/**
 * 試合データ取得関数のテスト
 *
 * games.ts がエクスポートする全関数を網羅的にテストする。
 * 現時点ではモックデータを使った実装のため、期待値はモックデータの値に基づく。
 */

import { describe, it, expect } from "vitest";
import {
  getLatestGame,
  getNextGame,
  getGames,
  getGameByScheduleKey,
  getGameDetail,
  isWin,
  getExScore,
  getOppScore,
  getScoreTrend,
  getCurrentStreak,
} from "@/lib/data/games";
import { mockGames } from "@/lib/mock-data";
import type { Game } from "@/lib/types/database";

// ================================================
// getLatestGame
// ================================================

describe("getLatestGame", () => {
  it("終了済み（FINAL）の試合のうち最も日付が新しい試合を返す", async () => {
    const result = await getLatestGame();

    expect(result).not.toBeNull();
    // 最新のFINAL試合は game25（2026-02-21）
    expect(result!.schedule_key).toBe("B2-2025-025");
    expect(result!.game_date).toBe("2026-02-21");
    expect(result!.status).toBe("FINAL");
  });

  it("対戦相手チーム情報（opponent）が含まれている", async () => {
    const result = await getLatestGame();

    expect(result).not.toBeNull();
    expect(result!.opponent).toBeDefined();
    // game25 の対戦相手は東京エクセレンス（team-0014）
    expect(result!.opponent.id).toBe("team-0014");
    expect(result!.opponent.name).toBe("東京エクセレンス");
  });
});

// ================================================
// getNextGame
// ================================================

describe("getNextGame", () => {
  it("予定済み（SCHEDULED）の試合のうち最も日付が古い（直近の）試合を返す", async () => {
    const result = await getNextGame();

    expect(result).not.toBeNull();
    // 最も近いSCHEDULED試合は game26（2026-02-22）
    expect(result!.schedule_key).toBe("B2-2025-026");
    expect(result!.game_date).toBe("2026-02-22");
    expect(result!.status).toBe("SCHEDULED");
  });

  it("対戦相手チーム情報（opponent）が含まれている", async () => {
    const result = await getNextGame();

    expect(result).not.toBeNull();
    expect(result!.opponent).toBeDefined();
    // game26 の対戦相手は東京エクセレンス（team-0014）
    expect(result!.opponent.id).toBe("team-0014");
    expect(result!.opponent.short_name).toBe("東京EX");
  });
});

// ================================================
// getGames
// ================================================

describe("getGames", () => {
  it("フィルタなしで全30試合を日付の新しい順に返す", async () => {
    const result = await getGames();

    expect(result).toHaveLength(30);
    // 先頭は最も新しい試合
    expect(result[0].schedule_key).toBe("B2-2025-030");
    // 末尾は最も古い試合
    expect(result[result.length - 1].schedule_key).toBe("B2-2025-001");
    // 各要素にopponent情報が含まれている
    for (const game of result) {
      expect(game.opponent).toBeDefined();
      expect(game.opponent.name).toBeTruthy();
    }
  });

  it("月フィルタ: 10月の試合のみ返す", async () => {
    const result = await getGames({ month: "10" });

    // 10月の試合は6試合（game1〜game6）
    expect(result).toHaveLength(6);
    for (const game of result) {
      expect(game.game_date.substring(5, 7)).toBe("10");
    }
  });

  it("月フィルタ: 'all'を指定すると全試合を返す", async () => {
    const result = await getGames({ month: "all" });

    expect(result).toHaveLength(30);
  });

  it("H/Aフィルタ: HOME試合のみ返す", async () => {
    const result = await getGames({ homeAway: "HOME" });

    // HOME試合は16試合
    expect(result).toHaveLength(16);
    for (const game of result) {
      expect(game.home_away).toBe("HOME");
    }
  });

  it("H/Aフィルタ: AWAY試合のみ返す", async () => {
    const result = await getGames({ homeAway: "AWAY" });

    // AWAY試合は14試合
    expect(result).toHaveLength(14);
    for (const game of result) {
      expect(game.home_away).toBe("AWAY");
    }
  });

  it("結果フィルタ: 勝利した試合のみ返す", async () => {
    const result = await getGames({ result: "win" });

    // モックデータでの勝利は15試合
    expect(result).toHaveLength(15);
    // 各試合でEXの得点が相手より高いことを検証
    for (const game of result) {
      const exScore = game.home_away === "HOME" ? game.score_home! : game.score_away!;
      const oppScore = game.home_away === "HOME" ? game.score_away! : game.score_home!;
      expect(exScore).toBeGreaterThan(oppScore);
    }
  });

  it("結果フィルタ: 敗北した試合のみ返す", async () => {
    const result = await getGames({ result: "loss" });

    // モックデータでの敗北は10試合
    expect(result).toHaveLength(10);
    for (const game of result) {
      const exScore = game.home_away === "HOME" ? game.score_home! : game.score_away!;
      const oppScore = game.home_away === "HOME" ? game.score_away! : game.score_home!;
      expect(exScore).toBeLessThan(oppScore);
    }
  });

  it("結果フィルタ: 予定試合のみ返す", async () => {
    const result = await getGames({ result: "scheduled" });

    // SCHEDULED試合は5試合
    expect(result).toHaveLength(5);
    for (const game of result) {
      expect(game.status).toBe("SCHEDULED");
    }
  });

  it("複数フィルタの組み合わせ: 10月のHOME試合", async () => {
    const result = await getGames({ month: "10", homeAway: "HOME" });

    // 10月HOME: game1, game2, game5, game6 = 4試合
    expect(result).toHaveLength(4);
    for (const game of result) {
      expect(game.game_date.substring(5, 7)).toBe("10");
      expect(game.home_away).toBe("HOME");
    }
  });
});

