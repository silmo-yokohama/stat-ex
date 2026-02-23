-- ================================================
-- B2 2025-26シーズン チームデータ修正
-- ================================================
-- シードデータはB3時代（2024-25）のチームIDだったため、
-- 実際のB2 2025-26シーズンのチームIDに修正する。
--
-- 変更概要:
--   削除: 千葉(696), 越谷(717), さいたま(723), 岡山(726), 東京EX(727)
--   更新: 福島(698→711), 山形(682→710), 岩手(708→709), 青森(695→708),
--          愛媛(718→723), 熊本(697→724), 奈良(720→719)
--   追加: 信州(716), 福井(2891), 神戸(718), 福岡(753), 静岡(1637)
--
-- 注意: bleague_team_id は UNIQUE のため、更新順序が重要

-- ================================================
-- ステップ1: B2に存在しないチームを削除
-- ================================================
-- CASCADE で standings, h2h_records が自動削除される
-- games は CASCADE なしだが、現時点では試合データなし

DELETE FROM standings WHERE team_id IN (
  SELECT id FROM teams WHERE bleague_team_id IN (696, 717, 723, 726, 727)
);
DELETE FROM h2h_records WHERE opponent_team_id IN (
  SELECT id FROM teams WHERE bleague_team_id IN (696, 717, 723, 726, 727)
);
DELETE FROM teams WHERE bleague_team_id IN (696, 717, 723, 726, 727);

-- ================================================
-- ステップ2: 既存チームの bleague_team_id を修正
-- ================================================
-- UNIQUE制約があるため、競合しない順序で実行する

-- 岩手: 708 → 709（先に実行。708は後で青森が使う）
UPDATE teams SET bleague_team_id = 709 WHERE bleague_team_id = 708;

-- 青森: 695 → 708（岩手が709に移動したので安全）
UPDATE teams SET bleague_team_id = 708 WHERE bleague_team_id = 695;

-- 愛媛: 718 → 723（さいたま(723)は削除済みなので安全。718は後で神戸が使う）
UPDATE teams SET bleague_team_id = 723 WHERE bleague_team_id = 718;

-- 残りは競合なし
UPDATE teams SET bleague_team_id = 711 WHERE bleague_team_id = 698;  -- 福島
UPDATE teams SET bleague_team_id = 710 WHERE bleague_team_id = 682;  -- 山形
UPDATE teams SET bleague_team_id = 724 WHERE bleague_team_id = 697;  -- 熊本
UPDATE teams SET bleague_team_id = 719 WHERE bleague_team_id = 720;  -- 奈良

-- ================================================
-- ステップ3: 新規B2チームを追加
-- ================================================
INSERT INTO teams (bleague_team_id, name, short_name) VALUES
  (716,  '信州ブレイブウォリアーズ', '信州'),
  (2891, '福井ブローウィンズ', '福井'),
  (718,  '神戸ストークス', '神戸'),
  (753,  'ライジングゼファーフクオカ', '福岡'),
  (1637, 'ベルテックス静岡', '静岡');
