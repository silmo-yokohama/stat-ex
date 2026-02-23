"use client";

/**
 * ペナントレースチャート（貯金/借金シーズン推移）
 *
 * B2リーグ全チームの貯金/借金推移を折れ線グラフで可視化する。
 * 野球のペナントレースチャートと同じコンセプト。
 *
 * - 横軸: 試合数（1, 2, 3, ...）
 * - 縦軸: 貯金/借金数 = (累積勝数 - 累積敗数) / 2
 * - 横浜EX: 太い緑色の実線（実際の試合データから計算）
 * - 他チーム: 細い色付きの線（最終成績から線形補間）
 * - 0ライン（.500基準）を ReferenceLine で明示
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// ================================================
// 型定義
// ================================================

/** チームのシーズン推移データ */
export type PennantRaceTeam = {
  /** チーム短縮名 */
  teamName: string;
  /** 横浜EXかどうか（ハイライト用） */
  isExcellence: boolean;
  /** 試合毎の累積gamesAbove500: [第1試合後, 第2試合後, ...] */
  progression: number[];
};

type Props = {
  /** 全チームの推移データ */
  teams: PennantRaceTeam[];
};

// ================================================
// 定数
// ================================================

/** 横浜EXの線色 */
const COLOR_EX = "#006d3b";

/**
 * 他チーム用の13色パレット
 *
 * 各チームを視覚的に区別するための色セット。
 * 横浜EX以外の最大13チーム分を用意。
 */
const TEAM_PALETTE = [
  "#8B5CF6", // パープル
  "#F97316", // オレンジ
  "#3B82F6", // ブルー
  "#EC4899", // ピンク
  "#EAB308", // イエロー
  "#14B8A6", // ティール
  "#EF4444", // レッド
  "#A855F7", // バイオレット
  "#6366F1", // インディゴ
  "#84CC16", // ライム
  "#F59E0B", // アンバー
  "#06B6D4", // シアン
  "#78716C", // ストーン
];

/** ツールチップの共通スタイル */
const tooltipBaseStyle: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid #e2e4e6",
  fontSize: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  backgroundColor: "white",
  padding: "8px 12px",
};

// ================================================
// サブコンポーネント
// ================================================

/** gamesAbove値を +N / -N / 0 形式にフォーマットする */
function formatGamesAbove(v: number): string {
  return v > 0 ? `+${v}` : String(v);
}

/**
 * カスタムツールチップ
 *
 * 横浜EXを先頭に太字表示し、他チームは値の降順で表示する。
 * ※ ESLint react-hooks/static-components 対策でコンポーネント外に定義
 */
function PennantTooltip({
  active,
  payload,
  label,
  exTeamName,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
  exTeamName?: string;
}) {
  if (!active || !payload?.length) return null;

  // 有効なエントリを値の降順でソート
  const entries = payload.filter((p) => p.value != null).sort((a, b) => b.value - a.value);

  // 横浜EXのエントリを分離
  const exEntry = entries.find((e) => e.name === exTeamName);
  const others = entries.filter((e) => e.name !== exTeamName);

  return (
    <div style={{ ...tooltipBaseStyle, maxHeight: "280px", overflowY: "auto" }}>
      <p
        style={{
          fontWeight: 600,
          marginBottom: 4,
          borderBottom: "1px solid #e2e4e6",
          paddingBottom: 4,
        }}
      >
        第{label}試合
      </p>

      {/* 横浜EX（常に先頭・太字・グリーン） */}
      {exEntry && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            fontWeight: 700,
            color: COLOR_EX,
            marginBottom: 4,
            paddingBottom: 4,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <span>{exEntry.name}</span>
          <span>{formatGamesAbove(exEntry.value)}</span>
        </div>
      )}

      {/* 他チーム（値の降順） */}
      {others.map((entry) => (
        <div
          key={entry.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            lineHeight: "1.7",
          }}
        >
          <span style={{ color: entry.color, fontWeight: 500 }}>{entry.name}</span>
          <span style={{ color: "#606060" }}>{formatGamesAbove(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ================================================
// メインコンポーネント
// ================================================

/**
 * ペナントレースチャート
 *
 * 全チームの貯金/借金推移を折れ線で重ねて表示する。
 * 横浜EXの線は太く緑色でハイライトし、他チームは細い色付き線で背景に配置。
 *
 * @param teams - 全チームの推移データ
 */
export function GamesAbove500Chart({ teams }: Props) {
  // Recharts用のフラットデータ構造に変換
  // 各データポイント: { game: 1, "横浜EX": 0.5, "千葉": 0.29, ... }
  const maxGames = Math.max(...teams.map((t) => t.progression.length), 0);
  const chartData: Record<string, number | string>[] = [];

  for (let i = 0; i < maxGames; i++) {
    const point: Record<string, number | string> = { game: i + 1 };
    for (const team of teams) {
      if (i < team.progression.length) {
        point[team.teamName] = team.progression[i];
      }
    }
    chartData.push(point);
  }

  // 横浜EXと他チームを分離（横浜EXを最後にレンダリング → 最前面に表示）
  const exTeam = teams.find((t) => t.isExcellence);
  const otherTeams = teams.filter((t) => !t.isExcellence);

  // 他チームへの色割り当て
  const teamColorMap: Record<string, string> = {};
  otherTeams.forEach((t, i) => {
    teamColorMap[t.teamName] = TEAM_PALETTE[i % TEAM_PALETTE.length];
  });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 16, right: 16, left: 4, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e4e6" />

        {/* X軸: 試合数 */}
        <XAxis
          dataKey="game"
          tick={{ fontSize: 11, fill: "#606060" }}
          axisLine={{ stroke: "#e2e4e6" }}
          tickLine={false}
        />

        {/* Y軸: 貯金/借金数 */}
        <YAxis
          tick={{ fontSize: 11, fill: "#606060" }}
          axisLine={false}
          tickLine={false}
          width={35}
          tickFormatter={(v: number) => formatGamesAbove(v)}
        />

        {/* ツールチップ */}
        <Tooltip content={<PennantTooltip exTeamName={exTeam?.teamName} />} />

        {/* .500ライン（基準線） */}
        <ReferenceLine
          y={0}
          stroke="#374151"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          label={{
            value: ".500",
            position: "right",
            style: { fontSize: 10, fill: "#606060" },
          }}
        />

        {/* 他チームの線（先にレンダリング → 背面に配置） */}
        {otherTeams.map((team) => (
          <Line
            key={team.teamName}
            type="monotone"
            dataKey={team.teamName}
            stroke={teamColorMap[team.teamName]}
            strokeWidth={1.2}
            strokeOpacity={0.4}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 1 }}
            connectNulls={false}
          />
        ))}

        {/* 横浜EXの線（最後にレンダリング → 最前面に表示） */}
        {exTeam && (
          <Line
            type="monotone"
            dataKey={exTeam.teamName}
            stroke={COLOR_EX}
            strokeWidth={3}
            dot={false}
            activeDot={{
              r: 5,
              stroke: COLOR_EX,
              strokeWidth: 2,
              fill: "#fff",
            }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
