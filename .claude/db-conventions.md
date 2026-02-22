# STAT-EX データベース設計規約

## 基本方針

- Supabase（PostgreSQL）を使用する
- フロントエンドからは **READ ONLY** アクセスのみ（RLS で制御）
- データ書き込みは **バッチ処理（service_role_key）** のみ
- 2025-26シーズン（B2昇格）以降のデータを蓄積する

---

## 命名規則

### テーブル名

- **snake_case** + **複数形**
- 例: `games`, `box_scores`, `player_seasons`

### カラム名

- **snake_case**
- バスケットボールスタッツの略称はそのまま使用可: `pts`, `fg_pct`, `ast`, `eff`
- 外部キーは `{テーブル名単数}_id` 形式: `game_id`, `player_id`, `season_id`
- 真偽値は `is_` プレフィックス: `is_active`, `is_starter`
- 日時は `_at` サフィックス: `created_at`, `updated_at`, `published_at`
- 日付は `_date` サフィックス: `joined_date`, `left_date`

### インデックス名

- `idx_{テーブル名}_{カラム名}` 形式
- 例: `idx_games_schedule_key`, `idx_box_scores_game_id`

---

## 主要テーブル一覧

### マスタ系

| テーブル | 説明 | 主要カラム |
|---------|------|-----------|
| `seasons` | シーズンマスタ | id, year, name, start_date, end_date |
| `players` | 選手マスタ | id, bleague_player_id, sportsnavi_player_id, name, number, position, height, weight, birthdate, birthplace, image_url |
| `teams` | B2全チーム | id, bleague_team_id, name, short_name, arena, city |
| `mascot` | マスコット情報 | id, name, profile_json, images_json |

### 試合系

| テーブル | 説明 | 主要カラム |
|---------|------|-----------|
| `games` | 試合データ | id, schedule_key, season_id, game_date, opponent_team_id, home_away, score_home, score_away, q1〜q4スコア, status, venue, attendance, referee |
| `box_scores` | ボックススコア | id, game_id, player_id, team_side(home/away), is_starter, minutes, pts, fgm, fga, fg_pct, ... eff, plus_minus |
| `game_comments` | AI試合寸評 | id, game_id, content, model, generated_at |

### 選手系

| テーブル | 説明 | 主要カラム |
|---------|------|-----------|
| `player_seasons` | 選手のシーズン在籍情報 | id, player_id, season_id, is_active, joined_date, left_date |

### チーム系

| テーブル | 説明 | 主要カラム |
|---------|------|-----------|
| `team_stats` | チーム成績（シーズン単位） | id, season_id, wins, losses, win_pct, avg_points_for, avg_points_against, ... |
| `standings` | B2順位表 | id, season_id, team_id, rank, wins, losses, win_pct, games_behind, ... |
| `h2h_records` | 対戦成績 | id, season_id, opponent_team_id, wins, losses, avg_points_for, avg_points_against |
| `injuries` | インジュアリーリスト | id, player_id, reason, registered_date |

### コンテンツ系

| テーブル | 説明 | 主要カラム |
|---------|------|-----------|
| `news` | ニュース記事 | id, source(official/media), title, url, published_at, thumbnail_url |
| `videos` | YouTube動画 | id, video_id, title, published_at, thumbnail_url, game_id(nullable) |

---

## 共通カラム

全テーブルに以下のカラムを含める:

- `id` - UUID（主キー、Supabase デフォルト）
- `created_at` - timestamptz（レコード作成日時、デフォルト now()）
- `updated_at` - timestamptz（レコード更新日時）

---

## リレーション設計

### 主要な外部キー

- `games.season_id` → `seasons.id`
- `games.opponent_team_id` → `teams.id`
- `box_scores.game_id` → `games.id`
- `box_scores.player_id` → `players.id`
- `player_seasons.player_id` → `players.id`
- `player_seasons.season_id` → `seasons.id`
- `standings.season_id` → `seasons.id`
- `standings.team_id` → `teams.id`
- `game_comments.game_id` → `games.id`（1:1）
- `videos.game_id` → `games.id`（nullable、マッチングできない動画もある）

### 外部IDの管理

- B.LEAGUE公式のID: `bleague_player_id`, `schedule_key` 等
- スポナビのID: `sportsnavi_player_id`, `sportsnavi_game_id` 等
- 両ソースのIDは別カラムで保持し、マッピングを可能にする

---

## RLS（Row Level Security）方針

### 読み取り（SELECT）

- 全テーブルで匿名ユーザー（anon）に SELECT を許可する
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` でフロントエンドからアクセス

### 書き込み（INSERT / UPDATE / DELETE）

- 全テーブルで匿名ユーザーの書き込みを禁止する
- バッチ処理は `SUPABASE_SERVICE_ROLE_KEY` を使用（RLSバイパス）

---

## データ蓄積ルール

### 移籍選手の扱い

- 移籍した選手のデータは**永続的に保持**する
- `player_seasons` テーブルで在籍期間を管理する
  - `is_active = false`, `left_date` を設定
- 選手詳細ページは移籍後も永続的にアクセス可能
- 横浜EX在籍時のスタッツのみ表示（他チームでの成績は追わない）

### シーズン管理

- `seasons` テーブルでシーズンを管理
- 来シーズン以降も継続蓄積。シーズンごとにデータを区分する
- 2024-25以前のデータはB3所属のため存在しない

### 重複防止

- `games` テーブル: `schedule_key` でユニーク制約
- `box_scores` テーブル: `game_id` + `player_id` でユニーク制約
- `news` テーブル: `url` でユニーク制約
- `videos` テーブル: `video_id` でユニーク制約

---

## マイグレーション

- `supabase/` ディレクトリにマイグレーションファイルを配置する
- Supabase CLI（`supabase migration`）を使用する
- 型定義は `supabase gen types typescript` で自動生成し、フロントエンドで使用する

---

## パフォーマンス考慮

### インデックス

- `games.schedule_key`（試合詳細ページのルーティング）
- `games.season_id` + `games.game_date`（試合一覧のソート・フィルター）
- `box_scores.game_id`（試合詳細のボックススコア取得）
- `box_scores.player_id`（選手詳細の試合別ログ取得）
- `player_seasons.player_id` + `player_seasons.season_id`
- `news.published_at`（ニュースの新着順表示）
- `standings.season_id`（順位表表示）

### データ量の見込み

- B2の試合数: 年間約60試合（横浜EX分）
- 選手数: ロスター約15名 + 移籍選手
- ボックススコア: 約60試合 × 約25名（両チーム）= 約1,500行/シーズン
- Supabase無料枠で十分対応可能
