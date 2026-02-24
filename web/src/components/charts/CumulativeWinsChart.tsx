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
  ReferenceLine,
} from "recharts";

/** 試合ごとの累積勝利データ（wins=null は未消化試合） */
type CumulativeWinsData = {
  game: number;
  wins: number | null;
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
 * シーズン全日程を横軸に表示し、終了済み試合は実績を、
 * 未消化試合は理想ペースのみを描画する。
 * 現在地（最新の終了試合）に参照線を表示する。
 *
 * @param data - 試合番号、累積勝利数（null=未消化）、理想ペースの配列
 */
export function CumulativeWinsChart({ data }: Props) {
  // 終了済みの最後の試合番号（参照線の位置）
  const lastFinished = data.filter((d) => d.wins !== null).length;

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
          formatter={(value: unknown, name: string | undefined) => {
            // wins=null（未消化試合）の場合は非表示
            if (value === null || value === undefined) return ["-", ""];
            return [
              `${value}勝`,
              name === "wins" ? "実績" : "理想ペース",
            ];
          }}
          labelFormatter={(label: unknown) => `第${label}試合`}
        />
        <Legend
          formatter={(value: string) =>
            value === "wins" ? "累積勝利数" : "理想ペース（60%）"
          }
          wrapperStyle={{ fontSize: "12px" }}
        />
        {/* 現在地: 最新の終了試合に参照線を表示 */}
        {lastFinished > 0 && lastFinished < data.length && (
          <ReferenceLine
            x={lastFinished}
            stroke="#006d3b"
            strokeDasharray="4 3"
            strokeWidth={1}
            label={{
              value: "現在",
              position: "top",
              style: { fontSize: 10, fill: "#006d3b", fontWeight: 600 },
            }}
          />
        )}
        {/* 理想ペース: 破線で全日程分表示 */}
        <Line
          type="monotone"
          dataKey="ideal"
          stroke="#9CA3AF"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          dot={false}
        />
        {/* 累積勝利数: グラデーション付きエリア（未消化試合はnullで途切れる） */}
        <Area
          type="monotone"
          dataKey="wins"
          stroke="#006d3b"
          strokeWidth={2.5}
          fill="url(#winsGradient)"
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
