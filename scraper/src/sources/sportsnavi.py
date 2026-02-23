"""
スポナビ（Yahoo Sports）データ取得モジュール

サブソース。B.LEAGUE公式にないデータ（H2H対戦成績、インジュアリー、選手画像）を取得する。
Widget URLへの直接HTTPリクエストでSSR HTMLが返る。認証不要。
"""

import re
from bs4 import BeautifulSoup

from src.utils.http import get
from src.utils.output import output_error

# スポナビWidget ベースURL
BASE_URL = "https://sports.yahoo.co.jp/basket/widget/ds/pc/"

# 横浜エクセレンスのTeamID（スポナビでも714）
TEAM_ID = 714


def fetch_head_to_head() -> dict:
    """
    対戦成績（H2H）を取得する

    スポナビのheadtohead widgetをパースし、
    全対戦相手との勝敗数・平均得点・失点を取得する。

    HTML構造（2025-26シーズン時点）:
      <td class="ba-table__data">
        <dl>
          <dt class="ba-table__team">
            <a href="...teams/{id}/info">
              <p class="ba-table__name">vs. {チーム名}</p>
            </a>
          </dt>
          <dd class="ba-table__detail">{N}戦{W}勝{L}敗</dd>
          <dd class="ba-table__detail">平均{PF}得点{PA}失点</dd>
        </dl>
      </td>

    Returns:
        対戦相手別の勝敗数・平均得点・失点
    """
    url = f"{BASE_URL}teams/{TEAM_ID}/headtohead.html"
    errors: list[dict] = []

    try:
        response = get(url)
        html = response.text
    except Exception as e:
        return {"error": str(e), "records": []}

    soup = BeautifulSoup(html, "html.parser")
    records: list[dict] = []

    # 「ホーム＆アウェイ」タブ（最初のタブ）のテーブルを取得
    tab_dom = soup.find("div", id="js-tabDom01")
    if not tab_dom:
        # フォールバック: 最初のテーブルを使う
        tab_dom = soup

    # 各対戦相手はtd.ba-table__dataに格納されている
    cells = tab_dom.find_all("td", class_="ba-table__data")

    if not cells:
        errors.append({"source": "h2h", "message": "H2Hデータが見つかりません"})
        return {"records": [], "errors": errors}

    for cell in cells:
        try:
            dl = cell.find("dl")
            if not dl:
                continue

            # チーム名: <p class="ba-table__name">vs. 青森</p>
            name_el = dl.find("p", class_="ba-table__name")
            team_name = name_el.get_text(strip=True) if name_el else ""
            # "vs. 青森" → "青森"
            team_name = re.sub(r"^vs\.\s*", "", team_name)

            # チームID: <a href="...teams/{id}/info"> から抽出
            team_link = dl.find("a")
            opponent_id = None
            if team_link:
                id_match = re.search(r"/teams/(\d+)/", team_link.get("href", ""))
                if id_match:
                    opponent_id = int(id_match.group(1))

            # 戦績・平均得失点: <dd class="ba-table__detail"> から抽出
            details = dl.find_all("dd", class_="ba-table__detail")
            wins = 0
            losses = 0
            avg_points_for = None
            avg_points_against = None

            for dd in details:
                text = dd.get_text(strip=True)
                # "4戦3勝1敗" パターン
                record_match = re.search(r"(\d+)勝(\d+)敗", text)
                if record_match:
                    wins = int(record_match.group(1))
                    losses = int(record_match.group(2))
                # "平均88得点78失点" パターン
                pts_match = re.search(r"平均(\d+)得点(\d+)失点", text)
                if pts_match:
                    avg_points_for = float(pts_match.group(1))
                    avg_points_against = float(pts_match.group(2))

            records.append({
                "opponent_name": team_name,
                "opponent_id": opponent_id,
                "wins": wins,
                "losses": losses,
                "avg_points_for": avg_points_for,
                "avg_points_against": avg_points_against,
            })
        except Exception as e:
            errors.append({"source": "h2h.cell", "message": str(e)})

    return {"records": records, "total": len(records), "errors": errors}


