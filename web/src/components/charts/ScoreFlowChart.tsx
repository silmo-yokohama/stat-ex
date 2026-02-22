"use client";

/**
 * 累積スコア推移チャート
 *
 * 試合中のクォーターごとの累積得点を折れ線グラフで表示する。
 * Q1終了→Q2終了→Q3終了→FINAL の4ポイントで両チームのスコアを可視化。
 * 試合詳細ページで使用。
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/** クォーターごとの累積スコアデータ */
type ScoreFlowData = {
  /** クォーターラベル（"Q1", "Q2", "Q3", "FINAL"） */
  label: string;
  /** ホームチーム累積スコア */
  homeTotal: number;
  /** アウェイチーム累積スコア */
  awayTotal: number;
};

type Props = {
  /** クォーターごとの累積スコアデータ配列 */
  data: ScoreFlowData[];
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
 * 累積スコア推移チャート
 *
 * @param data - Q1〜FINALの累積スコアデータ
 * @param homeTeamName - ホームチーム名（凡例表示用）
 * @param awayTeamName - アウェイチーム名（凡例表示用）
 */
export function ScoreFlowChart({ data, homeTeamName, awayTeamName }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e4e6" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#606060" }}
          axisLine={{ stroke: "#e2e4e6" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, "auto"]}
          tick={{ fontSize: 11, fill: "#606060" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number | undefined, name: string | undefined) => [
            `${value ?? 0}点`,
            name === "homeTotal" ? homeTeamName : awayTeamName,
          ]}
        />
        <Legend
          formatter={(value: string) =>
            value === "homeTotal" ? homeTeamName : awayTeamName
          }
          wrapperStyle={{ fontSize: "12px" }}
        />
        {/* ホームチーム: ダークグリーン実線、ドット付き */}
        <Line
          type="monotone"
          dataKey="homeTotal"
          stroke="#006d3b"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#006d3b", stroke: "#fff", strokeWidth: 2 }}
          isAnimationActive={true}
        />
        {/* アウェイチーム: グレー破線、ドットなし */}
        <Line
          type="monotone"
          dataKey="awayTotal"
          stroke="#9CA3AF"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
          isAnimationActive={true}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
