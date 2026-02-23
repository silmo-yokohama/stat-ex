"use client";

/**
 * 月別勝敗チャート
 *
 * 月ごとの勝ち数・負け数を積み上げ棒グラフで表示する。
 * 勝ち=グリーン、負け=グレーの配色でシーズン推移を把握できる。
 * チーム成績ページで使用。
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

/** 月別の勝敗データ */
type MonthlyRecordData = {
  month: string;
  wins: number;
  losses: number;
};

type Props = {
  /** 月別の勝敗データ配列 */
  data: MonthlyRecordData[];
};

/** 共通のツールチップスタイル */
const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid #e2e4e6",
  fontSize: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

/**
 * 月別勝敗チャート
 *
 * @param data - 月ごとの勝ち数・負け数
 */
export function MonthlyRecordChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e4e6" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#606060" }}
          axisLine={{ stroke: "#e2e4e6" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#606060" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number | undefined, name: string | undefined) => [
            `${value ?? 0}試合`,
            name === "wins" ? "勝ち" : "負け",
          ]}
        />
        <Legend
          formatter={(value: string) => (value === "wins" ? "勝ち" : "負け")}
          wrapperStyle={{ fontSize: "12px" }}
        />
        {/* 勝ち: ダークグリーン（下段に配置） */}
        <Bar dataKey="wins" stackId="record" fill="#006d3b" radius={[0, 0, 0, 0]} barSize={32} />
        {/* 負け: グレー（上段に積み上げ） */}
        <Bar dataKey="losses" stackId="record" fill="#9CA3AF" radius={[4, 4, 0, 0]} barSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
