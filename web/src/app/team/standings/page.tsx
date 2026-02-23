import type { Metadata } from "next";
import { getStandings } from "@/lib/data";
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
  description: "B.LEAGUE B2リーグの順位表。横浜エクセレンスの順位をハイライト表示。",
};

/**
 * 横浜エクセレンスの行かどうかを判定する
 *
 * team_idが "team-0001" を含む行を横浜EXとして識別する。
 *
 * @param teamId - チームID
 * @returns 横浜EXの行であればtrue
 */
function isYokohamaEx(teamId: string): boolean {
  return teamId.includes("team-0001");
}

/**
 * P7: B2順位表ページ
 *
 * B2リーグ全チームの順位を一覧表示するページ。
 * - 順位、チーム名、W、L、勝率、GB、PF、PA、得失点差、連勝/敗、直近5試合
 * - 横浜エクセレンスの行はライトグリーンの背景でハイライト
 * - モバイルでは水平スクロール対応
 */
export default async function StandingsPage() {
  const standings = await getStandings();

  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Icon name="leaderboard" size={24} className="text-primary" />
          B2順位表
        </h1>
        <p className="text-sm text-muted-foreground">2025-26シーズン</p>
      </div>

      {/* 順位表テーブル（モバイルで水平スクロール対応） */}
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
            {standings.map((row) => {
              // 横浜EXの行をハイライト
              const isHighlight = isYokohamaEx(row.team_id);

              return (
                <TableRow key={row.id} className={isHighlight ? "highlight-row bg-[#e8f5ee]" : ""}>
                  {/* 順位 */}
                  <TableCell className="text-center font-display text-lg">{row.rank}</TableCell>

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
    </div>
  );
}
