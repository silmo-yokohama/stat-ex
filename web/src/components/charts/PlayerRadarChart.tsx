"use client";

/**
 * 選手総合力レーダーチャート
 *
 * 選手の主要スタッツを5角形のレーダーチャートで可視化する。
 * 得点・リバウンド・アシスト・スティール・効率の5指標を
 * 0〜100にスケーリングした値で表示する。
 * 各頂点にホバー/タップすると実際の数値を確認できる。
 * 選手詳細ページで使用。
 */

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/** レーダーチャート用の選手スタッツデータ */
export type PlayerRadarData = {
  /** スタッツ名（"得点", "リバウンド", "アシスト", "スティール", "効率"） */
  stat: string;
  /** 0〜100 にスケーリング済みの値 */
  value: number;
  /** 元の実数値（ツールチップ表示用） */
  rawValue: number;
  /** 最大値（常に100） */
  fullMark: number;
};

type Props = {
  /** 5つのスタッツデータ配列 */
  data: PlayerRadarData[];
};

/** ツールチップの共通スタイル */
const tooltipStyle: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid #e2e4e6",
  fontSize: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  backgroundColor: "#fff",
  padding: "8px 12px",
};

/**
 * レーダーチャート用カスタムツールチップ
 *
 * スケール値（0-100）ではなく元の実数値を表示し、
 * 初心者にもわかりやすいようにスタッツ名を日本語で表示する。
 */
function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PlayerRadarData }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 600, margin: 0, color: "#006d3b" }}>
        {data.stat}
      </p>
      <p style={{ margin: "4px 0 0", color: "#606060" }}>
        実数値: <span style={{ fontWeight: 600 }}>{data.rawValue.toFixed(1)}</span>
      </p>
      <p style={{ margin: "2px 0 0", color: "#9CA3AF", fontSize: "11px" }}>
        スケール: {Math.round(data.value)}/100
      </p>
    </div>
  );
}

/**
 * 選手総合力レーダーチャート
 *
 * @param data - 5角形レーダー用のスタッツデータ（0〜100スケール + 実数値）
 */
export function PlayerRadarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        {/* レーダーグリッド */}
        <PolarGrid stroke="#e2e4e6" />
        {/* 軸ラベル（スタッツ名） */}
        <PolarAngleAxis dataKey="stat" tick={{ fontSize: 11, fill: "#606060" }} />
        {/* 数値目盛り: 非表示。domain=[0,100]でスケールを固定し、値の大小が正しく反映されるようにする */}
        <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
        {/* ツールチップ: 実数値とスケール値を表示 */}
        <Tooltip content={<RadarTooltip />} />
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
