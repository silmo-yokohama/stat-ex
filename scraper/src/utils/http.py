"""
HTTPリクエスト用ユーティリティ

スクレイピング時の共通設定（User-Agent、レート制限、タイムアウト）を提供する。
"""

import time
from typing import Optional

import requests

# STAT-EX のUser-Agent
USER_AGENT = "stat-ex/1.0 (https://github.com/silmo-yokohama/stat-ex)"

# デフォルトタイムアウト（秒）
DEFAULT_TIMEOUT = 15

# リクエスト間の最低待機時間（秒）
MIN_REQUEST_INTERVAL = 1.0

# 最後のリクエスト時刻
_last_request_time: float = 0.0


def get(url: str, headers: Optional[dict] = None, timeout: int = DEFAULT_TIMEOUT) -> requests.Response:
    """
    レート制限付きGETリクエストを実行する

    Args:
        url: リクエスト先URL
        headers: 追加ヘッダー（User-Agentは自動設定）
        timeout: タイムアウト（秒）

    Returns:
        requests.Response
    """
    global _last_request_time

    # レート制限: 前回リクエストから最低1秒待機
    elapsed = time.time() - _last_request_time
    if elapsed < MIN_REQUEST_INTERVAL:
        time.sleep(MIN_REQUEST_INTERVAL - elapsed)

    request_headers = {"User-Agent": USER_AGENT}
    if headers:
        request_headers.update(headers)

    response = requests.get(url, headers=request_headers, timeout=timeout)
    _last_request_time = time.time()

    response.raise_for_status()
    return response
