# STAT-EX プロジェクトガイド

## プロジェクト概要

横浜エクセレンス（B.LEAGUE B2）に特化した情報ダッシュボード。
コンセプト: **「5クリックかかる情報を1クリックで」**

- サイト名: **STAT-EX**（Stats × Excellence）
- 要件定義書: `requirements.md`
- GitHub: silmo-yokohama/stat-ex（Public）
- 横浜エクセレンス TeamID: `714`

---

## 技術スタック

### フロントエンド（/web）

- **Next.js 16**（App Router）
- **TypeScript**（strict mode）
- **Tailwind CSS** + **shadcn/ui**
- **Recharts**（データ可視化、9種類のグラフ）
- **pnpm**（パッケージマネージャー）

### スクレイピング（/scraper）

- **Python 3.10+**
- **Beautiful Soup 4** + **requests**
- knowledge-hubプロジェクトのパターンを踏襲
  - JSONを標準出力に出力するUnixパイプ設計
  - レート制限: リクエスト間に1秒以上のスリープ
  - User-Agentヘッダ必須

### インフラ・外部サービス

| サービス | 用途 |
|---------|------|
| Vercel | ホスティング（初期はデフォルトドメイン） |
| Supabase | PostgreSQL データベース |
| GitHub Actions | バッチ実行（毎日22:00 JST） |
| Gemini 2.0 Flash | AI試合寸評の自動生成 |
| Google Analytics 4 | アクセス解析 |

### テスト・コード品質

- **Vitest**（ユニットテスト）
- **Playwright**（E2Eテスト）
- **ESLint** + **Prettier**

---

## リポジトリ構成

モノレポ構成。フロントエンド `/web` とスクレイピング `/scraper` を同一リポジトリで管理する。

- `web/` - Next.js フロントエンド
  - `web/src/app/` - App Router ページ
  - `web/src/components/` - UIコンポーネント（shadcn/ui含む）
  - `web/src/lib/` - ユーティリティ、Supabaseクライアント、型定義
- `scraper/` - Python スクレイピングスクリプト
  - `scraper/src/sources/` - データソース別モジュール（bleague, sportsnavi, rss, youtube）
  - `scraper/src/models/` - データモデル
- `supabase/` - マイグレーション・シードデータ
- `.github/workflows/` - GitHub Actions ワークフロー

---

## アーキテクチャ方針

### データフロー

- **通常時**: GitHub Actions バッチ → Supabase → Server Components → 画面表示
- **試合中**: クライアント → API Route → B.LEAGUE game_detail 直接取得（30秒間隔）
- リアルタイム取得データはDBに書き込まない（22:00バッチで確定データを格納）

### データ取得

- **Server Components** で Supabase を直接クエリする（API Route経由しない）
- API Route は**リアルタイム更新のみ**に使用
- Supabase クライアントは `lib/supabase/` に集約し、server用 / client用を分離する

### レンダリング戦略

- 静的ページ（順位表、選手一覧等）: **SSG / ISR**
- 動的ページ（試合詳細等）: **Server Components**（リクエスト時取得）
- リアルタイム: **クライアントコンポーネント**（setInterval + visibilitychange）

---

## ページ構成（全8ページ）

| パス | ページ | 主要機能 |
|------|--------|---------|
| `/` | トップ（ダッシュボード） | Heroカード、Stats Cards、得点推移グラフ、チームリーダー、ニュース |
| `/games` | 試合一覧 | フィルター、勝敗ストリークバー、試合カード |
| `/games/:scheduleKey` | 試合詳細 | スコアボード、ボックススコア、リアルタイム更新、YouTube動画、AI寸評 |
| `/players` | 選手一覧 | ポジションフィルター、スタッツ分布チャート、選手カード |
| `/players/:playerId` | 選手詳細 | Season Average、推移グラフ、シューティングスプリット |
| `/team` | チーム成績 | 累積勝利グラフ、H/A比較、月別成績、H2H、インジュアリー |
| `/team/standings` | B2順位表 | 全チーム順位テーブル（横浜EXハイライト） |
| `/mascot` | マスコット紹介 | プロフィール、ギャラリー |

---

## コーディング規約

### 全般

