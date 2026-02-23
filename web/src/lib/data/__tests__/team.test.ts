/**
 * チームデータ取得関数のテスト
 *
 * getTeamStats, getStandings, getH2HRecords, getInjuries,
 * getTeamLeaders, getMonthlyRecord, getQuarterTrend をテストする。
 */

import { describe, it, expect } from "vitest";
import {
  getTeamStats,
  getStandings,
  getH2HRecords,
  getInjuries,
  getTeamLeaders,
  getMonthlyRecord,
  getQuarterTrend,
} from "@/lib/data/team";
import {
  mockTeamStats,
  mockStandings,
  mockH2HRecords,
  mockInjuries,
  mockTeamLeaders,
  mockPlayers,
} from "@/lib/mock-data";

// ================================================
// getTeamStats
// ================================================

describe("getTeamStats", () => {
  it("チーム成績オブジェクトを返す", async () => {
    const stats = await getTeamStats();

    expect(stats).toBeDefined();
    expect(stats.id).toBe(mockTeamStats.id);
  });

  it("勝敗数と勝率が含まれている", async () => {
    const stats = await getTeamStats();

    expect(typeof stats.wins).toBe("number");
    expect(typeof stats.losses).toBe("number");
    expect(typeof stats.win_pct).toBe("number");
    // 勝敗合計が0より大きい
    expect(stats.wins + stats.losses).toBeGreaterThan(0);
  });

  it("ホーム/アウェイの勝敗数が合計と一致する", async () => {
    const stats = await getTeamStats();

    expect(stats.home_wins + stats.away_wins).toBe(stats.wins);
    expect(stats.home_losses + stats.away_losses).toBe(stats.losses);
  });

  it("平均得点・平均失点が含まれている", async () => {
    const stats = await getTeamStats();

    expect(stats.avg_points_for).not.toBeNull();
    expect(stats.avg_points_against).not.toBeNull();
    expect(stats.avg_points_for!).toBeGreaterThan(0);
    expect(stats.avg_points_against!).toBeGreaterThan(0);
  });
});

// ================================================
// getStandings
// ================================================

describe("getStandings", () => {
  it("B2全14チームの順位表を返す", async () => {
    const standings = await getStandings();

    expect(standings).toHaveLength(mockStandings.length);
  });

  it("各エントリにteam_nameとshort_nameが付与されている", async () => {
    const standings = await getStandings();

    standings.forEach((s) => {
      expect(s).toHaveProperty("team_name");
      expect(s).toHaveProperty("short_name");
      expect(typeof s.team_name).toBe("string");
      expect(typeof s.short_name).toBe("string");
      // 名前が空文字でないことを確認
      expect(s.team_name.length).toBeGreaterThan(0);
      expect(s.short_name.length).toBeGreaterThan(0);
    });
  });

  it("順位（rank）が含まれている", async () => {
    const standings = await getStandings();

    standings.forEach((s) => {
      expect(typeof s.rank).toBe("number");
      expect(s.rank).toBeGreaterThanOrEqual(1);
      expect(s.rank).toBeLessThanOrEqual(14);
    });
  });
});

// ================================================
// getH2HRecords
// ================================================

describe("getH2HRecords", () => {
  it("対戦実績のあるレコードのみを返す（0勝0敗は除外）", async () => {
    const h2h = await getH2HRecords();

    // wins + losses が0のレコードは含まれない
    h2h.forEach((record) => {
      expect(record.wins + record.losses).toBeGreaterThan(0);
    });

    // モックデータ中に0勝0敗のレコードが存在することを前提に、除外されていることを確認
    const zeroRecords = mockH2HRecords.filter((r) => r.wins + r.losses === 0);
    expect(h2h.length).toBe(mockH2HRecords.length - zeroRecords.length);
  });

  it("各エントリにopponent_nameとshort_nameが付与されている", async () => {
    const h2h = await getH2HRecords();

    h2h.forEach((record) => {
      expect(record).toHaveProperty("opponent_name");
      expect(record).toHaveProperty("short_name");
      expect(typeof record.opponent_name).toBe("string");
      expect(typeof record.short_name).toBe("string");
    });
  });

  it("勝ち越し数（wins - losses）の降順でソートされている", async () => {
    const h2h = await getH2HRecords();

    for (let i = 0; i < h2h.length - 1; i++) {
      const currentDiff = h2h[i].wins - h2h[i].losses;
      const nextDiff = h2h[i + 1].wins - h2h[i + 1].losses;
      expect(currentDiff).toBeGreaterThanOrEqual(nextDiff);
    }
  });
});

// ================================================
// getInjuries
// ================================================

