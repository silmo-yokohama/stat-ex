# STAT-EX データソース仕様

## 概要

横浜エクセレンス（TeamID: `714`）のデータを以下のソースから収集する。
全ソースともHeadlessブラウザ不要。HTTP リクエスト（curl相当）のみで取得可能。

---

## メインソース: B.LEAGUE公式サイト

ベースURL: `https://www.bleague.jp`

### 順位表

- URL: `/standings/?tab=2`
- 取得方法: SSR HTMLパース
- 取得データ: B2全チームの順位・勝敗・勝率・得失点差・H/A成績・連勝連敗・過去5試合

### 試合結果一覧（JSON API）

- URL: `/schedule/?data_format=json`
- 取得方法: JSON API（ページネーション対応、20件/ページ）
- 取得データ: スコア・対戦相手・日付・節・会場・ScheduleKey
- パラメータ:
  - `year=2025` シーズン開始年
  - `event=7` B2リーグ戦（`8`=プレーオフ）
  - `club=714` 横浜エクセレンス
  - `fb` 1=日程のみ, 2=結果のみ, 空=全て
  - `ha` 1=HOME, 2=AWAY
  - `mon` all or 10〜04（月指定）
  - `index` 1, 21, 41...（ページネーション）

### ボックススコア（最重要）

- URL: `/game_detail/?ScheduleKey={ID}&tab=2`
- 取得方法: HTML内JSオブジェクト（`_contexts_s3id.data`）を抽出してJSONパース
- 取得データ:
  - 全選手詳細スタッツ: PTS, FGM/A, 3PM/A, FTM/A, RB(OR/DR), AST, TO, ST, BS, FOUL, EFF, +/-, USG, TS%, EFG
  - クォーター別スコア（HomeTeamScore01〜04, AwayTeamScore01〜04）
  - スターティング5
  - 観客数、審判名、会場情報
  - HomeBoxscores / AwayBoxscores 配列

### チームスタッツ

- URL: `/club_detail/?TeamID=714`
- 取得方法: SSR HTMLパース（テーブル5つ）
- 取得データ:
  - シーズン通算/平均: PPG, FG%, 2FG%, 3FG%, FT%, RPG, APG, TOPG, STPG, BSPG, EFFPG
  - アドバンスド: ポゼッション, レーティング, 2NDPTS, FBPS, PITP

### 選手ランキング（JSON API）

- URL: `/stats/?data_format=json`
- 取得方法: JSON API
- 取得データ: B2全選手ランキング
- パラメータ:
  - `year=2025`, `tab=2`, `target=player-b2`
  - `value` ソート対象（AveragePoints等）
  - `dt` avg/tot/dtl（平均/合計/詳細）
  - `club=714` クラブフィルタ
  - `p` ポジションフィルタ（PG/SG/SF/PF/C）

### 選手個人成績

- URL: `/roster_detail/?PlayerID={ID}`
- 取得方法: SSR HTMLパース（テーブル4つ）
- 取得データ: シーズン通算、試合別成績、アドバンスドスタッツ、プロフィール

### 全チーム本拠地

- URL: `/club_detail/?TeamID={ID}`
- 取得方法: SSR HTMLパース（dt/dd要素）
- 取得データ: ホームタウン、アリーナ名称、住所（B2全14チーム分）

---

## サブソース: スポナビ（Yahoo Sports）

ベースURL: `https://sports.yahoo.co.jp/basket/widget/ds/pc/`
Widget URLへの直接HTTPリクエストでSSR HTMLが返る。認証不要。

### 対戦成績（H2H）

- URL: `teams/714/headtohead.html`
- 取得データ: 全対戦相手との勝敗数・平均得点・失点（H/A別）
- B.LEAGUE公式にはないデータ

### インジュアリーリスト

- URL: `teams/714/injury.html`
- 取得データ: 選手名・公示事由・登録日
- B.LEAGUE公式にはないデータ

### チームリーダー

- URL: `teams/714/leaders.html`
- 取得データ: 得点王・リバウンド王・アシスト王