// ================================================
// getGameByScheduleKey
// ================================================

describe("getGameByScheduleKey", () => {
  it("存在するscheduleKeyで試合データを返す", async () => {
    const result = await getGameByScheduleKey("B2-2025-025");

    expect(result).not.toBeNull();
    expect(result!.schedule_key).toBe("B2-2025-025");
    expect(result!.game_date).toBe("2026-02-21");
    expect(result!.opponent).toBeDefined();
    expect(result!.opponent.name).toBe("東京エクセレンス");
  });

  it("存在しないscheduleKeyでnullを返す", async () => {
    const result = await getGameByScheduleKey("NONEXISTENT-KEY");

    expect(result).toBeNull();
  });
});

// ================================================
// getGameDetail
// ================================================

describe("getGameDetail", () => {
  it("存在するscheduleKeyで試合詳細データを返す", async () => {
    const result = await getGameDetail("B2-2025-025");

    expect(result).not.toBeNull();
    expect(result!.schedule_key).toBe("B2-2025-025");
    expect(result!.opponent).toBeDefined();
    expect(result!.opponent.name).toBe("東京エクセレンス");
  });

  it("ボックススコア情報が含まれている", async () => {
    const result = await getGameDetail("B2-2025-025");

    expect(result).not.toBeNull();
    // game25にはボックススコアデータが存在する（10エントリ）
    expect(result!.box_scores).toBeDefined();
    expect(result!.box_scores.length).toBeGreaterThan(0);
    // 各ボックススコアにplayer情報が含まれている
    for (const bs of result!.box_scores) {
      expect(bs.player).toBeDefined();
      expect(bs.player.name).toBeTruthy();
    }
  });

  it("AI寸評（comment）が含まれている", async () => {
    const result = await getGameDetail("B2-2025-025");

    expect(result).not.toBeNull();
    expect(result!.comment).not.toBeNull();
    expect(result!.comment!.game_id).toBe("game-0025");
    expect(result!.comment!.content).toBeTruthy();
    expect(result!.comment!.model).toBe("gemini-2.0-flash");
  });

  it("動画（video）が含まれている", async () => {
    const result = await getGameDetail("B2-2025-025");

    expect(result).not.toBeNull();
    expect(result!.video).not.toBeNull();
    expect(result!.video!.game_id).toBe("game-0025");
    expect(result!.video!.video_id).toBe("dQw4w9WgXcQ");
  });

  it("ボックススコアが存在しない試合ではbox_scoresが空配列になる", async () => {
    // game1にはボックススコアのモックデータがない
    const result = await getGameDetail("B2-2025-001");

    expect(result).not.toBeNull();
    expect(result!.box_scores).toEqual([]);
  });

  it("寸評・動画が存在しない試合ではnullになる", async () => {
    // game1にはcommentもvideoもない
    const result = await getGameDetail("B2-2025-001");

    expect(result).not.toBeNull();
    expect(result!.comment).toBeNull();
    expect(result!.video).toBeNull();
  });

  it("存在しないscheduleKeyでnullを返す", async () => {
    const result = await getGameDetail("NONEXISTENT-KEY");

    expect(result).toBeNull();
  });
});

// ================================================
// isWin
// ================================================

