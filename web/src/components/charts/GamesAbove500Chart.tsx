"use client";

/**
 * ペナントレースチャート（貯金/借金シーズン推移）
 *
 * B2リーグの貯金/借金推移を折れ線グラフで可視化する。
 * 野球のペナントレースチャートと同じコンセプト。
 *
 * - 横軸: 試合数（1, 2, 3, ...）
 * - 縦軸: 貯金/借金数 = (累積勝数 - 累積敗数) / 2
 * - 横浜EXの所属地区をデフォルト表示
 * - 横浜EX: 太い緑色の実線（実際の試合データから計算）
 * - 東地区チーム: 青系の線
 * - 西地区チーム: 暖色系の線
 * - 0ライン（.500基準）を ReferenceLine で明示
 *
 * タブで「東地区」「西地区」を切り替え。
 * 横浜EXの線は自分の所属地区のみに表示する。
 */

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { B2Division } from "@/lib/constants";

// ================================================
// 型定義
// ================================================

/** チームのシーズン推移データ */
export type PennantRaceTeam = {
  /** チーム短縮名 */
  teamName: string;
  /** 横浜EXかどうか（ハイライト用） */
  isExcellence: boolean;
  /** 所属地区（東地区/西地区） */
  division: B2Division | null;
  /** 試合毎の累積gamesAbove500: [第1試合後, 第2試合後, ...] */
  progression: number[];
};

type Props = {
  /** 全チームの推移データ */
  teams: PennantRaceTeam[];
};

// ================================================
// 定数
// ================================================

/** 横浜EXの線色 */
const COLOR_EX = "#006d3b";

/**
 * 東地区チーム用の色パレット（青系）
 * 横浜EX以外の東地区6チーム分
 */
const EAST_PALETTE = [
  "#3B82F6", // ブルー
  "#6366F1", // インディゴ
  "#8B5CF6", // パープル
  "#06B6D4", // シアン
  "#14B8A6", // ティール
  "#84CC16", // ライム
];

/**
 * 西地区チーム用の色パレット（暖色系）
 * 西地区7チーム分
 */
const WEST_PALETTE = [
  "#F97316", // オレンジ
  "#EF4444", // レッド
  "#EC4899", // ピンク
  "#EAB308", // イエロー
  "#F59E0B", // アンバー
  "#A855F7", // バイオレット
  "#78716C", // ストーン
];

/** ツールチップの共通スタイル */
const tooltipBaseStyle: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid #e2e4e6",
  fontSize: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  backgroundColor: "white",
  padding: "8px 12px",
};

// ================================================
// サブコンポーネント
// ================================================

/** gamesAbove値を +N / -N / 0 形式にフォーマットする */
function formatGamesAbove(v: number): string {
  return v > 0 ? `+${v}` : String(v);
}

/**
 * カスタムツールチップ
 *
 * 横浜EXを先頭に太字表示し、他チームは値の降順で表示する。
 */
