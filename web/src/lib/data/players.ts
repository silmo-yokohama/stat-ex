/**
 * 選手データ取得関数
 *
 * 現在はモックデータを返す。Supabase接続後はDBクエリに置き換える。
 */

import type { Player, PlayerWithSeason, BoxScore } from "@/lib/types/database";
import {
  mockPlayers,
  mockPlayerSeasons,
  mockPlayerAverages,
  mockBoxScores,
  mockGames,
  mockTeams,
  type PlayerSeasonAverage,
} from "@/lib/mock-data";

// ================================================
// 選手取得関数
// ================================================

/**
 * 選手一覧を取得する（ポジションフィルタ対応）
 */
export async function getPlayers(position?: string): Promise<PlayerWithSeason[]> {
  let players = [...mockPlayers];

  // ポジションフィルタ
  if (position && position !== "ALL") {
    players = players.filter((p) => p.position === position);
  }

  return players.map((p) => ({
    ...p,
    player_seasons: mockPlayerSeasons.filter((ps) => ps.player_id === p.id),
  }));
}

/**
 * 選手IDで選手を取得する
 */
export async function getPlayerById(playerId: string): Promise<PlayerWithSeason | null> {
  const player = mockPlayers.find((p) => p.id === playerId || p.bleague_player_id === playerId);
  if (!player) return null;

  return {
    ...player,
    player_seasons: mockPlayerSeasons.filter((ps) => ps.player_id === player.id),
  };
}

/**
 * 選手のシーズン平均スタッツを取得する
 */
export async function getPlayerAverage(playerId: string): Promise<PlayerSeasonAverage | null> {
  return mockPlayerAverages.find((a) => a.player_id === playerId) ?? null;
}

/**
 * 選手の全シーズン平均スタッツを取得する（一覧表示用）
 */
export async function getAllPlayerAverages(): Promise<(PlayerSeasonAverage & { player: Player })[]> {
  return mockPlayerAverages.map((avg) => ({
    ...avg,
    player: mockPlayers.find((p) => p.id === avg.player_id)!,
  }));
}

/**
 * 選手の試合別スタッツログを取得する
 */
export async function getPlayerGameLog(playerId: string): Promise<
  (BoxScore & { game_date: string; opponent_name: string; home_away: string; result: string })[]
> {
  const playerBoxScores = mockBoxScores.filter((bs) => bs.player_id === playerId);

  return playerBoxScores.map((bs) => {
    const game = mockGames.find((g) => g.id === bs.game_id)!;
    const opponent = mockTeams.find((t) => t.id === game.opponent_team_id)!;
    const exScore = game.home_away === "HOME" ? game.score_home! : game.score_away!;
    const oppScore = game.home_away === "HOME" ? game.score_away! : game.score_home!;

    return {
      ...bs,
      game_date: game.game_date,
      opponent_name: opponent.short_name,
      home_away: game.home_away,
      result: exScore > oppScore ? `W ${exScore}-${oppScore}` : `L ${exScore}-${oppScore}`,
    };
  });
}
