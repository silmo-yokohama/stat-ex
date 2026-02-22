"use client";

/**
 * 得点推移チャート
 *
 * 直近N試合の得点・失点を折れ線グラフで表示する。
 * 勝ち=●、負け=×のマーカーで結果を視覚化。
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ScoreTrendData = {
  label: string;
  exScore: number;
  oppScore: number;
  win: boolean;
};

type Props = {
  data: ScoreTrendData[];
};

/** 勝敗に応じたマーカー */
const CustomDot = (props: {
  cx?: number;
  cy?: number;
  payload?: ScoreTrendData;
}) => {
  const { cx = 0, cy = 0, payload } = props;
  if (!payload) return null;

  if (payload.win) {
    return (
      <circle cx={cx} cy={cy} r={4} fill="#006d3b" stroke="#fff" strokeWidth={2} />
    );
  }
  return (
    <g>
      <line x1={cx - 3} y1={cy - 3} x2={cx + 3} y2={cy + 3} stroke="#9CA3AF" strokeWidth={2} />
      <line x1={cx + 3} y1={cy - 3} x2={cx - 3} y2={cy + 3} stroke="#9CA3AF" strokeWidth={2} />
    </g>
  );
};

export function ScoreTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e4e6" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#606060" }}
          axisLine={{ stroke: "#e2e4e6" }}
          tickLine={false}
        />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fontSize: 11, fill: "#606060" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e4e6",
            fontSize: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
          formatter={(value: number | undefined, name: string | undefined) => [
            `${value ?? 0}点`,
            name === "exScore" ? "横浜EX" : "相手",
          ]}
        />
        <Line
          type="monotone"
          dataKey="exScore"
          stroke="#006d3b"
          strokeWidth={2.5}
          dot={<CustomDot />}
          name="exScore"
        />
        <Line
          type="monotone"
          dataKey="oppScore"
          stroke="#9CA3AF"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          name="oppScore"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
