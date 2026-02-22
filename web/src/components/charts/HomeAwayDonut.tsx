"use client";

/**
 * ホーム／アウェイ勝率ドーナツチャート
 *
 * ホームとアウェイの勝率をそれぞれドーナツチャートで横並びに表示する。
 * 中央に勝率パーセンテージを表示し、直感的に把握できるようにする。
 * チーム成績ページで使用。
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";

type Props = {
  /** ホーム勝利数 */
  homeWins: number;
  /** ホーム敗北数 */
  homeLosses: number;
  /** アウェイ勝利数 */
  awayWins: number;
  /** アウェイ敗北数 */
  awayLosses: number;
};

/** 勝ち: ダークグリーン */
const WIN_COLOR = "#006d3b";
/** 負け: グレー */
const LOSS_COLOR = "#9CA3AF";

/**
 * 勝率を計算する
 *
 * @param wins - 勝利数
 * @param losses - 敗北数
 * @returns パーセンテージ文字列（例: "75.0%"）
 */
const calcWinRate = (wins: number, losses: number): string => {
  const total = wins + losses;
  if (total === 0) return "0.0%";
  return `${((wins / total) * 100).toFixed(1)}%`;
};

/**
 * 勝敗の凡例を描画するコンポーネント
 *
 * @param wins - 勝利数
 * @param losses - 敗北数
 */
const RecordLabel = ({ wins, losses }: { wins: number; losses: number }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      gap: "12px",
      fontSize: "11px",
      color: "#606060",
      marginTop: "4px",
    }}
  >
    <span>
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: WIN_COLOR,
          marginRight: 4,
        }}
      />
      {wins}勝
    </span>
    <span>
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: LOSS_COLOR,
          marginRight: 4,
        }}
      />
      {losses}敗
    </span>
  </div>
);

/** 個別ドーナツチャートのProps */
type DonutProps = {
  data: { name: string; value: number }[];
  rate: string;
  title: string;
  wins: number;
  losses: number;
};

/**
 * 単一のドーナツチャート（ラベル付き）
 *
 * @param data - 勝敗データ
 * @param rate - 勝率テキスト
 * @param title - ラベル（"HOME" | "AWAY"）
 * @param wins - 勝利数
 * @param losses - 敗北数
 */
const SingleDonut = ({ data, rate, title, wins, losses }: DonutProps) => (
  <div style={{ width: "50%", maxWidth: 200 }}>
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          stroke="none"
        >
          <Cell fill={WIN_COLOR} />
          <Cell fill={LOSS_COLOR} />
          {/* ドーナツ中央に勝率を表示 */}
          <Label
            value={rate}
            position="center"
            dy={-6}
            style={{ fontSize: "20px", fontWeight: 700, fill: "#1f2937" }}
          />
        </Pie>
        {/* ドーナツ中央にタイトルを表示（勝率の下） */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          dy={16}
          style={{ fontSize: "11px", fontWeight: 500, fill: "#606060" }}
        >
          {title}
        </text>
      </PieChart>
    </ResponsiveContainer>
    <RecordLabel wins={wins} losses={losses} />
  </div>
);

/**
 * ホーム／アウェイ勝率ドーナツチャート
 *
 * @param homeWins - ホーム勝利数
 * @param homeLosses - ホーム敗北数
 * @param awayWins - アウェイ勝利数
 * @param awayLosses - アウェイ敗北数
 */
export function HomeAwayDonut({
  homeWins,
  homeLosses,
  awayWins,
  awayLosses,
}: Props) {
  const homeData = [
    { name: "勝ち", value: homeWins },
    { name: "負け", value: homeLosses },
  ];
  const awayData = [
    { name: "勝ち", value: awayWins },
    { name: "負け", value: awayLosses },
  ];

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
      <SingleDonut
        data={homeData}
        rate={calcWinRate(homeWins, homeLosses)}
        title="HOME"
        wins={homeWins}
        losses={homeLosses}
      />
      <SingleDonut
        data={awayData}
        rate={calcWinRate(awayWins, awayLosses)}
        title="AWAY"
        wins={awayWins}
        losses={awayLosses}
      />
    </div>
  );
}
