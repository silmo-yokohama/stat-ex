/**
 * 選手データ取得関数のテスト
 *
 * getPlayers, getPlayerById, getPlayerAverage,
 * getAllPlayerAverages, getPlayerGameLog をテストする。
 */

import { describe, it, expect } from "vitest";
import {
  getPlayers,
  getPlayerById,
  getPlayerAverage,
  getAllPlayerAverages,
  getPlayerGameLog,
} from "@/lib/data/players";
import {
  mockPlayers,
  mockPlayerSeasons,
  mockPlayerAverages,
  mockBoxScores,
  mockTeams,
} from "@/lib/mock-data";

// ================================================
// getPlayers
// ================================================

describe("getPlayers", () => {
  it("引数なしで全選手を返す", async () => {
    const players = await getPlayers();

    expect(players).toHaveLength(mockPlayers.length);
  });

  it("ポジション 'ALL' を指定した場合、全選手を返す", async () => {
    const players = await getPlayers("ALL");

    expect(players).toHaveLength(mockPlayers.length);
  });

  it("ポジション 'PG' でフィルタリングできる", async () => {
    const players = await getPlayers("PG");
    const expectedPGs = mockPlayers.filter((p) => p.position === "PG");

    expect(players).toHaveLength(expectedPGs.length);
    // 全員がPGであることを検証
    players.forEach((p) => {
      expect(p.position).toBe("PG");
    });
  });

  it("ポジション 'C' でフィルタリングできる", async () => {
    const players = await getPlayers("C");
    const expectedCs = mockPlayers.filter((p) => p.position === "C");

    expect(players).toHaveLength(expectedCs.length);
    players.forEach((p) => {
      expect(p.position).toBe("C");
    });
  });

  it("各選手にplayer_seasonsが付与されている", async () => {
    const players = await getPlayers();

    players.forEach((p) => {
      expect(p).toHaveProperty("player_seasons");
      expect(Array.isArray(p.player_seasons)).toBe(true);

      // player_seasonsの各要素がこの選手に紐づいていることを確認
      p.player_seasons.forEach((ps) => {
        expect(ps.player_id).toBe(p.id);
      });
    });
  });

  it("存在しないポジションを指定すると空配列を返す", async () => {
    const players = await getPlayers("XX");

    expect(players).toHaveLength(0);
  });
});

// ================================================
// getPlayerById
// ================================================

describe("getPlayerById", () => {
  it("IDで選手を取得できる", async () => {
    const targetPlayer = mockPlayers[0];
    const player = await getPlayerById(targetPlayer.id);

    expect(player).not.toBeNull();
    expect(player!.id).toBe(targetPlayer.id);
    expect(player!.name).toBe(targetPlayer.name);
  });

  it("bleague_player_idで選手を取得できる", async () => {
    const targetPlayer = mockPlayers[0];
    const player = await getPlayerById(targetPlayer.bleague_player_id);

    expect(player).not.toBeNull();
    expect(player!.bleague_player_id).toBe(targetPlayer.bleague_player_id);
  });

  it("player_seasonsが付与されている", async () => {
    const targetPlayer = mockPlayers[0];
    const player = await getPlayerById(targetPlayer.id);

    expect(player).not.toBeNull();
    expect(Array.isArray(player!.player_seasons)).toBe(true);

    // player_seasonsが正しい選手IDに紐づいていることを確認
    const expectedSeasons = mockPlayerSeasons.filter(
      (ps) => ps.player_id === targetPlayer.id
    );
    expect(player!.player_seasons).toHaveLength(expectedSeasons.length);
  });

  it("存在しないIDの場合nullを返す", async () => {
    const player = await getPlayerById("non-existent-id");

    expect(player).toBeNull();
  });
});

// ================================================
// getPlayerAverage
// ================================================

