"use client";

/**
 * ボックススコアテーブル（タブ切替 + ソート機能付き）
 *
 * - エクセレンスタブ / 相手チームタブで選手を分離表示
 * - デフォルトソート: スターター → ベンチ、得点(PTS)降順
 * - 各カラムヘッダーをクリックしてソート可能
 * - 得点上位3名: セル背景グリーン
 * - EFF上位3名: テキストグリーン太字
 * - +/-: プラス=グリーン、マイナス=赤
 */

import { useState, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import type { BoxScore, Player } from "@/lib/types/database";

// ================================================
// 型定義
// ================================================

type BoxScoreWithPlayer = BoxScore & { player: Player };

type SortKey =
  | "number"
  | "name"
  | "minutes"
  | "pts"
  | "fg_pct"
  | "tp_pct"
  | "ft_pct"
  | "reb"
  | "ast"
  | "tov"
  | "stl"
  | "blk"
  | "fouls"
  | "eff"
  | "plus_minus";

type SortDirection = "asc" | "desc";

type Props = {
  /** 全ボックススコア（両チーム分） */
  boxScores: BoxScoreWithPlayer[];
  /** エクセレンスがホーム側かどうか */
  isExHome: boolean;
  /** ホームチーム名 */
  homeName: string;
  /** アウェイチーム名 */
  awayName: string;
};

// ================================================
// ヘルパー
// ================================================

/**
 * ボックススコアから得点/EFF上位3名のIDセットを取得する
 */
function getTopIds(boxScores: BoxScoreWithPlayer[], key: "pts" | "eff"): Set<string> {
  return new Set(
    [...boxScores]
      .sort((a, b) => b[key] - a[key])
      .slice(0, 3)
      .map((bs) => bs.id)
  );
}

/**
 * ソートキーに基づいてボックススコアをソートする
 *
 * スターター/ベンチの区分は常に維持し、その中でソートする。
 */
function sortBoxScores(
  boxScores: BoxScoreWithPlayer[],
  sortKey: SortKey,
  direction: SortDirection
): BoxScoreWithPlayer[] {
  const sorted = [...boxScores];

  sorted.sort((a, b) => {
    // スターターを常に先頭に
    if (a.is_starter && !b.is_starter) return -1;
    if (!a.is_starter && b.is_starter) return 1;

    // ソートキーに基づく比較
    let aVal: number | string | null = 0;
    let bVal: number | string | null = 0;

    switch (sortKey) {
      case "number":
        aVal = a.player.number ?? 999;
        bVal = b.player.number ?? 999;
        break;
      case "name":
        aVal = a.player.name ?? "";
        bVal = b.player.name ?? "";
        break;
      case "minutes":
        aVal = a.minutes ?? "";
        bVal = b.minutes ?? "";
        break;
      case "fg_pct":
      case "tp_pct":
      case "ft_pct":
        aVal = a[sortKey] ?? -1;
        bVal = b[sortKey] ?? -1;
        break;
      default:
        aVal = a[sortKey] as number;
        bVal = b[sortKey] as number;
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      return direction === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    const numA = typeof aVal === "number" ? aVal : 0;
    const numB = typeof bVal === "number" ? bVal : 0;
    return direction === "asc" ? numA - numB : numB - numA;
  });

  return sorted;
}

// ================================================
// カラムヘッダー定義
// ================================================

const COLUMNS: { key: SortKey; label: string; defaultDesc: boolean }[] = [
  { key: "number", label: "#", defaultDesc: false },
  { key: "name", label: "選手名", defaultDesc: false },
  { key: "minutes", label: "MIN", defaultDesc: true },
  { key: "pts", label: "PTS", defaultDesc: true },
  { key: "fg_pct", label: "FG%", defaultDesc: true },
  { key: "tp_pct", label: "3P%", defaultDesc: true },
  { key: "ft_pct", label: "FT%", defaultDesc: true },
  { key: "reb", label: "REB", defaultDesc: true },
  { key: "ast", label: "AST", defaultDesc: true },
  { key: "tov", label: "TO", defaultDesc: false },
  { key: "stl", label: "STL", defaultDesc: true },
  { key: "blk", label: "BLK", defaultDesc: true },
  { key: "fouls", label: "F", defaultDesc: false },
  { key: "eff", label: "EFF", defaultDesc: true },
  { key: "plus_minus", label: "+/-", defaultDesc: true },
];

// ================================================
// メインコンポーネント
// ================================================

export function BoxScoreTable({ boxScores, isExHome, homeName, awayName }: Props) {
  // EX選手 / 相手選手を team_side で分離
  const exSide = isExHome ? "home" : "away";
  const exScores = boxScores.filter((bs) => bs.team_side === exSide);
  const oppScores = boxScores.filter((bs) => bs.team_side !== exSide);

  // タブ状態（"ex" = エクセレンス、"opp" = 相手チーム）
  const [activeTab, setActiveTab] = useState<"ex" | "opp">("ex");

  // ソート状態
  const [sortKey, setSortKey] = useState<SortKey>("pts");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  /** カラムヘッダークリックでソート切替 */
  const handleSort = (key: SortKey, defaultDesc: boolean) => {
    if (sortKey === key) {
      // 同じキー → 方向を反転
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      // 新しいキー → デフォルト方向で設定
      setSortKey(key);
      setSortDir(defaultDesc ? "desc" : "asc");
    }
  };

  // 表示するボックススコアをソート
  const currentScores = activeTab === "ex" ? exScores : oppScores;
  const sorted = useMemo(
    () => sortBoxScores(currentScores, sortKey, sortDir),
    [currentScores, sortKey, sortDir]
  );

  // ハイライト用の上位3名ID（現在のタブ内で計算）
  const ptsTop3 = useMemo(() => getTopIds(currentScores, "pts"), [currentScores]);
  const effTop3 = useMemo(() => getTopIds(currentScores, "eff"), [currentScores]);

  if (boxScores.length === 0) return null;

  // タブの表示名
  const exTabName = isExHome ? homeName : awayName;
  const oppTabName = isExHome ? awayName : homeName;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Icon name="table_chart" size={20} className="text-primary" />
        ボックススコア
      </h2>

      {/* タブ切替 */}
      <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setActiveTab("ex")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === "ex"
              ? "bg-[#006d3b] text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {exTabName}
        </button>
        <button
          onClick={() => setActiveTab("opp")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === "opp"
              ? "bg-gray-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {oppTabName}
        </button>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead
                  key={col.key}
                  className={`cursor-pointer select-none text-center transition-colors hover:bg-muted/50 ${
                    col.key === "name" ? "text-left" : ""
                  } ${col.key === "number" ? "w-10" : ""}`}
                  onClick={() => handleSort(col.key, col.defaultDesc)}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {col.label}
                    {/* ソート方向インジケーター */}
                    {sortKey === col.key && (
                      <Icon
                        name={sortDir === "desc" ? "arrow_downward" : "arrow_upward"}
                        size={12}
                        className="text-primary"
                      />
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((bs, index) => {
              const rowClass = bs.is_starter ? "font-semibold" : "";
              // スターターとベンチの境界にセパレータを挿入
              const isFirstBench =
                !bs.is_starter && index > 0 && sorted[index - 1].is_starter;

              // 得点上位3名はセル背景をハイライト
              const isPtsTop = ptsTop3.has(bs.id);
              const ptsHighlight = isPtsTop ? "bg-[#e8f5ee]" : "";

              // EFF上位3名はテキストをグリーン太字で強調
              const isEffTop = effTop3.has(bs.id);
              const effHighlight = isEffTop ? "text-[#006d3b] font-bold" : "";

              // +/-の色分け
              const plusMinusColor =
                bs.plus_minus > 0
                  ? "text-[#006d3b]"
                  : bs.plus_minus < 0
                    ? "text-[#ef4444]"
                    : "";

              return (
                <TableRow
                  key={bs.id}
                  className={isFirstBench ? "border-t-2 border-border" : ""}
                >
                  <TableCell className={`text-center ${rowClass}`}>
                    {bs.player.number ?? "-"}
                  </TableCell>
                  <TableCell className={rowClass}>{bs.player.name}</TableCell>
                  <TableCell className={`text-center ${rowClass}`}>
                    {bs.minutes ?? "-"}
                  </TableCell>
                  <TableCell className={`text-center ${rowClass} ${ptsHighlight}`}>
                    {bs.pts}
                  </TableCell>
                  <TableCell className={`text-center ${rowClass}`}>
                    {bs.fg_pct !== null ? `${bs.fg_pct}%` : "-"}
                  </TableCell>
                  <TableCell className={`text-center ${rowClass}`}>
                    {bs.tp_pct !== null ? `${bs.tp_pct}%` : "-"}
                  </TableCell>
                  <TableCell className={`text-center ${rowClass}`}>
                    {bs.ft_pct !== null ? `${bs.ft_pct}%` : "-"}
                  </TableCell>
                  <TableCell className={`text-center ${rowClass}`}>{bs.reb}</TableCell>
                  <TableCell className={`text-center ${rowClass}`}>{bs.ast}</TableCell>
                  <TableCell className={`text-center ${rowClass}`}>{bs.tov}</TableCell>
                  <TableCell className={`text-center ${rowClass}`}>{bs.stl}</TableCell>
                  <TableCell className={`text-center ${rowClass}`}>{bs.blk}</TableCell>
                  <TableCell className={`text-center ${rowClass}`}>
                    {bs.fouls}
                  </TableCell>
                  <TableCell className={`text-center ${rowClass} ${effHighlight}`}>
                    {bs.eff}
                  </TableCell>
                  <TableCell className={`text-center ${rowClass} ${plusMinusColor}`}>
                    {bs.plus_minus > 0 ? `+${bs.plus_minus}` : bs.plus_minus}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
