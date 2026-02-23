/**
 * STAT-EX データベース型定義
 *
 * Supabase の自動生成型（supabase.ts）をベースに、
 * アプリケーション用の型エイリアスとリレーション型を定義する。
 */

import type { Database } from "./supabase";

// ================================================
// Supabase テーブル Row 型のエイリアス
// ================================================

/** 全テーブルの Row 型へのショートカット */
type Tables = Database["public"]["Tables"];

/** シーズン */
export type Season = Tables["seasons"]["Row"];

/** チーム */
export type Team = Tables["teams"]["Row"];

/** 選手 */
export type Player = Tables["players"]["Row"];

/** 選手のシーズン在籍情報 */
export type PlayerSeason = Tables["player_seasons"]["Row"];

/** 試合 */
export type Game = Tables["games"]["Row"];

/** ボックススコア */
export type BoxScore = Tables["box_scores"]["Row"];

/** チーム成績 */
export type TeamStats = Tables["team_stats"]["Row"];

/** B2順位表 */
export type Standing = Tables["standings"]["Row"];

/** 対戦成績 */
export type H2HRecord = Tables["h2h_records"]["Row"];

/** インジュアリー */
export type Injury = Tables["injuries"]["Row"];

/** ニュース */
export type News = Tables["news"]["Row"];

/** YouTube動画 */
export type Video = Tables["videos"]["Row"];

/** AI試合寸評 */
export type GameComment = Tables["game_comments"]["Row"];

/** マスコット */
export type Mascot = Tables["mascot"]["Row"];

// ================================================
// カスタム列挙型（型安全なリテラル）
// ================================================

/** 試合ステータス */
export type GameStatus = "SCHEDULED" | "LIVE" | "FINAL";

/** ホーム/アウェイ */
export type HomeAway = "HOME" | "AWAY";

/** ニュースソース */
export type NewsSource = "official" | "media";

// ================================================
// リレーション付きの結合型（フロントエンドで使う）
// ================================================

/** 試合 + 対戦相手チーム情報 */
export type GameWithOpponent = Game & {
  opponent: Team;
};

/** 試合詳細（ボックススコア + 寸評 + 動画込み） */
export type GameDetail = Game & {
  opponent: Team;
  box_scores: (BoxScore & { player: Player })[];
  comment: GameComment | null;
  video: Video | null;
};

/** 選手 + シーズン在籍情報 */
export type PlayerWithSeason = Player & {
  player_seasons: PlayerSeason[];
};

// ================================================
// Insert / Update 用の型（スクレイパーバッチ等で使用）
// ================================================

/** テーブル名から Insert 型を取得するヘルパー */
export type InsertRow<T extends keyof Tables> = Tables[T]["Insert"];

/** テーブル名から Update 型を取得するヘルパー */
export type UpdateRow<T extends keyof Tables> = Tables[T]["Update"];

// Database 型の再エクスポート
export type { Database };
