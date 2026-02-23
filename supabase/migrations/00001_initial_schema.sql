-- ================================================
-- STAT-EX 初期スキーマ
-- 横浜エクセレンス 情報ダッシュボード
-- ================================================

-- PostgreSQL 13+ 標準の gen_random_uuid() を使用（uuid-ossp 拡張は不要）

-- ================================================
-- シーズンマスタ
-- ================================================
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE,           -- シーズン開始年（例: 2025 = 2025-26シーズン）
  name TEXT NOT NULL,                     -- 表示名（例: "2025-26"）
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================
-- B2全チーム
-- ================================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bleague_team_id INTEGER NOT NULL UNIQUE,  -- B.LEAGUE公式のTeamID
  name TEXT NOT NULL,                       -- チーム名（例: "横浜エクセレンス"）
  short_name TEXT NOT NULL,                 -- 略称（例: "横浜EX"）
  arena TEXT,                               -- ホームアリーナ名
  city TEXT,                                -- ホームタウン
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================
-- 選手マスタ
-- ================================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bleague_player_id TEXT NOT NULL UNIQUE,     -- B.LEAGUE公式のPlayerID
  sportsnavi_player_id TEXT,                  -- スポナビのPlayerID（マッピング用）
  name TEXT NOT NULL,                         -- 選手名
  name_en TEXT,                               -- 英語名
  number INTEGER,                             -- 背番号
  position TEXT,                              -- ポジション（PG/SG/SF/PF/C）
  height INTEGER,                             -- 身長（cm）
  weight INTEGER,                             -- 体重（kg）
  birthdate DATE,                             -- 生年月日
  birthplace TEXT,                            -- 出身地
  image_url TEXT,                             -- 選手画像URL（スポナビから取得）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================
-- 選手のシーズン在籍情報
-- 移籍した選手もデータを永続保持するための中間テーブル
-- ================================================
CREATE TABLE player_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,   -- 現在ロスターに在籍中か
  joined_date DATE,                          -- 加入日
  left_date DATE,                            -- 退団日（移籍時に設定）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, season_id)
);

-- ================================================
-- 試合データ
-- ================================================
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_key TEXT NOT NULL UNIQUE,          -- B.LEAGUE公式のScheduleKey（ルーティング用）
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  game_date DATE NOT NULL,                    -- 試合日
  game_time TIME,                             -- 試合開始時刻
  opponent_team_id UUID NOT NULL REFERENCES teams(id),
  home_away TEXT NOT NULL CHECK (home_away IN ('HOME', 'AWAY')),
  -- スコア（試合前はNULL）
  score_home INTEGER,
  score_away INTEGER,
  q1_home INTEGER,
  q1_away INTEGER,
  q2_home INTEGER,
  q2_away INTEGER,
  q3_home INTEGER,
  q3_away INTEGER,
  q4_home INTEGER,
  q4_away INTEGER,
  -- 試合ステータス
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'LIVE', 'FINAL')),
  -- 試合情報
  venue TEXT,                                 -- 会場名
  attendance INTEGER,                         -- 観客数
  referee TEXT,                               -- 審判名
  -- メタ
  sportsnavi_game_id TEXT,                    -- スポナビのgameID（マッピング用）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================
-- ボックススコア
-- 1試合の全選手スタッツ（両チーム）
-- ================================================
CREATE TABLE box_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_side TEXT NOT NULL CHECK (team_side IN ('home', 'away')),
  is_starter BOOLEAN NOT NULL DEFAULT false,
  -- 出場時間
  minutes TEXT,                               -- 出場時間（"32:15"形式）
  -- 基本スタッツ
  pts INTEGER DEFAULT 0,                      -- 得点
  fgm INTEGER DEFAULT 0,                      -- フィールドゴール成功
  fga INTEGER DEFAULT 0,                      -- フィールドゴール試投
  fg_pct NUMERIC(5,3),                        -- FG%
  tpm INTEGER DEFAULT 0,                      -- 3ポイント成功
  tpa INTEGER DEFAULT 0,                      -- 3ポイント試投
  tp_pct NUMERIC(5,3),                        -- 3P%
  ftm INTEGER DEFAULT 0,                      -- フリースロー成功
  fta INTEGER DEFAULT 0,                      -- フリースロー試投
  ft_pct NUMERIC(5,3),                        -- FT%
  -- リバウンド
  or_reb INTEGER DEFAULT 0,                   -- オフェンスリバウンド
  dr_reb INTEGER DEFAULT 0,                   -- ディフェンスリバウンド
  reb INTEGER DEFAULT 0,                      -- トータルリバウンド
  -- その他
  ast INTEGER DEFAULT 0,                      -- アシスト
  tov INTEGER DEFAULT 0,                      -- ターンオーバー
  stl INTEGER DEFAULT 0,                      -- スティール
  blk INTEGER DEFAULT 0,                      -- ブロック
  fouls INTEGER DEFAULT 0,                    -- ファウル
  -- アドバンスド
  eff INTEGER DEFAULT 0,                      -- 効率（EFF）
  plus_minus INTEGER DEFAULT 0,               -- +/-
  -- メタ
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, player_id)
);

