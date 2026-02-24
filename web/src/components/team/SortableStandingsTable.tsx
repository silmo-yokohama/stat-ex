"use client";

/**
 * ソート機能付き順位表テーブル
 *
 * B2順位表ページで地区ごとの順位テーブルを表示する。
 * カラムヘッダーをクリックしてソートを切り替え可能。
 * デフォルトは順位（#）の昇順。
 * 横浜EXの行はライトグリーンの背景でハイライト。
 */

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/SortableTableHead";

// ================================================
// 型定義
// ================================================

/** 順位表の1行分のデータ */
export type StandingRow = {
  id: string;
  rank: number | null;
  team_name: string;
  short_name: string;
  wins: number;
  losses: number;
  win_pct: number | null;
  games_behind: number | null;
  points_for: number | null;
  points_against: number | null;
  point_diff: number | null;
  streak: string | null;
  last5: string | null;
};

type SortKey =
  | "rank"
  | "team_name"
  | "wins"
  | "losses"
  | "win_pct"
  | "games_behind"
  | "points_for"
  | "points_against"
  | "point_diff";

/** カラム定義 */
const COLUMNS: { key: SortKey; label: string; defaultDesc: boolean }[] = [
  { key: "rank", label: "#", defaultDesc: false },
  { key: "team_name", label: "チーム", defaultDesc: false },
  { key: "wins", label: "W", defaultDesc: true },
  { key: "losses", label: "L", defaultDesc: true },
  { key: "win_pct", label: "Win%", defaultDesc: true },
  { key: "games_behind", label: "GB", defaultDesc: false },
  { key: "points_for", label: "PF", defaultDesc: true },
  { key: "points_against", label: "PA", defaultDesc: false },
  { key: "point_diff", label: "Diff", defaultDesc: true },
];

// ================================================
// ヘルパー
// ================================================

/** 横浜エクセレンスの行かどうかを判定する */
function isYokohamaEx(shortName: string): boolean {
  return shortName === "横浜EX";
}

/**
 * 順位表をソートする
 */
function sortStandings(data: StandingRow[], key: SortKey, dir: "asc" | "desc"): StandingRow[] {
  return [...data].sort((a, b) => {
    let aVal: number | string | null;
    let bVal: number | string | null;

    if (key === "team_name") {
      aVal = a.team_name;
      bVal = b.team_name;
    } else if (key === "rank") {
      aVal = a.rank ?? 99;
      bVal = b.rank ?? 99;
    } else {
      aVal = a[key] ?? -999;
      bVal = b[key] ?? -999;
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      return dir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    const numA = typeof aVal === "number" ? aVal : 0;
    const numB = typeof bVal === "number" ? bVal : 0;
    return dir === "asc" ? numA - numB : numB - numA;
  });
}

// ================================================
// メインコンポーネント
// ================================================

type Props = {
  /** 順位表データ配列 */
  standings: StandingRow[];
};

/**
 * ソート機能付き順位表テーブル
 *
 * @param standings - 1つの地区分の順位表データ
 */
export function SortableStandingsTable({ standings }: Props) {
  // ソート状態: デフォルトは順位昇順
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  /** カラムヘッダークリックでソート切替 */
  const handleSort = (key: string, defaultDesc: boolean) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key as SortKey);
      setSortDir(defaultDesc ? "desc" : "asc");
    }
  };

  const sorted = useMemo(
    () => sortStandings(standings, sortKey, sortDir),
    [standings, sortKey, sortDir]
  );

  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <SortableTableHead
                key={col.key}
                sortKey={col.key}
                currentSortKey={sortKey}
                currentDirection={sortDir}
                defaultDesc={col.defaultDesc}
                onSort={handleSort}
                className={
                  col.key === "rank" ? "w-12" : col.key === "team_name" ? "text-left" : ""
                }
              >
                {col.label}
              </SortableTableHead>
            ))}
            {/* Streak と Last 5 はソート対象外（文字列形式のため通常ヘッダー） */}
            <TableHead className="text-center">Streak</TableHead>
            <TableHead className="text-center">Last 5</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => {
            const isHighlight = isYokohamaEx(row.short_name);

            return (
              <TableRow key={row.id} className={isHighlight ? "highlight-row bg-[#e8f5ee]" : ""}>
                {/* 順位 */}
                <TableCell className="text-center font-display text-lg">
                  {row.rank ?? "-"}
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
                <TableCell className="text-center tabular-nums">
                  {row.win_pct !== null ? `${row.win_pct.toFixed(1)}` : "-"}
                </TableCell>

                {/* ゲーム差 */}
                <TableCell className="text-center text-muted-foreground tabular-nums">
                  {row.games_behind !== null
                    ? row.games_behind === 0
                      ? "-"
                      : row.games_behind.toFixed(1)
                    : "-"}
                </TableCell>

                {/* 平均得点 */}
                <TableCell className="text-center tabular-nums">
                  {row.points_for !== null ? row.points_for.toFixed(1) : "-"}
                </TableCell>

                {/* 平均失点 */}
                <TableCell className="text-center tabular-nums">
                  {row.points_against !== null ? row.points_against.toFixed(1) : "-"}
                </TableCell>

                {/* 得失点差 */}
                <TableCell
                  className={`text-center tabular-nums ${
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
