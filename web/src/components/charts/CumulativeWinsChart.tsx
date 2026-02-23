"use client";

/**
 * 累積勝利数チャート
 *
 * シーズンを通じた累積勝利数をエリアチャートで表示する。
 * 「理想ペース」を破線で重ねることで、目標との差を視覚化する。
 * チーム成績ページで使用。
 */

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/** 試合ごとの累積勝利データ */
type CumulativeWinsData = {
  game: number;
  wins: number;
  ideal: number;
};

type Props = {
  /** 試合ごとの累積勝利数と理想ペース */
  data: CumulativeWinsData[];
};

/** 共通のツールチップスタイル */
const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid #e2e4e6",
  fontSize: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

/**
 * 累積勝利数チャート
 *
 * @param data - 試合番号、累積勝利数、理想ペースの配列
 */
export function CumulativeWinsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          {/* 累積勝利数エリアのグラデーション */}
          <linearGradient id="winsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#006d3b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#006d3b" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e4e6" />
        <XAxis
          dataKey="game"
          tick={{ fontSize: 11, fill: "#606060" }}
          axisLine={{ stroke: "#e2e4e6" }}
          tickLine={false}
          label={{
            value: "試合数",
            position: "insideBottomRight",
            offset: -4,
            style: { fontSize: 10, fill: "#606060" },
          }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#606060" }}
          axisLine={false}
          tickLine={false}
          label={{
            value: "勝利数",
            angle: -90,
            position: "insideLeft",
            offset: 24,
            style: { fontSize: 10, fill: "#606060" },
          }}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number | undefined, name: string | undefined) => [
            `${value ?? 0}勝`,
            name === "wins" ? "実績" : "理想ペース",
          ]}
          labelFormatter={(label: unknown) => `第${label}試合`}
        />
        <Legend
          formatter={(value: string) => (value === "wins" ? "累積勝利数" : "理想ペース")}
          wrapperStyle={{ fontSize: "12px" }}
        />
        {/* 理想ペース: 破線で表示 */}
        <Line
          type="monotone"
          dataKey="ideal"
          stroke="#9CA3AF"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          dot={false}
        />
        {/* 累積勝利数: グラデーション付きエリア */}
        <Area
          type="monotone"
          dataKey="wins"
          stroke="#006d3b"
          strokeWidth={2.5}
          fill="url(#winsGradient)"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