### 選手プロフィール

- URL: `players/{playerID}/detail.html`
- 取得データ: 選手画像URL
- B.LEAGUE公式には選手画像がないため重要

### ボックススコア補完

- URL: `b2/games/{gameID}/box_score.html`
- 取得データ: B.LEAGUE公式と同等（クロスチェック用）
- 注意: スポナビのgameIDとB.LEAGUEのScheduleKeyの対応付けが必要（未解決事項）

---

## ニュースソース

### Google News RSS

- URL: `https://news.google.com/rss/search?q=横浜エクセレンス&hl=ja&gl=JP&ceid=JP:ja`
- 取得データ: タイトル、ソース名、公開日、リンク
- 注意: description（記事要約）は取得不可（タイトルの繰り返しのみ）
- 記事数: 約100件
- 用途: トップページ「メディア」タブ

### 公式HP RSS

- URL: `https://yokohama-ex.jp/RSS.rdf`
- フォーマット: Atom（CMS: RCMS）
- 取得データ: タイトル、更新日、リンク、サムネイル画像URL（enclosure）
- 注意: description（summary/content）は空
- 用途: トップページ「公式」タブ

---

## 動画ソース

### YouTube公式チャンネル RSS

- URL: `https://www.youtube.com/feeds/videos.xml?channel_id=UCbdBOgj1aQo4ojYA7Eym4jw`
- フォーマット: Atom
- 取得データ: videoId、タイトル、公開日、サムネイルURL、説明文、再生数
- 制限: 最新15件のみ返る
- ハイライト動画プレイリスト: `PLhBws5VoBj5YFIhZM-MAmWKTEbQRxT1qy`
- 用途: 試合詳細ページにダイジェスト動画を埋め込み
- マッチング: 動画タイトルまたはプレイリスト内順序で対象試合を特定（ロジックは実装時に詳細設計）

---

## バッチ実行仕様

### 実行タイミング

- **毎日22:00 JST**（GitHub Actions cron）
- B2の試合は通常18:00〜20:00開始、21:00頃終了。22:00なら試合終了後1〜2時間で全データ反映
- 試合がない日もバッチは実行する（ニュース・YouTube動画の更新があるため）

### 更新対象

| データ | 更新元 | 備考 |
|--------|--------|------|
| 試合結果・ボックススコア | B.LEAGUE game_detail | 新しい試合のみ追加 |
| 選手スタッツ（シーズン平均・通算） | B.LEAGUE roster_detail | 毎回上書き更新 |
| 選手の試合別成績ログ | ボックススコアから抽出 | 新しい試合のみ追加 |
| チーム成績・順位表 | B.LEAGUE standings + club_detail | 毎回上書き更新 |
| H2H対戦成績・インジュアリー | スポナビ widget | 毎回上書き更新 |
| ニュース | RSS | 重複チェックして新規のみ追加 |
| YouTube動画 | YouTube RSS | 重複チェックして新規のみ追加 |
| AI寸評 | Gemini 2.0 Flash | 新しい試合のみ生成（再生成しない） |

### スクレイピングの礼儀

- リクエスト間隔: **最低1秒**
- User-Agent ヘッダ: 必須（例: `stat-ex/1.0`）
- 非商用・個人利用を明示
- データ出典をフッターに表示

---

## リアルタイム更新仕様（試合中のみ）

- **トリガー**: 試合詳細ページ表示中、かつ試合ステータスが「試合中」
- **間隔**: 30秒（setInterval）
- **取得先**: B.LEAGUE game_detail を Next.js API Route 経由で直接取得
- **DB書き込み**: しない（22:00バッチで確定データを格納）
- **非アクティブタブ**: visibilitychange イベントで自動更新を停止
- **手動更新**: ボタン押下で即時再取得。最終更新日時を表示

---

## 未解決事項

- スポナビ gameID と B.LEAGUE ScheduleKey の対応付け方法
- YouTube動画と試合のマッチングロジックの詳細
- AI寸評のプロンプト設計（入力データ形式、出力トーン、文字数）