describe("getPlayerAverage", () => {
  it("選手IDでシーズン平均スタッツを取得できる", async () => {
    const targetAverage = mockPlayerAverages[0];
    const avg = await getPlayerAverage(targetAverage.player_id);

    expect(avg).not.toBeNull();
    expect(avg!.player_id).toBe(targetAverage.player_id);
    expect(avg!.ppg).toBe(targetAverage.ppg);
    expect(avg!.rpg).toBe(targetAverage.rpg);
    expect(avg!.apg).toBe(targetAverage.apg);
  });

  it("スタッツの各項目が正しい型で返される", async () => {
    const targetAverage = mockPlayerAverages[0];
    const avg = await getPlayerAverage(targetAverage.player_id);

    expect(avg).not.toBeNull();
    expect(typeof avg!.games_played).toBe("number");
    expect(typeof avg!.ppg).toBe("number");
    expect(typeof avg!.fg_pct).toBe("number");
    expect(typeof avg!.mpg).toBe("string");
  });

  it("存在しない選手IDの場合nullを返す", async () => {
    const avg = await getPlayerAverage("non-existent-id");

    expect(avg).toBeNull();
  });
});

// ================================================
// getAllPlayerAverages
// ================================================

describe("getAllPlayerAverages", () => {
  it("全選手の平均スタッツを返す", async () => {
    const averages = await getAllPlayerAverages();

    expect(averages).toHaveLength(mockPlayerAverages.length);
  });

  it("各エントリにplayer情報が付与されている", async () => {
    const averages = await getAllPlayerAverages();

    averages.forEach((avg) => {
      expect(avg).toHaveProperty("player");
      expect(avg.player).toHaveProperty("name");
      expect(avg.player).toHaveProperty("position");
      expect(avg.player).toHaveProperty("number");
    });
  });

  it("player情報がplayer_idと一致している", async () => {
    const averages = await getAllPlayerAverages();

    averages.forEach((avg) => {
      expect(avg.player.id).toBe(avg.player_id);
    });
  });
});

// ================================================
// getPlayerGameLog
// ================================================

describe("getPlayerGameLog", () => {
  it("選手の試合別スタッツログを返す", async () => {
    // ボックススコアが存在する選手IDを使う（player-0001）
    const playerId = mockBoxScores[0].player_id;
    const gameLog = await getPlayerGameLog(playerId);

    const expectedCount = mockBoxScores.filter(
      (bs) => bs.player_id === playerId
    ).length;
    expect(gameLog).toHaveLength(expectedCount);
  });

  it("各ログにgame_date, opponent_name, home_away, resultが含まれる", async () => {
    const playerId = mockBoxScores[0].player_id;
    const gameLog = await getPlayerGameLog(playerId);

    expect(gameLog.length).toBeGreaterThan(0);
    gameLog.forEach((log) => {
      expect(log).toHaveProperty("game_date");
      expect(log).toHaveProperty("opponent_name");
      expect(log).toHaveProperty("home_away");
      expect(log).toHaveProperty("result");
    });
  });

  it("resultが 'W' または 'L' で始まるフォーマットである", async () => {
    const playerId = mockBoxScores[0].player_id;
    const gameLog = await getPlayerGameLog(playerId);

    gameLog.forEach((log) => {
      // "W 85-78" または "L 78-85" のようなフォーマット
      expect(log.result).toMatch(/^[WL] \d+-\d+$/);
    });
  });

  it("ボックススコアが存在しない選手の場合、空配列を返す", async () => {
    const gameLog = await getPlayerGameLog("non-existent-id");

    expect(gameLog).toHaveLength(0);
  });

  it("opponent_nameがモックデータのチーム名と一致する", async () => {
    const playerId = mockBoxScores[0].player_id;
    const gameLog = await getPlayerGameLog(playerId);

    // 全チームのshort_name一覧を取得
    const validShortNames = mockTeams.map((t) => t.short_name);

    gameLog.forEach((log) => {
      expect(validShortNames).toContain(log.opponent_name);
    });
  });
});