- コメント・テストタイトルは**日本語**で記述する
- 効率よりも**可読性**を重視する
- 関数・メソッドには**Docコメント**を添える
- 重要なロジックには必ずコメントを添える

### TypeScript（フロントエンド）

- strict mode を有効にする
- `any` の使用を禁止する（`unknown` を使う）
- 型定義は `lib/types/` に集約する
- Supabase の型は `supabase gen types` で自動生成する
- コンポーネントは関数コンポーネント + アロー関数で統一する
- Server Components をデフォルトとし、クライアント機能が必要な場合のみ `"use client"` を付与する

### Python（スクレイピング）

- 型ヒントを使用する
- データソースごとにモジュールを分離する（`sources/bleague.py`, `sources/sportsnavi.py` 等）
- 結果はJSON形式で標準出力に出力する
- エラーは結果JSONの `errors` フィールドに含める（プロセスを落とさない）
- リクエスト間に最低1秒のスリープを入れる

### コンポーネント設計

- チャートコンポーネントは汎用化し、異なるページで再利用可能にする
- shadcn/ui コンポーネントはカスタマイズして使用する
- レスポンシブ対応: モバイルとPC同等の優先度

### テスト

- スクレイピングのパースロジックは必ずユニットテストを書く
- フロントエンドの主要ページはE2Eテストでカバーする
- テストファイルは対象ファイルと同階層の `__tests__/` または `tests/` に配置

---

## 命名規則

### ファイル・ディレクトリ

- コンポーネント: **PascalCase**（`HeroCard.tsx`, `BoxScore.tsx`）
- ユーティリティ・lib: **kebab-case**（`supabase-client.ts`, `format-stats.ts`）
- Python: **snake_case**（`fetch_box_scores.py`, `parse_standings.py`）

### データベース

- テーブル名: **snake_case 複数形**（`games`, `box_scores`, `player_seasons`）
- カラム名: **snake_case**（`schedule_key`, `home_away`, `fg_pct`）
- 詳細は `.claude/db-conventions.md` を参照

---

## 環境変数

フロントエンド（`web/.env.local`）で管理する主要な環境変数:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase プロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名キー（RLS適用、READ ONLY）
- `SUPABASE_SERVICE_ROLE_KEY` - サービスロールキー（バッチ用、フロントには露出しない）
- `GEMINI_API_KEY` - Gemini API キー
- `NEXT_PUBLIC_GA_ID` - Google Analytics 測定ID

---

## 配色ルール

勝敗の表現は全ページで統一する:
- **勝ち / 自チーム**: ダークグリーン `#006d3b`
- **負け / 相手チーム**: グレー `#9CA3AF`

詳細なカラーパレット・デザインガイドは `.claude/design-guide.md` を参照。

---

## データソース

- **メイン**: B.LEAGUE公式サイト（JSON API + HTMLパース）
- **サブ**: スポナビ Widget（HTMLパース、認証不要）
- **ニュース**: Google News RSS + 公式HP RSS
- **動画**: YouTube公式チャンネル RSS

詳細なURL・パラメータは `.claude/data-sources.md` を参照。

---

## 重要な制約・注意事項

1. **スクレイピングの礼儀**: リクエスト間隔1秒以上、User-Agent設定、データ出典をフッターに表示
2. **Supabase RLS**: フロントエンドからは READ ONLY アクセスのみ
3. **環境変数**: APIキー・DB接続情報は `.env.local` で管理し、絶対にコミットしない
4. **移籍選手**: 移籍した選手のデータは永続保持する。在籍期間を記録し、横浜EX時代のスタッツのみ表示
5. **過去データ**: 2025-26シーズン（B2昇格）以降のみ。2024-25以前はB3のためデータなし
6. **LINE Notify は終了済み**: 通知は GitHub Actions のメール通知のみ使用する

---

## 参照ドキュメント

| ファイル | 内容 |
|---------|------|
| `requirements.md` | 要件定義書（機能要件・非機能要件・スケジュール） |
| `.claude/design-guide.md` | カラーパレット・タイポグラフィ・レスポンシブ設計 |
| `.claude/data-sources.md` | データソースURL・パラメータ・取得方法の詳細 |
| `.claude/db-conventions.md` | テーブル設計・命名規則・RLS方針 |
