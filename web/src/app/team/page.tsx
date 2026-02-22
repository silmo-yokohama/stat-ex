import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "チーム成績",
};

/**
 * P6: チーム成績ページ
 *
 * チーム全体のパフォーマンスを分析するページ。
 * - シーズンサマリー
 * - 累積勝利数グラフ
 * - ホーム vs アウェイ比較
 * - 月別成績
 * - Q別得点傾向
 * - H2H対戦成績
 * - インジュアリーリスト
 */
export default function TeamPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">チーム成績</h1>

      {/* TODO: シーズンサマリー */}
      {/* TODO: 累積勝利数 + H/A比較 */}
      {/* TODO: 月別成績 + Q別得点傾向 */}
      {/* TODO: H2H対戦成績 */}
      {/* TODO: インジュアリーリスト */}

      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        <p>チーム成績コンテンツ（実装予定）</p>
      </div>
    </div>
  );
}
