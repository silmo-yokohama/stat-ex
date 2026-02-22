-- ================================================
-- STAT-EX RLS（Row Level Security）設定
--
-- 方針:
--   - 全テーブルで匿名ユーザー（anon）にSELECTを許可
--   - 書き込みはバッチ処理（service_role_key）のみ
-- ================================================

-- 全テーブルでRLSを有効化
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE h2h_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mascot ENABLE ROW LEVEL SECURITY;

-- 全テーブルに匿名ユーザーのSELECTポリシーを作成
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
      'CREATE POLICY "公開読み取り: %s" ON %s FOR SELECT TO anon USING (true)',
      t, t
    );
  END LOOP;
END $$;
