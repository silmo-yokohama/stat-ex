"use client";

/**
 * クォーター別得点傾向レーダーチャート
 *
 * Q1〜Q4の平均得点・平均失点をレーダーチャートで重ねて表示する。
 * チームの各クォーターにおける攻守の強弱を一目で把握できる。
 * チーム成績ページで使用。
 */

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

/** クォーターごとの平均得点データ */
type QuarterRadarData = {
  quarter: string;
  avgFor: number;
  avgAgainst: number;
};

type Props = {
  /** Q1〜Q4の平均得点・平均失点データ */
  data: QuarterRadarData[];
};

/** 共通のツールチップスタイル */
const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid #e2e4e6",
  fontSize: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

/**
 * クォーター別得点傾向レーダーチャート
 *
 * @param data - Q1〜Q4の平均得点と平均失点
 */
export function QuarterRadar({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        {/* レーダーグリッド */}
        <PolarGrid stroke="#e2e4e6" />
        {/* 軸ラベル（Q1〜Q4） */}
        <PolarAngleAxis
          dataKey="quarter"
          tick={{ fontSize: 12, fill: "#606060" }}
        />
        {/* 数値目盛り */}
        <PolarRadiusAxis
          angle={90}
          tick={{ fontSize: 10, fill: "#606060" }}
          axisLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number | undefined, name: string | undefined) => [
            `${(value ?? 0).toFixed(1)}点`,
            name === "avgFor" ? "平均得点" : "平均失点",
          ]}
        />
        <Legend
          formatter={(value: string) =>
            value === "avgFor" ? "平均得点" : "平均失点"
          }
          wrapperStyle={{ fontSize: "12px" }}
        />
        {/* 平均得点: ダークグリーン */}
        <Radar
          name="avgFor"
          dataKey="avgFor"
          stroke="#006d3b"
          fill="#006d3b"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        {/* 平均失点: グレー */}
        <Radar
          name="avgAgainst"
          dataKey="avgAgainst"
          stroke="#9CA3AF"
          fill="#9CA3AF"
          fillOpacity={0.15}
          strokeWidth={2}
          strokeDasharray="4 4"
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