-- ================================================
-- チーム成績（シーズン単位）
-- ================================================
CREATE TABLE team_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  win_pct NUMERIC(4,3),                       -- 勝率
  avg_points_for NUMERIC(5,1),                -- 平均得点
  avg_points_against NUMERIC(5,1),            -- 平均失点
  -- H/A成績
  home_wins INTEGER DEFAULT 0,
  home_losses INTEGER DEFAULT 0,
  away_wins INTEGER DEFAULT 0,
  away_losses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id)
);

-- ================================================
-- B2順位表
-- ================================================
CREATE TABLE standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  win_pct NUMERIC(4,3),
  games_behind NUMERIC(4,1),                  -- ゲーム差
  points_for NUMERIC(5,1),                    -- 平均得点
  points_against NUMERIC(5,1),                -- 平均失点
  point_diff NUMERIC(5,1),                    -- 得失点差
  streak TEXT,                                -- 連勝/連敗（例: "W3", "L2"）
  last5 TEXT,                                 -- 直近5試合（例: "4-1"）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, team_id)
);

-- ================================================
-- 対戦成績（H2H）
-- ================================================
CREATE TABLE h2h_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  opponent_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  avg_points_for NUMERIC(5,1),
  avg_points_against NUMERIC(5,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, opponent_team_id)
);

-- ================================================
-- インジュアリーリスト
-- ================================================
CREATE TABLE injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,                       -- 公示事由
  registered_date DATE NOT NULL,              -- 登録日
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================
-- ニュース記事
-- ================================================
CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('official', 'media')),  -- official=公式HP, media=Google News
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  published_at TIMESTAMPTZ NOT NULL,
  thumbnail_url TEXT,                         -- 公式HPのみ（enclosure）
  source_name TEXT,                           -- メディア名（Google Newsのみ）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================
-- YouTube動画
-- ================================================
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL UNIQUE,              -- YouTubeのvideoId
  title TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  thumbnail_url TEXT,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,  -- 試合マッチング（nullable）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================
-- AI試合寸評
-- ================================================
CREATE TABLE game_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,  -- 1試合1寸評
  content TEXT NOT NULL,                      -- 寸評テキスト（200〜300字）
  model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',  -- 使用したAIモデル
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================
-- マスコット情報
-- ================================================
CREATE TABLE mascot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  profile_json JSONB,                         -- プロフィール情報（柔軟なJSON）
  images_json JSONB,                          -- 画像URLリスト
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================
-- インデックス
-- ================================================
CREATE INDEX idx_games_schedule_key ON games(schedule_key);
CREATE INDEX idx_games_season_date ON games(season_id, game_date);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_box_scores_game_id ON box_scores(game_id);
CREATE INDEX idx_box_scores_player_id ON box_scores(player_id);
CREATE INDEX idx_player_seasons_player ON player_seasons(player_id, season_id);
CREATE INDEX idx_news_published ON news(published_at DESC);
CREATE INDEX idx_news_source ON news(source);
CREATE INDEX idx_standings_season ON standings(season_id);
CREATE INDEX idx_videos_game ON videos(game_id);

-- ================================================
-- updated_at 自動更新トリガー
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 全テーブルにトリガーを適用
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'seasons', 'teams', 'players', 'player_seasons', 'games',
      'box_scores', 'team_stats', 'standings', 'h2h_records',
      'injuries', 'news', 'videos', 'game_comments', 'mascot'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END $$;
