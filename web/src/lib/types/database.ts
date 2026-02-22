/**
 * STAT-EX データベース型定義
 *
 * Supabase接続後は `supabase gen types typescript` で自動生成した型に置き換える。
 * それまでの開発用に手動で定義した暫定型。
 */

// ================================================
// 共通
// ================================================

/** 全テーブル共通のメタカラム */
type BaseRecord = {
  id: string;
  created_at: string;
  updated_at: string;
};

// ================================================
// マスタ系
// ================================================

/** シーズン */
export type Season = BaseRecord & {
  year: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
};

/** チーム */
export type Team = BaseRecord & {
  bleague_team_id: number;
  name: string;
  short_name: string;
  arena: string | null;
  city: string | null;
};

/** 選手 */
export type Player = BaseRecord & {
  bleague_player_id: string;
  sportsnavi_player_id: string | null;
  name: string;
  name_en: string | null;
  number: number | null;
  position: "PG" | "SG" | "SF" | "PF" | "C" | null;
  height: number | null;
  weight: number | null;
  birthdate: string | null;
  birthplace: string | null;
  image_url: string | null;
};

/** 選手のシーズン在籍情報 */
export type PlayerSeason = BaseRecord & {
  player_id: string;
  season_id: string;
  is_active: boolean;
  joined_date: string | null;
  left_date: string | null;
};

// ================================================
// 試合系
// ================================================

/** 試合ステータス */
export type GameStatus = "SCHEDULED" | "LIVE" | "FINAL";

/** ホーム/アウェイ */
export type HomeAway = "HOME" | "AWAY";

/** 試合 */
export type Game = BaseRecord & {
  schedule_key: string;
  season_id: string;
  game_date: string;
  game_time: string | null;
  opponent_team_id: string;
  home_away: HomeAway;
  score_home: number | null;
  score_away: number | null;
  q1_home: number | null;
  q1_away: number | null;
  q2_home: number | null;
  q2_away: number | null;
  q3_home: number | null;
  q3_away: number | null;
  q4_home: number | null;
  q4_away: number | null;
  status: GameStatus;
  venue: string | null;
  attendance: number | null;
  referee: string | null;
  sportsnavi_game_id: string | null;
};

/** ボックススコア */
export type BoxScore = BaseRecord & {
  game_id: string;
  player_id: string;
  team_side: "home" | "away";
  is_starter: boolean;
  minutes: string | null;
  pts: number;
  fgm: number;
  fga: number;
  fg_pct: number | null;
  tpm: number;
  tpa: number;
  tp_pct: number | null;
  ftm: number;
  fta: number;
  ft_pct: number | null;
  or_reb: number;
  dr_reb: number;
  reb: number;
  ast: number;
  tov: number;
  stl: number;
  blk: number;
  fouls: number;
  eff: number;
  plus_minus: number;
};

// ================================================
// チーム成績系
// ================================================

/** チーム成績 */
export type TeamStats = BaseRecord & {
  season_id: string;
  wins: number;
  losses: number;
  win_pct: number | null;
  avg_points_for: number | null;
  avg_points_against: number | null;
  home_wins: number;
  home_losses: number;
  away_wins: number;
  away_losses: number;
};

/** B2順位表 */
export type Standing = BaseRecord & {
  season_id: string;
  team_id: string;
  rank: number;
  wins: number;
  losses: number;
  win_pct: number | null;
  games_behind: number | null;
  points_for: number | null;
  points_against: number | null;
  point_diff: number | null;
  streak: string | null;
  last5: string | null;
};

/** 対戦成績 */
export type H2HRecord = BaseRecord & {
  season_id: string;
  opponent_team_id: string;
  wins: number;
  losses: number;
  avg_points_for: number | null;
  avg_points_against: number | null;
};

/** インジュアリー */
export type Injury = BaseRecord & {
  player_id: string;
  reason: string;
  registered_date: string;
};

// ================================================
// コンテンツ系
// ================================================

/** ニュースソース */
export type NewsSource = "official" | "media";

/** ニュース */
export type News = BaseRecord & {
  source: NewsSource;
  title: string;
  url: string;
  published_at: string;
  thumbnail_url: string | null;
  source_name: string | null;
};

/** YouTube動画 */
export type Video = BaseRecord & {
  video_id: string;
  title: string;
  published_at: string;
  thumbnail_url: string | null;
  game_id: string | null;
};

/** AI試合寸評 */
export type GameComment = BaseRecord & {
  game_id: string;
  content: string;
  model: string;
  generated_at: string;
};

/** マスコット */
export type Mascot = BaseRecord & {
  name: string;
  profile_json: Record<string, unknown> | null;
  images_json: string[] | null;
};

// ================================================
// リレーション付きの結合型（フロントエンドで使う）
// ================================================

/** 試合 + 対戦相手チーム情報 */
export type GameWithOpponent = Game & {
  opponent: Team;
};

/** 試合詳細（ボックススコア + 寸評 + 動画込み） */
export type GameDetail = Game & {
  opponent: Team;
  box_scores: (BoxScore & { player: Player })[];
  comment: GameComment | null;
  video: Video | null;
};

/** 選手 + シーズン在籍情報 */
export type PlayerWithSeason = Player & {
  player_seasons: PlayerSeason[];
};
