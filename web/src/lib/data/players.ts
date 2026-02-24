/**
 * 選手データ取得関数
 *
 * Supabase から Server Components 経由でデータを取得する。
 * box_scores からの平均スタッツ集計はデータ量が小さいため
 * （60試合×12選手=720行）クライアント側で集計する。
 */

import { createClient } from "@/lib/supabase/server";
import { getCurrentSeasonId } from "./season";
import type { Player, PlayerWithSeason, BoxScore, Game } from "@/lib/types/database";

// ================================================
// 型定義
// ================================================

/** 選手のシーズン平均スタッツ */
export type PlayerSeasonAverage = {
  player_id: string;
  games_played: number;
  ppg: number;
  rpg: number;
  apg: number;
  fg_pct: number;
  tp_pct: number;
  ft_pct: number;
  spg: number;
  bpg: number;
  topg: number; // ターンオーバー/試合
  mpg: string; // 出場時間/試合（"MM:SS"形式）
  eff: number; // 効率/試合
};

// ================================================
// 選手取得関数
// ================================================

/**
 * EX選手一覧を取得する（ポジションフィルタ対応）
 *
 * player_seasons.is_active=true のEX選手のみ返す。
 * 対戦相手の選手は含めない。
 */
export async function getPlayers(position?: string): Promise<PlayerWithSeason[]> {
  const supabase = await createClient();
  const seasonId = await getCurrentSeasonId();

  let query = supabase
    .from("players")
    .select("*, player_seasons!inner(*)")
    .eq("player_seasons.is_active", true)
    .order("number", { ascending: true });

  // シーズンフィルタ（当該シーズンに在籍する選手のみ）
  if (seasonId) {
    query = query.eq("player_seasons.season_id", seasonId);
  }

  // ポジションフィルタ
  if (position && position !== "ALL") {
    query = query.eq("position", position);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return data as unknown as PlayerWithSeason[];
}

/**
 * 選手IDで選手を取得する（bleague_player_id でも検索可能）
 */
export async function getPlayerById(playerId: string): Promise<PlayerWithSeason | null> {
  const supabase = await createClient();

  // まず UUID で検索
  const { data, error } = await supabase
    .from("players")
    .select("*, player_seasons(*)")
    .eq("id", playerId)
    .single();

  if (!error && data) return data as unknown as PlayerWithSeason;

  // UUID で見つからない場合は bleague_player_id で検索
  const { data: data2, error: error2 } = await supabase
    .from("players")
    .select("*, player_seasons(*)")
    .eq("bleague_player_id", playerId)
    .single();

  if (error2 || !data2) return null;
  return data2 as unknown as PlayerWithSeason;
}

/**
 * 選手のシーズン平均スタッツを取得する（box_scores から集計）
 */
export async function getPlayerAverage(playerId: string): Promise<PlayerSeasonAverage | null> {
  const supabase = await createClient();
  const seasonId = await getCurrentSeasonId();

  // box_scores を games 経由でシーズンフィルタ
  let query = supabase
    .from("box_scores")
    .select("*, game:games!inner(season_id)")
    .eq("player_id", playerId);

  if (seasonId) query = query.eq("game.season_id", seasonId);

  const { data, error } = await query;

  if (error || !data || data.length === 0) return null;

  return _calcAverage(playerId, data as unknown as BoxScore[]);
}

/**
 * 全選手の平均スタッツを取得する（一覧表示用）
 */
export async function getAllPlayerAverages(): Promise<
  (PlayerSeasonAverage & { player: Player })[]
> {
  const supabase = await createClient();
  const seasonId = await getCurrentSeasonId();

  // アクティブ選手の一覧と当該シーズンのボックススコアを取得
  let playersQuery = supabase
    .from("players")
    .select("*, player_seasons!inner(*)")
    .eq("player_seasons.is_active", true)
    .order("number", { ascending: true });

  // box_scores は games 経由でシーズンを絞る
  let boxQuery = supabase
    .from("box_scores")
    .select("*, game:games!inner(season_id)");

  if (seasonId) {
    playersQuery = playersQuery.eq("player_seasons.season_id", seasonId);
    boxQuery = boxQuery.eq("game.season_id", seasonId);
  }

  const [playersRes, boxRes] = await Promise.all([playersQuery, boxQuery]);

  if (playersRes.error || !playersRes.data) return [];
  if (boxRes.error || !boxRes.data) return [];

  const players = playersRes.data as unknown as Player[];
  const allBoxScores = boxRes.data as unknown as BoxScore[];

  // 選手ごとに集計
  return players
    .map((player) => {
      const playerBox = allBoxScores.filter((bs) => bs.player_id === player.id);
      if (playerBox.length === 0) return null;
      return { ..._calcAverage(player.id, playerBox), player };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

/**
 * 選手の試合別スタッツログを取得する
 */
export async function getPlayerGameLog(
  playerId: string
): Promise<
  (BoxScore & { game_date: string; opponent_name: string; home_away: string; result: string })[]
> {
  const supabase = await createClient();
  const seasonId = await getCurrentSeasonId();

  // ボックススコアと試合情報を取得（シーズンフィルタ付き）
  let query = supabase
    .from("box_scores")
    .select("*, game:games!inner(*, opponent:teams!opponent_team_id(short_name))")
    .eq("player_id", playerId)
    .order("game(game_date)", { ascending: false });

  if (seasonId) query = query.eq("game.season_id", seasonId);

  const { data, error } = await query;

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((bs) => {
    const game = bs.game as Game & { opponent: { short_name: string } };
    const exScore = game.home_away === "HOME" ? game.score_home! : game.score_away!;
    const oppScore = game.home_away === "HOME" ? game.score_away! : game.score_home!;

    return {
      ...bs,
      game: undefined, // リレーションデータを除外
      game_date: game.game_date,
      opponent_name: game.opponent.short_name,
      home_away: game.home_away,
      result: exScore > oppScore ? `W ${exScore}-${oppScore}` : `L ${exScore}-${oppScore}`,
    };
  });
}

// ================================================
// ヘルパー
// ================================================

/**
 * ボックススコアの配列からシーズン平均スタッツを算出する
 */
function _calcAverage(playerId: string, boxScores: BoxScore[]): PlayerSeasonAverage {
  const n = boxScores.length;
  const sum = (key: keyof BoxScore) =>
    boxScores.reduce((acc, bs) => acc + ((bs[key] as number) ?? 0), 0);

  const totalFgm = sum("fgm");
  const totalFga = sum("fga");
  const totalTpm = sum("tpm");
  const totalTpa = sum("tpa");
  const totalFtm = sum("ftm");
  const totalFta = sum("fta");

  return {
    player_id: playerId,
    games_played: n,
    ppg: _round(sum("pts") / n),
    rpg: _round(sum("reb") / n),
    apg: _round(sum("ast") / n),
    fg_pct: totalFga > 0 ? _round((totalFgm / totalFga) * 100) : 0,
    tp_pct: totalTpa > 0 ? _round((totalTpm / totalTpa) * 100) : 0,
    ft_pct: totalFta > 0 ? _round((totalFtm / totalFta) * 100) : 0,
    spg: _round(sum("stl") / n),
    bpg: _round(sum("blk") / n),
    topg: _round(sum("tov") / n),
    mpg: _calcAvgMinutes(boxScores),
    eff: _round(sum("eff") / n),
  };
}

/**
 * 出場時間の平均を "MM:SS" 形式で算出する
 */
function _calcAvgMinutes(boxScores: BoxScore[]): string {
  let totalSeconds = 0;
  let validCount = 0;

  for (const bs of boxScores) {
    if (!bs.minutes) continue;
    const parts = bs.minutes.split(":");
    if (parts.length === 2) {
      totalSeconds += parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      validCount++;
    }
  }

  if (validCount === 0) return "0:00";

  const avgSeconds = Math.round(totalSeconds / validCount);
  const mins = Math.floor(avgSeconds / 60);
  const secs = avgSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** 小数第1位に丸める */
function _round(value: number): number {
  return Math.round(value * 10) / 10;
}
