"""
出力用ユーティリティ

スクレイピング結果をJSON形式で標準出力に出力する。
knowledge-hubプロジェクトのUnixパイプ設計パターンを踏襲。
"""

import json
import sys
from datetime import datetime, timezone, timedelta
from typing import Any

# 日本時間（JST）
JST = timezone(timedelta(hours=9))


def output_result(data: dict[str, Any], errors: list[dict[str, str]] | None = None) -> None:
    """
    スクレイピング結果をJSON形式で標準出力に出力する

    Args:
        data: 出力データ
        errors: エラー情報のリスト（あれば）
    """
    result = {
        "fetched_at": datetime.now(JST).isoformat(),
        **data,
    }

    if errors:
        result["errors"] = errors

    print(json.dumps(result, ensure_ascii=False, indent=2))


def output_error(message: str, source: str = "") -> None:
    """
    エラーメッセージをJSON形式で標準エラー出力に出力する

    Args:
        message: エラーメッセージ
        source: エラー発生元
    """
    error = {
        "error": True,
        "message": message,
        "source": source,
        "timestamp": datetime.now(JST).isoformat(),
    }
    print(json.dumps(error, ensure_ascii=False, indent=2), file=sys.stderr)
