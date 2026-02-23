"""
B.LEAGUE公式サイト データ取得モジュール

メインのデータソース。試合結果、ボックススコア、選手スタッツ、順位表を取得する。
横浜エクセレンス TeamID: 714
"""

import json
import re
from bs4 import BeautifulSoup

from src.utils.http import get
from src.utils.output import output_error

# 横浜エクセレンスのTeamID
TEAM_ID = 714

# B.LEAGUE公式サイトベースURL
BASE_URL = "https://www.bleague.jp"

# 現在のシーズン開始年
CURRENT_SEASON_YEAR = 2025

# B2リーグ戦のイベントID
B2_EVENT_ID = 7


def fetch_schedule(
    fb: str = "",
    ha: str = "",
    month: str = "all",
) -> dict:
    """
    試合スケジュール（結果 + 予定）を取得する

    B.LEAGUE公式サイトのJSON APIはHTMLフラグメントを返す。
    topics配列からHTMLをパースして試合データを抽出する。

    Args:
        fb: フィルタ（"1"=日程のみ, "2"=結果のみ, ""=全て）
        ha: H/Aフィルタ（"1"=HOME, "2"=AWAY, ""=全て）
        month: 月フィルタ（"all" or "10"〜"04"）

    Returns:
        試合データのリストを含むdict
    """
    games: list[dict] = []
    index = 1
    errors: list[dict] = []

    while True:
        # tab=2 が B2タブの指定（必須）
        url = (
            f"{BASE_URL}/schedule/?data_format=json"
            f"&year={CURRENT_SEASON_YEAR}"
            f"&event={B2_EVENT_ID}"
            f"&club={TEAM_ID}"
            f"&tab=2"
            f"&fb={fb}&ha={ha}&mon={month}"
            f"&index={index}"
        )

        try:
            response = get(url, timeout=30)
            data = response.json()
        except Exception as e:
            errors.append({"source": "schedule", "message": str(e), "index": index})
            break

        # topics配列にHTMLフラグメントが格納されている
        topics = data.get("topics", [])

        if not topics:
            break

        for topic_html in topics:
            game = _parse_schedule_html(topic_html)
            if game:
                games.append(game)

        # index が null ならば最終ページ
        next_index = data.get("index")
        if not next_index:
            break

        index = next_index

    return {"games": games, "total": len(games), "errors": errors}


def _parse_schedule_html(html: str) -> dict | None:
    """
    スケジュールAPIのHTMLフラグメント1件を試合データにパースする

    HTMLフラグメント構造:
      <li class="list-item" id="{ScheduleKey}">
        <span class="team home"> / <span class="team away">
        <span class="number home-score"><span>{score}</span></span>
        <div class="info-arena"><span>{節}</span><span>{会場}</span><span>{時刻}</span></div>
        <div class="info-scorestate"><span>FINAL</span></div>
    """
    try:
        soup = BeautifulSoup(html, "html.parser")

        # ScheduleKey: <li id="505511"> から取得
        li = soup.find("li", class_="list-item")
        if not li:
            return None
        schedule_key = li.get("id", "")
        if not schedule_key:
            return None

        # 日付: <span class="title">2025.10.05(日)</span> から取得
        date_span = soup.find("span", class_="title")
        game_date = ""
        if date_span:
            date_text = date_span.get_text(strip=True)
            # "2025.10.05(日)" → "2025-10-05"
            date_match = re.match(r"(\d{4})\.(\d{2})\.(\d{2})", date_text)
            if date_match:
                game_date = f"{date_match.group(1)}-{date_match.group(2)}-{date_match.group(3)}"

        # チーム名: <span class="team home"> / <span class="team away">
        home_team_el = soup.find("span", class_=lambda c: c and "team" in c and "home" in c)
        away_team_el = soup.find("span", class_=lambda c: c and "team" in c and "away" in c)
        home_team_name = ""
        away_team_name = ""
        if home_team_el:
            name_el = home_team_el.find("span", class_="team-name")
            home_team_name = name_el.get_text(strip=True) if name_el else ""
        if away_team_el:
            name_el = away_team_el.find("span", class_="team-name")
            away_team_name = name_el.get_text(strip=True) if name_el else ""

        # 横浜EXがHOMEかAWAYかを判定（"横浜EX" を含むチーム名で判定）
        ex_names = ["横浜EX", "横浜エクセレンス"]
        is_home = any(n in home_team_name for n in ex_names)

        # スコア: <span class="number home-score"><span>{score}</span></span>
        score_home = None
        score_away = None
        home_score_el = soup.find("span", class_=lambda c: c and "home-score" in c)
        away_score_el = soup.find("span", class_=lambda c: c and "away-score" in c)
        if home_score_el:
            score_span = home_score_el.find("span")
            if score_span:
                score_home = _safe_int(score_span.get_text(strip=True))
        if away_score_el:
            score_span = away_score_el.find("span")
            if score_span:
                score_away = _safe_int(score_span.get_text(strip=True))

        # 試合時刻・会場: <div class="info-arena"><span>第1節</span><span>場所</span><span>13:35</span>
        game_time = ""
        venue = ""
        section = ""
        info_arena = soup.find("div", class_="info-arena")
        if info_arena:
            spans = info_arena.find_all("span")
            if len(spans) >= 1:
                section = spans[0].get_text(strip=True)
            if len(spans) >= 2:
                venue = spans[1].get_text(strip=True)
            if len(spans) >= 3:
                game_time = spans[2].get_text(strip=True)

        # ステータス: <div class="info-scorestate"><span>FINAL</span>
        status = "SCHEDULED"
        scorestate = soup.find("div", class_="info-scorestate")
        if scorestate:
            state_text = scorestate.get_text(strip=True)
            if "FINAL" in state_text:
                status = "FINAL"

        return {
            "schedule_key": schedule_key,
            "game_date": game_date,
            "game_time": game_time,
            "home_away": "HOME" if is_home else "AWAY",
            "home_team_name": home_team_name,
            "away_team_name": away_team_name,
            # HTMLにはteam IDがないため、チーム名でマッチングする
            "home_team_id": None,
            "away_team_id": None,
            "score_home": score_home,
            "score_away": score_away,
            "venue": venue,
            "section": section,
            "status": status,
        }
    except Exception:
        return None


