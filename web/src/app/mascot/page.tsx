import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "マスコット紹介",
};

/**
 * P8: マスコット紹介ページ
 *
 * チームマスコットの紹介ページ。
 * - メインビジュアル
 * - プロフィール
 * - ギャラリー
 */
export default function MascotPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">マスコット紹介</h1>

      {/* TODO: メインビジュアル */}
      {/* TODO: プロフィール */}
      {/* TODO: ギャラリー */}

      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        <p>マスコット紹介コンテンツ（実装予定）</p>
      </div>
    </div>
  );
}
