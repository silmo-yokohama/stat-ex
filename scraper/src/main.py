"""
STAT-EX バッチ実行メインスクリプト

GitHub Actions から毎日22:00 JSTに実行される。
各データソースからデータを収集し、Supabaseに格納する。
"""

import os
import sys
import traceback
from datetime import datetime, timezone, timedelta

from supabase import create_client, Client

from src.sources.bleague import (
    fetch_schedule,
    fetch_box_score,
    fetch_standings,
    get_current_season_year,
)
from src.sources.sportsnavi import (
    fetch_head_to_head,
    fetch_injuries,
)
from src.sources.rss import (
    fetch_google_news,
    fetch_official_news,
    fetch_youtube_videos,
)
from src.sources.gemini import generate_game_comment
from src.utils.output import output_result, output_error

# 日本時間
JST = timezone(timedelta(hours=9))

# 横浜エクセレンスの TeamID
YOKOHAMA_EX_TEAM_ID = 714


# ================================================
# ルックアップキャッシュ（UUID引き当て用）
# ================================================

class LookupCache:
    """
    Supabaseのマスタデータを起動時にキャッシュする。
    bleague_team_id / player_id → UUID のマッピングを提供する。
    """

    def __init__(self, client: Client) -> None:
        self.client = client
        self.season_id: str = ""
        self.team_bleague_map: dict[int, str] = {}    # bleague_team_id → UUID
        self.team_name_map: dict[str, str] = {}        # チーム名 → UUID
        self.player_bleague_map: dict[str, str] = {}   # bleague_player_id → UUID
        self.existing_schedule_keys: set[str] = set()  # DB上の既存 schedule_key
        self._load()

    def _load(self) -> None:
        """マスタデータをDBから読み込む"""
        # 現在のシーズン開始年から season_id を取得
        season_year = get_current_season_year()
        res = self.client.table("seasons").select("id").eq("year", season_year).execute()
        if res.data:
            self.season_id = res.data[0]["id"]

        # チームマッピング
        res = self.client.table("teams").select("id, bleague_team_id, name, short_name").execute()
        for t in res.data or []:
            self.team_bleague_map[t["bleague_team_id"]] = t["id"]
            self.team_name_map[t["name"]] = t["id"]
            self.team_name_map[t["short_name"]] = t["id"]

        # 選手マッピング
        res = self.client.table("players").select("id, bleague_player_id").execute()
        for p in res.data or []:
            self.player_bleague_map[p["bleague_player_id"]] = p["id"]

        # ボックススコアが存在する試合のschedule_key一覧（新規判定用）
        # games テーブルの全 schedule_key ではなく、box_scores が格納済みの試合のみ
        # → 前回バッチで格納失敗した試合を再取得できるようにする
        res = self.client.table("box_scores").select("game_id").limit(1000).execute()
        games_with_box = {r["game_id"] for r in (res.data or [])}
        res = self.client.table("games").select("schedule_key, id").execute()
        self.existing_schedule_keys = {
            g["schedule_key"] for g in (res.data or [])
            if g["id"] in games_with_box
        }

        print(f"[STAT-EX] キャッシュ読込: season={self.season_id[:8]}..., "
              f"teams={len(self.team_bleague_map)}, "
              f"players={len(self.player_bleague_map)}, "
              f"games={len(self.existing_schedule_keys)}")

    def get_team_uuid(self, bleague_team_id: int | None) -> str | None:
        """B.LEAGUEのチームIDからUUIDを取得する"""
        if bleague_team_id is None:
            return None
        return self.team_bleague_map.get(bleague_team_id)

    def get_team_uuid_by_name(self, name: str) -> str | None:
        """チーム名からUUIDを取得する（H2H用、部分一致対応）"""
        # 完全一致
        if name in self.team_name_map:
            return self.team_name_map[name]
        # 部分一致（「千葉」→「アルティーリ千葉」など）
        for team_name, uuid in self.team_name_map.items():
            if name in team_name or team_name in name:
                return uuid
        return None

    def get_player_uuid(self, bleague_player_id: str | None) -> str | None:
        """B.LEAGUEの選手IDからUUIDを取得する"""
        if bleague_player_id is None:
            return None
        return self.player_bleague_map.get(str(bleague_player_id))

    def register_player(self, bleague_player_id: str, uuid: str) -> None:
        """新規登録した選手のキャッシュを更新する"""
        self.player_bleague_map[str(bleague_player_id)] = uuid

    def register_game(self, schedule_key: str) -> None:
        """新規登録した試合のキャッシュを更新する"""
        self.existing_schedule_keys.add(schedule_key)


