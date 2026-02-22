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
    fetch_player_stats,
    fetch_team_stats,
)
from src.sources.sportsnavi import (
    fetch_head_to_head,
    fetch_injuries,
    fetch_team_leaders,
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


def _create_supabase_client() -> Client:
    """Supabaseクライアントを作成する"""
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key:
        raise ValueError("SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください")

    return create_client(url, key)


def main() -> None:
    """バッチ処理のメインエントリポイント"""
    start_time = datetime.now(JST)
    print(f"[STAT-EX] バッチ開始: {start_time.isoformat()}")

    errors: list[dict] = []
    results: dict = {}

    # ステップ1: B.LEAGUE公式 - 試合結果・ボックススコア取得
    print("[STAT-EX] ステップ1: 試合結果を取得中...")
    results["schedule"] = _safe_execute(
        "B.LEAGUE スケジュール", lambda: fetch_schedule(fb="2"), errors
    )

    # 新しい試合のボックススコアを取得
    new_game_keys = _get_new_game_keys(results.get("schedule", {}))
    results["box_scores"] = {}
    for key in new_game_keys:
        print(f"[STAT-EX]   ボックススコア取得: {key}")
        results["box_scores"][key] = _safe_execute(
            f"ボックススコア {key}", lambda k=key: fetch_box_score(k), errors
        )

    # ステップ2: B.LEAGUE公式 - 順位表・チーム成績取得
    print("[STAT-EX] ステップ2: 順位表・チーム成績を取得中...")
    results["standings"] = _safe_execute(
        "B.LEAGUE 順位表", fetch_standings, errors
    )
    results["team_stats"] = _safe_execute(
        "B.LEAGUE チーム成績", fetch_team_stats, errors
    )

    # ステップ3: スポナビ - H2H・インジュアリー・チームリーダー取得
    print("[STAT-EX] ステップ3: スポナビデータを取得中...")
    results["h2h"] = _safe_execute(
        "スポナビ H2H", fetch_head_to_head, errors
    )
    results["injuries"] = _safe_execute(
        "スポナビ インジュアリー", fetch_injuries, errors
    )
    results["leaders"] = _safe_execute(
        "スポナビ リーダー", fetch_team_leaders, errors
    )

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

    # ステップ5: AI寸評 - 新しい試合のみ生成
    print("[STAT-EX] ステップ5: AI寸評を生成中...")
    results["comments"] = {}
    for key in new_game_keys:
        bs = results.get("box_scores", {}).get(key, {})
        qs = bs.get("quarter_scores", {})
        if bs and not bs.get("error"):
            print(f"[STAT-EX]   AI寸評生成: {key}")
            results["comments"][key] = _safe_execute(
                f"Gemini 寸評 {key}",
                lambda b=bs, q=qs: generate_game_comment(b, q),
                errors,
            )

    # ステップ6: Supabase格納
    print("[STAT-EX] ステップ6: Supabaseに格納中...")
    try:
        _store_to_supabase(results)
    except Exception as e:
        errors.append({"source": "supabase", "message": str(e)})
        output_error(f"Supabase格納エラー: {e}", "supabase")

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


def _get_new_game_keys(schedule_result: object) -> list[str]:
    """
    スケジュール結果から新しい試合のScheduleKeyを取得する

    現時点では全FINAL試合のキーを返す。
    Supabase接続後はDB内の既存キーと比較して新規のみを返す。

    Args:
        schedule_result: fetch_scheduleの戻り値

    Returns:
        新しい試合のScheduleKeyリスト
    """
    if not schedule_result or not isinstance(schedule_result, dict):
        return []

    games = schedule_result.get("games", [])

    # FINAL状態の試合のみ対象
    final_games = [g for g in games if g.get("status") == "FINAL"]

    # TODO: Supabase接続後、DB内の既存schedule_keyと比較して新規のみに絞る
    # 現時点では直近3試合のみ取得（バッチ実行間隔を考慮）
    return [g["schedule_key"] for g in final_games[-3:]]


def _store_to_supabase(results: dict) -> None:
    """
    収集したデータをSupabaseに格納する

    Args:
        results: 各ステップで収集したデータ
    """
    try:
        client = _create_supabase_client()
    except ValueError as e:
        print(f"[STAT-EX] Supabase未接続（スキップ）: {e}")
        return

    # 順位表の更新（毎回上書き）
    standings = results.get("standings", {})
    if standings and not standings.get("error"):
        _upsert_standings(client, standings)

    # ニュースの追加（重複チェック）
    for source_key in ["google_news", "official_news"]:
        news_data = results.get(source_key, {})
        if news_data and not news_data.get("error"):
            _upsert_news(client, news_data)

    # YouTube動画の追加（重複チェック）
    youtube = results.get("youtube", {})
    if youtube and not youtube.get("error"):
        _upsert_videos(client, youtube)

    print("[STAT-EX] Supabase格納完了")


def _upsert_standings(client: Client, data: dict) -> None:
    """順位表をSupabaseに格納する"""
    standings = data.get("standings", [])
    for s in standings:
        try:
            client.table("standings").upsert(
                {
                    "team_id": s.get("team_id"),
                    "rank": s.get("rank"),
                    "wins": s.get("wins"),
                    "losses": s.get("losses"),
                    "win_pct": s.get("win_pct"),
                    "games_behind": s.get("games_behind"),
                },
                on_conflict="season_id,team_id",
            ).execute()
        except Exception as e:
            output_error(f"順位表格納エラー: {e}", "supabase.standings")


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


if __name__ == "__main__":
    main()
