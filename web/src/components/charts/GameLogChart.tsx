"use client";

/**
 * ゲームログチャート
 *
 * 選手の直近試合ごとの得点推移を折れ線グラフで表示する。
 * 勝ち試合は●（ダークグリーン）、負け試合は×（グレー）のマーカーで
 * 勝敗結果を視覚化する。シーズン平均得点の参考線も表示可能。
 * 選手詳細ページで使用。
 */

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

/** 試合ごとの得点データ */
type GameLogData = {
  /** 対戦相手名（例: "vs 千葉"） */
  label: string;
  /** その試合の得点 */
  pts: number;
  /** 勝敗結果（"W" | "L"） */
  result: string;
};

type Props = {
  /** 試合ごとの得点データ配列 */
  data: GameLogData[];
  /** シーズン平均得点（参考線として表示） */
  averagePts?: number;
};

/** 共通のツールチップスタイル */
const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid #e2e4e6",
  fontSize: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

/**
 * 勝敗に応じたカスタムドット
 *
 * ScoreTrendChart と同じパターンを踏襲。
 * 勝ち=●（ダークグリーン、白ストローク）、負け=×（グレー×印）
 */
const CustomDot = (props: {
  cx?: number;
  cy?: number;
  payload?: GameLogData;
}) => {
  const { cx = 0, cy = 0, payload } = props;
  if (!payload) return null;

  // 勝ち: ダークグリーンの丸ドット
  if (payload.result === "W") {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="#006d3b"
        stroke="#fff"
        strokeWidth={2}
      />
    );
  }

  // 負け: グレーの×印
  return (
    <g>
      <line
        x1={cx - 3}
        y1={cy - 3}
        x2={cx + 3}
        y2={cy + 3}
        stroke="#9CA3AF"
        strokeWidth={2}
      />
      <line
        x1={cx + 3}
        y1={cy - 3}
        x2={cx - 3}
        y2={cy + 3}
        stroke="#9CA3AF"
        strokeWidth={2}
      />
    </g>
  );
};

/**
 * カスタムツールチップ
 *
 * 得点と勝敗結果を表示する。
 */
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: GameLogData }>;
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const resultLabel = data.result === "W" ? "勝ち" : "負け";
  const resultColor = data.result === "W" ? "#006d3b" : "#9CA3AF";

  return (
    <div
      style={{
        ...tooltipStyle,
        backgroundColor: "#fff",
        padding: "8px 12px",
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
      <p style={{ margin: "4px 0 0", color: "#606060" }}>
        得点: <span style={{ fontWeight: 600 }}>{data.pts}点</span>
      </p>
      <p style={{ margin: "2px 0 0", color: resultColor, fontWeight: 600 }}>
        {resultLabel}
      </p>
    </div>
  );
};

/**
 * ゲームログチャート
 *
 * @param data - 直近試合ごとの得点データ
 * @param averagePts - シーズン平均得点（省略可、参考線として表示）
 */
export function GameLogChart({ data, averagePts }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e4e6" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#606060" }}
          axisLine={{ stroke: "#e2e4e6" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, "auto"]}
          tick={{ fontSize: 11, fill: "#606060" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        {/* シーズン平均得点の参考線（指定がある場合のみ表示） */}
        {averagePts !== undefined && (
          <ReferenceLine
            y={averagePts}
            stroke="#f59e0b"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{
              value: "AVG",
              position: "right",
              fill: "#f59e0b",
              fontSize: 11,
              fontWeight: 600,
            }}
          />
        )}
        {/* 得点の折れ線: ダークグリーン、カスタムドットで勝敗表示 */}
        <Line
          type="monotone"
          dataKey="pts"
          stroke="#006d3b"
          strokeWidth={2.5}
          dot={<CustomDot />}
          isAnimationActive={true}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
