"""
B.LEAGUE公式サイト データ取得モジュール

メインのデータソース。試合結果、ボックススコア、選手スタッツ、順位表を取得する。
横浜エクセレンス TeamID: 714
"""

# 横浜エクセレンスのTeamID
TEAM_ID = 714

# B.LEAGUE公式サイトベースURL
BASE_URL = "https://www.bleague.jp"

# 現在のシーズン開始年
CURRENT_SEASON_YEAR = 2025

# B2リーグ戦のイベントID
B2_EVENT_ID = 7


# --- 以下、実装フェーズで各関数を実装する ---


def fetch_schedule() -> dict:
    """
    試合スケジュール（結果 + 予定）を取得する

    Returns:
        試合データのリスト
    """
    raise NotImplementedError


def fetch_box_score(schedule_key: str) -> dict:
    """
    指定した試合のボックススコアを取得する

    Args:
        schedule_key: 試合のScheduleKey

    Returns:
        ボックススコアデータ
    """
    raise NotImplementedError


def fetch_standings() -> dict:
    """
    B2順位表を取得する

    Returns:
        順位表データ
    """
    raise NotImplementedError


def fetch_player_stats(player_id: str) -> dict:
    """
    選手個人成績を取得する

    Args:
        player_id: B.LEAGUEのPlayerID

    Returns:
        選手スタッツデータ
    """
    raise NotImplementedError


def fetch_team_stats() -> dict:
    """
    チームスタッツを取得する

    Returns:
        チームスタッツデータ
    """
    raise NotImplementedError
