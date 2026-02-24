import type { Metadata } from "next";
import { getStandings } from "@/lib/data";
import { B2_DIVISIONS, getCurrentSeasonName } from "@/lib/constants";
import { Icon } from "@/components/ui/Icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "B2順位表",
  description: "B.LEAGUE B2リーグの順位表。東地区・西地区・ワイルドカードの3区分で表示。",
};

/** 順位表の1行データ型 */
type StandingRow = Awaited<ReturnType<typeof getStandings>>[number];

/**
 * 横浜エクセレンスの行かどうかを判定する
 */
function isYokohamaEx(shortName: string): boolean {
  return shortName === "横浜EX";
}

/**
 * 順位表テーブルコンポーネント
 *
 * 1つの地区分のテーブルを描画する。
 * 横浜EXの行はライトグリーンの背景でハイライト。
 */
function StandingsTable({ standings }: { standings: StandingRow[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center w-12">#</TableHead>
            <TableHead>チーム</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">L</TableHead>
            <TableHead className="text-center">Win%</TableHead>
            <TableHead className="text-center">GB</TableHead>
            <TableHead className="text-center">PF</TableHead>
            <TableHead className="text-center">PA</TableHead>
            <TableHead className="text-center">Diff</TableHead>
            <TableHead className="text-center">Streak</TableHead>
            <TableHead className="text-center">Last 5</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((row, idx) => {
            const isHighlight = isYokohamaEx(row.short_name);

            return (
              <TableRow key={row.id} className={isHighlight ? "highlight-row bg-[#e8f5ee]" : ""}>
                {/* 順位 */}
                <TableCell className="text-center font-display text-lg">
                  {row.rank ?? idx + 1}
                </TableCell>

                {/* チーム名 */}
                <TableCell
                  className={`font-medium ${isHighlight ? "text-[#006d3b] font-bold" : ""}`}
                >
                  {row.team_name}
                </TableCell>

                {/* 勝数 */}
                <TableCell className="text-center font-semibold text-[#006d3b]">
                  {row.wins}
                </TableCell>

                {/* 敗数 */}
                <TableCell className="text-center text-[#9CA3AF]">{row.losses}</TableCell>

                {/* 勝率 */}
                <TableCell className="text-center">
                  {row.win_pct !== null ? `${row.win_pct.toFixed(1)}` : "-"}
                </TableCell>

                {/* ゲーム差 */}
                <TableCell className="text-center text-muted-foreground">
                  {row.games_behind !== null
                    ? row.games_behind === 0
                      ? "-"
                      : row.games_behind.toFixed(1)
                    : "-"}
                </TableCell>

                {/* 平均得点 */}
                <TableCell className="text-center">
                  {row.points_for !== null ? row.points_for.toFixed(1) : "-"}
                </TableCell>

                {/* 平均失点 */}
                <TableCell className="text-center">
                  {row.points_against !== null ? row.points_against.toFixed(1) : "-"}
                </TableCell>

                {/* 得失点差 */}
                <TableCell
                  className={`text-center ${
                    row.point_diff !== null && row.point_diff > 0
                      ? "text-[#006d3b]"
                      : row.point_diff !== null && row.point_diff < 0
                        ? "text-red-500"
                        : ""
                  }`}
                >
                  {row.point_diff !== null
                    ? `${row.point_diff > 0 ? "+" : ""}${row.point_diff.toFixed(1)}`
                    : "-"}
                </TableCell>

                {/* 連勝/連敗 */}
                <TableCell className="text-center">
                  {row.streak ? (
                    <span
                      className={
                        row.streak.startsWith("W")
                          ? "text-[#006d3b] font-semibold"
                          : "text-[#9CA3AF] font-semibold"
                      }
                    >
                      {row.streak}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>

                {/* 直近5試合 */}
                <TableCell className="text-center text-sm">{row.last5 ?? "-"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

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
        <StandingsTable standings={east} />
      </section>

      {/* 西地区 */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <span className="inline-block h-4 w-1 rounded bg-orange-500" />
          西地区
        </h2>
        <StandingsTable standings={west} />
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
          <StandingsTable standings={wildcard} />
        </section>
      )}

      {/* 注記 */}
      <p className="text-xs text-muted-foreground">
        各地区上位3チーム + ワイルドカード上位2チーム = 計8チームがプレーオフ進出
      </p>
    </div>
  );
}
