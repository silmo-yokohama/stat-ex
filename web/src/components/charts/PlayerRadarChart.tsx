"use client";

/**
 * 選手総合力レーダーチャート
 *
 * 選手の主要スタッツを5角形のレーダーチャートで可視化する。
 * 得点・リバウンド・アシスト・スティール・効率の5指標を
 * 0〜100にスケーリングした値で表示する。
 * 選手詳細ページで使用。
 */

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

/** レーダーチャート用の選手スタッツデータ */
type PlayerRadarData = {
  /** スタッツ名（"得点", "リバウンド", "アシスト", "スティール", "効率"） */
  stat: string;
  /** 0〜100 にスケーリング済みの値 */
  value: number;
  /** 最大値（常に100） */
  fullMark: number;
};

type Props = {
  /** 5つのスタッツデータ配列 */
  data: PlayerRadarData[];
};

/**
 * 選手総合力レーダーチャート
 *
 * @param data - 5角形レーダー用のスタッツデータ（0〜100スケール）
 */
export function PlayerRadarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        {/* レーダーグリッド */}
        <PolarGrid stroke="#e2e4e6" />
        {/* 軸ラベル（スタッツ名） */}
        <PolarAngleAxis
          dataKey="stat"
          tick={{ fontSize: 11, fill: "#606060" }}
        />
        {/* 数値目盛り: 非表示 */}
        <PolarRadiusAxis tick={false} axisLine={false} />
        {/* 選手スタッツ: ダークグリーン塗りつぶし */}
        <Radar
          name="value"
          dataKey="value"
          stroke="#006d3b"
          strokeWidth={2}
          fill="#006d3b"
          fillOpacity={0.3}
          dot={{ r: 4, fill: "#006d3b" }}
          isAnimationActive={true}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
