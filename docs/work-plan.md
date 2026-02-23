# STAT-EX 作業計画書

> 作成日: 2026-02-23
> プロジェクト: STAT-EX（横浜エクセレンス 情報ダッシュボード）
> コンセプト: 「5クリックかかる情報を1クリックで」
> 目標: B.LEAGUEシーズン中（2026年4月末まで）にリリース
> 残り期間: 約2ヶ月
> 公開URL: https://stat-ex.vercel.app/（モックデータで公開中）

---

## 進捗サマリー

プロジェクト全体の完成度: **約60%**

| カテゴリ | 完成度 | 状況 |
|---------|--------|------|
| 要件定義・設計ドキュメント | 100% | 全5ファイル完成 |
| DB設計（スキーマ・RLS） | 100% | 14テーブル定義済み、マイグレーション未適用 |
| フロントエンドUI | 90% | 全8ページ＋11チャート完成（モックデータ動作） |
| スクレイパー（データ取得） | 95% | 全4モジュール完成 |
| スクレイパー（DB格納） | 20% | 3/14テーブルのみ実装 |
| フロントエンド × Supabase接続 | 0% | 全26関数がモック参照のまま |
| リアルタイム更新 | 0% | 未着手 |
| テスト | 30% | ユニットテスト4ファイル、E2Eはスケルトン |
| SEO・デプロイ | 80% | OGP/favicon完了、Vercel公開済み、GA4未設定 |

### 残りの主要作業

1. **データパイプラインの接続**（Supabase適用 → スクレイパー格納完成 → フロントエンドDB接続）
2. **リアルタイム更新機能**（試合中30秒間隔のライブ更新）
3. **仕上げ**（GA4、E2Eテスト、パフォーマンス最適化）

---

## Phase 0: 要件定義・設計 [Done]

### T0-1: 要件定義書の作成 [Done]
- **概要**: 全機能要件・非機能要件・スケジュールを定義（589行）
- **成果物**: `requirements.md`

### T0-2: 設計ドキュメント群の作成 [Done]
- **概要**: データソース仕様、DB設計規約、デザインガイドを策定
- **成果物**: `.claude/data-sources.md`, `.claude/db-conventions.md`, `.claude/design-guide.md`

---

## Phase 1: DB設計 + スクレイピング [部分Done]

### T1-1: Supabaseスキーマ設計 [Done]
- **概要**: 14テーブル + インデックス + 自動更新トリガーを定義
- **成果物**: `supabase/migrations/00001_initial_schema.sql`
- **テーブル**: seasons, teams, players, player_seasons, games, box_scores, team_stats, standings, h2h_records, injuries, news, videos, game_comments, mascot

### T1-2: RLSポリシー設計 [Done]
- **概要**: 全テーブルにRLS有効化、anon→SELECT許可、書き込み禁止
- **成果物**: `supabase/migrations/00002_rls_policies.sql`

### T1-3: シードデータ作成 [Done]
- **概要**: 2025-26シーズンマスタ + B2全14チームマスタ
- **成果物**: `supabase/seed/initial_data.sql`

