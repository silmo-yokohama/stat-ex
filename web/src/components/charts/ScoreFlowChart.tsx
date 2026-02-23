"use client";

/**
 * Play-by-Play スコア推移チャート
 *
 * 試合中の得点イベントごとの累積スコアをステップチャートで表示する。
 * 各得点（2点シュート・3点シュート・フリースロー）を個別のデータポイントとして描画し、
 * 試合の流れ（リード変動・連続得点ランなど）をリアルに可視化する。
 * クォーター境界は縦の参照線で表示。
 */

import { useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";

// ================================================
// 型定義
// ================================================

/** 1つのスコアリングイベント（得点時点の累積スコア） */
export type PlayByPlayPoint = {
  /** ホームチーム累積スコア */
  homeTotal: number;
  /** アウェイチーム累積スコア */
  awayTotal: number;
  /** どのクォーターに属するか（"START", "Q1", "Q2", "Q3", "Q4"） */
  quarter: string;
};

type Props = {
  /** 得点イベントごとの累積スコアデータ配列 */
  data: PlayByPlayPoint[];
  /** ホームチーム名 */
  homeTeamName: string;
  /** アウェイチーム名 */
  awayTeamName: string;
};

/** 共通のツールチップスタイル */
const tooltipStyle: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid #e2e4e6",
  fontSize: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  padding: "8px 12px",
};

// ================================================
// カスタムツールチップ
// ================================================

type TooltipPayload = {
  value: number;
  dataKey: string;
};

/**
 * スコア表示のカスタムツールチップ
 *
 * 「HOME 45 - 42 AWAY」形式でスコアを表示する。
 */
function ScoreTooltip({
  active,
  payload,
  homeTeamName,
  awayTeamName,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  homeTeamName: string;
  awayTeamName: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const home = payload.find((p) => p.dataKey === "homeTotal")?.value ?? 0;
  const away = payload.find((p) => p.dataKey === "awayTotal")?.value ?? 0;

  return (
    <div style={tooltipStyle}>
      <p style={{ margin: 0, fontWeight: 600, fontSize: "13px" }}>
        <span style={{ color: "#006d3b" }}>
          {homeTeamName} {home}
        </span>
        <span style={{ color: "#606060" }}> - </span>
        <span style={{ color: "#9CA3AF" }}>
          {away} {awayTeamName}
        </span>
      </p>
    </div>
  );
}

// ================================================
// メインコンポーネント
// ================================================

/**
 * Play-by-Play スコア推移チャート
 *
 * ステップチャートで得点毎のスコア変化を表示し、
 * ホームチームはグリーンのエリア塗り、アウェイチームはグレー破線で描画する。
 * クォーター境界に縦の参照線を配置して時間の区切りを示す。
 *
 * @param data - 得点イベントごとの累積スコアデータ
 * @param homeTeamName - ホームチーム名（凡例・ツールチップ表示用）
 * @param awayTeamName - アウェイチーム名（凡例・ツールチップ表示用）
 */
export function ScoreFlowChart({ data, homeTeamName, awayTeamName }: Props) {
  // データにインデックスを付与（X軸のデータキーとして使用）
  const indexedData = useMemo(() => data.map((point, i) => ({ ...point, index: i })), [data]);

  // クォーター境界のインデックスを算出（quarter値が変わる最初のポイント）
  const quarterBoundaries = useMemo(() => {
    const boundaries: { index: number; label: string }[] = [];
    let prevQuarter = "";

    for (let i = 0; i < data.length; i++) {
      const q = data[i].quarter;
      if (q !== prevQuarter && q !== "START") {
        boundaries.push({ index: i, label: q });
        prevQuarter = q;
      }
    }

    return boundaries;
  }, [data]);

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">スコアデータがありません</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={indexedData} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
        {/* ホームチームのエリア塗りグラデーション定義 */}
        <defs>
          <linearGradient id="homeAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#006d3b" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#006d3b" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#e2e4e6" />

        {/* X軸: ラベルなし（クォーター境界の参照線で代替） */}
        <XAxis dataKey="index" tick={false} axisLine={{ stroke: "#e2e4e6" }} tickLine={false} />

        {/* Y軸: 得点 */}
        <YAxis
          domain={[0, "auto"]}
          tick={{ fontSize: 11, fill: "#606060" }}
          axisLine={false}
          tickLine={false}
        />

        {/* カスタムツールチップ */}
        <Tooltip
          content={<ScoreTooltip homeTeamName={homeTeamName} awayTeamName={awayTeamName} />}
        />

        {/* 凡例 */}
        <Legend
          formatter={(value: string) => (value === "homeTotal" ? homeTeamName : awayTeamName)}
          wrapperStyle={{ fontSize: "12px" }}
        />

        {/* クォーター境界の縦参照線 */}
        {quarterBoundaries.map((qb) => (
          <ReferenceLine
            key={qb.label}
            x={qb.index}
            stroke="#d1d5db"
            strokeDasharray="4 4"
            label={{
              value: qb.label,
              position: "top",
              fontSize: 10,
              fill: "#606060",
            }}
          />
        ))}

        {/* ホームチーム: グリーン塗りエリア + ステップチャート */}
        <Area
          type="stepAfter"
          dataKey="homeTotal"
          stroke="#006d3b"
          strokeWidth={2}
          fill="url(#homeAreaGradient)"
          isAnimationActive={true}
          animationDuration={1200}
        />

        {/* アウェイチーム: グレー破線（塗りなし） */}
        <Line
          type="stepAfter"
          dataKey="awayTotal"
          stroke="#9CA3AF"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          isAnimationActive={true}
          animationDuration={1200}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
