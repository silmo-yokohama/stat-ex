-- ================================================
-- DEFAULT 0 のカラムに NOT NULL 制約を追加
-- 自動生成型で number | null → number にするための修正
-- ================================================

-- box_scores: スタッツ系カラム（DEFAULT 0 だが NOT NULL が未設定だった）
ALTER TABLE box_scores
  ALTER COLUMN pts SET NOT NULL,
  ALTER COLUMN fgm SET NOT NULL,
  ALTER COLUMN fga SET NOT NULL,
  ALTER COLUMN tpm SET NOT NULL,
  ALTER COLUMN tpa SET NOT NULL,
  ALTER COLUMN ftm SET NOT NULL,
  ALTER COLUMN fta SET NOT NULL,
  ALTER COLUMN or_reb SET NOT NULL,
  ALTER COLUMN dr_reb SET NOT NULL,
  ALTER COLUMN reb SET NOT NULL,
  ALTER COLUMN ast SET NOT NULL,
  ALTER COLUMN tov SET NOT NULL,
  ALTER COLUMN stl SET NOT NULL,
  ALTER COLUMN blk SET NOT NULL,
  ALTER COLUMN fouls SET NOT NULL,
  ALTER COLUMN eff SET NOT NULL,
  ALTER COLUMN plus_minus SET NOT NULL;

-- team_stats: 勝敗・H/A成績（DEFAULT 0 だが NOT NULL が未設定だった）
ALTER TABLE team_stats
  ALTER COLUMN home_wins SET NOT NULL,
  ALTER COLUMN home_losses SET NOT NULL,
  ALTER COLUMN away_wins SET NOT NULL,
  ALTER COLUMN away_losses SET NOT NULL;

-- standings: 勝敗（DEFAULT 0 だが NOT NULL が未設定だった）
-- wins/losses は既に NOT NULL

-- h2h_records: 勝敗（DEFAULT 0 だが NOT NULL が未設定だった）
-- wins/losses は既に NOT NULL