### T1-4: Supabaseマイグレーション適用 [Todo]
- **概要**: Supabaseプロジェクト（作成済み）にスキーマ・RLS・シードを適用
- **依存**: なし
- **作業内容**:
  1. Supabase Dashboard の SQL Editor で `00001_initial_schema.sql` を実行
  2. `00002_rls_policies.sql` を実行
  3. `initial_data.sql` でシードデータ投入
  4. Dashboard でテーブル・RLS・シードの反映を確認
  5. `web/.env.local` に `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定
  6. GitHub Secrets に `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` を設定
- **注意**: 環境変数は絶対にコミットしないこと

### T1-5: スクレイパー -- データ取得ロジック [Done]
- **概要**: 全4モジュールのデータ取得が完成
- **成果物**:
  - `scraper/src/sources/bleague.py`（5関数: schedule, box_score, standings, player_stats, team_stats）
  - `scraper/src/sources/sportsnavi.py`（4関数: h2h, injuries, team_leaders, player_image）
  - `scraper/src/sources/rss.py`（3関数: google_news, official_news, youtube_videos）
  - `scraper/src/sources/gemini.py`（1関数: generate_game_comment）
  - `scraper/src/utils/http.py`, `scraper/src/utils/output.py`

### T1-6: スクレイパー -- Supabase格納処理の完成 [Todo]
- **概要**: `main.py` の格納ロジックを全テーブル対応に拡張。現在 standings/news/videos の3テーブルのみ実装済み
- **変更ファイル**: `scraper/src/main.py`
- **依存**: T1-4
- **作業内容**:
  1. **games**: `fetch_schedule` → games テーブルに upsert（on_conflict: `schedule_key`）
  2. **players**: ボックススコアの player_id で upsert + プロフィール・画像URL（on_conflict: `bleague_player_id`）
  3. **player_seasons**: ボックススコア出現選手を登録（on_conflict: `player_id, season_id`）
  4. **box_scores**: home/away の全選手スタッツ格納（on_conflict: `game_id, player_id`）
  5. **game_comments**: AI寸評格納（on_conflict: `game_id`）
  6. **team_stats**: チーム成績の更新（on_conflict: `season_id`）
  7. **h2h_records**: 対戦成績格納（on_conflict: `season_id, opponent_team_id`）
  8. **injuries**: 全件置き換え（DELETE + INSERT）
- **注意**:
  - teams/players の UUID 引き当て用マッピングを起動時にキャッシュ
  - エラー時もプロセスを落とさず `errors` に追加して続行

### T1-7: 選手データの自動登録/更新ロジック [Todo]
- **概要**: ロスター同期 — 新加入選手の自動登録、移籍選手の is_active 更新
- **変更ファイル**: `scraper/src/sources/bleague.py`（`fetch_roster` 追加）, `scraper/src/main.py`
- **依存**: T1-4, T1-6
- **作業内容**:
  1. `bleague.py` に `fetch_roster()` 追加（B.LEAGUE `/club_detail/?TeamID=714` からロスター取得）
  2. `main.py` にロスター同期ステップ追加
  3. DBの `player_seasons(is_active=true)` と比較して差分処理
  4. `sportsnavi.fetch_player_image()` で選手画像URLを取得・更新

### T1-8: スクレイパーテスト [Done]
- **概要**: パースロジックのユニットテスト
- **成果物**: `scraper/tests/test_bleague.py`, `test_rss.py`, `test_utils.py`

### T1-9: GitHub Actions ワークフロー [Done]
- **概要**: CI（ci.yml）とバッチ実行（scrape.yml、毎日22:00 JST）が定義済み
- **成果物**: `.github/workflows/ci.yml`, `.github/workflows/scrape.yml`

---

## Phase 2: フロントエンド開発 [部分Done]

### T2-1: 全8ページ実装（モックデータ） [Done]
- **概要**: 全ページが Server Component ベースで完成。モックデータで完全動作
- **成果物**:
  - `web/src/app/page.tsx`（トップ/ダッシュボード）
  - `web/src/app/games/page.tsx`（試合一覧）
  - `web/src/app/games/[scheduleKey]/page.tsx`（試合詳細）
  - `web/src/app/players/page.tsx`（選手一覧）
  - `web/src/app/players/[playerId]/page.tsx`（選手詳細）
  - `web/src/app/team/page.tsx`（チーム成績）
  - `web/src/app/team/standings/page.tsx`（B2順位表）
  - `web/src/app/mascot/page.tsx`（マスコット紹介）

### T2-2: チャートコンポーネント [Done]
- **概要**: 11種類のRechartsコンポーネント
- **成果物**: `web/src/components/charts/` 配下（ScoreTrend, PennantRace, HomeAwayDonut, Quarter, QuarterRadar, PlayerScatter, CumulativeWins, MonthlyRecord, SeasonRecord, ScoreFlow, GameLog, PlayerRadar）

### T2-3: UIコンポーネント・レイアウト [Done]
- **概要**: shadcn/ui（9種類）+ Header/Footer/NavigationProgress/PageTransition/HamburgerMenu

### T2-4: 型定義 [Done]
- **概要**: 19型、Supabaseスキーマと完全一致する暫定手動型
- **成果物**: `web/src/lib/types/database.ts`

### T2-5: モックデータ [Done]
- **概要**: 461行、14種のモックデータ（リアルなサンプルデータ）
- **成果物**: `web/src/lib/mock-data.ts`

### T2-6: データ取得関数群 [Done]
- **概要**: 全26関数（全て async）
- **成果物**: `web/src/lib/data/`（games.ts: 10関数, players.ts: 5関数, team.ts: 7関数, content.ts: 3関数, pennant-race.ts: 1関数）

### T2-7: Supabaseクライアント準備 [Done]
- **成果物**: `web/src/lib/supabase/server.ts`, `web/src/lib/supabase/client.ts`

### T2-8: フロントエンドのSupabase接続（モック→実DB切替） [Todo]
- **概要**: `lib/data/` の全26関数をモック参照から Supabase クエリに置き換え。ページコンポーネントは変更不要
- **変更ファイル**:
  - `web/src/lib/data/games.ts`（10関数）
  - `web/src/lib/data/players.ts`（5関数）
  - `web/src/lib/data/team.ts`（7関数）
  - `web/src/lib/data/content.ts`（3関数）
  - `web/src/lib/data/pennant-race.ts`（変更不要、入力形式が同じ）
- **依存**: T1-4, T1-6（DBにデータが入った状態が前提）
- **実装ポイント**:
  - **games.ts**: JOINクエリ `games.select('*, opponent:teams!opponent_team_id(*)')` でGameWithOpponentを取得。フィルタはSupabaseクエリビルダで組み立て
  - **players.ts**: `getPlayerAverage` / `getAllPlayerAverages` は box_scores からの集計が必要。データ量が小さい（60試合×12選手=720行）のでクライアント側集計で十分
  - **team.ts**: `getTeamLeaders` は box_scores のAVG集計から算出。`getMonthlyRecord` / `getQuarterTrend` は games テーブルから直接算出
  - **content.ts**: 単純な SELECT + フィルタ + ソート
- **注意**: エラーハンドリングを全関数に追加（モック時代は常に成功だったが、DB接続はエラーの可能性あり）

### T2-9: Supabase型定義の自動生成 [Todo]
- **概要**: `supabase gen types typescript` でベース型を自動生成し、暫定型を置き換え
- **変更ファイル**: `web/src/lib/types/database.ts`（ベース型を差し替え、リレーション型は維持）
- **依存**: T1-4

---

## Phase 3: リアルタイム更新 + YouTube連携 + AI寸評 [Todo]

### T3-1: リアルタイム更新API Route [Todo]
- **概要**: 試合中にB.LEAGUE `game_detail` を直接取得してクライアントに返すAPI Route。DBには書き込まない
- **新規ファイル**: `web/src/app/api/live/[scheduleKey]/route.ts`
- **依存**: なし（独立して実装可能）
- **作業内容**:
  1. `GET /api/live/[scheduleKey]` を実装
  2. B.LEAGUE HTML内のJSオブジェクトからデータ抽出（スクレイパーのロジックのTS版）
  3. クォーター別スコア + ボックススコアをJSON返却
  4. Cache-Control: max-age=10 でキャッシュ
- **注意**: Vercel無料枠のタイムアウト10秒以内に収めること

### T3-2: 試合詳細ページのライブモード [Todo]
- **概要**: 試合中に30秒間隔自動更新するクライアントコンポーネント
- **新規ファイル**: `web/src/components/games/LiveScoreboard.tsx`（"use client"）
- **変更ファイル**: `web/src/app/games/[scheduleKey]/page.tsx`
- **依存**: T3-1
- **作業内容**:
  1. `setInterval(30000)` によるポーリング
  2. `visibilitychange` で非アクティブタブ時に停止
  3. 手動更新ボタン + 最終更新日時表示
  4. `game.status === "LIVE"` 時のみ LiveScoreboard をレンダリング

### T3-3: YouTube動画と試合のマッチング [Todo]
- **概要**: 動画タイトルから対戦相手名+日付を解析し、試合に紐付け
- **変更ファイル**: `scraper/src/main.py`（格納処理内）
- **依存**: T1-6
- **作業内容**:
  1. タイトルから対戦相手名を抽出
  2. games テーブルの opponent + game_date（±3日）で候補検索
  3. マッチ時は videos.game_id にセット、不一致時は NULL のまま

### T3-4: AI寸評の動作確認・プロンプト調整 [Todo]
- **概要**: 実データで `generate_game_comment()` を動作確認し、出力品質を調整
- **変更ファイル**: `scraper/src/sources/gemini.py`
- **依存**: T1-4, T1-6

---

## Phase 4: SEO + OGP + アナリティクス [部分Done]

### T4-1: SEO/メタデータ [Done]
- **概要**: OGP, Twitter Card, robots, favicon, apple-icon, opengraph-image を設定
- **成果物**: `web/src/app/layout.tsx`, `web/src/app/icon.svg`, `web/src/app/apple-icon.tsx`, `web/src/app/opengraph-image.tsx`

### T4-2: Vercelデプロイ [Done]
- **概要**: https://stat-ex.vercel.app/ で公開中（モックデータ）
- **設定**: Root Directory = `web`, Framework = Next.js（自動検出）

### T4-3: Google Analytics 4 導入 [Todo]
- **概要**: GA4でPV・ユーザー数を計測
- **新規ファイル**: `web/src/components/analytics/GoogleAnalytics.tsx`
- **変更ファイル**: `web/src/app/layout.tsx`
- **依存**: なし
- **作業内容**:
  1. GA4プロパティ作成、測定ID取得
  2. `.env.local` に `NEXT_PUBLIC_GA_ID` 追加
  3. `GoogleAnalytics` コンポーネント作成（Script タグで gtag.js 読み込み）
  4. `layout.tsx` に追加

---

## Phase 5: テスト・調整・本番リリース [部分Done]

### T5-1: ユニットテスト（フロントエンド） [Done（一部）]
- **概要**: 4テストファイルが存在（Supabase接続後にモック差し替え必要）
- **成果物**: `web/src/lib/data/__tests__/`（games, players, team, content）

### T5-2: E2Eテスト本格実装 [Todo]
- **概要**: 現在は home.spec.ts のタイトル確認のみ → 全ページのE2Eを追加
- **新規ファイル**: `web/e2e/` 配下にテストファイル追加
- **依存**: T2-8
- **作業内容**:
  1. `home.spec.ts` 拡充（Hero, Stats Cards, チャート, ニュース）
  2. `games.spec.ts`（一覧表示、フィルタ）
  3. `game-detail.spec.ts`（スコアボード、ボックススコア）
  4. `players.spec.ts`（一覧、ポジションフィルタ）
  5. `player-detail.spec.ts`（各セクション）
  6. `team.spec.ts`（チーム成績ページ各セクション）
  7. `standings.spec.ts`（順位表テーブル）
  8. `navigation.spec.ts`（ナビゲーション、レスポンシブメニュー）

### T5-3: テストの更新（Supabase接続対応） [Todo]
- **概要**: ユニットテストのモックをSupabaseクライアントモックに差し替え + スクレイパー格納処理テスト追加
- **変更ファイル**: `web/src/lib/data/__tests__/`, `scraper/tests/`
- **依存**: T2-8, T1-6

### T5-4: パフォーマンス最適化 [Todo]
- **概要**: Lighthouseスコア85以上を目標
- **作業内容**:
  1. チャートコンポーネントに `dynamic(() => import(...), { ssr: false })` 適用
  2. Skeleton でローディング表示
  3. `next/image` による選手画像等の最適化
  4. ISR の revalidate 設定調整

### T5-5: 初回バッチ実行・データ投入 [Todo]
- **概要**: GitHub Actions で初回バッチを実行し、Supabaseに実データを投入
- **依存**: T1-4, T1-6, T1-7
- **作業内容**:
  1. `workflow_dispatch` で scrape.yml を手動実行
  2. Supabase Dashboard でデータ格納を確認
  3. フロントエンドで実データ表示を確認

### T5-6: 本番リリース [Todo]
- **概要**: Vercel環境変数にSupabase接続情報を設定し、実データで全ページ動作確認
- **依存**: T5-5
- **作業内容**:
  1. Vercel 環境変数に `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定
  2. 全8ページの表示確認（PC/タブレット/スマホ）
  3. Lighthouse Performance Score 計測
  4. OGP プレビュー確認

