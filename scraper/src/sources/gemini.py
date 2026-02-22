"""
Gemini AI 試合寸評生成モジュール

ボックススコアとクォーター別スコアから、200〜300字の試合要約を自動生成する。
Gemini 2.0 Flash を使用。
"""

import os
import json

import google.generativeai as genai

from src.utils.output import output_error

# Gemini APIキー（環境変数から取得）
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# 使用モデル
MODEL_NAME = "gemini-2.0-flash"

# 寸評の目標文字数
TARGET_LENGTH_MIN = 200
TARGET_LENGTH_MAX = 300

# 試合寸評生成用のシステムプロンプト
SYSTEM_PROMPT = """あなたはバスケットボールの試合解説者です。
横浜エクセレンス（B.LEAGUE B2）のファン向けに、試合の寸評を日本語で書いてください。

以下のルールに従ってください:
- 200〜300字で簡潔にまとめる
- 横浜エクセレンス視点で書く（「横浜EX」と略称する）
- 主要な活躍選手を2〜3名挙げる
- クォーターごとの流れを簡潔に触れる
- 勝敗の要因を分析する
- 数字（得点・リバウンド等）を具体的に含める
- ファンが読んで楽しい、ポジティブなトーンで書く（負け試合でも課題と次への期待に触れる）"""


def generate_game_comment(box_score: dict, quarter_scores: dict) -> str:
    """
    ボックススコアとクォーター別スコアから試合寸評を生成する

    Args:
        box_score: ボックススコアデータ（game_info, home_box_scores, away_box_scores含む）
        quarter_scores: クォーター別スコア

    Returns:
        生成された試合寸評テキスト（200〜300字）

    Raises:
        ValueError: APIキーが未設定の場合
        RuntimeError: API呼び出しが失敗した場合
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY が設定されていません")

    # Gemini APIを設定
    genai.configure(api_key=GEMINI_API_KEY)

    # 入力データを整形
    prompt = _build_prompt(box_score, quarter_scores)

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(
            [SYSTEM_PROMPT, prompt],
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=500,
            ),
        )

        comment = response.text.strip()

        # 文字数チェック（大幅に超過している場合は警告）
        if len(comment) > TARGET_LENGTH_MAX * 1.5:
            output_error(
                f"生成された寸評が長すぎます: {len(comment)}字",
                "gemini.length",
            )

        return comment

    except Exception as e:
        raise RuntimeError(f"Gemini API呼び出しエラー: {e}") from e


def _build_prompt(box_score: dict, quarter_scores: dict) -> str:
    """
    Geminiに送信するプロンプトを組み立てる

    ボックススコアとクォーター別スコアを読みやすい形式に整形する。

    Args:
        box_score: ボックススコアデータ
        quarter_scores: クォーター別スコア

    Returns:
        整形されたプロンプト文字列
    """
    game_info = box_score.get("game_info", {})
    home_name = game_info.get("home_team_name", "ホーム")
    away_name = game_info.get("away_team_name", "アウェイ")
    score_home = game_info.get("score_home", 0)
    score_away = game_info.get("score_away", 0)
    venue = game_info.get("venue", "")
    attendance = game_info.get("attendance", 0)

    # クォーター別スコア
    q_lines = []
    for q in range(1, 5):
        qh = quarter_scores.get(f"q{q}_home", 0)
        qa = quarter_scores.get(f"q{q}_away", 0)
        q_lines.append(f"Q{q}: {home_name} {qh} - {qa} {away_name}")

    # ホームチームの主要選手（得点トップ5）
    home_box = box_score.get("home_box_scores", [])
    home_top = sorted(home_box, key=lambda x: x.get("pts", 0), reverse=True)[:5]

    # アウェイチームの主要選手（得点トップ5）
    away_box = box_score.get("away_box_scores", [])
    away_top = sorted(away_box, key=lambda x: x.get("pts", 0), reverse=True)[:5]

    prompt_parts = [
        "以下の試合データから寸評を作成してください。",
        "",
        f"【試合結果】{home_name} {score_home} - {score_away} {away_name}",
        f"【会場】{venue}（観客数: {attendance}人）",
        "",
        "【クォーター別スコア】",
        *q_lines,
        "",
        f"【{home_name} 主要選手】",
    ]

    for p in home_top:
        name = p.get("player_name", "")
        pts = p.get("pts", 0)
        reb = p.get("reb", 0)
        ast = p.get("ast", 0)
        prompt_parts.append(f"  {name}: {pts}得点 {reb}リバウンド {ast}アシスト")

    prompt_parts.append(f"\n【{away_name} 主要選手】")
    for p in away_top:
        name = p.get("player_name", "")
        pts = p.get("pts", 0)
        reb = p.get("reb", 0)
        ast = p.get("ast", 0)
        prompt_parts.append(f"  {name}: {pts}得点 {reb}リバウンド {ast}アシスト")

    return "\n".join(prompt_parts)
