"""
RSS フィード取得モジュール

Google News RSS、公式HP RSS、YouTube RSSからデータを取得する。
"""

# Google News RSS URL
GOOGLE_NEWS_RSS_URL = (
    "https://news.google.com/rss/search?"
    "q=%E6%A8%AA%E6%B5%9C%E3%82%A8%E3%82%AF%E3%82%BB%E3%83%AC%E3%83%B3%E3%82%B9"
    "&hl=ja&gl=JP&ceid=JP:ja"
)

# 横浜エクセレンス公式HP RSS URL
OFFICIAL_RSS_URL = "https://yokohama-ex.jp/RSS.rdf"

# YouTube公式チャンネル RSS URL
YOUTUBE_RSS_URL = (
    "https://www.youtube.com/feeds/videos.xml?"
    "channel_id=UCbdBOgj1aQo4ojYA7Eym4jw"
)

# ハイライト動画プレイリストID
HIGHLIGHT_PLAYLIST_ID = "PLhBws5VoBj5YFIhZM-MAmWKTEbQRxT1qy"


# --- 以下、実装フェーズで各関数を実装する ---


def fetch_google_news() -> dict:
    """
    Google News RSSから横浜エクセレンス関連ニュースを取得する

    Returns:
        ニュース記事のリスト（タイトル、ソース名、公開日、リンク）
    """
    raise NotImplementedError


def fetch_official_news() -> dict:
    """
    横浜エクセレンス公式HP RSSからニュースを取得する

    Returns:
        公式ニュースのリスト（タイトル、更新日、リンク、サムネイルURL）
    """
    raise NotImplementedError


def fetch_youtube_videos() -> dict:
    """
    YouTube公式チャンネルRSSから動画情報を取得する

    Returns:
        動画のリスト（videoId、タイトル、公開日、サムネイルURL）
    """
    raise NotImplementedError
