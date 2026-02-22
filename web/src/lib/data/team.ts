/**
 * チームデータ取得関数
 *
 * 現在はモックデータを返す。Supabase接続後はDBクエリに置き換える。
 */

import type { TeamStats, Standing, H2HRecord, Injury } from "@/lib/types/database";
import type { TeamLeader } from "@/lib/mock-data";
import {
  mockTeamStats,
  mockStandings,
  mockH2HRecords,
  mockInjuries,
  mockTeamLeaders,
  mockTeams,
  mockPlayers,
  mockGames,
} from "@/lib/mock-data";

// ================================================
// チームデータ取得関数
// ================================================

/**
 * チーム成績を取得する
 */
export async function getTeamStats(): Promise<TeamStats> {
  return mockTeamStats;
}

/**
 * B2順位表を取得する（チーム名付き）
 */
export async function getStandings(): Promise<(Standing & { team_name: string; short_name: string })[]> {
  return mockStandings.map((s) => {
    const team = mockTeams.find((t) => t.id === s.team_id)!;
    return {
      ...s,
      team_name: team.name,
      short_name: team.short_name,
    };
  });
}

/**
 * H2H対戦成績を取得する（チーム名付き）
 */
export async function getH2HRecords(): Promise<(H2HRecord & { opponent_name: string; short_name: string })[]> {
  return mockH2HRecords
    .filter((h) => h.wins + h.losses > 0)
    .map((h) => {
      const team = mockTeams.find((t) => t.id === h.opponent_team_id)!;
      return {
        ...h,
        opponent_name: team.name,
        short_name: team.short_name,
      };
    })
    .sort((a, b) => b.wins - b.losses - (a.wins - a.losses));
}

/**
 * インジュアリーリストを取得する（選手名付き）
 */
export async function getInjuries(): Promise<(Injury & { player_name: string; player_number: number | null })[]> {
  return mockInjuries.map((inj) => {
    const player = mockPlayers.find((p) => p.id === inj.player_id)!;
    return {
      ...inj,
      player_name: player.name,
      player_number: player.number,
    };
  });
}

/**
 * チームリーダーを取得する
 */
export async function getTeamLeaders(): Promise<TeamLeader[]> {
  return mockTeamLeaders;
}

/**
 * 月別成績を取得する
 */
export async function getMonthlyRecord(): Promise<
  { month: string; wins: number; losses: number }[]
> {
  const months = ["10", "11", "12", "01", "02"];
  const finishedGames = mockGames.filter((g) => g.status === "FINAL");

  return months.map((m) => {
    const monthGames = finishedGames.filter((g) => g.game_date.substring(5, 7) === m);
    const wins = monthGames.filter((g) => {
      const exScore = g.home_away === "HOME" ? g.score_home! : g.score_away!;
      const oppScore = g.home_away === "HOME" ? g.score_away! : g.score_home!;
      return exScore > oppScore;
    }).length;
    return { month: m, wins, losses: monthGames.length - wins };
  });
}

/**
 * Q別得点傾向を取得する
 */
export async function getQuarterTrend(): Promise<
  { quarter: string; avgFor: number; avgAgainst: number }[]
> {
  const finished = mockGames.filter(
    (g) => g.status === "FINAL" && g.q1_home !== null
  );
  const count = finished.length || 1;

  const quarters = [
    { label: "Q1", homeKey: "q1_home", awayKey: "q1_away" },
    { label: "Q2", homeKey: "q2_home", awayKey: "q2_away" },
    { label: "Q3", homeKey: "q3_home", awayKey: "q3_away" },
    { label: "Q4", homeKey: "q4_home", awayKey: "q4_away" },
  ] as const;

  return quarters.map(({ label, homeKey, awayKey }) => {
    let totalFor = 0;
    let totalAgainst = 0;
    for (const g of finished) {
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
