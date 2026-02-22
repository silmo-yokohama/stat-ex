import type { Metadata } from "next";

type Props = {
  params: Promise<{ scheduleKey: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { scheduleKey } = await params;
  return {
    title: `試合詳細 - ${scheduleKey}`,
  };
}

/**
 * P3: 試合詳細ページ
 *
 * 1試合の全情報を集約するページ。リアルタイム更新対応。
 * - スコアボードヘッダー
 * - Q別得点比較グラフ
 * - チーム比較チャート
 * - ボックススコア
 * - ダイジェスト動画（試合後のみ）
 * - AI試合寸評（試合後のみ）
 * - 試合情報
 */
export default async function GameDetailPage({ params }: Props) {
  const { scheduleKey } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">試合詳細</h1>
      <p className="text-sm text-muted-foreground">
        ScheduleKey: {scheduleKey}
      </p>

      {/* TODO: スコアボードヘッダー */}
      {/* TODO: Q別得点比較 + チーム比較チャート */}
      {/* TODO: ボックススコアテーブル */}
      {/* TODO: ダイジェスト動画 */}
      {/* TODO: AI試合寸評 */}

      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        <p>試合詳細コンテンツ（実装予定）</p>
      </div>
    </div>
  );
}
