"""
B.LEAGUE公式サイトスクレイパーのテスト

パースロジックを中心にテストする。
実際のHTTPリクエストは送信せず、HTMLサンプルを使う。
"""

import pytest
from src.sources.bleague import (
    _parse_schedule_item,
    _parse_boxscores,
    _extract_game_data_from_html,
    _safe_int,
    _safe_float,
    _determine_status,
)


class TestParseScheduleItem:
    """スケジュールAPIレスポンスのパーステスト"""

    def test_正常な試合データをパースできる(self):
        item = {
            "ScheduleKey": "B2-2025-001",
            "GameDate": "2025-10-04",
            "GameTime": "18:00",
            "HomeTeamID": 714,
            "AwayTeamID": 696,
            "HomeTeamName": "横浜エクセレンス",
            "AwayTeamName": "アルティーリ千葉",
            "HomeTeamScore": "82",
            "AwayTeamScore": "75",
            "Arena": "横浜武道館",
            "SectionName": "第1節",
        }
        result = _parse_schedule_item(item)

        assert result is not None
        assert result["schedule_key"] == "B2-2025-001"
        assert result["home_away"] == "HOME"
        assert result["score_home"] == 82
        assert result["score_away"] == 75
        assert result["status"] == "FINAL"

    def test_横浜EXがアウェイの場合(self):
        item = {
            "ScheduleKey": "B2-2025-002",
            "GameDate": "2025-10-11",
            "GameTime": "18:00",
            "HomeTeamID": 717,
            "AwayTeamID": 714,
            "HomeTeamName": "越谷アルファーズ",
            "AwayTeamName": "横浜エクセレンス",
            "HomeTeamScore": "80",
            "AwayTeamScore": "90",
            "Arena": "ウイング・ハット春日部",
        }
        result = _parse_schedule_item(item)

        assert result is not None
        assert result["home_away"] == "AWAY"

    def test_ScheduleKeyがない場合はNoneを返す(self):
        item = {"GameDate": "2025-10-04"}
        result = _parse_schedule_item(item)
        assert result is None

    def test_空のデータでもエラーにならない(self):
        result = _parse_schedule_item({})
        assert result is None


class TestParseBoxscores:
    """ボックススコアのパーステスト"""

    def test_正常なボックススコアをパースできる(self):
        boxscores = [
            {
                "PlayerID": "10001",
                "PlayerName": "田中 大輝",
                "PlayerNo": "0",
                "StartingFlg": "1",
                "PlayingTime": "32:15",
                "Point": "14",
                "FieldGoalsMade": "5",
                "FieldGoalsAttempted": "11",
                "FieldGoalsPercentage": "45.5",
                "ThreePointersMade": "2",
                "ThreePointersAttempted": "4",
                "ThreePointersPercentage": "50.0",
                "FreeThrowsMade": "2",
                "FreeThrowsAttempted": "2",
                "FreeThrowsPercentage": "100.0",
                "OffensiveRebounds": "0",
                "DefensiveRebounds": "3",
                "Rebounds": "3",
                "Assists": "8",
                "Turnovers": "3",
                "Steals": "2",
                "BlockShots": "0",
                "Fouls": "2",
                "Efficiency": "18",
                "PlusMinus": "8",
            }
        ]
        result = _parse_boxscores(boxscores, "home")

        assert len(result) == 1
        player = result[0]
        assert player["player_id"] == "10001"
        assert player["player_name"] == "田中 大輝"
        assert player["team_side"] == "home"
        assert player["is_starter"] is True
        assert player["pts"] == 14
        assert player["fg_pct"] == 45.5
        assert player["ast"] == 8
        assert player["plus_minus"] == 8

    def test_空のボックススコアリスト(self):
        result = _parse_boxscores([], "away")
        assert result == []

    def test_スターターフラグが0の場合(self):
        boxscores = [{"PlayerID": "10006", "StartingFlg": "0"}]
        result = _parse_boxscores(boxscores, "home")
        assert result[0]["is_starter"] is False


class TestExtractGameData:
    """HTML内のゲームデータ抽出テスト"""

    def test_contexts_s3idパターンを抽出できる(self):
        html = '''
        <script>
        _contexts_s3id.data = {"HomeTeamScore01": 22, "AwayTeamScore01": 18, "HomeBoxscores": []};
        </script>
        '''
        result = _extract_game_data_from_html(html)
        assert result is not None
        assert result["HomeTeamScore01"] == 22

    def test_データが見つからない場合はNone(self):
        html = "<html><body>データなし</body></html>"
        result = _extract_game_data_from_html(html)
        assert result is None


class TestSafeConversions:
    """安全な型変換のテスト"""

    def test_safe_int_正常値(self):
        assert _safe_int("42") == 42
        assert _safe_int(42) == 42

    def test_safe_int_None(self):
        assert _safe_int(None) == 0

    def test_safe_int_不正な値(self):
        assert _safe_int("abc") == 0
        assert _safe_int("") == 0

    def test_safe_float_正常値(self):
        assert _safe_float("45.5") == 45.5

    def test_safe_float_None(self):
        assert _safe_float(None) is None

    def test_safe_float_不正な値(self):
        assert _safe_float("abc") is None


class TestDetermineStatus:
    """試合ステータス判定のテスト"""

    def test_スコアありはFINAL(self):
        item = {"HomeTeamScore": "82", "AwayTeamScore": "75"}
        assert _determine_status(item) == "FINAL"

    def test_スコアなしはSCHEDULED(self):
        item = {"HomeTeamScore": None, "AwayTeamScore": None}
        assert _determine_status(item) == "SCHEDULED"

    def test_スコアが数値でない場合はSCHEDULED(self):
        item = {"HomeTeamScore": "-", "AwayTeamScore": "-"}
        assert _determine_status(item) == "SCHEDULED"