def fetch_box_score(schedule_key: str) -> dict:
    """
    指定した試合のボックススコアを取得する

    HTML内のJSオブジェクト（_contexts_s3id.data）を抽出してJSONパースする。

    Args:
        schedule_key: 試合のScheduleKey

    Returns:
        ボックススコアデータ（クォーター別スコア、全選手スタッツ含む）
    """
    url = f"{BASE_URL}/game_detail/?ScheduleKey={schedule_key}&tab=2"
    errors: list[dict] = []

    try:
        response = get(url)
        html = response.text
    except Exception as e:
        return {"error": str(e), "schedule_key": schedule_key}

    # HTML内のJSオブジェクトからデータを抽出
    game_data = _extract_game_data_from_html(html)
    if not game_data:
        return {"error": "ゲームデータの抽出に失敗", "schedule_key": schedule_key}

    # クォーター別スコア
    quarter_scores = {
        "q1_home": _safe_int(game_data.get("HomeTeamScore01")),
        "q1_away": _safe_int(game_data.get("AwayTeamScore01")),
        "q2_home": _safe_int(game_data.get("HomeTeamScore02")),
        "q2_away": _safe_int(game_data.get("AwayTeamScore02")),
        "q3_home": _safe_int(game_data.get("HomeTeamScore03")),
        "q3_away": _safe_int(game_data.get("AwayTeamScore03")),
        "q4_home": _safe_int(game_data.get("HomeTeamScore04")),
        "q4_away": _safe_int(game_data.get("AwayTeamScore04")),
    }

    # ボックススコア（ホーム・アウェイ）
    home_box = _parse_boxscores(game_data.get("HomeBoxscores", []), "home")
    away_box = _parse_boxscores(game_data.get("AwayBoxscores", []), "away")

    # 試合情報
    game_info = {
        "schedule_key": schedule_key,
        "home_team_name": game_data.get("HomeTeamName", ""),
        "away_team_name": game_data.get("AwayTeamName", ""),
        "score_home": _safe_int(game_data.get("HomeTeamScore")),
        "score_away": _safe_int(game_data.get("AwayTeamScore")),
        "venue": game_data.get("Arena", ""),
        "attendance": _safe_int(game_data.get("Attendance")),
        "referee": game_data.get("Referee", ""),
    }

    return {
        "game_info": game_info,
        "quarter_scores": quarter_scores,
        "home_box_scores": home_box,
        "away_box_scores": away_box,
        "errors": errors,
    }


