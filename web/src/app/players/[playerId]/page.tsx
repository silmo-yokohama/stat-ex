import type { Metadata } from "next";

type Props = {
  params: Promise<{ playerId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerId } = await params;
  return {
    title: `選手詳細 - ${playerId}`,
  };
}

/**
 * P5: 選手詳細ページ
 *
 * 特定選手のシーズン成績と試合ごとの推移を深掘りするページ。
 * - 選手ヘッダー
 * - Season Averageカード
 * - 試合ごと推移グラフ
 * - シューティングスプリット
 * - 試合別スタッツログ
 */
export default async function PlayerDetailPage({ params }: Props) {
  const { playerId } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">選手詳細</h1>
      <p className="text-sm text-muted-foreground">PlayerID: {playerId}</p>

      {/* TODO: 選手ヘッダー */}
      {/* TODO: Season Averageカード */}
      {/* TODO: 試合ごと推移グラフ */}
      {/* TODO: シューティングスプリット */}
      {/* TODO: 試合別スタッツログ */}

      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        <p>選手詳細コンテンツ（実装予定）</p>
      </div>
    </div>
  );
}
