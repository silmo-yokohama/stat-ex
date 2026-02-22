"""
RSS フィード取得モジュール

Google News RSS、公式HP RSS、YouTube RSSからデータを取得する。
feedparserライブラリを使用してRSS/Atomフィードをパースする。
"""

from datetime import datetime, timezone, timedelta
from typing import Optional

import feedparser

from src.utils.http import get
from src.utils.output import output_error

# 日本時間
JST = timezone(timedelta(hours=9))

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


def fetch_google_news(limit: int = 20) -> dict:
    """
    Google News RSSから横浜エクセレンス関連ニュースを取得する

    Args:
        limit: 最大取得件数

    Returns:
        ニュース記事のリスト（タイトル、ソース名、公開日、リンク）
    """
    errors: list[dict] = []

    try:
        # feedparserでRSSフィードを取得・パース
        feed = feedparser.parse(GOOGLE_NEWS_RSS_URL)
    except Exception as e:
        return {"error": str(e), "articles": []}

    if feed.bozo and feed.bozo_exception:
        errors.append({
            "source": "google_news",
            "message": f"RSSパースエラー: {feed.bozo_exception}",
        })

    articles: list[dict] = []

    for entry in feed.entries[:limit]:
        try:
            # Google Newsの場合、sourceタグにメディア名が入る
            source_name = ""
            if hasattr(entry, "source") and hasattr(entry.source, "title"):
                source_name = entry.source.title
            elif " - " in entry.get("title", ""):
                # タイトル末尾の「 - メディア名」から取得
                source_name = entry.title.rsplit(" - ", 1)[-1]

            # 公開日時をパース
            published_at = _parse_date(entry.get("published", ""))

            articles.append({
                "title": _clean_title(entry.get("title", "")),
                "url": entry.get("link", ""),
                "published_at": published_at,
                "source_name": source_name,
                "source": "media",
            })
        except Exception as e:
            errors.append({"source": "google_news.entry", "message": str(e)})

    return {"articles": articles, "total": len(articles), "errors": errors}


def fetch_official_news(limit: int = 20) -> dict:
    """
    横浜エクセレンス公式HP RSSからニュースを取得する

    Atomフォーマット（CMS: RCMS）。
    description（summary/content）は空のため、タイトルとリンクのみ取得。

    Args:
        limit: 最大取得件数

    Returns:
        公式ニュースのリスト（タイトル、更新日、リンク、サムネイルURL）
    """
    errors: list[dict] = []

    try:
        feed = feedparser.parse(OFFICIAL_RSS_URL)
    except Exception as e:
        return {"error": str(e), "articles": []}

    if feed.bozo and feed.bozo_exception:
        errors.append({
            "source": "official_news",
            "message": f"RSSパースエラー: {feed.bozo_exception}",
        })

    articles: list[dict] = []

    for entry in feed.entries[:limit]:
        try:
            # サムネイル画像（enclosureタグから取得）
            thumbnail_url = None
            if hasattr(entry, "enclosures") and entry.enclosures:
                for enc in entry.enclosures:
                    if enc.get("type", "").startswith("image/"):
                        thumbnail_url = enc.get("href") or enc.get("url")
                        break

            # 公開日時をパース
            published_at = _parse_date(
                entry.get("published", entry.get("updated", ""))
            )

            articles.append({
                "title": entry.get("title", ""),
                "url": entry.get("link", ""),
                "published_at": published_at,
                "thumbnail_url": thumbnail_url,
                "source_name": "横浜エクセレンス公式",
                "source": "official",
            })
        except Exception as e:
            errors.append({"source": "official_news.entry", "message": str(e)})

    return {"articles": articles, "total": len(articles), "errors": errors}


def fetch_youtube_videos(limit: int = 15) -> dict:
    """
    YouTube公式チャンネルRSSから動画情報を取得する

    Atomフォーマット。最新15件のみ返される（YouTube RSS制限）。

    Args:
        limit: 最大取得件数

    Returns:
        動画のリスト（videoId、タイトル、公開日、サムネイルURL）
    """
    errors: list[dict] = []

    try:
        feed = feedparser.parse(YOUTUBE_RSS_URL)
    except Exception as e:
        return {"error": str(e), "videos": []}

    if feed.bozo and feed.bozo_exception:
        errors.append({
            "source": "youtube",
            "message": f"RSSパースエラー: {feed.bozo_exception}",
        })

    videos: list[dict] = []

    for entry in feed.entries[:limit]:
        try:
            # YouTube RSSのvideoIdはyt:videoIdタグに入る
            video_id = entry.get("yt_videoid", "")

            # URLからvideoIdを取得（フォールバック）
            if not video_id and entry.get("link"):
                link = entry["link"]
                if "watch?v=" in link:
                    video_id = link.split("watch?v=")[-1].split("&")[0]

            # サムネイルURL
            thumbnail_url = None
            if hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
                thumbnail_url = entry.media_thumbnail[0].get("url")
            elif video_id:
                # YouTube標準のサムネイルURLを生成
                thumbnail_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"

            # 公開日時をパース
            published_at = _parse_date(entry.get("published", ""))

            videos.append({
                "video_id": video_id,
                "title": entry.get("title", ""),
                "published_at": published_at,
                "thumbnail_url": thumbnail_url,
            })
        except Exception as e:
            errors.append({"source": "youtube.entry", "message": str(e)})

    return {"videos": videos, "total": len(videos), "errors": errors}


# ================================================
# ユーティリティ
# ================================================


def _parse_date(date_str: str) -> Optional[str]:
    """
    日付文字列をISO 8601形式に変換する

    feedparserが返す様々な日付形式に対応する。

    Args:
        date_str: パース対象の日付文字列

    Returns:
        ISO 8601形式の日付文字列、パースできない場合はNone
    """
    if not date_str:
        return None

    # feedparserのtime_structを試行
    try:
        import time
        parsed = feedparser._parse_date(date_str)
        if parsed:
            dt = datetime(*parsed[:6], tzinfo=timezone.utc)
            return dt.isoformat()
    except Exception:
        pass

    # よくある日付形式を試行
    formats = [
        "%a, %d %b %Y %H:%M:%S %z",  # RFC 822
        "%Y-%m-%dT%H:%M:%S%z",         # ISO 8601
        "%Y-%m-%dT%H:%M:%SZ",          # ISO 8601 (UTC)
        "%Y-%m-%d %H:%M:%S",           # 一般的な形式
        "%Y-%m-%d",                     # 日付のみ
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=JST)
            return dt.isoformat()
        except ValueError:
            continue

    return date_str


def _clean_title(title: str) -> str:
    """
    Google Newsのタイトルからメディア名を除去する

    Google Newsは「記事タイトル - メディア名」形式でタイトルを返す。

    Args:
        title: 元のタイトル

    Returns:
        クリーニング後のタイトル
    """
    if " - " in title:
        return title.rsplit(" - ", 1)[0].strip()
    return title.strip()
