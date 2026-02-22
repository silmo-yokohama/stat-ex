import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "試合一覧",
};

/**
 * P2: 試合一覧ページ
 *
 * シーズン全試合（終了済み + 予定）を一覧で確認。
 * - フィルターバー（月・H/A・勝敗/予定・対戦相手）
 * - 勝敗ストリークバー
 * - 試合カード（終了済み / 予定）
 */
export default function GamesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">試合一覧</h1>

      {/* TODO: フィルターバー */}
      {/* TODO: 勝敗ストリークバー */}
      {/* TODO: 試合カードグリッド */}

      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        <p>試合一覧コンテンツ（実装予定）</p>
      </div>
    </div>
  );
}