describe("isWin", () => {
  it("HOME勝利の試合でtrueを返す", () => {
    // game1: HOME, score_home=82, score_away=75 → EX=82 > 75 → 勝ち
    const game1 = mockGames.find((g) => g.schedule_key === "B2-2025-001")!;
    expect(isWin(game1)).toBe(true);
  });

  it("HOME敗北の試合でfalseを返す", () => {
    // game2: HOME, score_home=78, score_away=85 → EX=78 < 85 → 負け
    const game2 = mockGames.find((g) => g.schedule_key === "B2-2025-002")!;
    expect(isWin(game2)).toBe(false);
  });

  it("AWAY勝利の試合でtrueを返す", () => {
    // game4: AWAY, score_home=76, score_away=80 → EX=80 > 76 → 勝ち
    const game4 = mockGames.find((g) => g.schedule_key === "B2-2025-004")!;
    expect(isWin(game4)).toBe(true);
  });

  it("AWAY敗北の試合でfalseを返す", () => {
    // game3: AWAY, score_home=90, score_away=82 → EX=82 < 90 → 負け
    const game3 = mockGames.find((g) => g.schedule_key === "B2-2025-003")!;
    expect(isWin(game3)).toBe(false);
  });

  it("未実施の試合（SCHEDULED）でnullを返す", () => {
    const scheduledGame = mockGames.find((g) => g.status === "SCHEDULED")!;
    expect(isWin(scheduledGame)).toBeNull();
  });

  it("スコアがnullの試合でnullを返す", () => {
    // FINAL だがスコアがnullの仮想ケース
    const noScoreGame: Game = {
      ...mockGames[0],
      status: "FINAL",
      score_home: null,
      score_away: null,
    };
    expect(isWin(noScoreGame)).toBeNull();
  });
});

// ================================================
// getExScore
// ================================================

describe("getExScore", () => {
  it("HOME試合ではscore_homeを返す", () => {
    // game1: HOME, score_home=82
    const game1 = mockGames.find((g) => g.schedule_key === "B2-2025-001")!;
    expect(getExScore(game1)).toBe(82);
  });

  it("AWAY試合ではscore_awayを返す", () => {
    // game4: AWAY, score_away=80
    const game4 = mockGames.find((g) => g.schedule_key === "B2-2025-004")!;
    expect(getExScore(game4)).toBe(80);
  });

  it("スコアがnullの試合ではnullを返す", () => {
    const scheduledGame = mockGames.find((g) => g.status === "SCHEDULED")!;
    expect(getExScore(scheduledGame)).toBeNull();
  });
});

// ================================================
// getOppScore
// ================================================

describe("getOppScore", () => {
  it("HOME試合ではscore_awayを返す", () => {
    // game1: HOME, score_away=75
    const game1 = mockGames.find((g) => g.schedule_key === "B2-2025-001")!;
    expect(getOppScore(game1)).toBe(75);
  });

  it("AWAY試合ではscore_homeを返す", () => {
    // game4: AWAY, score_home=76
    const game4 = mockGames.find((g) => g.schedule_key === "B2-2025-004")!;
    expect(getOppScore(game4)).toBe(76);
  });

  it("スコアがnullの試合ではnullを返す", () => {
    const scheduledGame = mockGames.find((g) => g.status === "SCHEDULED")!;
    expect(getOppScore(scheduledGame)).toBeNull();
  });
});

// ================================================
// getScoreTrend
// ================================================

describe("getScoreTrend", () => {
  it("デフォルトで直近10試合の得点推移を日付昇順で返す", async () => {
    const result = await getScoreTrend();

    expect(result).toHaveLength(10);
    // 日付昇順（古い順）で並んでいることを検証
    for (let i = 1; i < result.length; i++) {
      expect(result[i].game.game_date >= result[i - 1].game.game_date).toBe(true);
    }
  });

  it("各エントリにexScore, oppScore, winが含まれている", async () => {
    const result = await getScoreTrend();

    for (const entry of result) {
      expect(typeof entry.exScore).toBe("number");
      expect(typeof entry.oppScore).toBe("number");
      expect(typeof entry.win).toBe("boolean");
      // winフラグの整合性を検証
      expect(entry.win).toBe(entry.exScore > entry.oppScore);
    }
  });

  it("countパラメータで取得件数を制限できる", async () => {
    const result = await getScoreTrend(5);

    expect(result).toHaveLength(5);
  });

  it("対戦相手情報（opponent）が各エントリに含まれている", async () => {
    const result = await getScoreTrend(3);

    for (const entry of result) {
      expect(entry.game.opponent).toBeDefined();
      expect(entry.game.opponent.name).toBeTruthy();
    }
  });
});

// ================================================
// getCurrentStreak
// ================================================

describe("getCurrentStreak", () => {
  it("現在の連勝/連敗情報を返す", async () => {
    const result = await getCurrentStreak();

    // 最新試合（game25）は勝利、その前（game24）は敗北のため W1
    expect(result.type).toBe("W");
    expect(result.count).toBe(1);
  });

  it("typeは'W'または'L'のいずれかである", async () => {
    const result = await getCurrentStreak();

    expect(["W", "L"]).toContain(result.type);
  });

  it("countは0以上の整数である", async () => {
    const result = await getCurrentStreak();

    expect(result.count).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result.count)).toBe(true);
  });
});