---

## タスク依存関係

```
T1-4 (Supabaseマイグレーション適用)
  ├─→ T2-9 (型定義自動生成)
  ├─→ T1-6 (スクレイパー格納処理)
  │     ├─→ T1-7 (選手データ登録ロジック)
  │     ├─→ T3-3 (YouTube マッチング)
  │     ├─→ T3-4 (AI寸評調整)
  │     └─→ T2-8 (フロントエンド DB接続)
  │           ├─→ T5-2 (E2Eテスト)
  │           ├─→ T5-3 (テスト更新)
  │           └─→ T5-4 (パフォーマンス最適化)
  └─→ T5-5 (初回バッチ) ─→ T5-6 (本番リリース)

T3-1 (API Route) ─→ T3-2 (ライブモード)  ← 独立して並行作業可能
T4-3 (GA4)                                ← 独立して並行作業可能
```

---

## 推奨スケジュール

### Week 1（2/24〜3/2）: データパイプライン接続

| Day | 作業 | タスク |
|-----|------|--------|
| 1 | Supabaseマイグレーション適用 + 型定義自動生成 | T1-4, T2-9 |
| 2-3 | スクレイパー格納処理の完成（7テーブル追加） | T1-6 |
| 3 | 選手データ自動登録ロジック | T1-7 |
| 4 | 初回バッチ実行・データ投入確認 | T5-5 |
| 4-5 | フロントエンド DB接続（games.ts, team.ts） | T2-8 前半 |
| 5-6 | フロントエンド DB接続（players.ts, content.ts） | T2-8 後半 |

