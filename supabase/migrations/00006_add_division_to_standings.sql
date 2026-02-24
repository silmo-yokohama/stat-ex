-- standings テーブルに地区カラムを追加（東地区/西地区）
ALTER TABLE standings ADD COLUMN IF NOT EXISTS division TEXT;
