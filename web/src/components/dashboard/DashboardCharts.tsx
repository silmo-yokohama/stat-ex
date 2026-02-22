"use client";

/**
 * ダッシュボード用ホーム／アウェイ ドーナツチャートラッパー
 *
 * HomeAwayDonut は "use client" コンポーネントのため、
 * Server Component である page.tsx から直接呼べない。
 * このラッパー経由で表示する。
 */

import { HomeAwayDonut } from "@/components/charts/HomeAwayDonut";

type Props = {
  /** ホーム勝利数 */
  homeWins: number;
  /** ホーム敗北数 */
  homeLosses: number;
  /** アウェイ勝利数 */
  awayWins: number;
  /** アウェイ敗北数 */
  awayLosses: number;
};

/**
 * ダッシュボード用 HomeAwayDonut ラッパー
 *
 * @param props - ホーム／アウェイの勝敗データ
 */
export function DashboardHomeAwayDonut(props: Props) {
  return <HomeAwayDonut {...props} />;
}