# ================================================
# Supabase クライアント
# ================================================

def _create_supabaseclient() -> Client:
    """Supabaseクライアントを作成する"""
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key:
        raise ValueError("SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください")

    return create_client(url, key)


# ================================================
# メインエントリポイント
# ================================================

def main() -> None:
    """バッチ処理のメインエントリポイント"""
    start_time = datetime.now(JST)
    print(f"[STAT-EX] バッチ開始: {start_time.isoformat()}")

    errors: list[dict] = []
    results: dict = {}

    # ステップ1: B.LEAGUE公式 - 全試合（結果+予定）取得
    # fb="" で結果(FINAL)+予定(SCHEDULED)の両方を取得する
    # → FINAL試合はボックススコア取得対象、SCHEDULED試合はカレンダー表示用
    print("[STAT-EX] ステップ1: 試合データを取得中...")
    results["schedule"] = _safe_execute(
        "B.LEAGUE スケジュール", lambda: fetch_schedule(fb=""), errors
    )

    # ステップ2: B.LEAGUE公式 - 順位表・チーム成績取得
    print("[STAT-EX] ステップ2: 順位表・チーム成績を取得中...")
    results["standings"] = _safe_execute(
        "B.LEAGUE 順位表", fetch_standings, errors
    )
    # NOTE: fetch_team_stats() はHTMLヘッダーが動的で信頼性が低いため、
    # チーム成績は games テーブルから算出する方式に変更済み（_upsert_team_stats_from_games）

    # ステップ3: スポナビ - H2H・インジュアリー・チームリーダー取得
    print("[STAT-EX] ステップ3: スポナビデータを取得中...")
    results["h2h"] = _safe_execute(
        "スポナビ H2H", fetch_head_to_head, errors
    )
    results["injuries"] = _safe_execute(
        "スポナビ インジュアリー", fetch_injuries, errors
    )
    # NOTE: fetch_team_leaders() のデータは現在DBテーブルがないため格納しない
    # フロントエンドでは box_scores のAVG集計から算出する

    # ステップ4: RSS - ニュース・YouTube動画取得
    print("[STAT-EX] ステップ4: RSS/YouTube取得中...")
    results["google_news"] = _safe_execute(
        "Google News RSS", fetch_google_news, errors
    )
    results["official_news"] = _safe_execute(
        "公式HP RSS", fetch_official_news, errors
    )
    results["youtube"] = _safe_execute(
        "YouTube RSS", fetch_youtube_videos, errors
    )

    # ステップ5: Supabase格納（試合・ボックススコア → 新規判定 → AI寸評の順）
    print("[STAT-EX] ステップ5: Supabaseに格納中...")
    new_game_keys: list[str] = []
    sb_client: Client | None = None
    sb_cache: LookupCache | None = None
    try:
        new_game_keys, sb_client, sb_cache = _store_to_supabase(results, errors)
    except Exception as e:
        errors.append({"source": "supabase", "message": str(e)})
        output_error(f"Supabase格納エラー: {e}", "supabase")

    # ステップ6: 新規試合のボックススコア取得 + AI寸評生成
    # AI寸評は ENABLE_AI_COMMENT=true の場合のみ生成（初回バッチ時はスキップ推奨）
    enable_ai = os.environ.get("ENABLE_AI_COMMENT", "").lower() == "true"
    print(f"[STAT-EX] ステップ6: 新規試合のボックススコアを取得中...（AI寸評: {'ON' if enable_ai else 'OFF'}）")
    results["box_scores"] = {}
    results["comments"] = {}
    for key in new_game_keys:
        print(f"[STAT-EX]   ボックススコア取得: {key}")
        bs_result = _safe_execute(
            f"ボックススコア {key}", lambda k=key: fetch_box_score(k), errors
        )
        results["box_scores"][key] = bs_result

        # AI寸評の生成（環境変数で有効化されている場合のみ）
        if enable_ai and bs_result and not bs_result.get("error"):
            qs = bs_result.get("quarter_scores", {})
            print(f"[STAT-EX]   AI寸評生成: {key}")
            results["comments"][key] = _safe_execute(
                f"Gemini 寸評 {key}",
                lambda b=bs_result, q=qs: generate_game_comment(b, q),
                errors,
            )

    # ステップ7: ボックススコア・AI寸評をSupabaseに格納
    if new_game_keys and sb_client and sb_cache:
        print("[STAT-EX] ステップ7: ボックススコア・AI寸評を格納中...")
        try:
            _store_box_scores_and_comments(sb_client, sb_cache, results, errors)
        except Exception as e:
            errors.append({"source": "supabase.box_scores", "message": str(e)})
            output_error(f"ボックススコア格納エラー: {e}", "supabase.box_scores")

    # 完了
    end_time = datetime.now(JST)
    elapsed = (end_time - start_time).total_seconds()

    output_result({
        "status": "completed" if not errors else "completed_with_errors",
        "elapsed_seconds": elapsed,
        "new_games": len(new_game_keys),
        "error_count": len(errors),
    }, errors if errors else None)

    print(f"[STAT-EX] バッチ完了: {end_time.isoformat()} ({elapsed:.1f}秒)")

    if errors:
        print(f"[STAT-EX] エラー {len(errors)} 件:", file=sys.stderr)
        for error in errors:
            print(f"  - [{error.get('source', '?')}] {error.get('message', '')}", file=sys.stderr)
        sys.exit(1)


