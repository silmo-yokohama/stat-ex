"use client";

/**
 * チーム成績ページ用チャートラッパー
 *
 * Recharts はクライアントコンポーネントでのみ動作するため、
 * Server Component のページから使うための "use client" ラッパーを提供する。
 * 各チャートコンポーネントを named export し、ページ側で個別にインポートできる。
 */

import { MonthlyRecordChart } from "@/components/charts/MonthlyRecordChart";
import { QuarterRadar } from "@/components/charts/QuarterRadar";
import { HomeAwayDonut } from "@/components/charts/HomeAwayDonut";
import { CumulativeWinsChart } from "@/components/charts/CumulativeWinsChart";

// ================================================
// Props型定義
// ================================================

/** 月別成績チャートのProps */
type TeamMonthlyChartProps = {
  data: { month: string; wins: number; losses: number }[];
};

/** Q別得点傾向レーダーチャートのProps */
type TeamQuarterRadarProps = {
  data: { quarter: string; avgFor: number; avgAgainst: number }[];
};

/** ホーム／アウェイ勝率ドーナツチャートのProps */
type TeamHomeAwayDonutProps = {
  homeWins: number;
  homeLosses: number;
  awayWins: number;
  awayLosses: number;
};

/** 累積勝利数チャートのProps（wins=null は未消化試合） */
type TeamCumulativeWinsProps = {
  data: { game: number; wins: number | null; ideal: number }[];
};

// ================================================
// ラッパーコンポーネント
// ================================================

/**
 * 月別成績チャートラッパー
 *
 * 月ごとの勝敗を積み上げ棒グラフで表示する。
 *
 * @param data - 月別の勝敗データ配列
 */
export function TeamMonthlyChart({ data }: TeamMonthlyChartProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <MonthlyRecordChart data={data} />
    </div>
  );
}

/**
 * Q別得点傾向レーダーチャートラッパー
 *
 * Q1〜Q4の平均得点・平均失点をレーダーチャートで表示する。
 *
 * @param data - クォーターごとの平均得点・失点データ
 */
export function TeamQuarterRadar({ data }: TeamQuarterRadarProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <QuarterRadar data={data} />
    </div>
  );
}

/**
 * ホーム／アウェイ勝率ドーナツチャートラッパー
 *
 * ホームとアウェイの勝率をドーナツチャートで並べて表示する。
 *
 * @param homeWins - ホーム勝利数
 * @param homeLosses - ホーム敗北数
 * @param awayWins - アウェイ勝利数
 * @param awayLosses - アウェイ敗北数
 */
export function TeamHomeAwayDonut({
  homeWins,
  homeLosses,
  awayWins,
  awayLosses,
}: TeamHomeAwayDonutProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <HomeAwayDonut
        homeWins={homeWins}
        homeLosses={homeLosses}
        awayWins={awayWins}
        awayLosses={awayLosses}
      />
    </div>
  );
}

/**
 * 累積勝利数チャートラッパー
 *
 * シーズンを通じた累積勝利数を理想ペースと比較するエリアチャート。
 *
 * @param data - 試合番号、累積勝利数、理想ペースの配列
 */
export function TeamCumulativeWins({ data }: TeamCumulativeWinsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <CumulativeWinsChart data={data} />
    </div>
  );
}
