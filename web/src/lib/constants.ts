/**
 * STAT-EX 定数定義
 */

/** サイト情報 */
export const SITE = {
  name: "STAT-EX",
  description: "横浜エクセレンス 情報ダッシュボード",
  concept: "横浜EX データベース",
} as const;

/** 横浜エクセレンス情報 */
export const TEAM = {
  id: 714,
  name: "横浜エクセレンス",
  shortName: "横浜EX",
} as const;

/** ナビゲーション項目（icon は Material Symbols のアイコン名） */
export const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード", icon: "dashboard" },
  { href: "/games", label: "試合", icon: "sports_basketball" },
  { href: "/players", label: "選手", icon: "group" },
  { href: "/team", label: "チーム", icon: "bar_chart" },
  { href: "/mascot", label: "マスコット", icon: "pets" },
] as const;

/**
 * B2リーグ 2025-26シーズン 地区分け
 *
 * 東地区(7チーム)・西地区(7チーム)の固定構成。
 * ワイルドカード = 各地区4位以下の8チームを勝率順に並べたもの。
 * キーはチームの short_name。
 */
export const B2_DIVISIONS: Record<string, "東地区" | "西地区"> = {
  信州: "東地区",
  福島: "東地区",
  横浜EX: "東地区",
  福井: "東地区",
  岩手: "東地区",
  青森: "東地区",
  山形: "東地区",
  神戸: "西地区",
  愛媛: "西地区",
  鹿児島: "西地区",
  熊本: "西地区",
  FE福岡: "西地区",
  奈良: "西地区",
  静岡: "西地区",
} as const;

/** 地区名の型 */
export type B2Division = "東地区" | "西地区";

/**
 * 現在のシーズン開始年を動的に算出する
 *
 * B.LEAGUEのシーズンは10月〜翌年5月。
 * - 10月〜12月 → その年がシーズン開始年（例: 2025年10月 → 2025）
 * - 1月〜9月  → 前年がシーズン開始年（例: 2026年2月 → 2025）
 */
export function getCurrentSeasonYear(): number {
  const now = new Date();
  const month = now.getMonth() + 1; // 0-indexed → 1-indexed
  return month >= 10 ? now.getFullYear() : now.getFullYear() - 1;
}

/**
 * 現在のシーズン名を取得する（例: "2025-26"）
 */
export function getCurrentSeasonName(): string {
  const year = getCurrentSeasonYear();
  return `${year}-${String(year + 1).slice(-2)}`;
}

/** チケット購入URL */
export const TICKET_URL = "https://bleague-ticket.psrv.jp/games/EX";

/** リアルタイム更新間隔（ミリ秒） */
export const LIVE_UPDATE_INTERVAL = 30_000;