# ================================================
# ユーティリティ
# ================================================

def _safe_execute(name: str, func: object, errors: list[dict]) -> object:
    """
    関数を安全に実行する（例外をキャッチしてエラーリストに追加）

    Args:
        name: 処理名（エラー特定用）
        func: 実行する関数
        errors: エラーを追加するリスト

    Returns:
        関数の戻り値、またはエラー時はNone
    """
    try:
        return func()  # type: ignore
    except Exception as e:
        error_info = {
            "source": name,
            "message": str(e),
            "traceback": traceback.format_exc(),
        }
        errors.append(error_info)
        output_error(f"{name}: {e}", name)
        return None


# ================================================
# Supabase 格納メイン処理
# ================================================

def _store_to_supabase(
    results: dict, errors: list[dict]
) -> tuple[list[str], Client | None, LookupCache | None]:
    """
    収集したデータをSupabaseに格納する（メイン処理）

    Args:
        results: 各ステップで収集したデータ
        errors: エラーリスト

    Returns:
        (新規試合の schedule_key リスト, Supabaseクライアント, キャッシュ)
    """
    try:
        client = _create_supabaseclient()
    except ValueError as e:
        print(f"[STAT-EX] Supabase未接続（スキップ）: {e}")
        return [], None, None

    # ルックアップキャッシュの構築
    cache = LookupCache(client)

    if not cache.season_id:
        print("[STAT-EX] シーズンデータが見つかりません。スキップします。")
        return [], client, cache

    # 1. 試合データの格納（新規判定の前にDBに入れる）
    schedule = results.get("schedule")
    new_game_keys: list[str] = []
    if schedule and not schedule.get("error"):
        new_game_keys = _upsert_games(client, cache, schedule)

    # 2. 順位表の更新
    standings = results.get("standings")
    if standings and not standings.get("error"):
        _upsert_standings(client, cache, standings)

    # 3. チーム成績の更新（gamesテーブルのスケジュールデータから算出）
    if schedule and not schedule.get("error"):
        _upsert_team_stats_from_games(client, cache, schedule)

    # 4. H2H対戦成績の更新
    h2h = results.get("h2h")
    if h2h and not h2h.get("error"):
        _upsert_h2h(client, cache, h2h)

    # 5. インジュアリーの全件置き換え
    injuries = results.get("injuries")
    if injuries and not injuries.get("error"):
        _replace_injuries(client, cache, injuries)

    # 6. ニュースの追加
    for source_key in ["google_news", "official_news"]:
        news_data = results.get(source_key)
        if news_data and not news_data.get("error"):
            _upsert_news(client, news_data)

    # 7. YouTube動画の追加
    youtube = results.get("youtube")
    if youtube and not youtube.get("error"):
        _upsert_videos(client, youtube)

    print(f"[STAT-EX] Supabase格納完了（新規試合: {len(new_game_keys)} 件）")
    return new_game_keys, client, cache


