"use client";

/**
 * 選手スタッツ分布チャート（散布図）
 *
 * 選手の平均得点（PPG）を横軸、平均リバウンド（RPG）を縦軸、
 * 平均アシスト（APG）をバブルサイズとして散布図に表示する。
 * ポジション別に色分けし、チーム全体のスタッツ分布を把握できる。
 * 選手一覧ページで使用。
 */

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Legend,
} from "recharts";

/** 選手のスタッツデータ */
type PlayerScatterData = {
  name: string;
  ppg: number;
  rpg: number;
  apg: number;
  position: string;
};

type Props = {
  /** 選手スタッツの配列 */
  data: PlayerScatterData[];
};

/**
 * ポジション別の表示色
 *
 * PG/SG=ダークグリーン（バックコート）、
 * SF/PF=ティール（フォワード）、
 * C=グレー（センター）
 */
const POSITION_COLORS: Record<string, string> = {
  PG: "#006d3b",
  SG: "#059669",
  SF: "#0d9488",
  PF: "#6366f1",
  C: "#9CA3AF",
};

/** ポジションの日本語名 */
const POSITION_LABELS: Record<string, string> = {
  PG: "PG",
  SG: "SG",
  SF: "SF",
  PF: "PF",
  C: "C",
};

/** ポジションキーの配列（凡例の表示順） */
const POSITION_KEYS = ["PG", "SG", "SF", "PF", "C"];

/** 共通のツールチップスタイル */
const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid #e2e4e6",
  fontSize: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

/**
 * カスタムツールチップ
 * ホバーした選手の名前とスタッツを表示する
 */
const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PlayerScatterData }>;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const player = payload[0].payload;

  return (
    <div style={{ ...tooltipStyle, backgroundColor: "#fff", padding: "8px 12px" }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: "#1f2937" }}>
        {player.name}
        <span style={{ fontWeight: 400, color: "#606060", marginLeft: 6 }}>
          {POSITION_LABELS[player.position] ?? player.position}
        </span>
      </p>
      <p style={{ margin: 0 }}>PPG: {player.ppg.toFixed(1)}</p>
      <p style={{ margin: 0 }}>RPG: {player.rpg.toFixed(1)}</p>
      <p style={{ margin: 0 }}>APG: {player.apg.toFixed(1)}</p>
    </div>
  );
};

/**
 * 選手スタッツ分布チャート
 *
 * @param data - 選手のPPG・RPG・APG・ポジション情報の配列
 */
export function PlayerScatterChart({ data }: Props) {
  // ポジションごとにデータを分割して色分け表示する
  const groupedByPosition = POSITION_KEYS.reduce<
    Record<string, PlayerScatterData[]>
  >((acc, pos) => {
    acc[pos] = data.filter((d) => d.position === pos);
    return acc;
  }, {});

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e4e6" />
        <XAxis
          dataKey="ppg"
          type="number"
          name="PPG"
          tick={{ fontSize: 11, fill: "#606060" }}
          axisLine={{ stroke: "#e2e4e6" }}
          tickLine={false}
          label={{
            value: "PPG（平均得点）",
            position: "insideBottomRight",
            offset: -4,
            style: { fontSize: 10, fill: "#606060" },
          }}
        />
        <YAxis
          dataKey="rpg"
          type="number"
          name="RPG"
          tick={{ fontSize: 11, fill: "#606060" }}
          axisLine={false}
          tickLine={false}
          label={{
            value: "RPG（平均リバウンド）",
            angle: -90,
            position: "insideLeft",
            offset: 16,
            style: { fontSize: 10, fill: "#606060" },
          }}
        />
        {/* APGをバブルサイズにマッピング（最小30px、最大300px） */}
        <ZAxis dataKey="apg" type="number" name="APG" range={[30, 300]} />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ strokeDasharray: "3 3" }}
        />
        <Legend
          formatter={(value: string) =>
            POSITION_LABELS[value] ?? value
          }
          wrapperStyle={{ fontSize: "12px" }}
        />
        {/* ポジションごとに Scatter を描画 */}
        {POSITION_KEYS.map((pos) =>
          groupedByPosition[pos] && groupedByPosition[pos].length > 0 ? (
            <Scatter
              key={pos}
              name={pos}
              data={groupedByPosition[pos]}
              fill={POSITION_COLORS[pos] ?? "#606060"}
              fillOpacity={0.7}
            />
          ) : null,
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
