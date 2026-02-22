"use client";

/**
 * 選手詳細ページのチャート群
 *
 * Server Componentのページから使うためのuse clientラッパー。
 * 各チャートコンポーネントをnamed exportし、Server Componentから
 * 個別にインポートできるようにする。
 */

import { PlayerRadarChart } from "@/components/charts/PlayerRadarChart";
import { GameLogChart } from "@/components/charts/GameLogChart";
import { PlayerScatterChart } from "@/components/charts/PlayerScatterChart";

// --- 型定義 ---

/** レーダーチャート用のスタッツデータ */
type PlayerRadarData = {
  /** スタッツ名（"得点", "リバウンド" 等） */
  stat: string;
  /** 0〜100 にスケーリング済みの値 */
  value: number;
  /** 最大値（常に100） */
  fullMark: number;
};

/** ゲームログ用の試合データ */
type GameLogData = {
  /** 対戦相手名（例: "千葉"） */
  label: string;
  /** その試合の得点 */
  pts: number;
  /** 勝敗結果（"W" | "L"） */
  result: string;
};

/** 散布図用の選手スタッツデータ */
type PlayerScatterData = {
  /** 選手名 */
  name: string;
  /** 平均得点 */
  ppg: number;
  /** 平均リバウンド */
  rpg: number;
  /** 平均アシスト */
  apg: number;
  /** ポジション */
  position: string;
};

// --- ラッパーコンポーネント ---

/**
 * 選手能力レーダーチャート
 *
 * 選手の主要5指標を五角形のレーダーチャートで可視化する。
 * PlayerRadarChart の use client ラッパー。
 *
 * @param data - 5つのスタッツデータ配列（0〜100スケール）
 */
export function PlayerAbilityRadar({ data }: { data: PlayerRadarData[] }) {
  return <PlayerRadarChart data={data} />;
}

/**
 * 選手得点推移チャート
 *
 * 直近試合ごとの得点を折れ線グラフで表示する。
 * GameLogChart の use client ラッパー。
 *
 * @param data - 試合ごとの得点データ配列
 * @param averagePts - シーズン平均得点（参考線として表示）
 */
export function PlayerGameLogChart({
  data,
  averagePts,
}: {
  data: GameLogData[];
  averagePts?: number;
}) {
  return <GameLogChart data={data} averagePts={averagePts} />;
}

/**
 * 選手スタッツ分布散布図
 *
 * 全選手のPPG/RPG/APGを散布図で比較する。
 * PlayerScatterChart の use client ラッパー。選手一覧ページ用。
 *
 * @param data - 選手ごとのPPG・RPG・APG・ポジション情報の配列
 */
export function PlayersScatterChart({ data }: { data: PlayerScatterData[] }) {
  return <PlayerScatterChart data={data} />;
}