def _store_box_scores_and_comments(
    client: Client, cache: LookupCache, results: dict, errors: list[dict]
) -> None:
    """
    ボックススコアとAI寸評をSupabaseに格納する（ステップ7）

    Args:
        client: Supabaseクライアント
        cache: ルックアップキャッシュ
        results: 各ステップで収集したデータ
        errors: エラーリスト
    """

    box_scores = results.get("box_scores", {})
    comments = results.get("comments", {})

    for schedule_key, bs_data in box_scores.items():
        if not bs_data or bs_data.get("error"):
            continue

        # ゲームUUID + home_away を取得
        game_res = client.table("games").select("id, home_away").eq(
            "schedule_key", schedule_key
        ).execute()
        if not game_res.data:
            continue
        game_uuid = game_res.data[0]["id"]

        # クォータースコアの更新（ボックススコアから詳細データを取得）
        qs = bs_data.get("quarter_scores", {})
        game_info = bs_data.get("game_info", {})
        try:
            client.table("games").update({
                "q1_home": qs.get("q1_home"),
                "q1_away": qs.get("q1_away"),
                "q2_home": qs.get("q2_home"),
                "q2_away": qs.get("q2_away"),
                "q3_home": qs.get("q3_home"),
                "q3_away": qs.get("q3_away"),
                "q4_home": qs.get("q4_home"),
                "q4_away": qs.get("q4_away"),
                "venue": game_info.get("venue") or None,
                "attendance": game_info.get("attendance"),
                "referee": game_info.get("referee") or None,
            }).eq("id", game_uuid).execute()
        except Exception as e:
            output_error(f"クォータースコア更新エラー ({schedule_key}): {e}", "supabase.quarter")

        # ボックススコアの格納
        # home_away に基づいてEX選手かどうかを判定する
        # HOME試合 → home_box_scores がEX選手、AWAY試合 → away_box_scores がEX選手
        game_home_away = game_res.data[0].get("home_away", "HOME")
        for side_key in ["home_box_scores", "away_box_scores"]:
            is_ex_side = (
                (game_home_away == "HOME" and side_key == "home_box_scores")
                or (game_home_away == "AWAY" and side_key == "away_box_scores")
            )
            for player_stats in bs_data.get(side_key, []):
                _upsert_single_box_score(
                    client, cache, game_uuid, player_stats, is_ex_player=is_ex_side
                )

        # AI寸評の格納
        comment_text = comments.get(schedule_key)
        if comment_text and isinstance(comment_text, str):
            _upsert_game_comment(client, game_uuid, comment_text)

    print(f"[STAT-EX] ボックススコア・AI寸評格納完了")


# ================================================
# 個別テーブルの格納処理
# ================================================