function PennantTooltip({
  active,
  payload,
  label,
  exTeamName,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
  exTeamName?: string;
}) {
  if (!active || !payload?.length) return null;

  // 有効なエントリを値の降順でソート
  const entries = payload.filter((p) => p.value != null).sort((a, b) => b.value - a.value);

  // 横浜EXのエントリを分離
  const exEntry = entries.find((e) => e.name === exTeamName);
  const others = entries.filter((e) => e.name !== exTeamName);

  return (
    <div style={{ ...tooltipBaseStyle, maxHeight: "280px", overflowY: "auto" }}>
      <p
        style={{
          fontWeight: 600,
          marginBottom: 4,
          borderBottom: "1px solid #e2e4e6",
          paddingBottom: 4,
        }}
      >
        第{label}試合
      </p>

      {/* 横浜EX（先頭・太字・グリーン） */}
      {exEntry && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            fontWeight: 700,
            color: COLOR_EX,
            marginBottom: 4,
            paddingBottom: 4,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <span>{exEntry.name}</span>
          <span>{formatGamesAbove(exEntry.value)}</span>
        </div>
      )}

      {/* 他チーム（値の降順） */}
      {others.map((entry) => (
        <div
          key={entry.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            lineHeight: "1.7",
          }}
        >
          <span style={{ color: entry.color, fontWeight: 500 }}>{entry.name}</span>
          <span style={{ color: "#606060" }}>{formatGamesAbove(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ================================================
// メインコンポーネント
// ================================================

/**
 * ペナントレースチャート
 *
 * 地区別にチームの貯金/借金推移を折れ線で表示する。
 * 横浜EXの所属地区をデフォルトタブとし、
 * 他地区のタブでは横浜EXの線を含めない。
 *
 * @param teams - 全チームの推移データ（地区情報付き）
 */
export function GamesAbove500Chart({ teams }: Props) {
  // 横浜EXの所属地区をデータから動的に判定（シーズンごとに変わる可能性に対応）
  const exTeam = teams.find((t) => t.isExcellence);
  const exDivision: B2Division = exTeam?.division ?? "東地区";

  const [filter, setFilter] = useState<B2Division>(exDivision);

  // タブ選択肢（地区のみ）
  const filterTabs: { label: string; value: B2Division }[] = [
    { label: "東地区", value: "東地区" },
    { label: "西地区", value: "西地区" },
  ];

  // フィルタに応じてチームを絞り込む
  // 横浜EXは自分の所属地区のみに表示する
  const filteredTeams = teams.filter((t) => {
    if (t.isExcellence) return filter === exDivision;
    return t.division === filter;
  });

  // 現在のタブがEXの所属地区かどうか
  const isExDivision = filter === exDivision;

  // Recharts用のフラットデータ構造に変換
  // 各データポイント: { game: 1, "横浜EX": 0.5, "信州": 0.29, ... }
  const maxGames = Math.max(...filteredTeams.map((t) => t.progression.length), 0);
  const chartData: Record<string, number | string>[] = [];

  for (let i = 0; i < maxGames; i++) {
    const point: Record<string, number | string> = { game: i + 1 };
    for (const team of filteredTeams) {
      if (i < team.progression.length) {
        point[team.teamName] = team.progression[i];
      }
    }
    chartData.push(point);
  }

  // 横浜EXと他チームを分離（横浜EXを最後にレンダリング → 最前面に表示）
  const visibleEx = isExDivision ? filteredTeams.find((t) => t.isExcellence) : undefined;
  const otherTeams = filteredTeams.filter((t) => !t.isExcellence);

  // 地区別に色を割り当て
  const teamColorMap: Record<string, string> = {};
  const palette = filter === "東地区" ? EAST_PALETTE : WEST_PALETTE;
  let colorIdx = 0;
  for (const t of otherTeams) {
    teamColorMap[t.teamName] = palette[colorIdx % palette.length];
    colorIdx++;
  }

  return (
    <div>
      {/* 地区フィルタタブ */}
      <div className="mb-4 flex gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === tab.value
                ? "bg-[#006d3b] text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 16, right: 16, left: 4, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e4e6" />

          {/* X軸: 試合数 */}
          <XAxis
            dataKey="game"
            tick={{ fontSize: 11, fill: "#606060" }}
            axisLine={{ stroke: "#e2e4e6" }}
            tickLine={false}
          />

          {/* Y軸: 貯金/借金数 */}
          <YAxis
            tick={{ fontSize: 11, fill: "#606060" }}
            axisLine={false}
            tickLine={false}
            width={35}
            tickFormatter={(v: number) => formatGamesAbove(v)}
          />

          {/* ツールチップ */}
          <Tooltip content={<PennantTooltip exTeamName={visibleEx?.teamName} />} />

          {/* .500ライン（基準線） */}
          <ReferenceLine
            y={0}
            stroke="#374151"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            label={{
              value: ".500",
              position: "right",
              style: { fontSize: 10, fill: "#606060" },
            }}
          />

          {/* 他チームの線（先にレンダリング → 背面に配置） */}
          {otherTeams.map((team) => (
            <Line
              key={team.teamName}
              type="monotone"
              dataKey={team.teamName}
              stroke={teamColorMap[team.teamName]}
              strokeWidth={1.2}
              strokeOpacity={0.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 1 }}
              connectNulls={false}
            />
          ))}

          {/* 横浜EXの線（最後にレンダリング → 最前面に表示、所属地区のみ） */}
          {visibleEx && (
            <Line
              type="monotone"
              dataKey={visibleEx.teamName}
              stroke={COLOR_EX}
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 5,
                stroke: COLOR_EX,
                strokeWidth: 2,
                fill: "#fff",
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
