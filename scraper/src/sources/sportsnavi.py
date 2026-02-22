"""
スポナビ（Yahoo Sports）データ取得モジュール

サブソース。B.LEAGUE公式にないデータ（H2H対戦成績、インジュアリー、選手画像）を取得する。
Widget URLへの直接HTTPリクエストでSSR HTMLが返る。認証不要。
"""

# スポナビWidget ベースURL
BASE_URL = "https://sports.yahoo.co.jp/basket/widget/ds/pc/"

# 横浜エクセレンスのTeamID（スポナビでも714）
TEAM_ID = 714


# --- 以下、実装フェーズで各関数を実装する ---


def fetch_head_to_head() -> dict:
    """
    対戦成績（H2H）を取得する

    Returns:
        対戦相手別の勝敗数・平均得点・失点
    """
    raise NotImplementedError


def fetch_injuries() -> dict:
    """
    インジュアリーリストを取得する

    Returns:
        怪我・離脱情報のリスト
    """
    raise NotImplementedError


def fetch_team_leaders() -> dict:
    """
    チームリーダー（得点王・リバウンド王・アシスト王）を取得する

    Returns:
        チームリーダーデータ
    """
    raise NotImplementedError


def fetch_player_image(player_id: str) -> str | None:
    """
    選手の画像URLを取得する

    Args:
        player_id: スポナビのPlayerID

    Returns:
        画像URL（取得できない場合はNone）
    """
    raise NotImplementedError
