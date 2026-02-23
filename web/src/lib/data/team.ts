/**
 * チームデータ取得関数
 *
 * Supabase から Server Components 経由でデータを取得する。
 */

import { createClient } from "@/lib/supabase/server";
import type { TeamStats, Standing, H2HRecord, Injury, Game, Player, BoxScore } from "@/lib/types/database";

// ================================================
// 型定義
// ================================================

/** チームリーダー（カテゴリ別トップ選手） */
export type TeamLeader = {
  category: string;
  player: Player;
  value: number;
  unit: string;
};

// ================================================
// チームデータ取得関数
// ================================================

/** チーム成績のデフォルト値（データ未投入時用） */
const DEFAULT_TEAM_STATS: TeamStats = {
  id: "",
  season_id: "",
  wins: 0,
  losses: 0,
  win_pct: 0,
  avg_points_for: 0,
  avg_points_against: 0,
  home_wins: 0,
  home_losses: 0,
  away_wins: 0,
  away_losses: 0,
  created_at: "",
  updated_at: "",
};

/**
 * チーム成績を取得する
 */
export async function getTeamStats(): Promise<TeamStats> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_stats")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) return DEFAULT_TEAM_STATS;
  return data as unknown as TeamStats;
}

/**
 * B2順位表を取得する（チーム名付き）
 */
export async function getStandings(): Promise<(Standing & { team_name: string; short_name: string })[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("standings")
    .select("*, team:teams(name, short_name)")
    .order("rank", { ascending: true });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((s) => ({
    ...s,
    team_name: s.team.name,
    short_name: s.team.short_name,
    team: undefined, // リレーションデータを除外
  }));
}

/**
 * H2H対戦成績を取得する（チーム名付き）
 */
export async function getH2HRecords(): Promise<(H2HRecord & { opponent_name: string; short_name: string })[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("h2h_records")
    .select("*, opponent:teams!opponent_team_id(name, short_name)");

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[])
    .filter((h) => h.wins + h.losses > 0)
    .map((h) => ({
      ...h,
      opponent_name: h.opponent.name,
      short_name: h.opponent.short_name,
      opponent: undefined,
    }))
    .sort((a: { wins: number; losses: number }, b: { wins: number; losses: number }) =>
      (b.wins - b.losses) - (a.wins - a.losses)
    );
}

/**
 * インジュアリーリストを取得する（選手名付き）
 */
export async function getInjuries(): Promise<(Injury & { player_name: string; player_number: number | null })[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("injuries")
    .select("*, player:players(name, number)");

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((inj) => ({
    ...inj,
    player_name: inj.player.name,
    player_number: inj.player.number,
    player: undefined,
  }));
}

/**
 * チームリーダーを取得する（box_scores からAVG集計）
 *
 * 得点・リバウンド・アシストの各カテゴリでトップ1選手を返す。
 */
export async function getTeamLeaders(): Promise<TeamLeader[]> {
  const supabase = await createClient();

  // アクティブ選手の全ボックススコアを取得
  const { data, error } = await supabase
    .from("box_scores")
    .select("player_id, pts, reb, ast, player:players(*)");

  if (error || !data || data.length === 0) return [];

  // 選手ごとに集計
  const playerStats = new Map<string, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    player: any;
    totalPts: number;
    totalReb: number;
    totalAst: number;
    games: number;
  }>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const bs of data as any[]) {
    const pid = bs.player_id as string;
    const existing = playerStats.get(pid);
    if (existing) {
      existing.totalPts += bs.pts ?? 0;
      existing.totalReb += bs.reb ?? 0;
      existing.totalAst += bs.ast ?? 0;
      existing.games += 1;
    } else {
      playerStats.set(pid, {
        player: bs.player,
        totalPts: bs.pts ?? 0,
        totalReb: bs.reb ?? 0,
        totalAst: bs.ast ?? 0,
        games: 1,
      });
    }
  }

  // 各カテゴリのリーダーを算出
  const categories: { key: string; label: string; unit: string; field: "totalPts" | "totalReb" | "totalAst" }[] = [
    { key: "pts", label: "得点", unit: "PPG", field: "totalPts" },
    { key: "reb", label: "リバウンド", unit: "RPG", field: "totalReb" },
    { key: "ast", label: "アシスト", unit: "APG", field: "totalAst" },
  ];

  return categories.map(({ label, unit, field }) => {
    let bestPlayer = null;
    let bestAvg = 0;

    for (const stats of playerStats.values()) {
      const avg = stats[field] / stats.games;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestPlayer = stats.player;
      }
    }

    return {
      category: label,
      player: bestPlayer as Player,
      value: Math.round(bestAvg * 10) / 10,
      unit,
    };
  }).filter((l) => l.player !== null);
}

/**
 * 月別成績を取得する
 */
export async function getMonthlyRecord(): Promise<
  { month: string; wins: number; losses: number }[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select("game_date, home_away, score_home, score_away")
    .eq("status", "FINAL");

  if (error || !data) return [];

  const games = data as unknown as Game[];

  // シーズン中の月（10月〜翌4月）
  const months = ["10", "11", "12", "01", "02", "03", "04"];

  return months.map((m) => {
    const monthGames = games.filter((g) => g.game_date.substring(5, 7) === m);
    const wins = monthGames.filter((g) => {
      const exScore = g.home_away === "HOME" ? g.score_home! : g.score_away!;
      const oppScore = g.home_away === "HOME" ? g.score_away! : g.score_home!;
      return exScore > oppScore;
    }).length;
    return { month: m, wins, losses: monthGames.length - wins };
  }).filter((m) => m.wins + m.losses > 0); // データのある月のみ
}

/**
 * Q別得点傾向を取得する
 */
export async function getQuarterTrend(): Promise<
  { quarter: string; avgFor: number; avgAgainst: number }[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select("home_away, q1_home, q1_away, q2_home, q2_away, q3_home, q3_away, q4_home, q4_away")
    .eq("status", "FINAL")
    .not("q1_home", "is", null);

  if (error || !data || data.length === 0) return [];

  const games = data as unknown as Game[];
  const count = games.length;

  const quarters = [
    { label: "Q1", homeKey: "q1_home", awayKey: "q1_away" },
    { label: "Q2", homeKey: "q2_home", awayKey: "q2_away" },
    { label: "Q3", homeKey: "q3_home", awayKey: "q3_away" },
    { label: "Q4", homeKey: "q4_home", awayKey: "q4_away" },
  ] as const;

  return quarters.map(({ label, homeKey, awayKey }) => {
    let totalFor = 0;
    let totalAgainst = 0;
    for (const g of games) {
      const hScore = g[homeKey] ?? 0;
      const aScore = g[awayKey] ?? 0;
      if (g.home_away === "HOME") {
        totalFor += hScore;
        totalAgainst += aScore;
      } else {
        totalFor += aScore;
        totalAgainst += hScore;
      }
    }
    return {
      quarter: label,
      avgFor: Math.round((totalFor / count) * 10) / 10,
      avgAgainst: Math.round((totalAgainst / count) * 10) / 10,
    };
  });
}