def _upsert_games(client: Client, cache: LookupCache, data: dict) -> list[str]:
    """
    試合データをSupabaseに格納する

    Args:
        client: Supabaseクライアント
        cache: ルックアップキャッシュ
        data: fetch_scheduleの戻り値

    Returns:
        新規試合の schedule_key リスト
    """
    games = data.get("games", [])
    new_keys: list[str] = []

    for g in games:
        schedule_key = g.get("schedule_key", "")
        if not schedule_key:
            continue

        # ボックススコア未取得の新規FINAL試合を判定
        is_new = (
            schedule_key not in cache.existing_schedule_keys
            and g.get("status") == "FINAL"
        )

        # 対戦相手のチームUUIDを取得
        # home_away に応じて、相手チームのIDを決定
        opp_uuid = None
        if g.get("home_away") == "HOME":
            opp_bleague_id = g.get("away_team_id")
            opp_name = g.get("away_team_name", "")
        else:
            opp_bleague_id = g.get("home_team_id")
            opp_name = g.get("home_team_name", "")

        # bleague_team_id でのルックアップを試行
        if opp_bleague_id is not None:
            opp_uuid = cache.get_team_uuid(_safe_int_val(opp_bleague_id))

        # IDが取れない場合はチーム名でフォールバック検索
        if not opp_uuid and opp_name:
            opp_uuid = cache.get_team_uuid_by_name(opp_name)

        if not opp_uuid:
            output_error(
                f"対戦相手チーム不明: {g.get('home_team_name')} vs {g.get('away_team_name')}",
                "supabase.games",
            )
            continue

        try:
            client.table("games").upsert(
                {
                    "schedule_key": schedule_key,
                    "season_id": cache.season_id,
                    "game_date": g.get("game_date"),
                    "game_time": g.get("game_time"),
                    "opponent_team_id": opp_uuid,
                    "home_away": g.get("home_away", "HOME"),
                    "score_home": g.get("score_home"),
                    "score_away": g.get("score_away"),
                    "status": g.get("status", "SCHEDULED"),
                    "venue": g.get("venue") or None,
                },
                on_conflict="schedule_key",
            ).execute()

            if is_new:
                new_keys.append(schedule_key)
                cache.register_game(schedule_key)

        except Exception as e:
            output_error(f"試合格納エラー ({schedule_key}): {e}", "supabase.games")

    print(f"[STAT-EX]   試合: {len(games)} 件処理（新規FINAL: {len(new_keys)} 件）")
    return new_keys


def _upsert_standings(client: Client, cache: LookupCache, data: dict) -> None:
    """順位表をSupabaseに格納する（地区情報付き）"""
    standings = data.get("standings", [])
    count = 0
    for s in standings:
        # bleague_team_id → UUID に変換
        team_uuid = cache.get_team_uuid(s.get("team_id"))
        if not team_uuid:
            continue

        try:
            record: dict = {
                "season_id": cache.season_id,
                "team_id": team_uuid,
                "rank": s.get("rank"),
                "wins": s.get("wins", 0),
                "losses": s.get("losses", 0),
                "win_pct": s.get("win_pct"),
                "games_behind": s.get("games_behind"),
                "points_for": s.get("points_for"),
                "points_against": s.get("points_against"),
                "point_diff": s.get("point_diff"),
                "streak": s.get("streak"),
                "last5": s.get("last5"),
            }
            # 地区情報が取得できた場合のみ追加
            if s.get("division"):
                record["division"] = s["division"]

            client.table("standings").upsert(
                record,
                on_conflict="season_id,team_id",
            ).execute()
            count += 1
        except Exception as e:
            output_error(f"順位表格納エラー: {e}", "supabase.standings")

    print(f"[STAT-EX]   順位表: {count} 件更新")


