"""
RSSフィード取得モジュールのテスト

パースロジックとユーティリティをテストする。
"""

import pytest
from src.sources.rss import _parse_date, _clean_title


class TestParseDate:
    """日付パースのテスト"""

    def test_RFC822形式をパースできる(self):
        result = _parse_date("Mon, 21 Feb 2026 22:00:00 +0900")
        assert result is not None
        assert "2026" in result

    def test_ISO8601形式をパースできる(self):
        result = _parse_date("2026-02-21T22:00:00+09:00")
        assert result is not None
        assert "2026-02-21" in result

    def test_空文字列はNone(self):
        result = _parse_date("")
        assert result is None

    def test_日付のみの形式(self):
        result = _parse_date("2026-02-21")
        assert result is not None
        assert "2026-02-21" in result


class TestCleanTitle:
    """Google Newsタイトルクリーニングのテスト"""

    def test_メディア名を除去できる(self):
        title = "横浜エクセレンスが勝利 - バスケットボールキング"
        result = _clean_title(title)
        assert result == "横浜エクセレンスが勝利"

    def test_ハイフンが複数ある場合は最後のみ除去(self):
        title = "B2リーグ - 横浜EX vs 千葉 - スポーツナビ"
        result = _clean_title(title)
        assert result == "B2リーグ - 横浜EX vs 千葉"

    def test_ハイフンがない場合はそのまま返す(self):
        title = "横浜エクセレンスが勝利"
        result = _clean_title(title)
        assert result == "横浜エクセレンスが勝利"

    def test_空白のトリミング(self):
        title = "  横浜EX  "
        result = _clean_title(title)
        assert result == "横浜EX"
