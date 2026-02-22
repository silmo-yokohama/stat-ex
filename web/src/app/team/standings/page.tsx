import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "B2順位表",
};

/**
 * P7: B2順位表ページ
 *
 * B2リーグ全体の順位を表示。横浜EXの行をハイライト。
 */
export default function StandingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">B2順位表</h1>

      {/* TODO: 順位表テーブル（横浜EXハイライト） */}

      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        <p>B2順位表（実装予定）</p>
      </div>
    </div>
  );
}
