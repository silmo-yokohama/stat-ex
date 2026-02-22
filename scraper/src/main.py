"""
STAT-EX バッチ実行メインスクリプト

GitHub Actions から毎日22:00 JSTに実行される。
各データソースからデータを収集し、Supabaseに格納する。
"""

import sys
from datetime import datetime, timezone, timedelta

JST = timezone(timedelta(hours=9))


def main() -> None:
    """バッチ処理のメインエントリポイント"""
    print(f"[STAT-EX] バッチ開始: {datetime.now(JST).isoformat()}")

    errors: list[dict] = []

    # TODO: 実装フェーズで以下のステップを実装する
    # 1. B.LEAGUE公式: 試合結果・ボックススコア取得
    # 2. B.LEAGUE公式: 選手スタッツ・順位表・チーム成績取得
    # 3. スポナビ: H2H対戦成績・インジュアリー・チームリーダー取得
    # 4. RSS: Google News・公式HP・YouTube動画取得
    # 5. Gemini: 新しい試合のAI寸評生成
    # 6. Supabase: 全データを格納

    print(f"[STAT-EX] バッチ完了: {datetime.now(JST).isoformat()}")

    if errors:
        print(f"[STAT-EX] エラー {len(errors)} 件:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