def _upsert_team_stats_from_games(
    client: Client, cache: LookupCache, schedule_data: dict | None
) -> None:
    """
    gamesテーブルの試合結果からチーム成績を算出して格納する

    fetch_team_stats() の出力はHTMLヘッダーが動的なため、
    より信頼性の高い games テーブルからの算出を採用する。
    """
    if not schedule_data or schedule_data.get("error"):
        return

    games = schedule_data.get("games", [])
    # FINAL試合のみ対象
    final_games = [g for g in games if g.get("status") == "FINAL"]
    if not final_games:
        return

    wins = 0
    losses = 0
    home_wins = 0
    home_losses = 0
    away_wins = 0
    away_losses = 0
    total_points_for = 0
    total_points_against = 0

    for g in final_games:
        score_home = g.get("score_home") or 0
        score_away = g.get("score_away") or 0
        is_home = g.get("home_away") == "HOME"

        # 横浜EXの得点・失点
        if is_home:
            pts_for = score_home
            pts_against = score_away
        else:
            pts_for = score_away
            pts_against = score_home

        total_points_for += pts_for
        total_points_against += pts_against

        # 勝敗判定
        is_win = pts_for > pts_against
        if is_win:
            wins += 1
            if is_home:
                home_wins += 1
            else:
                away_wins += 1
        else:
            losses += 1
            if is_home:
                home_losses += 1
            else:
                away_losses += 1

    total_games = wins + losses
    win_pct = round(wins / total_games, 3) if total_games > 0 else 0
    avg_for = round(total_points_for / total_games, 1) if total_games > 0 else 0
    avg_against = round(total_points_against / total_games, 1) if total_games > 0 else 0

    try:
        client.table("team_stats").upsert(
            {
                "season_id": cache.season_id,
                "wins": wins,
                "losses": losses,
                "win_pct": win_pct,
                "avg_points_for": avg_for,
                "avg_points_against": avg_against,
                "home_wins": home_wins,
                "home_losses": home_losses,
                "away_wins": away_wins,
                "away_losses": away_losses,
            },
            on_conflict="season_id",
        ).execute()
        print(f"[STAT-EX]   チーム成績: {wins}W-{losses}L (H:{home_wins}-{home_losses}, A:{away_wins}-{away_losses})")
    except Exception as e:
        output_error(f"チーム成績格納エラー: {e}", "supabase.team_stats")


def _upsert_h2h(client: Client, cache: LookupCache, data: dict) -> None:
    """H2H対戦成績をSupabaseに格納する"""
    records = data.get("records", [])
    count = 0
    for r in records:
        # スポナビのチーム名 → UUID に変換
        opp_uuid = cache.get_team_uuid_by_name(r.get("opponent_name", ""))
        if not opp_uuid:
            output_error(
                f"H2H対戦相手不明: {r.get('opponent_name')}",
                "supabase.h2h",
            )
            continue

        try:
            client.table("h2h_records").upsert(
                {
                    "season_id": cache.season_id,
                    "opponent_team_id": opp_uuid,
                    "wins": r.get("wins", 0),
                    "losses": r.get("losses", 0),
                    "avg_points_for": r.get("avg_points_for"),
                    "avg_points_against": r.get("avg_points_against"),
                },
                on_conflict="season_id,opponent_team_id",
            ).execute()
            count += 1
        except Exception as e:
            output_error(f"H2H格納エラー: {e}", "supabase.h2h")

    print(f"[STAT-EX]   H2H: {count} 件更新")


