"use client";

/**
 * クォーター別スコア比較チャート
 *
 * Q1〜Q4の各クォーターにおけるホーム／アウェイチームの得点を
 * グループ棒グラフで並べて表示する。
 * 試合詳細ページなどで使用。
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/** クォーターごとの得点データ */
type QuarterScoreData = {
  quarter: string;
  home: number;
  away: number;
};

type Props = {
  /** Q1〜Q4の得点データ配列 */
  data: QuarterScoreData[];
  /** ホームチーム名 */
  homeTeamName: string;
  /** アウェイチーム名 */
  awayTeamName: string;
};

/** 共通のツールチップスタイル */
const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid #e2e4e6",
  fontSize: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

/**
 * クォーター別スコア比較チャート
 *
 * @param data - Q1〜Q4の得点データ
 * @param homeTeamName - ホームチーム名（凡例に表示）
 * @param awayTeamName - アウェイチーム名（凡例に表示）
 */
export function QuarterChart({ data, homeTeamName, awayTeamName }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e4e6" vertical={false} />
        <XAxis
          dataKey="quarter"
          tick={{ fontSize: 12, fill: "#606060" }}
          axisLine={{ stroke: "#e2e4e6" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#606060" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number | undefined, name: string | undefined) => [
            `${value ?? 0}点`,
            name === "home" ? homeTeamName : awayTeamName,
          ]}
        />
        <Legend
          formatter={(value: string) =>
            value === "home" ? homeTeamName : awayTeamName
          }
          wrapperStyle={{ fontSize: "12px" }}
        />
        {/* ホームチーム: チームカラー（ダークグリーン） */}
        <Bar
          dataKey="home"
          fill="#006d3b"
          radius={[4, 4, 0, 0]}
          barSize={28}
        />
        {/* アウェイチーム: グレー */}
        <Bar
          dataKey="away"
          fill="#9CA3AF"
          radius={[4, 4, 0, 0]}
          barSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
