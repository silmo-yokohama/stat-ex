"use client";

/**
 * 選手ゲームログテーブル（ソート機能付き）
 *
 * 選手詳細ページで各試合のボックススコアを表形式で表示する。
 * カラムヘッダーをクリックしてソートを切り替え可能。
 * デフォルトは日付の新しい順（降順）。
 *
 * カラム: 日付 / 対戦 / 結果 / MIN / PTS / REB / AST / STL / BLK / TO / FG / 3P / FT / +/- / EFF
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

/** ゲームログの1行分のデータ */
export type GameLogRow = {
  /** 試合日（"YYYY-MM-DD" 形式） */
  game_date: string;
  /** 対戦相手名 */
  opponent_name: string | null;
  /** ホーム/アウェイ */
  home_away: string;
  /** 勝敗結果（"W 80-70" 形式） */
  result: string | null;
  /** 出場時間 */
  minutes: string | null;
  /** 得点 */
  pts: number;
  /** リバウンド */
  reb: number;
  /** アシスト */
  ast: number;
  /** スティール */
  stl: number;
  /** ブロック */
  blk: number;
  /** ターンオーバー */
  tov: number;
  /** FG成功数 */
  fgm: number;
  /** FG試投数 */
  fga: number;
  /** 3P成功数 */
  tpm: number;
  /** 3P試投数 */
  tpa: number;
  /** FT成功数 */
  ftm: number;
  /** FT試投数 */
  fta: number;
  /** プラスマイナス */
  plus_minus: number;
  /** 効率値 */
  eff: number;
};

type SortKey =
  | "game_date"
  | "opponent_name"
  | "pts"
  | "reb"
  | "ast"
  | "stl"
  | "blk"
  | "tov"
  | "fgm"
  | "tpm"
  | "ftm"
  | "plus_minus"
  | "eff";

/** カラム定義: ソートキー・ラベル・デフォルト方向 */
const COLUMNS: { key: SortKey; label: string; defaultDesc: boolean }[] = [
  { key: "game_date", label: "日付", defaultDesc: true },
  { key: "opponent_name", label: "対戦", defaultDesc: false },
  { key: "pts", label: "PTS", defaultDesc: true },
  { key: "reb", label: "REB", defaultDesc: true },
  { key: "ast", label: "AST", defaultDesc: true },
  { key: "stl", label: "STL", defaultDesc: true },
  { key: "blk", label: "BLK", defaultDesc: true },
  { key: "tov", label: "TO", defaultDesc: false },
  { key: "fgm", label: "FG", defaultDesc: true },
  { key: "tpm", label: "3P", defaultDesc: true },
  { key: "ftm", label: "FT", defaultDesc: true },
  { key: "plus_minus", label: "+/-", defaultDesc: true },
  { key: "eff", label: "EFF", defaultDesc: true },
];

// ================================================
// ヘルパー
// ================================================

/**
 * 試合日付を "M/D" 形式にフォーマットする
 */
function formatGameDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * ゲームログをソートする
 */
function sortGameLog(data: GameLogRow[], key: SortKey, dir: "asc" | "desc"): GameLogRow[] {
  return [...data].sort((a, b) => {
    let aVal: number | string | null;
    let bVal: number | string | null;

    if (key === "opponent_name") {
      aVal = a.opponent_name ?? "";
      bVal = b.opponent_name ?? "";
    } else if (key === "game_date") {
      aVal = a.game_date;
      bVal = b.game_date;
    } else {
      aVal = a[key] as number;
      bVal = b[key] as number;
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
  /** ゲームログデータ配列 */
  data: GameLogRow[];
};

/**
 * ソート機能付きゲームログテーブル
 *
 * @param data - 全試合のボックススコアデータ（新しい順で渡される想定）
 */
export function GameLogTable({ data }: Props) {
  // ソート状態: デフォルトは日付降順（新しい順）
  const [sortKey, setSortKey] = useState<SortKey>("game_date");
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
    () => sortGameLog(data, sortKey, sortDir),
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
        {sorted.map((g, i) => {
          const isWin = g.result?.startsWith("W");
          return (
            <TableRow key={i}>
              {/* 日付: MM/DD形式 */}
              <TableCell className="text-center text-xs text-muted-foreground">
                {formatGameDate(g.game_date)}
              </TableCell>
              {/* 対戦相手: H/Aマーク付き */}
              <TableCell className="text-center text-xs">
                <span className="text-muted-foreground">
                  {g.home_away === "HOME" ? "vs" : "@"}
                </span>{" "}
                {g.opponent_name ?? "不明"}
                {/* 勝敗バッジ */}
                <span
                  className={`ml-1 text-[10px] font-medium ${
                    isWin ? "text-[#006d3b]" : "text-[#9CA3AF]"
                  }`}
                >
                  {g.result ?? ""}
                </span>
              </TableCell>
              {/* 得点: 太字で強調 */}
              <TableCell className="text-center font-semibold tabular-nums">{g.pts}</TableCell>
              <TableCell className="text-center tabular-nums">{g.reb}</TableCell>
              <TableCell className="text-center tabular-nums">{g.ast}</TableCell>
              <TableCell className="text-center tabular-nums">{g.stl}</TableCell>
              <TableCell className="text-center tabular-nums">{g.blk}</TableCell>
              <TableCell className="text-center tabular-nums">{g.tov}</TableCell>
              {/* FG: 成功/試投 */}
              <TableCell className="text-center text-xs tabular-nums">
                {g.fgm}/{g.fga}
              </TableCell>
              {/* 3P: 成功/試投 */}
              <TableCell className="text-center text-xs tabular-nums">
                {g.tpm}/{g.tpa}
              </TableCell>
              {/* FT: 成功/試投 */}
              <TableCell className="text-center text-xs tabular-nums">
                {g.ftm}/{g.fta}
              </TableCell>
              {/* +/-: プラスは緑、マイナスは赤 */}
              <TableCell className="text-center tabular-nums">
                <span
                  className={
                    g.plus_minus > 0
                      ? "text-[#006d3b]"
                      : g.plus_minus < 0
                        ? "text-red-500"
                        : ""
                  }
                >
                  {g.plus_minus > 0 ? `+${g.plus_minus}` : g.plus_minus}
                </span>
              </TableCell>
              <TableCell className="text-center tabular-nums">{g.eff}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