describe("getInjuries", () => {
  it("インジュアリーリストを返す", async () => {
    const injuries = await getInjuries();

    expect(injuries).toHaveLength(mockInjuries.length);
  });

  it("各エントリにplayer_nameとplayer_numberが付与されている", async () => {
    const injuries = await getInjuries();

    injuries.forEach((inj) => {
      expect(inj).toHaveProperty("player_name");
      expect(inj).toHaveProperty("player_number");
      expect(typeof inj.player_name).toBe("string");
      expect(inj.player_name.length).toBeGreaterThan(0);
    });
  });

  it("player_nameがモックデータの選手名と一致する", async () => {
    const injuries = await getInjuries();
    const validPlayerNames = mockPlayers.map((p) => p.name);

    injuries.forEach((inj) => {
      expect(validPlayerNames).toContain(inj.player_name);
    });
  });

  it("怪我の理由（reason）が含まれている", async () => {
    const injuries = await getInjuries();

    injuries.forEach((inj) => {
      expect(typeof inj.reason).toBe("string");
      expect(inj.reason.length).toBeGreaterThan(0);
    });
  });
});

// ================================================
// getTeamLeaders
// ================================================

describe("getTeamLeaders", () => {
  it("チームリーダー一覧を返す", async () => {
    const leaders = await getTeamLeaders();

    expect(leaders).toHaveLength(mockTeamLeaders.length);
  });

  it("各リーダーにcategory, player, value, unitが含まれる", async () => {
    const leaders = await getTeamLeaders();

    leaders.forEach((leader) => {
      expect(leader).toHaveProperty("category");
      expect(leader).toHaveProperty("player");
      expect(leader).toHaveProperty("value");
      expect(leader).toHaveProperty("unit");
      expect(typeof leader.category).toBe("string");
      expect(typeof leader.value).toBe("number");
      expect(typeof leader.unit).toBe("string");
    });
  });

  it("得点・リバウンド・アシストのカテゴリが含まれる", async () => {
    const leaders = await getTeamLeaders();
    const categories = leaders.map((l) => l.category);

    expect(categories).toContain("得点");
    expect(categories).toContain("リバウンド");
    expect(categories).toContain("アシスト");
  });
});

// ================================================
// getMonthlyRecord
// ================================================

describe("getMonthlyRecord", () => {
  it("5ヶ月分（10月〜2月）の月別成績を返す", async () => {
    const monthly = await getMonthlyRecord();

    expect(monthly).toHaveLength(5);
  });

  it("各月にmonth, wins, lossesが含まれる", async () => {
    const monthly = await getMonthlyRecord();

    monthly.forEach((m) => {
      expect(m).toHaveProperty("month");
      expect(m).toHaveProperty("wins");
      expect(m).toHaveProperty("losses");
      expect(typeof m.month).toBe("string");
      expect(typeof m.wins).toBe("number");
      expect(typeof m.losses).toBe("number");
    });
  });

  it("月のラベルが正しい順序で並んでいる", async () => {
    const monthly = await getMonthlyRecord();
    const months = monthly.map((m) => m.month);

    expect(months).toEqual(["10", "11", "12", "01", "02"]);
  });

  it("勝敗数が0以上である", async () => {
    const monthly = await getMonthlyRecord();

    monthly.forEach((m) => {
      expect(m.wins).toBeGreaterThanOrEqual(0);
      expect(m.losses).toBeGreaterThanOrEqual(0);
    });
  });
});

// ================================================
// getQuarterTrend
// ================================================

describe("getQuarterTrend", () => {
  it("Q1〜Q4の4クォーター分のデータを返す", async () => {
    const trend = await getQuarterTrend();

    expect(trend).toHaveLength(4);
  });

  it("各クォーターにquarter, avgFor, avgAgainstが含まれる", async () => {
    const trend = await getQuarterTrend();

    trend.forEach((q) => {
      expect(q).toHaveProperty("quarter");
      expect(q).toHaveProperty("avgFor");
      expect(q).toHaveProperty("avgAgainst");
      expect(typeof q.quarter).toBe("string");
      expect(typeof q.avgFor).toBe("number");
      expect(typeof q.avgAgainst).toBe("number");
    });
  });

  it("クォーターラベルがQ1〜Q4の順序で並んでいる", async () => {
    const trend = await getQuarterTrend();
    const labels = trend.map((q) => q.quarter);

    expect(labels).toEqual(["Q1", "Q2", "Q3", "Q4"]);
  });

  it("平均得点・平均失点が正の数値である", async () => {
    const trend = await getQuarterTrend();

    trend.forEach((q) => {
      expect(q.avgFor).toBeGreaterThan(0);
      expect(q.avgAgainst).toBeGreaterThan(0);
    });
  });
});