def fetch_injuries() -> dict:
    """
    インジュアリーリストを取得する

    スポナビのinjury widgetをパースし、怪我・離脱情報を取得する。

    Returns:
        怪我・離脱情報のリスト
    """
    url = f"{BASE_URL}teams/{TEAM_ID}/injury.html"
    errors: list[dict] = []

    try:
        response = get(url)
        html = response.text
    except Exception as e:
        return {"error": str(e), "injuries": []}

    soup = BeautifulSoup(html, "html.parser")
    injuries: list[dict] = []

    # テーブルからインジュアリー情報を抽出
    table = soup.find("table")
    if not table:
        # インジュアリーがない場合はテーブル自体が存在しない可能性
        return {"injuries": [], "total": 0, "errors": errors}

    rows = table.find_all("tr")[1:]

    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 3:
            continue

        try:
            # 選手リンクからIDを取得
            player_link = cells[0].find("a")
            player_id = None
            if player_link:
                id_match = re.search(r"/players/(\d+)/", player_link.get("href", ""))
                if id_match:
                    player_id = id_match.group(1)

            cell_texts = [c.get_text(strip=True) for c in cells]

            injuries.append({
                "player_name": cell_texts[0],
                "player_id": player_id,
                "reason": cell_texts[1] if len(cell_texts) > 1 else "",
                "registered_date": cell_texts[2] if len(cell_texts) > 2 else "",
            })
        except Exception as e:
            errors.append({"source": "injury.row", "message": str(e)})

    return {"injuries": injuries, "total": len(injuries), "errors": errors}


def fetch_team_leaders() -> dict:
    """
    チームリーダー（得点王・リバウンド王・アシスト王）を取得する

    スポナビのleaders widgetをパースする。

    Returns:
        チームリーダーデータ（カテゴリ別トップ選手）
    """
    url = f"{BASE_URL}teams/{TEAM_ID}/leaders.html"
    errors: list[dict] = []

    try:
        response = get(url)
        html = response.text
    except Exception as e:
        return {"error": str(e), "leaders": []}

    soup = BeautifulSoup(html, "html.parser")
    leaders: list[dict] = []

    # セクションまたはテーブルごとにリーダーを取得
    sections = soup.find_all("section")
    if not sections:
        sections = soup.find_all("div", class_=re.compile(r"leader|ranking"))

    for section in sections:
        try:
            # カテゴリ名を取得
            heading = section.find(["h2", "h3", "caption", "dt"])
            category = heading.get_text(strip=True) if heading else ""

            table = section.find("table")
            if table:
                rows = table.find_all("tr")
                for row in rows[:3]:  # トップ3まで
                    cells = row.find_all("td")
                    if len(cells) < 2:
                        continue

                    player_link = row.find("a")
                    player_id = None
                    if player_link:
                        id_match = re.search(r"/players/(\d+)/", player_link.get("href", ""))
                        if id_match:
                            player_id = id_match.group(1)

                    cell_texts = [c.get_text(strip=True) for c in cells]

                    leaders.append({
                        "category": category,
                        "rank": _safe_int(cell_texts[0]) if cell_texts[0].isdigit() else None,
                        "player_name": cell_texts[1] if len(cell_texts) > 1 else "",
                        "player_id": player_id,
                        "value": _safe_float(cell_texts[-1]) if cell_texts else None,
                    })
        except Exception as e:
            errors.append({"source": "leaders.section", "message": str(e)})

    return {"leaders": leaders, "total": len(leaders), "errors": errors}


def fetch_player_image(player_id: str) -> str | None:
    """
    選手の画像URLを取得する

    B.LEAGUE公式には選手画像がないため、スポナビから取得する。

    Args:
        player_id: スポナビのPlayerID

    Returns:
        画像URL（取得できない場合はNone）
    """
    url = f"{BASE_URL}players/{player_id}/detail.html"

    try:
        response = get(url)
        html = response.text
    except Exception as e:
        output_error(f"選手画像取得エラー: {e}", "sportsnavi.player_image")
        return None

    soup = BeautifulSoup(html, "html.parser")

    # 選手画像を探す
    img_selectors = [
        soup.find("img", class_=re.compile(r"player|profile|photo")),
        soup.find("img", alt=re.compile(r"選手|player", re.IGNORECASE)),
    ]

    for img in img_selectors:
        if img and img.get("src"):
            src = img["src"]
            # 相対URLを絶対URLに変換
            if src.startswith("//"):
                return f"https:{src}"
            elif src.startswith("/"):
                return f"https://sports.yahoo.co.jp{src}"
            return src

    return None


# ================================================
# ユーティリティ
# ================================================


def _safe_int(value: object) -> int:
    """安全に整数変換する"""
    if value is None:
        return 0
    try:
        return int(str(value).replace(",", ""))
    except (ValueError, TypeError):
        return 0


def _safe_float(value: object) -> float | None:
    """安全に浮動小数点数変換する"""
    if value is None:
        return None
    try:
        return float(str(value).replace(",", ""))
    except (ValueError, TypeError):
        return None
