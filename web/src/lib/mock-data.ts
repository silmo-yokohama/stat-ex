/**
 * STAT-EX モックデータ
 *
 * Supabase接続前の開発用モックデータ。
 * 横浜エクセレンス 2025-26シーズンを想定したリアルなサンプルデータ。
 * Supabase接続後はこのファイルを削除し、実際のDBクエリに置き換える。
 */

import type {
  Season,
  Team,
  Player,
  PlayerSeason,
  Game,
  BoxScore,
  TeamStats,
  Standing,
  H2HRecord,
  Injury,
  News,
  Video,
  GameComment,
  Mascot,
} from "@/lib/types/database";

// ================================================
// UUID生成ヘルパー（モック用の簡易的なID）
// ================================================

/** モック用の固定ID生成（テスト再現性のため） */
const id = (prefix: string, num: number) => `${prefix}-${String(num).padStart(4, "0")}`;

// ================================================
// シーズン
// ================================================

export const mockSeason: Season = {
  id: id("season", 1),
  year: 2025,
  name: "2025-26",
  start_date: "2025-10-01",
  end_date: "2026-05-31",
  created_at: "2025-10-01T00:00:00+09:00",
  updated_at: "2025-10-01T00:00:00+09:00",
};

// ================================================
// チーム（B2全14チーム）
// ================================================

