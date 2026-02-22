import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "選手一覧",
};

/**
 * P4: 選手一覧ページ
 *
 * ロスター全体を把握し、主要スタッツを比較するページ。
 * - ポジションフィルター
 * - スタッツ分布チャート
 * - 選手カードグリッド
 * - 移籍選手セクション
 */
export default function PlayersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">選手一覧</h1>

      {/* TODO: ポジションフィルター */}
      {/* TODO: スタッツ分布チャート */}
      {/* TODO: 選手カードグリッド */}

      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        <p>選手一覧コンテンツ（実装予定）</p>
      </div>
    </div>
  );
}
