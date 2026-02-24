"use client";

/**
 * H2H対戦成績テーブル（ソート機能付き）
 *
 * チーム成績ページで各対戦相手との勝敗・平均得点/失点を表示する。
 * カラムヘッダーをクリックしてソートを切り替え可能。
 * デフォルトは勝敗差（勝ち越し数）の多い順。
 */

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/SortableTableHead";

// ================================================
// 型定義
// ================================================

/** H2Hレコードの1行分のデータ */
export type H2HRow = {
  id: string;
  /** 対戦相手名 */
  opponent_name: string;
  /** 勝ち数 */
  wins: number;
  /** 負け数 */
  losses: number;
  /** 平均得点 */
  avg_points_for: number | null;
  /** 平均失点 */
  avg_points_against: number | null;
};

type SortKey = "opponent_name" | "wins" | "losses" | "avg_points_for" | "avg_points_against" | "diff";

/** カラム定義 */
const COLUMNS: { key: SortKey; label: string; defaultDesc: boolean }[] = [
  { key: "opponent_name", label: "対戦相手", defaultDesc: false },
  { key: "wins", label: "W", defaultDesc: true },
  { key: "losses", label: "L", defaultDesc: true },
  { key: "avg_points_for", label: "Avg PF", defaultDesc: true },
  { key: "avg_points_against", label: "Avg PA", defaultDesc: false },
];

// ================================================
// ヘルパー
// ================================================

/**
 * H2Hレコードをソートする
 */
function sortH2H(data: H2HRow[], key: SortKey, dir: "asc" | "desc"): H2HRow[] {
  return [...data].sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;

    if (key === "opponent_name") {
      aVal = a.opponent_name;
      bVal = b.opponent_name;
    } else if (key === "diff") {
      // 勝敗差（仮想カラム）
      aVal = a.wins - a.losses;
      bVal = b.wins - b.losses;
    } else if (key === "avg_points_for" || key === "avg_points_against") {
      aVal = a[key] ?? 0;
      bVal = b[key] ?? 0;
    } else {
      aVal = a[key];
      bVal = b[key];
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
  /** H2Hレコード配列 */
  data: H2HRow[];
};

/**
 * ソート機能付きH2H対戦成績テーブル
 *
 * @param data - 対戦相手ごとの勝敗・平均得失点データ
 */
export function H2HTable({ data }: Props) {
  // ソート状態: デフォルトは勝ち数降順
  const [sortKey, setSortKey] = useState<SortKey>("wins");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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
    () => sortH2H(data, sortKey, sortDir),
    [data, sortKey, sortDir]
  );

  return (
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
              className={col.key === "opponent_name" ? "text-left" : ""}
            >
              {col.label}
            </SortableTableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="font-medium">{record.opponent_name}</TableCell>
            <TableCell className="text-center text-[#006d3b] font-semibold">
              {record.wins}
            </TableCell>
            <TableCell className="text-center text-[#9CA3AF] font-semibold">
              {record.losses}
            </TableCell>
            <TableCell className="text-center tabular-nums">
              {record.avg_points_for !== null ? record.avg_points_for.toFixed(1) : "-"}
            </TableCell>
            <TableCell className="text-center tabular-nums">
              {record.avg_points_against !== null ? record.avg_points_against.toFixed(1) : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
