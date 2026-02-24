import type { Metadata } from "next";
import { getStandings } from "@/lib/data";
import { B2_DIVISIONS, getCurrentSeasonName } from "@/lib/constants";
import { Icon } from "@/components/ui/Icon";
import { SortableStandingsTable } from "@/components/team/SortableStandingsTable";

export const metadata: Metadata = {
  title: "B2順位表",
  description: "B.LEAGUE B2リーグの順位表。東地区・西地区・ワイルドカードの3区分で表示。",
};

/**
 * P7: B2順位表ページ
 *
 * B2リーグの順位を東地区・西地区・ワイルドカードの3セクションで表示。
 * - 東地区: 7チーム（rank昇順）
 * - 西地区: 7チーム（rank昇順）
 * - ワイルドカード: 各地区4位以下の8チームを勝率順に並べたもの
 * - 横浜EXの行はライトグリーンの背景でハイライト
 */
export default async function StandingsPage() {
  const standings = await getStandings();

  // 地区情報を付与（constants.ts のマッピングを使用）
  const withDivision = standings.map((s) => ({
    ...s,
    division: B2_DIVISIONS[s.short_name] ?? null,
  }));

  // 東地区・西地区に分割
  const east = withDivision
    .filter((s) => s.division === "東地区")
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  const west = withDivision
    .filter((s) => s.division === "西地区")
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  // ワイルドカード: 各地区4位以下を勝率順にソート
  const wildcard = withDivision
    .filter((s) => (s.rank ?? 0) > 3)
    .sort((a, b) => {
      // 勝率の降順
      const wpA = a.win_pct ?? 0;
      const wpB = b.win_pct ?? 0;
      return wpB - wpA;
    });

  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Icon name="leaderboard" size={24} className="text-primary" />
          B2順位表
        </h1>
        <p className="text-sm text-muted-foreground">{getCurrentSeasonName()}シーズン</p>
      </div>

      {/* 東地区 */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <span className="inline-block h-4 w-1 rounded bg-blue-500" />
          東地区
        </h2>
        <SortableStandingsTable standings={east} />
      </section>

      {/* 西地区 */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <span className="inline-block h-4 w-1 rounded bg-orange-500" />
          西地区
        </h2>
        <SortableStandingsTable standings={west} />
      </section>

      {/* ワイルドカード */}
      {wildcard.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <span className="inline-block h-4 w-1 rounded bg-gray-400" />
            ワイルドカード
            <span className="text-sm font-normal text-muted-foreground">
              （各地区4位以下 / 勝率順）
            </span>
          </h2>
          <SortableStandingsTable standings={wildcard} />
        </section>
      )}

      {/* 注記 */}
      <p className="text-xs text-muted-foreground">
        各地区上位3チーム + ワイルドカード上位2チーム = 計8チームがプレーオフ進出
      </p>
    </div>
  );
}