def _replace_injuries(client: Client, cache: LookupCache, data: dict) -> None:
    """
    インジュアリーリストを全件置き換える（DELETE + INSERT）

    スポナビのインジュアリーは player_id がスポナビ形式のため、
    選手名で照合する。一致しない場合はスキップ。
    """
    injuries = data.get("injuries", [])

    # 選手名 → UUID のマッピング構築（DELETE前に行い、空なら安全にスキップ）
    players_res = client.table("players").select("id, name").execute()
    player_name_map: dict[str, str] = {}
    for p in players_res.data or []:
        # 空名前のゴーストレコードを除外
        if p["name"]:
            player_name_map[p["name"]] = p["id"]

    # playersが空の場合、DELETEせずにスキップ（データロスト防止）
    if not player_name_map:
        print("[STAT-EX]   インジュアリー: 選手データ未登録のためスキップ")
        return

    # 全件削除（選手マッチングの準備が整ってからDELETE）
    try:
        client.table("injuries").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    except Exception as e:
        output_error(f"インジュアリー削除エラー: {e}", "supabase.injuries")
        return

    count = 0
    for inj in injuries:
        player_name = inj.get("player_name", "")
        player_uuid = player_name_map.get(player_name)
        if not player_uuid:
            # 名前の部分一致を試みる
            for name, uuid in player_name_map.items():
                if player_name in name or name in player_name:
                    player_uuid = uuid
                    break

        if not player_uuid:
            output_error(f"インジュアリー選手不明: {player_name}", "supabase.injuries")
            continue

        try:
            client.table("injuries").insert({
                "player_id": player_uuid,
                "reason": inj.get("reason", ""),
                "registered_date": inj.get("registered_date", ""),
            }).execute()
            count += 1
        except Exception as e:
            output_error(f"インジュアリー格納エラー ({player_name}): {e}", "supabase.injuries")

    print(f"[STAT-EX]   インジュアリー: {count} 件更新")


def _upsert_single_box_score(
    client: Client, cache: LookupCache, game_uuid: str, player_stats: dict,
    *, is_ex_player: bool = True,
) -> None:
    """
    1選手分のボックススコアをSupabaseに格納する

    選手が未登録の場合は自動登録する。
    is_ex_player=True の場合のみ player_seasons.is_active=True に設定する。

    Args:
        is_ex_player: この選手がEXの選手かどうか（対戦相手の場合はFalse）
    """
    bleague_pid = str(player_stats.get("player_id", ""))
    player_uuid = cache.get_player_uuid(bleague_pid)

    # 未登録選手の自動登録
    if not player_uuid:
        player_uuid = _register_new_player(
            client, cache, player_stats, is_ex_player=is_ex_player
        )
        if not player_uuid:
            return
    else:
        # 既存選手でも player_seasons が存在することを保証する
        # EX選手のみ is_active=True、対戦相手は is_active=False
        try:
            client.table("player_seasons").upsert(
                {
                    "player_id": player_uuid,
                    "season_id": cache.season_id,
                    "is_active": is_ex_player,
                },
                on_conflict="player_id,season_id",
            ).execute()
        except Exception as e:
            output_error(f"player_seasons upsert エラー: {e}", "supabase.player_seasons")

    try:
        client.table("box_scores").upsert(
            {
                "game_id": game_uuid,
                "player_id": player_uuid,
                "team_side": player_stats.get("team_side", "home"),
                "is_starter": player_stats.get("is_starter", False),
                "minutes": player_stats.get("minutes"),
                "pts": player_stats.get("pts", 0),
                "fgm": player_stats.get("fgm", 0),
                "fga": player_stats.get("fga", 0),
                "fg_pct": player_stats.get("fg_pct"),
                "tpm": player_stats.get("tpm", 0),
                "tpa": player_stats.get("tpa", 0),
                "tp_pct": player_stats.get("tp_pct"),
                "ftm": player_stats.get("ftm", 0),
                "fta": player_stats.get("fta", 0),
                "ft_pct": player_stats.get("ft_pct"),
                "or_reb": player_stats.get("or_reb", 0),
                "dr_reb": player_stats.get("dr_reb", 0),
                "reb": player_stats.get("reb", 0),
                "ast": player_stats.get("ast", 0),
                "tov": player_stats.get("tov", 0),
                "stl": player_stats.get("stl", 0),
                "blk": player_stats.get("blk", 0),
                "fouls": player_stats.get("fouls", 0),
                "eff": player_stats.get("eff", 0),
                "plus_minus": player_stats.get("plus_minus", 0),
            },
            on_conflict="game_id,player_id",
        ).execute()
    except Exception as e:
        output_error(
            f"ボックススコア格納エラー ({player_stats.get('player_name', '?')}): {e}",
            "supabase.box_scores",
        )