export const mockTeams: Team[] = [
  { id: id("team", 1), bleague_team_id: 714, name: "横浜エクセレンス", short_name: "横浜EX", arena: "横浜武道館", city: "横浜市", created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("team", 2), bleague_team_id: 696, name: "アルティーリ千葉", short_name: "千葉", arena: "ポートアリーナ", city: "千葉市", created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("team", 3), bleague_team_id: 717, name: "越谷アルファーズ", short_name: "越谷", arena: "ウイング・ハット春日部", city: "越谷市", created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("team", 4), bleague_team_id: 723, name: "さいたまブロンコス", short_name: "さいたま", arena: "サイデン化学アリーナ", city: "さいたま市", created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("team", 5), bleague_team_id: 698, name: "福島ファイヤーボンズ", short_name: "福島", arena: "宝来屋郡山総合体育館", city: "郡山市", created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("team", 6), bleague_team_id: 682, name: "山形ワイヴァンズ", short_name: "山形", arena: "山形市総合スポーツセンター", city: "山形市", created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("team", 7), bleague_team_id: 708, name: "岩手ビッグブルズ", short_name: "岩手", arena: "盛岡タカヤアリーナ", city: "盛岡市", created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("team", 8), bleague_team_id: 695, name: "青森ワッツ", short_name: "青森", arena: "マエダアリーナ", city: "八戸市", created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("team", 9), bleague_team_id: 718, name: "愛媛オレンジバイキングス", short_name: "愛媛", arena: "愛媛県武道館", city: "松山市", created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("team", 10), bleague_team_id: 697, name: "熊本ヴォルターズ", short_name: "熊本", arena: "熊本県立総合体育館", city: "熊本市", created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("team", 11), bleague_team_id: 725, name: "ヴェルカ鹿児島", short_name: "鹿児島", arena: "西原商会アリーナ", city: "鹿児島市", created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("team", 12), bleague_team_id: 720, name: "バンビシャス奈良", short_name: "奈良", arena: "ならでんアリーナ", city: "奈良市", created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("team", 13), bleague_team_id: 726, name: "岡山トルネーズ", short_name: "岡山", arena: "ジップアリーナ岡山", city: "岡山市", created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("team", 14), bleague_team_id: 727, name: "東京エクセレンス", short_name: "東京EX", arena: "板橋区立小豆沢体育館", city: "板橋区", created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
];

/** 横浜エクセレンスのチーム情報 */
export const yokohamaTeam = mockTeams[0];

// ================================================
// 選手（横浜エクセレンス ロスター 15名）
// ================================================

export const mockPlayers: Player[] = [
  { id: id("player", 1), bleague_player_id: "10001", sportsnavi_player_id: "sp-1001", name: "田中 大輝", name_en: "Daiki Tanaka", number: 0, position: "PG", height: 178, weight: 75, birthdate: "1998-04-12", birthplace: "東京都", image_url: null, created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("player", 2), bleague_player_id: "10002", sportsnavi_player_id: "sp-1002", name: "佐藤 健太", name_en: "Kenta Sato", number: 1, position: "SG", height: 185, weight: 82, birthdate: "1996-08-23", birthplace: "神奈川県", image_url: null, created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("player", 3), bleague_player_id: "10003", sportsnavi_player_id: "sp-1003", name: "高橋 翔", name_en: "Sho Takahashi", number: 3, position: "SF", height: 192, weight: 88, birthdate: "1997-01-15", birthplace: "大阪府", image_url: null, created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("player", 4), bleague_player_id: "10004", sportsnavi_player_id: "sp-1004", name: "渡辺 龍一", name_en: "Ryuichi Watanabe", number: 7, position: "PF", height: 198, weight: 95, birthdate: "1995-11-30", birthplace: "千葉県", image_url: null, created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("player", 5), bleague_player_id: "10005", sportsnavi_player_id: "sp-1005", name: "マイケル・ジョンソン", name_en: "Michael Johnson", number: 11, position: "C", height: 205, weight: 108, birthdate: "1993-03-22", birthplace: "USA", image_url: null, created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("player", 6), bleague_player_id: "10006", sportsnavi_player_id: "sp-1006", name: "鈴木 拓海", name_en: "Takumi Suzuki", number: 13, position: "PG", height: 175, weight: 72, birthdate: "2000-06-18", birthplace: "埼玉県", image_url: null, created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("player", 7), bleague_player_id: "10007", sportsnavi_player_id: "sp-1007", name: "伊藤 悠真", name_en: "Yuma Ito", number: 14, position: "SG", height: 188, weight: 84, birthdate: "1999-09-05", birthplace: "愛知県", image_url: null, created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("player", 8), bleague_player_id: "10008", sportsnavi_player_id: "sp-1008", name: "中村 光太郎", name_en: "Kotaro Nakamura", number: 21, position: "SF", height: 190, weight: 86, birthdate: "1998-12-01", birthplace: "福岡県", image_url: null, created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("player", 9), bleague_player_id: "10009", sportsnavi_player_id: "sp-1009", name: "デイビッド・ウィリアムズ", name_en: "David Williams", number: 24, position: "PF", height: 200, weight: 100, birthdate: "1994-07-14", birthplace: "USA", image_url: null, created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("player", 10), bleague_player_id: "10010", sportsnavi_player_id: "sp-1010", name: "小林 慶介", name_en: "Keisuke Kobayashi", number: 30, position: "C", height: 202, weight: 103, birthdate: "1996-02-28", birthplace: "茨城県", image_url: null, created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("player", 11), bleague_player_id: "10011", sportsnavi_player_id: "sp-1011", name: "山本 駿", name_en: "Shun Yamamoto", number: 33, position: "PG", height: 180, weight: 76, birthdate: "2001-05-20", birthplace: "静岡県", image_url: null, created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("player", 12), bleague_player_id: "10012", sportsnavi_player_id: "sp-1012", name: "松田 陸", name_en: "Riku Matsuda", number: 40, position: "SF", height: 193, weight: 90, birthdate: "1997-10-08", birthplace: "広島県", image_url: null, created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("player", 13), bleague_player_id: "10013", sportsnavi_player_id: "sp-1013", name: "クリス・テイラー", name_en: "Chris Taylor", number: 44, position: "PF", height: 201, weight: 102, birthdate: "1992-11-11", birthplace: "USA", image_url: null, created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("player", 14), bleague_player_id: "10014", sportsnavi_player_id: "sp-1014", name: "井上 颯太", name_en: "Sota Inoue", number: 5, position: "SG", height: 186, weight: 80, birthdate: "2002-03-14", birthplace: "北海道", image_url: null, created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
  { id: id("player", 15), bleague_player_id: "10015", sportsnavi_player_id: "sp-1015", name: "木村 大地", name_en: "Daichi Kimura", number: 8, position: "PF", height: 196, weight: 92, birthdate: "1999-08-25", birthplace: "京都府", image_url: null, created_at: "2025-10-01T00:00:00+09:00", updated_at: "2025-10-01T00:00:00+09:00" },
];

// ================================================
// 選手シーズン在籍
// ================================================

export const mockPlayerSeasons: PlayerSeason[] = mockPlayers.map((p, i) => ({
  id: id("ps", i + 1),
  player_id: p.id,
  season_id: mockSeason.id,
  is_active: true,
  joined_date: "2025-10-01",
  left_date: null,
  created_at: "2025-10-01T00:00:00+09:00",
  updated_at: "2025-10-01T00:00:00+09:00",
}));

// ================================================
// 試合データ（2025-26シーズン 30試合分）
// ================================================

/** 試合生成ヘルパー */
const game = (
  num: number,
  date: string,
  time: string,
  opponentIdx: number,
  homeAway: "HOME" | "AWAY",
  scoreHome: number | null,
  scoreAway: number | null,
  q1h: number | null, q1a: number | null,
  q2h: number | null, q2a: number | null,
  q3h: number | null, q3a: number | null,
  q4h: number | null, q4a: number | null,
  status: "SCHEDULED" | "LIVE" | "FINAL",
  attendance: number | null
): Game => ({
  id: id("game", num),
  schedule_key: `B2-2025-${String(num).padStart(3, "0")}`,
  season_id: mockSeason.id,
  game_date: date,
  game_time: time,
  opponent_team_id: mockTeams[opponentIdx].id,
  home_away: homeAway,
  score_home: scoreHome,
  score_away: scoreAway,
  q1_home: q1h, q1_away: q1a,
  q2_home: q2h, q2_away: q2a,
  q3_home: q3h, q3_away: q3a,
  q4_home: q4h, q4_away: q4a,
  status,
  venue: homeAway === "HOME" ? "横浜武道館" : mockTeams[opponentIdx].arena,
  attendance,
  referee: status === "FINAL" ? "山田太郎 / 佐々木次郎" : null,
  sportsnavi_game_id: status === "FINAL" ? `sn-${num}` : null,
  created_at: "2025-10-01T00:00:00+09:00",
  updated_at: `${date}T23:00:00+09:00`,
});

export const mockGames: Game[] = [
  // 10月（開幕月）
  game(1,  "2025-10-04", "18:00", 1,  "HOME", 82, 75, 22, 18, 20, 19, 18, 22, 22, 16, "FINAL", 1850),
  game(2,  "2025-10-05", "14:00", 1,  "HOME", 78, 85, 18, 22, 20, 21, 20, 24, 20, 18, "FINAL", 2100),
  game(3,  "2025-10-11", "18:00", 2,  "AWAY", 90, 82, 24, 20, 22, 18, 20, 22, 24, 22, "FINAL", 1500),
  game(4,  "2025-10-12", "14:00", 2,  "AWAY", 76, 80, 18, 20, 20, 22, 16, 18, 22, 20, "FINAL", 1600),
  game(5,  "2025-10-18", "18:00", 3,  "HOME", 88, 79, 24, 18, 20, 20, 22, 19, 22, 22, "FINAL", 2200),
  game(6,  "2025-10-19", "14:00", 3,  "HOME", 85, 82, 20, 22, 22, 18, 21, 20, 22, 22, "FINAL", 2350),
  // 11月
  game(7,  "2025-11-01", "18:00", 4,  "AWAY", 72, 78, 16, 20, 18, 22, 20, 18, 18, 18, "FINAL", 1200),
  game(8,  "2025-11-02", "14:00", 4,  "AWAY", 91, 84, 22, 20, 24, 22, 22, 20, 23, 22, "FINAL", 1350),
  game(9,  "2025-11-08", "18:00", 5,  "HOME", 80, 76, 20, 18, 18, 20, 22, 18, 20, 20, "FINAL", 2000),
  game(10, "2025-11-09", "14:00", 5,  "HOME", 86, 88, 22, 24, 20, 20, 22, 22, 22, 22, "FINAL", 2150),
  game(11, "2025-11-15", "18:00", 6,  "AWAY", 94, 80, 26, 20, 22, 18, 24, 22, 22, 20, "FINAL", 1100),
  game(12, "2025-11-16", "14:00", 6,  "AWAY", 83, 79, 20, 18, 22, 20, 19, 21, 22, 20, "FINAL", 1250),
  // 12月
  game(13, "2025-12-06", "18:00", 7,  "HOME", 77, 72, 20, 18, 18, 16, 20, 20, 19, 18, "FINAL", 1900),
  game(14, "2025-12-07", "14:00", 7,  "HOME", 89, 78, 22, 20, 24, 18, 20, 20, 23, 20, "FINAL", 2050),
  game(15, "2025-12-13", "18:00", 8,  "AWAY", 81, 86, 18, 22, 22, 24, 20, 18, 21, 22, "FINAL", 1400),
  game(16, "2025-12-14", "14:00", 8,  "AWAY", 92, 85, 24, 20, 22, 22, 22, 21, 24, 22, "FINAL", 1500),
  // 1月
  game(17, "2026-01-10", "18:00", 9,  "HOME", 87, 82, 22, 20, 20, 22, 24, 18, 21, 22, "FINAL", 2300),
  game(18, "2026-01-11", "14:00", 9,  "HOME", 75, 80, 18, 22, 20, 18, 17, 20, 20, 20, "FINAL", 2450),
  game(19, "2026-01-17", "18:00", 10, "AWAY", 83, 77, 20, 18, 22, 20, 20, 19, 21, 20, "FINAL", 1300),
  game(20, "2026-01-18", "14:00", 10, "AWAY", 79, 83, 20, 22, 18, 20, 21, 21, 20, 20, "FINAL", 1450),
  // 2月（直近）
  game(21, "2026-02-07", "18:00", 11, "HOME", 96, 82, 26, 20, 24, 18, 22, 22, 24, 22, "FINAL", 2500),
  game(22, "2026-02-08", "14:00", 11, "HOME", 84, 81, 20, 22, 22, 18, 20, 21, 22, 20, "FINAL", 2600),
  game(23, "2026-02-14", "18:00", 12, "AWAY", 88, 90, 22, 24, 20, 22, 24, 22, 22, 22, "FINAL", 1600),
  game(24, "2026-02-15", "14:00", 12, "AWAY", 91, 84, 24, 20, 22, 22, 22, 20, 23, 22, "FINAL", 1700),
  // 直近の試合（最新）
  game(25, "2026-02-21", "18:00", 13, "HOME", 85, 78, 22, 18, 20, 20, 22, 20, 21, 20, "FINAL", 2700),
  game(26, "2026-02-22", "14:00", 13, "HOME", null, null, null, null, null, null, null, null, null, null, "SCHEDULED", null),
  // 3月以降（予定）
  game(27, "2026-03-07", "18:00", 1,  "AWAY", null, null, null, null, null, null, null, null, null, null, "SCHEDULED", null),
  game(28, "2026-03-08", "14:00", 1,  "AWAY", null, null, null, null, null, null, null, null, null, null, "SCHEDULED", null),
  game(29, "2026-03-14", "18:00", 8,  "HOME", null, null, null, null, null, null, null, null, null, null, "SCHEDULED", null),
  game(30, "2026-03-15", "14:00", 8,  "HOME", null, null, null, null, null, null, null, null, null, null, "SCHEDULED", null),
];

// ================================================
// ボックススコア（直近5試合分の詳細データ）
// ================================================

/** ボックススコア生成ヘルパー */
const boxScore = (
  gameNum: number, playerNum: number, teamSide: "home" | "away",
  isStarter: boolean, minutes: string,
  pts: number, fgm: number, fga: number,
  tpm: number, tpa: number, ftm: number, fta: number,
  orReb: number, drReb: number, ast: number, tov: number,
  stl: number, blk: number, fouls: number, eff: number, plusMinus: number
): BoxScore => ({
  id: id("bs", gameNum * 100 + playerNum),
  game_id: id("game", gameNum),
  player_id: id("player", playerNum),
  team_side: teamSide,
  is_starter: isStarter,
  minutes,
  pts, fgm, fga,
  fg_pct: fga > 0 ? Math.round((fgm / fga) * 1000) / 10 : null,
  tpm, tpa,
  tp_pct: tpa > 0 ? Math.round((tpm / tpa) * 1000) / 10 : null,
  ftm, fta,
  ft_pct: fta > 0 ? Math.round((ftm / fta) * 1000) / 10 : null,
  or_reb: orReb, dr_reb: drReb, reb: orReb + drReb,
  ast, tov, stl, blk, fouls, eff, plus_minus: plusMinus,
  created_at: "2026-02-21T23:00:00+09:00",
  updated_at: "2026-02-21T23:00:00+09:00",
});

/** 直近試合（game25: 横浜EX 85 - 78 東京EX / HOME）のボックススコア */
export const mockBoxScoresGame25: BoxScore[] = [
  // 横浜EXスターター（home）
  boxScore(25, 1,  "home", true,  "32:15", 14, 5, 11, 2, 4, 2, 2, 0, 3, 8, 3, 2, 0, 2, 18, 8),
  boxScore(25, 2,  "home", true,  "28:40", 18, 7, 14, 3, 6, 1, 1, 1, 4, 2, 1, 1, 0, 3, 16, 5),
  boxScore(25, 3,  "home", true,  "30:10", 12, 5, 10, 1, 3, 1, 2, 2, 5, 3, 2, 2, 1, 2, 17, 7),
  boxScore(25, 4,  "home", true,  "26:30", 15, 6, 12, 1, 2, 2, 3, 3, 6, 1, 1, 0, 2, 4, 16, 4),
  boxScore(25, 5,  "home", true,  "24:20", 16, 7, 10, 0, 0, 2, 4, 4, 7, 1, 2, 0, 3, 3, 22, 10),
  // 横浜EXベンチ（home）
  boxScore(25, 6,  "home", false, "16:00", 4,  2, 5,  0, 2, 0, 0, 0, 1, 4, 2, 1, 0, 1, 4,  3),
  boxScore(25, 7,  "home", false, "20:15", 6,  2, 6,  1, 3, 1, 1, 0, 2, 1, 1, 0, 0, 2, 4,  -2),
  boxScore(25, 8,  "home", false, "10:05", 0,  0, 3,  0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, -1, -1),
  boxScore(25, 9,  "home", false, "18:30", 0,  0, 2,  0, 0, 0, 0, 2, 3, 0, 1, 0, 1, 2, 1,  2),
  boxScore(25, 10, "home", false, "14:15", 0,  0, 1,  0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 2, 0,  -1),
];

/** 全ボックススコア（簡易版: 直近試合のみ詳細） */
export const mockBoxScores: BoxScore[] = [...mockBoxScoresGame25];

// ================================================
// チーム成績
// ================================================

/** 終了済み試合から勝敗を算出 */
const finishedGames = mockGames.filter((g) => g.status === "FINAL");

const countWins = (games: Game[]): number =>
  games.filter((g) => {
    if (!g.score_home || !g.score_away) return false;
    // 横浜EXの得点を判定
    const exScore = g.home_away === "HOME" ? g.score_home : g.score_away;
    const oppScore = g.home_away === "HOME" ? g.score_away : g.score_home;
    return exScore > oppScore;
  }).length;

const totalWins = countWins(finishedGames);
const totalLosses = finishedGames.length - totalWins;
const homeGames = finishedGames.filter((g) => g.home_away === "HOME");
const awayGames = finishedGames.filter((g) => g.home_away === "AWAY");
const homeWins = countWins(homeGames);
const awayWins = countWins(awayGames);

export const mockTeamStats: TeamStats = {
  id: id("ts", 1),
  season_id: mockSeason.id,
  wins: totalWins,
  losses: totalLosses,
  win_pct: Math.round((totalWins / finishedGames.length) * 1000) / 10,
  avg_points_for: Math.round(
    finishedGames.reduce((sum, g) => sum + (g.home_away === "HOME" ? g.score_home! : g.score_away!), 0) / finishedGames.length * 10
  ) / 10,
  avg_points_against: Math.round(
    finishedGames.reduce((sum, g) => sum + (g.home_away === "HOME" ? g.score_away! : g.score_home!), 0) / finishedGames.length * 10
  ) / 10,
  home_wins: homeWins,
  home_losses: homeGames.length - homeWins,
  away_wins: awayWins,
  away_losses: awayGames.length - awayWins,
  created_at: "2026-02-22T00:00:00+09:00",
  updated_at: "2026-02-22T00:00:00+09:00",
};

// ================================================
// B2順位表（全14チーム）
// ================================================

export const mockStandings: Standing[] = [
  { id: id("st", 1),  season_id: mockSeason.id, team_id: id("team", 2),  rank: 1,  wins: 19, losses: 5,  win_pct: 79.2, games_behind: null, points_for: 86.2, points_against: 78.5, point_diff: 7.7,  streak: "W5", last5: "5-0", created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("st", 2),  season_id: mockSeason.id, team_id: id("team", 9),  rank: 2,  wins: 18, losses: 6,  win_pct: 75.0, games_behind: 1.0, points_for: 84.8, points_against: 79.2, point_diff: 5.6,  streak: "W3", last5: "4-1", created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("st", 3),  season_id: mockSeason.id, team_id: id("team", 1),  rank: 3,  wins: totalWins, losses: totalLosses, win_pct: mockTeamStats.win_pct, games_behind: 3.0, points_for: mockTeamStats.avg_points_for, points_against: mockTeamStats.avg_points_against, point_diff: Math.round((mockTeamStats.avg_points_for! - mockTeamStats.avg_points_against!) * 10) / 10, streak: "W1", last5: "3-2", created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("st", 4),  season_id: mockSeason.id, team_id: id("team", 3),  rank: 4,  wins: 15, losses: 9,  win_pct: 62.5, games_behind: 4.0, points_for: 82.1, points_against: 79.8, point_diff: 2.3,  streak: "L1", last5: "3-2", created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("st", 5),  season_id: mockSeason.id, team_id: id("team", 11), rank: 5,  wins: 14, losses: 10, win_pct: 58.3, games_behind: 5.0, points_for: 81.5, points_against: 80.2, point_diff: 1.3,  streak: "W2", last5: "3-2", created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("st", 6),  season_id: mockSeason.id, team_id: id("team", 10), rank: 6,  wins: 13, losses: 11, win_pct: 54.2, games_behind: 6.0, points_for: 80.3, points_against: 79.8, point_diff: 0.5,  streak: "L2", last5: "2-3", created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("st", 7),  season_id: mockSeason.id, team_id: id("team", 4),  rank: 7,  wins: 12, losses: 12, win_pct: 50.0, games_behind: 7.0, points_for: 79.8, points_against: 80.1, point_diff: -0.3, streak: "W1", last5: "2-3", created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("st", 8),  season_id: mockSeason.id, team_id: id("team", 5),  rank: 8,  wins: 12, losses: 12, win_pct: 50.0, games_behind: 7.0, points_for: 79.2, points_against: 80.5, point_diff: -1.3, streak: "L1", last5: "2-3", created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("st", 9),  season_id: mockSeason.id, team_id: id("team", 12), rank: 9,  wins: 11, losses: 13, win_pct: 45.8, games_behind: 8.0, points_for: 78.5, points_against: 80.8, point_diff: -2.3, streak: "W1", last5: "2-3", created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("st", 10), season_id: mockSeason.id, team_id: id("team", 6),  rank: 10, wins: 10, losses: 14, win_pct: 41.7, games_behind: 9.0, points_for: 77.8, points_against: 81.5, point_diff: -3.7, streak: "L3", last5: "1-4", created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("st", 11), season_id: mockSeason.id, team_id: id("team", 13), rank: 11, wins: 9,  losses: 15, win_pct: 37.5, games_behind: 10.0, points_for: 76.5, points_against: 82.0, point_diff: -5.5, streak: "L2", last5: "1-4", created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("st", 12), season_id: mockSeason.id, team_id: id("team", 7),  rank: 12, wins: 8,  losses: 16, win_pct: 33.3, games_behind: 11.0, points_for: 75.2, points_against: 82.8, point_diff: -7.6, streak: "L4", last5: "0-5", created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("st", 13), season_id: mockSeason.id, team_id: id("team", 8),  rank: 13, wins: 7,  losses: 17, win_pct: 29.2, games_behind: 12.0, points_for: 74.8, points_against: 83.5, point_diff: -8.7, streak: "W1", last5: "1-4", created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("st", 14), season_id: mockSeason.id, team_id: id("team", 14), rank: 14, wins: 5,  losses: 19, win_pct: 20.8, games_behind: 14.0, points_for: 73.0, points_against: 85.2, point_diff: -12.2, streak: "L5", last5: "0-5", created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
];

// ================================================
// H2H対戦成績
// ================================================

export const mockH2HRecords: H2HRecord[] = [
  { id: id("h2h", 1),  season_id: mockSeason.id, opponent_team_id: id("team", 2),  wins: 1, losses: 1, avg_points_for: 80.0, avg_points_against: 80.0, created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("h2h", 2),  season_id: mockSeason.id, opponent_team_id: id("team", 3),  wins: 1, losses: 1, avg_points_for: 83.0, avg_points_against: 81.0, created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("h2h", 3),  season_id: mockSeason.id, opponent_team_id: id("team", 4),  wins: 2, losses: 0, avg_points_for: 86.5, avg_points_against: 80.5, created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("h2h", 4),  season_id: mockSeason.id, opponent_team_id: id("team", 5),  wins: 1, losses: 1, avg_points_for: 81.5, avg_points_against: 81.0, created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("h2h", 5),  season_id: mockSeason.id, opponent_team_id: id("team", 6),  wins: 1, losses: 1, avg_points_for: 83.0, avg_points_against: 82.0, created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("h2h", 6),  season_id: mockSeason.id, opponent_team_id: id("team", 7),  wins: 2, losses: 0, avg_points_for: 88.5, avg_points_against: 79.5, created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("h2h", 7),  season_id: mockSeason.id, opponent_team_id: id("team", 8),  wins: 2, losses: 0, avg_points_for: 83.0, avg_points_against: 75.0, created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("h2h", 8),  season_id: mockSeason.id, opponent_team_id: id("team", 9),  wins: 1, losses: 1, avg_points_for: 81.0, avg_points_against: 81.0, created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("h2h", 9),  season_id: mockSeason.id, opponent_team_id: id("team", 10), wins: 1, losses: 1, avg_points_for: 81.0, avg_points_against: 80.0, created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("h2h", 10), season_id: mockSeason.id, opponent_team_id: id("team", 11), wins: 2, losses: 0, avg_points_for: 90.0, avg_points_against: 81.5, created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("h2h", 11), season_id: mockSeason.id, opponent_team_id: id("team", 12), wins: 1, losses: 1, avg_points_for: 89.5, avg_points_against: 87.0, created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("h2h", 12), season_id: mockSeason.id, opponent_team_id: id("team", 13), wins: 0, losses: 0, avg_points_for: null, avg_points_against: null, created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("h2h", 13), season_id: mockSeason.id, opponent_team_id: id("team", 14), wins: 1, losses: 0, avg_points_for: 85.0, avg_points_against: 78.0, created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
];

// ================================================
// インジュアリー
// ================================================

export const mockInjuries: Injury[] = [
  { id: id("inj", 1), player_id: id("player", 12), reason: "左膝前十字靱帯損傷", registered_date: "2026-01-20", created_at: "2026-01-20T00:00:00+09:00", updated_at: "2026-01-20T00:00:00+09:00" },
  { id: id("inj", 2), player_id: id("player", 15), reason: "右足首捻挫", registered_date: "2026-02-10", created_at: "2026-02-10T00:00:00+09:00", updated_at: "2026-02-10T00:00:00+09:00" },
];

// ================================================
// ニュース
// ================================================

export const mockNews: News[] = [
  { id: id("news", 1), source: "official", title: "【試合結果】2/21(金) vs 東京エクセレンス GAME1", url: "https://yokohama-ex.jp/news/game-result-0221", published_at: "2026-02-21T22:00:00+09:00", thumbnail_url: null, source_name: "横浜エクセレンス公式", created_at: "2026-02-21T22:30:00+09:00", updated_at: "2026-02-21T22:30:00+09:00" },
  { id: id("news", 2), source: "official", title: "2月後半 ホームゲームチケット発売のお知らせ", url: "https://yokohama-ex.jp/news/ticket-feb", published_at: "2026-02-18T12:00:00+09:00", thumbnail_url: null, source_name: "横浜エクセレンス公式", created_at: "2026-02-18T12:30:00+09:00", updated_at: "2026-02-18T12:30:00+09:00" },
  { id: id("news", 3), source: "official", title: "マイケル・ジョンソン選手 月間MVP受賞", url: "https://yokohama-ex.jp/news/mvp-johnson", published_at: "2026-02-15T10:00:00+09:00", thumbnail_url: null, source_name: "横浜エクセレンス公式", created_at: "2026-02-15T10:30:00+09:00", updated_at: "2026-02-15T10:30:00+09:00" },
  { id: id("news", 4), source: "official", title: "横浜武道館 来場者1万人達成記念イベント開催", url: "https://yokohama-ex.jp/news/10000-event", published_at: "2026-02-12T10:00:00+09:00", thumbnail_url: null, source_name: "横浜エクセレンス公式", created_at: "2026-02-12T10:30:00+09:00", updated_at: "2026-02-12T10:30:00+09:00" },
  { id: id("news", 5), source: "official", title: "新グッズ販売開始のお知らせ", url: "https://yokohama-ex.jp/news/new-goods", published_at: "2026-02-10T10:00:00+09:00", thumbnail_url: null, source_name: "横浜エクセレンス公式", created_at: "2026-02-10T10:30:00+09:00", updated_at: "2026-02-10T10:30:00+09:00" },
  { id: id("news", 6), source: "media", title: "横浜エクセレンス、B2昇格初年度で3位と好調 プレーオフ進出に期待", url: "https://example.com/news/yokohama-ex-b2", published_at: "2026-02-20T15:00:00+09:00", thumbnail_url: null, source_name: "バスケットボールキング", created_at: "2026-02-20T15:30:00+09:00", updated_at: "2026-02-20T15:30:00+09:00" },
  { id: id("news", 7), source: "media", title: "B2注目チーム：横浜エクセレンスの強さの秘密に迫る", url: "https://example.com/news/yokohama-ex-analysis", published_at: "2026-02-17T12:00:00+09:00", thumbnail_url: null, source_name: "月刊バスケットボール", created_at: "2026-02-17T12:30:00+09:00", updated_at: "2026-02-17T12:30:00+09:00" },
  { id: id("news", 8), source: "media", title: "M.ジョンソン（横浜EX）がB2得点ランク2位に浮上", url: "https://example.com/news/johnson-scoring", published_at: "2026-02-14T18:00:00+09:00", thumbnail_url: null, source_name: "スポーツナビ", created_at: "2026-02-14T18:30:00+09:00", updated_at: "2026-02-14T18:30:00+09:00" },
  { id: id("news", 9), source: "media", title: "Bリーグ B2リーグ 2月第3週 結果まとめ", url: "https://example.com/news/b2-week3-feb", published_at: "2026-02-11T10:00:00+09:00", thumbnail_url: null, source_name: "Yahoo!ニュース", created_at: "2026-02-11T10:30:00+09:00", updated_at: "2026-02-11T10:30:00+09:00" },
  { id: id("news", 10), source: "media", title: "横浜エクセレンス 田中大輝「チーム一丸で上を目指す」", url: "https://example.com/news/tanaka-interview", published_at: "2026-02-08T14:00:00+09:00", thumbnail_url: null, source_name: "バスケットカウント", created_at: "2026-02-08T14:30:00+09:00", updated_at: "2026-02-08T14:30:00+09:00" },
];

// ================================================
// YouTube動画
// ================================================

export const mockVideos: Video[] = [
  { id: id("video", 1), video_id: "dQw4w9WgXcQ", title: "【ハイライト】横浜エクセレンス vs 東京エクセレンス GAME1｜2/21", published_at: "2026-02-21T23:30:00+09:00", thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg", game_id: id("game", 25), created_at: "2026-02-22T00:00:00+09:00", updated_at: "2026-02-22T00:00:00+09:00" },
  { id: id("video", 2), video_id: "abc123def45", title: "【ハイライト】バンビシャス奈良 vs 横浜エクセレンス GAME2｜2/15", published_at: "2026-02-15T23:30:00+09:00", thumbnail_url: "https://img.youtube.com/vi/abc123def45/maxresdefault.jpg", game_id: id("game", 24), created_at: "2026-02-16T00:00:00+09:00", updated_at: "2026-02-16T00:00:00+09:00" },
  { id: id("video", 3), video_id: "xyz789ghi01", title: "【ハイライト】バンビシャス奈良 vs 横浜エクセレンス GAME1｜2/14", published_at: "2026-02-14T23:30:00+09:00", thumbnail_url: "https://img.youtube.com/vi/xyz789ghi01/maxresdefault.jpg", game_id: id("game", 23), created_at: "2026-02-15T00:00:00+09:00", updated_at: "2026-02-15T00:00:00+09:00" },
  { id: id("video", 4), video_id: "jkl456mno78", title: "【選手インタビュー】マイケル・ジョンソン「横浜のファンが力になる」", published_at: "2026-02-12T18:00:00+09:00", thumbnail_url: "https://img.youtube.com/vi/jkl456mno78/maxresdefault.jpg", game_id: null, created_at: "2026-02-13T00:00:00+09:00", updated_at: "2026-02-13T00:00:00+09:00" },
  { id: id("video", 5), video_id: "pqr012stu34", title: "【ハイライト】横浜エクセレンス vs ヴェルカ鹿児島 GAME2｜2/8", published_at: "2026-02-08T23:30:00+09:00", thumbnail_url: "https://img.youtube.com/vi/pqr012stu34/maxresdefault.jpg", game_id: id("game", 22), created_at: "2026-02-09T00:00:00+09:00", updated_at: "2026-02-09T00:00:00+09:00" },
];

// ================================================
// AI試合寸評
// ================================================

export const mockGameComments: GameComment[] = [
  {
    id: id("gc", 25),
    game_id: id("game", 25),
    content: "横浜EXが東京EXに85-78で勝利。第1Qから主導権を握り、マイケル・ジョンソンが16得点11リバウンドのダブルダブルを記録。佐藤健太も18得点と好調で、チーム全体のシュート精度が高かった。第3Qに一度追い上げを許すも、第4Qに田中大輝のゲームメイクで突き放した。ホーム横浜武道館に2,700人が詰めかけ、今季最多観客数を更新した。",
    model: "gemini-2.0-flash",
    generated_at: "2026-02-21T23:30:00+09:00",
    created_at: "2026-02-21T23:30:00+09:00",
    updated_at: "2026-02-21T23:30:00+09:00",
  },
  {
    id: id("gc", 24),
    game_id: id("game", 24),
    content: "横浜EXがアウェイでバンビシャス奈良に91-84で勝利し、連敗を1で止めた。渡辺龍一が22得点と奮闘し、マイケル・ジョンソンが18得点10リバウンドのダブルダブル。前日の敗戦からディフェンスの強度を高め、第1Qから積極的にオフェンスを展開。終盤は奈良の追い上げにも冷静に対処し、チーム力で勝ち切った。",
    model: "gemini-2.0-flash",
    generated_at: "2026-02-15T23:30:00+09:00",
    created_at: "2026-02-15T23:30:00+09:00",
    updated_at: "2026-02-15T23:30:00+09:00",
  },
];

// ================================================
// マスコット
// ================================================

export const mockMascot: Mascot = {
  id: id("mascot", 1),
  name: "エクセル",
  profile_json: {
    birthday: "10月1日",
    personality: "元気で明るい、ファン思いの性格",
    skills: "ダンス、ハイタッチ、バスケットボール",
    favorites: "横浜のファン、バスケットボール、横浜のグルメ",
    height: "秘密",
    dream: "横浜エクセレンスをB1に昇格させること",
    description: "横浜エクセレンスの公式マスコットキャラクター。チームカラーのグリーンをまとい、ホームゲームでファンを盛り上げる人気者。",
  },
  images_json: [],
  created_at: "2025-10-01T00:00:00+09:00",
  updated_at: "2025-10-01T00:00:00+09:00",
};

// ================================================
// チームリーダー（部門別トップ選手）
// ================================================

export type TeamLeader = {
  category: string;
  player: Player;
  value: number;
  unit: string;
};

export const mockTeamLeaders: TeamLeader[] = [
  { category: "得点", player: mockPlayers[4], value: 18.5, unit: "PPG" },
  { category: "リバウンド", player: mockPlayers[4], value: 10.2, unit: "RPG" },
  { category: "アシスト", player: mockPlayers[0], value: 7.8, unit: "APG" },
];

// ================================================
// 選手シーズン平均スタッツ（各選手のダッシュボード表示用）
// ================================================

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
  topg: number;
  mpg: string;
  eff: number;
};

export const mockPlayerAverages: PlayerSeasonAverage[] = [
  { player_id: id("player", 1),  games_played: 25, ppg: 12.4, rpg: 3.2, apg: 7.8, fg_pct: 45.2, tp_pct: 35.8, ft_pct: 82.0, spg: 1.8, bpg: 0.1, topg: 2.8, mpg: "32:10", eff: 17.5 },
  { player_id: id("player", 2),  games_played: 25, ppg: 16.8, rpg: 4.5, apg: 2.3, fg_pct: 46.5, tp_pct: 38.2, ft_pct: 85.0, spg: 1.2, bpg: 0.2, topg: 1.5, mpg: "30:20", eff: 18.2 },
  { player_id: id("player", 3),  games_played: 25, ppg: 13.5, rpg: 6.2, apg: 2.8, fg_pct: 48.0, tp_pct: 33.5, ft_pct: 78.0, spg: 1.5, bpg: 0.8, topg: 1.8, mpg: "29:45", eff: 17.8 },
  { player_id: id("player", 4),  games_played: 25, ppg: 14.2, rpg: 7.8, apg: 1.5, fg_pct: 50.2, tp_pct: 30.0, ft_pct: 72.5, spg: 0.8, bpg: 1.2, topg: 1.2, mpg: "28:30", eff: 18.5 },
  { player_id: id("player", 5),  games_played: 25, ppg: 18.5, rpg: 10.2, apg: 1.8, fg_pct: 55.8, tp_pct: 0.0,  ft_pct: 68.5, spg: 0.5, bpg: 2.5, topg: 2.0, mpg: "27:15", eff: 24.2 },
  { player_id: id("player", 6),  games_played: 22, ppg: 5.2,  rpg: 1.5, apg: 4.5, fg_pct: 40.0, tp_pct: 32.0, ft_pct: 80.0, spg: 1.0, bpg: 0.0, topg: 1.8, mpg: "18:30", eff: 7.5 },
  { player_id: id("player", 7),  games_played: 24, ppg: 8.5,  rpg: 2.8, apg: 1.5, fg_pct: 42.5, tp_pct: 36.5, ft_pct: 88.0, spg: 0.8, bpg: 0.1, topg: 1.0, mpg: "22:10", eff: 9.8 },
  { player_id: id("player", 8),  games_played: 20, ppg: 6.2,  rpg: 3.5, apg: 1.8, fg_pct: 44.0, tp_pct: 30.5, ft_pct: 75.0, spg: 1.2, bpg: 0.5, topg: 1.2, mpg: "16:45", eff: 8.2 },
  { player_id: id("player", 9),  games_played: 25, ppg: 15.5, rpg: 8.5, apg: 1.2, fg_pct: 52.0, tp_pct: 28.0, ft_pct: 70.0, spg: 0.5, bpg: 1.8, topg: 1.5, mpg: "25:40", eff: 19.8 },
  { player_id: id("player", 10), games_played: 23, ppg: 4.8,  rpg: 5.2, apg: 0.8, fg_pct: 48.5, tp_pct: 0.0,  ft_pct: 65.0, spg: 0.3, bpg: 1.5, topg: 1.0, mpg: "15:20", eff: 7.8 },
  { player_id: id("player", 11), games_played: 18, ppg: 3.5,  rpg: 1.0, apg: 2.5, fg_pct: 38.0, tp_pct: 30.0, ft_pct: 85.0, spg: 0.5, bpg: 0.0, topg: 1.5, mpg: "12:00", eff: 4.2 },
  { player_id: id("player", 12), games_played: 15, ppg: 7.0,  rpg: 3.8, apg: 1.5, fg_pct: 43.0, tp_pct: 35.0, ft_pct: 78.0, spg: 1.0, bpg: 0.3, topg: 1.0, mpg: "18:00", eff: 9.0 },
  { player_id: id("player", 13), games_played: 25, ppg: 14.8, rpg: 7.2, apg: 1.0, fg_pct: 51.5, tp_pct: 25.0, ft_pct: 72.0, spg: 0.8, bpg: 1.5, topg: 1.8, mpg: "26:30", eff: 17.5 },
  { player_id: id("player", 14), games_played: 20, ppg: 6.5,  rpg: 2.0, apg: 1.2, fg_pct: 41.0, tp_pct: 37.0, ft_pct: 82.0, spg: 0.8, bpg: 0.1, topg: 0.8, mpg: "15:30", eff: 7.0 },
  { player_id: id("player", 15), games_played: 18, ppg: 5.8,  rpg: 4.0, apg: 0.8, fg_pct: 45.0, tp_pct: 28.0, ft_pct: 70.0, spg: 0.5, bpg: 0.5, topg: 0.8, mpg: "14:20", eff: 7.2 },
];
