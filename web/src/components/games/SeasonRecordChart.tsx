"use client";

/**
 * シーズン戦績チャート
 *
 * 全試合を横棒チャート（BarChart）で表示し、
 * 勝ち=グリーン、負け=グレー、未実施=薄いグレー枠で可視化する。
 * Server Component から使うための use client ラッパーコンポーネント。
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ================================================
// 型定義
// ================================================

/** チャートに渡す1試合分のデータ */
export type SeasonRecordData = {
  /** 試合日（YYYY-MM-DD） */
  date: string;
  /** 対戦相手の略称 */
  opponent: string;
  /** 勝ち=true, 負け=false, 未実施=null */
  win: boolean | null;
  /** 横浜EXの得点 */
  exScore: number | null;
  /** 相手チームの得点 */
  oppScore: number | null;
};

// ================================================
// 定数
// ================================================

/** 勝利バーの色（ダークグリーン） */
const COLOR_WIN = "#006d3b";
/** 敗北バーの色（グレー） */
const COLOR_LOSS = "#9CA3AF";
/** 未実施バーの色（薄いグレー） */
const COLOR_SCHEDULED = "#E5E7EB";
/** 未実施バーの枠線色 */
const COLOR_SCHEDULED_BORDER = "#D1D5DB";

/** バーの固定高さ（全バー統一） */
const BAR_HEIGHT_VALUE = 1;

// ================================================
// ヘルパー
// ================================================

/**
 * 日付文字列を「M/D」形式にフォーマットする
 */
function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

// ================================================
// カスタムツールチップ
// ================================================

/**
 * ホバー時に表示するツールチップ
 *
 * 対戦相手名とスコアを表示する。未実施の場合は「予定」と表示。
 */
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: SeasonRecordData }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-foreground">vs {data.opponent}</p>
      {data.exScore !== null && data.oppScore !== null ? (
        <p className="text-muted-foreground">
          <span className="font-bold" style={{ color: data.win ? COLOR_WIN : COLOR_LOSS }}>
            {data.exScore}
          </span>
          {" - "}
          <span>{data.oppScore}</span>
        </p>
      ) : (
        <p className="text-muted-foreground">予定</p>
      )}
      <p className="text-xs text-muted-foreground">{formatDateShort(data.date)}</p>
    </div>
  );
}

// ================================================
// メインコンポーネント
// ================================================

type Props = {
  /** シーズン全試合のデータ（日付の古い順） */
  data: SeasonRecordData[];
};

/**
 * シーズン戦績チャート
 *
 * 各試合を1本のバーとして横並びに表示する。
 * 勝ち=グリーン、負け=グレー、未実施=薄いグレー枠。
 * X軸に日付（M/D形式）、ホバーで対戦相手とスコアを表示。
 *
 * @param data - 日付の古い順にソートされた試合データ
 */
export function SeasonRecordChart({ data }: Props) {
  // チャート用データ: 全試合に固定の高さ値を設定
  const chartData = data.map((d) => ({
    ...d,
    /** バーの高さ（全試合で統一） */
    value: BAR_HEIGHT_VALUE,
    /** X軸ラベル用 */
    label: formatDateShort(d.date),
  }));

  return (
    <div className="w-full overflow-x-auto">
      {/* モバイルで横スクロール可能にするため、最低幅を設定 */}
      <div style={{ minWidth: Math.max(chartData.length * 28, 300) }}>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#606060" }}
              axisLine={{ stroke: "#e2e4e6" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            {/* Y軸は非表示（全バー同じ高さのため不要） */}
            <YAxis hide domain={[0, BAR_HEIGHT_VALUE]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={20}>
              {chartData.map((entry, index) => {
                // 勝敗に応じてバーの色を切り替え
                let fill = COLOR_SCHEDULED;
                let stroke = COLOR_SCHEDULED_BORDER;
                let strokeWidth = 1;

                if (entry.win === true) {
                  fill = COLOR_WIN;
                  stroke = COLOR_WIN;
                  strokeWidth = 0;
                } else if (entry.win === false) {
                  fill = COLOR_LOSS;
                  stroke = COLOR_LOSS;
                  strokeWidth = 0;
                }

                return (
                  <Cell
                    key={`bar-${index}`}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
