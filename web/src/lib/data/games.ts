/**
 * 試合データ取得関数
 *
 * Supabase から Server Components 経由でデータを取得する。
 */

import { createClient } from "@/lib/supabase/server";
import type { Game, GameDetail, GameWithOpponent, HomeAway } from "@/lib/types/database";

// ================================================
// フィルタ型
// ================================================

export type GameFilter = {
  month?: string;
  homeAway?: HomeAway;
  result?: "win" | "loss" | "scheduled";
  opponentTeamId?: string;
};

// ================================================
// 試合取得関数
// ================================================

/**
 * 直近の終了済み試合を取得する
 */
export async function getLatestGame(): Promise<GameWithOpponent | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select("*, opponent:teams!opponent_team_id(*)")
    .eq("status", "FINAL")
    .order("game_date", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as unknown as GameWithOpponent;
}

/**
 * 次の試合予定を取得する
 */
export async function getNextGame(): Promise<GameWithOpponent | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select("*, opponent:teams!opponent_team_id(*)")
    .eq("status", "SCHEDULED")
    .order("game_date", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as unknown as GameWithOpponent;
}

/**
 * 試合一覧を取得する（フィルタ対応）
 */
export async function getGames(filter?: GameFilter): Promise<GameWithOpponent[]> {
  const supabase = await createClient();

  let query = supabase
    .from("games")
    .select("*, opponent:teams!opponent_team_id(*)")
    .order("game_date", { ascending: false });

  // 月フィルタ（game_date の月部分で絞る）
  if (filter?.month && filter.month !== "all") {
    query = query.like("game_date", `%-${filter.month}-%`);
  }

  // H/Aフィルタ
  if (filter?.homeAway) {
    query = query.eq("home_away", filter.homeAway);
  }

  // 対戦相手フィルタ
  if (filter?.opponentTeamId) {
    query = query.eq("opponent_team_id", filter.opponentTeamId);
  }

  // 結果フィルタ: scheduled はステータスで絞る
  if (filter?.result === "scheduled") {
    query = query.eq("status", "SCHEDULED");
  }

  const { data, error } = await query;

  if (error || !data) return [];

  let games = data as unknown as GameWithOpponent[];

  // 結果フィルタ: win/loss はクライアント側で判定
  // （home_away に応じた得点比較がSQLでは複雑なため）
  if (filter?.result === "win" || filter?.result === "loss") {
    games = games.filter((g) => {
      if (g.status !== "FINAL" || g.score_home == null || g.score_away == null) return false;
      const exScore = g.home_away === "HOME" ? g.score_home : g.score_away;
      const oppScore = g.home_away === "HOME" ? g.score_away : g.score_home;
      return filter.result === "win" ? exScore > oppScore : exScore < oppScore;
    });
  }

  return games;
}

/**
 * ScheduleKeyで試合を取得する
 */
export async function getGameByScheduleKey(scheduleKey: string): Promise<GameWithOpponent | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select("*, opponent:teams!opponent_team_id(*)")
    .eq("schedule_key", scheduleKey)
    .single();

  if (error || !data) return null;
  return data as unknown as GameWithOpponent;
}

/**
 * 試合詳細（ボックススコア・寸評・動画込み）を取得する
 */
export async function getGameDetail(scheduleKey: string): Promise<GameDetail | null> {
  const supabase = await createClient();

  // 試合データ + 対戦相手
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*, opponent:teams!opponent_team_id(*)")
    .eq("schedule_key", scheduleKey)
    .single();

  if (gameError || !game) return null;

  // ボックススコア + AI寸評 + 動画を並行取得
  const [boxRes, commentRes, videoRes] = await Promise.all([
    supabase
      .from("box_scores")
      .select("*, player:players(*)")
      .eq("game_id", game.id)
      .order("is_starter", { ascending: false })
      .order("pts", { ascending: false }),
    supabase.from("game_comments").select("*").eq("game_id", game.id).single(),
    supabase.from("videos").select("*").eq("game_id", game.id).limit(1).single(),
  ]);

  return {
    ...(game as unknown as GameWithOpponent),
    box_scores: (boxRes.data ?? []) as unknown as GameDetail["box_scores"],
    comment: (commentRes.data ?? null) as GameDetail["comment"],
    video: (videoRes.data ?? null) as GameDetail["video"],
  };
}

/**
 * 横浜EXの試合結果を判定するヘルパー
 */
export function isWin(game: Game): boolean | null {
  if (game.status !== "FINAL" || !game.score_home || !game.score_away) return null;
  const exScore = game.home_away === "HOME" ? game.score_home : game.score_away;
  const oppScore = game.home_away === "HOME" ? game.score_away : game.score_home;
  return exScore > oppScore;
}

/**
 * 横浜EXの得点を取得するヘルパー
 */
export function getExScore(game: Game): number | null {
  if (!game.score_home || !game.score_away) return null;
  return game.home_away === "HOME" ? game.score_home : game.score_away;
}

/**
 * 相手チームの得点を取得するヘルパー
 */
export function getOppScore(game: Game): number | null {
  if (!game.score_home || !game.score_away) return null;
  return game.home_away === "HOME" ? game.score_away : game.score_home;
}

/**
 * 直近N試合の得点推移を取得する
 */
export async function getScoreTrend(
  count: number = 10
): Promise<{ game: GameWithOpponent; exScore: number; oppScore: number; win: boolean }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select("*, opponent:teams!opponent_team_id(*)")
    .eq("status", "FINAL")
    .order("game_date", { ascending: false })
    .limit(count);

  if (error || !data) return [];

  // 古い順に並び替え（グラフ表示用）
  const games = (data as unknown as GameWithOpponent[]).reverse();

  return games.map((g) => {
    const exScore = g.home_away === "HOME" ? g.score_home! : g.score_away!;
    const oppScore = g.home_away === "HOME" ? g.score_away! : g.score_home!;
    return { game: g, exScore, oppScore, win: exScore > oppScore };
  });
}

/**
 * 現在の連勝/連敗数を算出する
 */
export async function getCurrentStreak(): Promise<{ type: "W" | "L"; count: number }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("status", "FINAL")
    .order("game_date", { ascending: false })
    .limit(20);

  if (error || !data || data.length === 0) return { type: "W", count: 0 };

  const games = data as unknown as Game[];
  const firstResult = isWin(games[0]);
  const streakType = firstResult ? "W" : "L";
  let streakCount = 0;

  for (const g of games) {
    const win = isWin(g);
    if ((streakType === "W" && win) || (streakType === "L" && !win)) {
      streakCount++;
    } else {
      break;
    }
  }

  return { type: streakType, count: streakCount };
}