### Week 2（3/3〜3/9）: リアルタイム + 仕上げ

| Day | 作業 | タスク |
|-----|------|--------|
| 7 | リアルタイム更新（API Route + ライブモード） | T3-1, T3-2 |
| 8 | YouTube マッチング + AI寸評調整 | T3-3, T3-4 |
| 8 | Google Analytics 4 導入 | T4-3 |
| 9 | E2Eテスト本格実装 | T5-2 |
| 10 | パフォーマンス最適化 + 本番リリース | T5-4, T5-6 |

**合計: 約10日間（余裕込みで2週間）**

---

## リリース完了基準

- [ ] 全8ページが Supabase の実データで正常表示
- [ ] 全8ページが PC/タブレット/スマホ で正常表示・操作可能
- [ ] GitHub Actions のバッチが毎日22:00に正常実行
- [ ] 試合中のリアルタイム更新が30秒間隔で動作
- [ ] YouTube動画が試合詳細に自動表示
- [ ] AI寸評が試合後に自動生成・表示
- [ ] GA4でPVが計測される
- [ ] OGP画像がSNS共有時に正しく表示
- [ ] Lighthouse Performance Score 85以上
- [ ] E2Eテストが全ページ通過

---

## リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| B.LEAGUE公式のHTML構造変更 | 高 | 複数フォールバックパターン実装済み。GitHub Actions失敗通知で検知 |
| Supabase無料枠制限（500MB） | 低 | B2は年60試合。全データ推定5000行未満、無料枠で十分 |
| Vercelタイムアウト（10秒） | 中 | ライブ更新のHTML取得は通常2-3秒で完了 |
| YouTube動画マッチング精度 | 低 | 不一致時は非表示設計。手動修正可能 |
| LINE Notify終了 | 低 | GitHub Actionsのメール通知で代替済み |

## 未解決事項

| 項目 | 対応方針 | 時期 |
|------|---------|------|
| ドメイン名 | 初回は `stat-ex.vercel.app` で公開。カスタムドメインは後日 | リリース後 |
| スポナビgameID↔ScheduleKey対応 | 当面B.LEAGUE公式のみで運用。必要時は日付+チーム名で照合 | 当面不要 |
