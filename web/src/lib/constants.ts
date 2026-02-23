/**
 * STAT-EX 定数定義
 */

/** サイト情報 */
export const SITE = {
  name: "STAT-EX",
  description: "横浜エクセレンス 情報ダッシュボード",
  concept: "5クリックかかる情報を1クリックで",
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

/** チケット購入URL */
export const TICKET_URL = "https://bleague-ticket.psrv.jp/games/EX";

/** リアルタイム更新間隔（ミリ秒） */
export const LIVE_UPDATE_INTERVAL = 30_000;
