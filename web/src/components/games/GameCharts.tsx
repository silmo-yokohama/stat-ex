"use client";

/**
 * 試合詳細ページのチャート群
 *
 * Server Componentのページから使うための use client ラッパー。
 * Recharts はクライアント側でのみ動作するため、
 * チャートコンポーネントをこのファイル経由でインポートする。
 */

import { QuarterChart } from "@/components/charts/QuarterChart";
import { ScoreFlowChart } from "@/components/charts/ScoreFlowChart";
import type { PlayByPlayPoint } from "@/components/charts/ScoreFlowChart";

// ================================================
// 型定義
// ================================================

/** QuarterChart 用の1クォーター分のデータ */
type QuarterData = {
  quarter: string;
  home: number;
  away: number;
};

// ================================================
// エクスポートコンポーネント
// ================================================

/**
 * Q別得点バーチャート（use client ラッパー）
 *
 * @param data - Q1〜Q4の各クォーター得点データ
 * @param homeTeamName - ホームチーム名
 * @param awayTeamName - アウェイチーム名
 */
export function GameQuarterChart({
  data,
  homeTeamName,
  awayTeamName,
}: {
  data: QuarterData[];
  homeTeamName: string;
  awayTeamName: string;
}) {
  return (
    <QuarterChart
      data={data}
      homeTeamName={homeTeamName}
      awayTeamName={awayTeamName}
    />
  );
}

/**
 * Play-by-Play スコアフローチャート（use client ラッパー）
 *
 * 得点毎のスコア推移をステップチャートで表示する。
 *
 * @param data - 得点イベントごとの累積スコアデータ
 * @param homeTeamName - ホームチーム名
 * @param awayTeamName - アウェイチーム名
 */
export function GameScoreFlowChart({
  data,
  homeTeamName,
  awayTeamName,
}: {
  data: PlayByPlayPoint[];
  homeTeamName: string;
  awayTeamName: string;
}) {
  return (
    <ScoreFlowChart
      data={data}
      homeTeamName={homeTeamName}
      awayTeamName={awayTeamName}
    />
  );
}
