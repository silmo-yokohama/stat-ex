"""
Gemini AI 試合寸評生成モジュール

ボックススコアとクォーター別スコアから、200〜300字の試合要約を自動生成する。
Gemini 2.0 Flash を使用。
"""

import os

# Gemini APIキー（環境変数から取得）
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# 使用モデル
MODEL_NAME = "gemini-2.0-flash"

# 寸評の目標文字数
TARGET_LENGTH_MIN = 200
TARGET_LENGTH_MAX = 300


# --- 以下、実装フェーズで各関数を実装する ---


def generate_game_comment(box_score: dict, quarter_scores: dict) -> str:
    """
    ボックススコアとクォーター別スコアから試合寸評を生成する

    Args:
        box_score: ボックススコアデータ
        quarter_scores: クォーター別スコア

    Returns:
        生成された試合寸評テキスト（200〜300字）
    """
    raise NotImplementedError