def _register_new_player(
    client: Client, cache: LookupCache, player_stats: dict,
    *, is_ex_player: bool = True,
) -> str | None:
    """
    ボックススコアに出現した未登録選手を自動登録する

    Args:
        client: Supabaseクライアント
        cache: ルックアップキャッシュ
        player_stats: ボックススコアの選手データ
        is_ex_player: EX選手かどうか（対戦相手の場合はFalse）

    Returns:
        登録した選手のUUID、失敗時はNone
    """
    bleague_pid = str(player_stats.get("player_id", ""))
    player_name = player_stats.get("player_name", "不明")
    player_name_en = player_stats.get("player_name_en", "")
    # player_number が空文字列の場合はNoneに変換（DBカラムは INTEGER 型）
    player_number = player_stats.get("player_number")
    if player_number is not None:
        try:
            player_number = int(player_number)
        except (ValueError, TypeError):
            player_number = None

    try:
        res = client.table("players").insert({
            "bleague_player_id": bleague_pid,
            "name": player_name,
            "name_en": player_name_en or None,
            "number": player_number,
        }).execute()

        if res.data:
            new_uuid = res.data[0]["id"]
            cache.register_player(bleague_pid, new_uuid)

            # player_seasons にも登録
            # EX選手のみ is_active=True、対戦相手は is_active=False
            client.table("player_seasons").upsert(
                {
                    "player_id": new_uuid,
                    "season_id": cache.season_id,
                    "is_active": is_ex_player,
                },
                on_conflict="player_id,season_id",
            ).execute()

            side_label = "EX" if is_ex_player else "対戦相手"
            print(f"[STAT-EX]     新規選手登録: {player_name} (#{player_number}) [{side_label}]")
            return new_uuid
    except Exception as e:
        output_error(f"選手登録エラー ({player_name}): {e}", "supabase.players")

    return None


def _upsert_game_comment(client: Client, game_uuid: str, comment: str) -> None:
    """AI寸評をSupabaseに格納する"""
    try:
        client.table("game_comments").upsert(
            {
                "game_id": game_uuid,
                "content": comment,
                "model": "gemini-2.0-flash",
            },
            on_conflict="game_id",
        ).execute()
    except Exception as e:
        output_error(f"AI寸評格納エラー: {e}", "supabase.game_comments")


def _upsert_news(client: Client, data: dict) -> None:
    """ニュースをSupabaseに格納する（URLで重複チェック）"""
    articles = data.get("articles", [])
    for article in articles:
        try:
            client.table("news").upsert(
                {
                    "source": article.get("source", "media"),
                    "title": article.get("title", ""),
                    "url": article.get("url", ""),
                    "published_at": article.get("published_at"),
                    "thumbnail_url": article.get("thumbnail_url"),
                    "source_name": article.get("source_name"),
                },
                on_conflict="url",
            ).execute()
        except Exception as e:
            output_error(f"ニュース格納エラー: {e}", "supabase.news")


def _upsert_videos(client: Client, data: dict) -> None:
    """YouTube動画をSupabaseに格納する（video_idで重複チェック）"""
    videos = data.get("videos", [])
    for video in videos:
        try:
            client.table("videos").upsert(
                {
                    "video_id": video.get("video_id", ""),
                    "title": video.get("title", ""),
                    "published_at": video.get("published_at"),
                    "thumbnail_url": video.get("thumbnail_url"),
                },
                on_conflict="video_id",
            ).execute()
        except Exception as e:
            output_error(f"動画格納エラー: {e}", "supabase.videos")


# ================================================
# ヘルパー
# ================================================

def _safe_int_val(value: object) -> int | None:
    """値を安全に int に変換する"""
    if value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


if __name__ == "__main__":
    main()
