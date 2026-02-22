/**
 * 試合データ取得関数
 *
 * 現在はモックデータを返す。Supabase接続後はDBクエリに置き換える。
 */

import type { Game, GameDetail, GameWithOpponent, HomeAway } from "@/lib/types/database";
import {
  mockGames,
  mockTeams,
  mockBoxScoresGame25,
  mockGameComments,
  mockVideos,
  mockPlayers,
} from "@/lib/mock-data";

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
  const finished = mockGames
    .filter((g) => g.status === "FINAL")
    .sort((a, b) => b.game_date.localeCompare(a.game_date));

  const game = finished[0];
  if (!game) return null;

  const opponent = mockTeams.find((t) => t.id === game.opponent_team_id);
  if (!opponent) return null;

  return { ...game, opponent };
}

/**
 * 次の試合予定を取得する
 */
export async function getNextGame(): Promise<GameWithOpponent | null> {
  const scheduled = mockGames
    .filter((g) => g.status === "SCHEDULED")
    .sort((a, b) => a.game_date.localeCompare(b.game_date));

  const game = scheduled[0];
  if (!game) return null;

  const opponent = mockTeams.find((t) => t.id === game.opponent_team_id);
  if (!opponent) return null;

  return { ...game, opponent };
}

/**
 * 試合一覧を取得する（フィルタ対応）
 */
export async function getGames(filter?: GameFilter): Promise<GameWithOpponent[]> {
  let games = [...mockGames];

  // 月フィルタ
  if (filter?.month && filter.month !== "all") {
    games = games.filter((g) => g.game_date.substring(5, 7) === filter.month);
  }

  // H/Aフィルタ
  if (filter?.homeAway) {
    games = games.filter((g) => g.home_away === filter.homeAway);
  }

  // 結果フィルタ
  if (filter?.result) {
    games = games.filter((g) => {
      if (filter.result === "scheduled") return g.status === "SCHEDULED";
      if (g.status !== "FINAL" || !g.score_home || !g.score_away) return false;
      const exScore = g.home_away === "HOME" ? g.score_home : g.score_away;
      const oppScore = g.home_away === "HOME" ? g.score_away : g.score_home;
      return filter.result === "win" ? exScore > oppScore : exScore < oppScore;
    });
  }

  // 対戦相手フィルタ
  if (filter?.opponentTeamId) {
    games = games.filter((g) => g.opponent_team_id === filter.opponentTeamId);
  }

  // 日付順（新しい順）
  games.sort((a, b) => b.game_date.localeCompare(a.game_date));

  return games.map((g) => ({
    ...g,
    opponent: mockTeams.find((t) => t.id === g.opponent_team_id)!,
  }));
}

/**
 * ScheduleKeyで試合を取得する
 */
export async function getGameByScheduleKey(scheduleKey: string): Promise<GameWithOpponent | null> {
  const game = mockGames.find((g) => g.schedule_key === scheduleKey);
  if (!game) return null;

  const opponent = mockTeams.find((t) => t.id === game.opponent_team_id);
  if (!opponent) return null;

  return { ...game, opponent };
}

/**
 * 試合詳細（ボックススコア・寸評・動画込み）を取得する
 */
export async function getGameDetail(scheduleKey: string): Promise<GameDetail | null> {
  const game = mockGames.find((g) => g.schedule_key === scheduleKey);
  if (!game) return null;

  const opponent = mockTeams.find((t) => t.id === game.opponent_team_id);
  if (!opponent) return null;

  // ボックススコア（現時点ではgame25のみ詳細データあり）
  const boxScores = mockBoxScoresGame25
    .filter((bs) => bs.game_id === game.id)
    .map((bs) => ({
      ...bs,
      player: mockPlayers.find((p) => p.id === bs.player_id)!,
    }));

  // AI寸評
  const comment = mockGameComments.find((c) => c.game_id === game.id) ?? null;

  // 動画
  const video = mockVideos.find((v) => v.game_id === game.id) ?? null;

  return { ...game, opponent, box_scores: boxScores, comment, video };
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
export async function getScoreTrend(count: number = 10): Promise<
  { game: GameWithOpponent; exScore: number; oppScore: number; win: boolean }[]
> {
  const finished = mockGames
    .filter((g) => g.status === "FINAL")
    .sort((a, b) => a.game_date.localeCompare(b.game_date))
    .slice(-count);

  return finished.map((g) => {
    const exScore = g.home_away === "HOME" ? g.score_home! : g.score_away!;
    const oppScore = g.home_away === "HOME" ? g.score_away! : g.score_home!;
    return {
      game: { ...g, opponent: mockTeams.find((t) => t.id === g.opponent_team_id)! },
      exScore,
      oppScore,
      win: exScore > oppScore,
    };
  });
}

/**
 * 現在の連勝/連敗数を算出する
 */
export async function getCurrentStreak(): Promise<{ type: "W" | "L"; count: number }> {
  const finished = mockGames
    .filter((g) => g.status === "FINAL")
    .sort((a, b) => b.game_date.localeCompare(a.game_date));

  if (finished.length === 0) return { type: "W", count: 0 };

  const firstResult = isWin(finished[0]);
  const streakType = firstResult ? "W" : "L";
  let count = 0;

  for (const g of finished) {
    const win = isWin(g);
    if ((streakType === "W" && win) || (streakType === "L" && !win)) {
      count++;
    } else {
      break;
    }
  }

  return { type: streakType, count };
}