def _extract_game_data_from_html(html: str) -> dict | None:
    """
    HTML内のJSオブジェクトからゲームデータを抽出する

    B.LEAGUE公式サイトの試合詳細ページでは、_contexts_s3id.data に
    JSONデータが埋め込まれている。
    """
    # _contexts_s3id.data = {...} パターンを探す
    patterns = [
        r'_contexts_s3id\.data\s*=\s*({.*?});',
        r'__NEXT_DATA__.*?"gameDetail"\s*:\s*({.*?})\s*[,}]',
        r'data-game-detail=[\'"]({.*?})[\'"]',
    ]

    for pattern in patterns:
        match = re.search(pattern, html, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                continue

    # フォールバック: script タグからJSONを探す
    soup = BeautifulSoup(html, "html.parser")
    for script in soup.find_all("script"):
        text = script.string or ""
        if "HomeBoxscores" in text or "HomeTeamScore01" in text:
            # JSONっぽい部分を抽出
            json_match = re.search(r'\{.*"HomeTeamScore01".*\}', text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    continue

    return None


def _parse_boxscores(boxscores: list, team_side: str) -> list[dict]:
    """ボックススコア配列をパースする"""
    result = []
    for bs in boxscores:
        try:
            result.append({
                "player_id": str(bs.get("PlayerID", "")),
                "player_name": bs.get("PlayerName", ""),
                "player_number": bs.get("PlayerNo", ""),
                "team_side": team_side,
                "is_starter": bs.get("StartingFlg", "0") == "1",
                "minutes": bs.get("PlayingTime", ""),
                "pts": _safe_int(bs.get("Point")),
                "fgm": _safe_int(bs.get("FieldGoalsMade")),
                "fga": _safe_int(bs.get("FieldGoalsAttempted")),
                "fg_pct": _safe_float(bs.get("FieldGoalsPercentage")),
                "tpm": _safe_int(bs.get("ThreePointersMade")),
                "tpa": _safe_int(bs.get("ThreePointersAttempted")),
                "tp_pct": _safe_float(bs.get("ThreePointersPercentage")),
                "ftm": _safe_int(bs.get("FreeThrowsMade")),
                "fta": _safe_int(bs.get("FreeThrowsAttempted")),
                "ft_pct": _safe_float(bs.get("FreeThrowsPercentage")),
                "or_reb": _safe_int(bs.get("OffensiveRebounds")),
                "dr_reb": _safe_int(bs.get("DefensiveRebounds")),
                "reb": _safe_int(bs.get("Rebounds")),
                "ast": _safe_int(bs.get("Assists")),
                "tov": _safe_int(bs.get("Turnovers")),
                "stl": _safe_int(bs.get("Steals")),
                "blk": _safe_int(bs.get("BlockShots")),
                "fouls": _safe_int(bs.get("Fouls")),
                "eff": _safe_int(bs.get("Efficiency")),
                "plus_minus": _safe_int(bs.get("PlusMinus")),
            })
        except Exception as e:
            output_error(f"ボックススコアパースエラー: {e}", "bleague.boxscore")
    return result


def fetch_standings() -> dict:
    """
    B2順位表を取得する

    SSR HTMLをパースしてB2全チームの順位・勝敗データを抽出する。
    B2は複数カンファレンスに分かれているため、全テーブルをパースする。

    Returns:
        順位表データ
    """
    url = f"{BASE_URL}/standings/?tab=2"
    errors: list[dict] = []

    try:
        response = get(url, timeout=30)
        html = response.text
    except Exception as e:
        return {"error": str(e), "standings": []}

    soup = BeautifulSoup(html, "html.parser")
    standings: list[dict] = []

    # 全テーブルから順位表を探す（B2は複数カンファレンスに分かれている）
    tables = soup.find_all("table")
    standings_tables = []
    for t in tables:
        headers = t.find_all("th")
        header_texts = [h.get_text(strip=True) for h in headers]
        if "勝" in header_texts and "負" in header_texts:
            standings_tables.append(t)

    if not standings_tables:
        errors.append({"source": "standings", "message": "順位表テーブルが見つかりません"})
        return {"standings": [], "errors": errors}

    # 重複排除用（複数テーブルに同じチームが出る場合、最初の出現を優先）
    seen_team_ids: set[int] = set()

    # 全テーブルの行をパースする
    for table in standings_tables:
        rows = table.find_all("tr")[1:]  # ヘッダー行をスキップ

        for row in rows:
            cells = row.find_all(["td", "th"])
            if len(cells) < 5:
                continue

            try:
                # チーム名からリンクを取得してTeamIDを抽出
                team_link = row.find("a", href=re.compile(r"TeamID="))
                team_id = None
                if team_link:
                    team_id_match = re.search(r"TeamID=(\d+)", team_link.get("href", ""))
                    if team_id_match:
                        team_id = int(team_id_match.group(1))

                cell_texts = [c.get_text(strip=True) for c in cells]

                # 重複チーム（複数テーブルに出現）をスキップ
                if team_id and team_id in seen_team_ids:
                    continue
                if team_id:
                    seen_team_ids.add(team_id)

                standings.append({
                    "rank": _safe_int(cell_texts[0]) if cell_texts[0].isdigit() else None,
                    "team_name": cell_texts[1] if len(cell_texts) > 1 else "",
                    "team_id": team_id,
                    "wins": _safe_int(cell_texts[2]) if len(cell_texts) > 2 else 0,
                    "losses": _safe_int(cell_texts[3]) if len(cell_texts) > 3 else 0,
                    "win_pct": _safe_float(cell_texts[4]) if len(cell_texts) > 4 else None,
                    "games_behind": _safe_float(cell_texts[5]) if len(cell_texts) > 5 else None,
                })
            except Exception as e:
                errors.append({"source": "standings.row", "message": str(e)})

    return {"standings": standings, "total": len(standings), "errors": errors}


def fetch_player_stats(player_id: str) -> dict:
    """
    選手個人成績を取得する

    SSR HTMLから選手のシーズンスタッツ、試合別成績を抽出する。

    Args:
        player_id: B.LEAGUEのPlayerID

    Returns:
        選手スタッツデータ（プロフィール、シーズン平均、試合別成績）
    """
    url = f"{BASE_URL}/roster_detail/?PlayerID={player_id}"
    errors: list[dict] = []

    try:
        response = get(url)
        html = response.text
    except Exception as e:
        return {"error": str(e), "player_id": player_id}

    soup = BeautifulSoup(html, "html.parser")

    # プロフィール情報
    profile = _parse_player_profile(soup)

    # シーズン平均スタッツ（テーブル1つ目）
    season_avg = _parse_stats_table(soup, 0)

    # 試合別成績（テーブル3つ目以降）
    game_log = _parse_game_log_table(soup)

    return {
        "player_id": player_id,
        "profile": profile,
        "season_average": season_avg,
        "game_log": game_log,
        "errors": errors,
    }


def _parse_player_profile(soup: BeautifulSoup) -> dict:
    """選手プロフィール情報をパースする"""
    profile: dict = {}

    # dt/ddペアからプロフィール項目を取得
    dts = soup.find_all("dt")
    dds = soup.find_all("dd")

    key_map = {
        "背番号": "number",
        "ポジション": "position",
        "身長": "height",
        "体重": "weight",
        "生年月日": "birthdate",
        "出身地": "birthplace",
    }

    for dt, dd in zip(dts, dds):
        key = dt.get_text(strip=True)
        value = dd.get_text(strip=True)

        if key in key_map:
            profile[key_map[key]] = value

    return profile


def _parse_stats_table(soup: BeautifulSoup, table_index: int) -> dict:
    """スタッツテーブルをパースする"""
    tables = soup.find_all("table")
    if table_index >= len(tables):
        return {}

    table = tables[table_index]
    headers = [th.get_text(strip=True) for th in table.find_all("th")]
    rows = table.find_all("tr")

    if len(rows) < 2:
        return {}

    # 最初のデータ行
    cells = rows[1].find_all("td")
    cell_texts = [c.get_text(strip=True) for c in cells]

    result: dict = {}
    for h, v in zip(headers, cell_texts):
        result[h] = v

    return result


def _parse_game_log_table(soup: BeautifulSoup) -> list[dict]:
    """試合別成績テーブルをパースする"""
    game_log: list[dict] = []
    tables = soup.find_all("table")

    # テーブルが4つ以上ある場合、4つ目が試合別成績
    if len(tables) < 4:
        return game_log

    table = tables[3]
    headers = [th.get_text(strip=True) for th in table.find_all("th")]
    rows = table.find_all("tr")[1:]

    for row in rows:
        cells = row.find_all("td")
        if not cells:
            continue
        cell_texts = [c.get_text(strip=True) for c in cells]
        entry: dict = {}
        for h, v in zip(headers, cell_texts):
            entry[h] = v
        game_log.append(entry)

    return game_log


def fetch_team_stats() -> dict:
    """
    チームスタッツを取得する

    SSR HTMLからシーズン通算/平均データを抽出する。

    Returns:
        チームスタッツデータ（ベーシック + アドバンスド）
    """
    url = f"{BASE_URL}/club_detail/?TeamID={TEAM_ID}"
    errors: list[dict] = []

    try:
        response = get(url)
        html = response.text
    except Exception as e:
        return {"error": str(e)}

    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")

    stats: dict = {"basic": {}, "advanced": {}}

    # テーブルごとにスタッツを取得
    for i, table in enumerate(tables):
        headers = [th.get_text(strip=True) for th in table.find_all("th")]
        rows = table.find_all("tr")

        if len(rows) < 2:
            continue

        cells = rows[1].find_all("td")
        cell_texts = [c.get_text(strip=True) for c in cells]

        table_data: dict = {}
        for h, v in zip(headers, cell_texts):
            table_data[h] = v

        # 最初の2テーブルはベーシックスタッツ、残りはアドバンスド
        if i < 2:
            stats["basic"].update(table_data)
        else:
            stats["advanced"].update(table_data)

    return {"team_id": TEAM_ID, "stats": stats, "errors": errors}


# ================================================
# ユーティリティ
# ================================================


def _safe_int(value: object) -> int:
    """安全に整数変換する"""
    if value is None:
        return 0
    try:
        return int(value)
    except (ValueError, TypeError):
        return 0


def _safe_float(value: object) -> float | None:
    """安全に浮動小数点数変換する"""
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


