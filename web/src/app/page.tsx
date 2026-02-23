/**
 * P1: トップページ（ダッシュボード）
 *
 * サイトを開いた瞬間に今知りたい情報が全部見えるページ。
 * Server Component で全データを事前取得し、描画する。
 *
 * セクション構成:
 * 1. Heroカード（直近試合結果 / 次の試合）
 * 2. Stats Cards（順位・勝率・ストリーク・平均得点・ホーム勝率・得失点差）
 * 3. 得点推移グラフ（左） + H/Aドーナツ（中） + チームリーダー（右）
 * 4. クイックリンクバー
 * 5. 最新ニュース（公式 / メディア タブ切替）
 */

import Link from "next/link";

import { SITE, TEAM } from "@/lib/constants";
import { Icon } from "@/components/ui/Icon";
import {
  getLatestGame,
  getNextGame,
  getTeamStats,
  getStandings,
  getTeamLeaders,
  getNews,
  getGames,
} from "@/lib/data";
import { getScoreTrend, getCurrentStreak, isWin, getExScore, getOppScore } from "@/lib/data/games";
import { buildPennantRaceData } from "@/lib/data/pennant-race";

import { Badge } from "@/components/ui/badge";
import { ScoreTrendChart } from "@/components/charts/ScoreTrendChart";
import { GamesAbove500Chart } from "@/components/charts/GamesAbove500Chart";
import { DashboardHomeAwayDonut } from "@/components/dashboard/DashboardCharts";
import { NewsTabs } from "@/components/dashboard/NewsTabs";
import { PlayerAvatar } from "@/components/players/PlayerAvatar";

// ================================================
// ヘルパー
// ================================================

/**
 * 日付文字列を「M月D日（曜日）」形式にフォーマットする
 */
function formatGameDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日（${weekday}）`;
}

/**
 * チームリーダーのカテゴリに応じた左ボーダーのクラス名を返す
 */
function getLeaderBorderClass(category: string): string {
  switch (category) {
    case "得点":
      return "border-l-4 border-[#006d3b]";
    case "リバウンド":
      return "border-l-4 border-[#059669]";
    case "アシスト":
      return "border-l-4 border-[#0d9488]";
    default:
      return "border-l-4 border-border";
  }
}

// ================================================
// ページ本体
// ================================================

export default async function Home() {
  // 並列で全データを取得（パフォーマンス向上のため Promise.all）
  const [
    latestGame,
    nextGame,
    teamStats,
    standings,
    teamLeaders,
    officialNews,
    mediaNews,
    scoreTrend,
    streak,
    allGames,
  ] = await Promise.all([
    getLatestGame(),
    getNextGame(),
    getTeamStats(),
    getStandings(),
    getTeamLeaders(),
    getNews("official", 5),
    getNews("media", 5),
    getScoreTrend(10),
    getCurrentStreak(),
    getGames(),
  ]);

  // 順位表から横浜EXの順位を抽出
  const yokohamaStanding = standings.find((s) => s.short_name === TEAM.shortName);
  const rank = yokohamaStanding?.rank ?? null;

  // ペナントレースチャート用データを構築
  // 横浜EXの試合結果を日付昇順で取得し、勝敗のみの配列にする
  const exGameResults = [...allGames]
    .filter((g) => g.status === "FINAL")
    .sort((a, b) => a.game_date.localeCompare(b.game_date))
    .map((g) => isWin(g) === true);

  const pennantRaceData = buildPennantRaceData(standings, exGameResults, TEAM.shortName);

  // 得点推移データをチャート用に変換
  const trendData = scoreTrend.map((t) => ({
    label: t.game.opponent.short_name,
    exScore: t.exScore,
    oppScore: t.oppScore,
    win: t.win,
  }));

  // 直近試合の勝敗判定
  const latestWin = latestGame ? isWin(latestGame) : null;
  const latestExScore = latestGame ? getExScore(latestGame) : null;
  const latestOppScore = latestGame ? getOppScore(latestGame) : null;

  // ホーム勝率の算出
  const homeTotal = teamStats.home_wins + teamStats.home_losses;
  const homeWinPct = homeTotal > 0 ? ((teamStats.home_wins / homeTotal) * 100).toFixed(1) : "--";

  // 得失点差の算出
  const pointDiff =
    teamStats.avg_points_for !== null && teamStats.avg_points_against !== null
      ? teamStats.avg_points_for - teamStats.avg_points_against
      : null;
  const pointDiffDisplay =
    pointDiff !== null ? `${pointDiff >= 0 ? "+" : ""}${pointDiff.toFixed(1)}` : "--";

  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{TEAM.name}</h1>
        <p className="text-sm text-muted-foreground">{SITE.concept}</p>
      </div>

      {/* ========================================
       * セクション1: Heroカード（直近試合 / 次の試合）
       * グラデーション背景で勝敗を直感的に表現
       * ======================================== */}
      <section>
        {latestGame && (
          <Link href={`/games/${latestGame.schedule_key}`}>
            <div
              className={`rounded-xl p-6 transition-shadow hover:shadow-md ${
                latestWin
                  ? "hero-gradient-win"
                  : latestWin === false
                    ? "hero-gradient-loss"
                    : "border border-border bg-card"
              }`}
            >
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                {/* 左: 試合情報 */}
                <div className="text-center sm:text-left">
                  <div className="mb-1 flex items-center justify-center gap-2 sm:justify-start">
                    {latestWin !== null && (
                      <Badge className="bg-white/20 text-white">{latestWin ? "WIN" : "LOSS"}</Badge>
                    )}
                    <Badge className="bg-white/20 text-white">
                      {latestGame.home_away === "HOME" ? "HOME" : "AWAY"}
                    </Badge>
                  </div>
                  <p className="text-lg font-semibold text-white">vs {latestGame.opponent.name}</p>
                  <div className="mt-1 flex items-center justify-center gap-3 text-sm text-white/70 sm:justify-start">
                    <span className="flex items-center gap-1">
                      <Icon name="calendar_today" size={14} />
                      {formatGameDate(latestGame.game_date)}
                    </span>
                    {latestGame.venue && (
                      <span className="flex items-center gap-1">
                        <Icon name="location_on" size={14} />
                        {latestGame.venue}
                      </span>
                    )}
                  </div>
                </div>

                {/* 右: スコア表示（拡大版） */}
                {latestExScore !== null && latestOppScore !== null && (
                  <div className="flex items-center gap-3">
                    {/* 横浜EXスコア */}
                    <div className="text-center">
                      <p className="text-xs text-white/70">{TEAM.shortName}</p>
                      <p className="font-display text-7xl leading-none text-white">
                        {latestExScore}
                      </p>
                    </div>
                    {/* セパレータ */}
                    <span className="font-display text-4xl text-white/50">-</span>
                    {/* 相手スコア */}
                    <div className="text-center">
                      <p className="text-xs text-white/70">{latestGame.opponent.short_name}</p>
                      <p className="font-display text-7xl leading-none text-white/80">
                        {latestOppScore}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* 次の試合カード */}
        {nextGame && (
          <Link href={`/games/${nextGame.schedule_key}`}>
            <div className="mt-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="shrink-0 text-xs">
                  NEXT
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    vs {nextGame.opponent.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icon name="calendar_today" size={12} />
                      {formatGameDate(nextGame.game_date)}
                    </span>
                    <span>
                      {nextGame.game_time ?? ""} {nextGame.home_away === "HOME" ? "HOME" : "AWAY"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}
      </section>

      {/* ========================================
       * セクション2: Stats Cards（6枚: 3列×2行）
       * 各カードにアクセントカラーボーダーとフェードインアニメーション
       * ======================================== */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {/* 順位 */}
        <div className="stat-card-green animate-fade-in-up delay-1 rounded-xl border border-border bg-card p-4 text-center">
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Icon name="leaderboard" size={14} />
            B2 順位
          </p>
          <p className="font-display text-4xl leading-tight text-foreground">
            {rank !== null ? `${rank}` : "--"}
          </p>
          {rank !== null && (
            <p className="text-xs text-muted-foreground">/ {standings.length}チーム</p>
          )}
        </div>

        {/* 勝率 */}
        <div className="stat-card-emerald animate-fade-in-up delay-2 rounded-xl border border-border bg-card p-4 text-center">
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Icon name="percent" size={14} />
            勝率
          </p>
          <p className="font-display text-4xl leading-tight text-foreground">
            {teamStats.win_pct !== null ? `${teamStats.win_pct}` : "--"}
          </p>
          <p className="text-xs text-muted-foreground">
            {teamStats.wins}勝 {teamStats.losses}敗
          </p>
        </div>

        {/* 連勝 / 連敗 */}
        <div className="stat-card-teal animate-fade-in-up delay-3 rounded-xl border border-border bg-card p-4 text-center">
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Icon name="local_fire_department" size={14} />
            現在のストリーク
          </p>
          <div className="flex items-center justify-center gap-1">
            {streak.type === "W" ? (
              <Icon name="trending_up" size={16} className="text-win" />
            ) : (
              <Icon name="trending_down" size={16} className="text-loss" />
            )}
            <p className="font-display text-4xl leading-tight text-foreground">{streak.count}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {streak.type === "W" ? "連勝中" : "連敗中"}
          </p>
        </div>

        {/* 平均得点 */}
        <div className="stat-card-indigo animate-fade-in-up delay-4 rounded-xl border border-border bg-card p-4 text-center">
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Icon name="sports_score" size={14} />
            平均得点
          </p>
          <p className="font-display text-4xl leading-tight text-foreground">
            {teamStats.avg_points_for !== null ? teamStats.avg_points_for.toFixed(1) : "--"}
          </p>
          {teamStats.avg_points_against !== null && (
            <p className="text-xs text-muted-foreground">
              失点 {teamStats.avg_points_against.toFixed(1)}
            </p>
          )}
        </div>

        {/* ホーム勝率 */}
        <div className="stat-card-amber animate-fade-in-up delay-5 rounded-xl border border-border bg-card p-4 text-center">
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Icon name="home" size={14} />
            ホーム勝率
          </p>
          <p className="font-display text-4xl leading-tight text-foreground">
            {homeWinPct}
            {homeWinPct !== "--" && <span className="text-lg">%</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {teamStats.home_wins}勝 {teamStats.home_losses}敗
          </p>
        </div>

        {/* 得失点差 */}
        <div className="stat-card-rose animate-fade-in-up delay-6 rounded-xl border border-border bg-card p-4 text-center">
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Icon name="compare_arrows" size={14} />
            得失点差
          </p>
          <p className="font-display text-4xl leading-tight text-foreground">{pointDiffDisplay}</p>
          <p className="text-xs text-muted-foreground">1試合あたり</p>
        </div>
      </section>

      {/* ========================================
       * セクション3: 得点推移グラフ + H/Aドーナツ + チームリーダー（3列）
       * ======================================== */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* 得点推移グラフ */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Icon name="show_chart" size={20} className="text-primary" />
            直近10試合 得点推移
          </h2>
          {trendData.length > 0 ? (
            <ScoreTrendChart data={trendData} />
          ) : (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              データがありません
            </div>
          )}
        </div>

        {/* ホーム／アウェイ勝率ドーナツ（中央） */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Icon name="pie_chart" size={20} className="text-primary" />
            H/A 勝率
          </h2>
          <DashboardHomeAwayDonut
            homeWins={teamStats.home_wins}
            homeLosses={teamStats.home_losses}
            awayWins={teamStats.away_wins}
            awayLosses={teamStats.away_losses}
          />
        </div>

        {/* チームリーダー（選手画像 + 選手詳細への導線） */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Icon name="emoji_events" size={20} className="text-primary" />
            チームリーダー
          </h2>
          <div className="space-y-4">
            {teamLeaders.map((leader) => (
              <Link
                key={leader.category}
                href={`/players/${leader.player.id}`}
                className={`flex items-center gap-3 rounded-lg border border-border p-3 transition-shadow hover:shadow-md ${getLeaderBorderClass(leader.category)}`}
              >
                {/* 選手アバター画像 */}
                <PlayerAvatar player={leader.player} size="sm" />

                {/* 選手情報 */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{leader.category}</p>
                  <p className="text-sm font-semibold text-foreground">{leader.player.name}</p>
                </div>

                {/* スタッツ数値 */}
                <div className="shrink-0 text-right">
                  <p className="font-display text-4xl leading-none text-foreground">
                    {leader.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{leader.unit}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
       * セクション4: ペナントレース（貯金/借金推移チャート）
       * 全チームのシーズン推移を折れ線で可視化
       * ======================================== */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Icon name="trending_up" size={20} className="text-primary" />
          B2 ペナントレース
        </h2>
        {pennantRaceData.length > 0 ? (
          <GamesAbove500Chart teams={pennantRaceData} />
        ) : (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            データがありません
          </div>
        )}
      </section>

      {/* ========================================
       * セクション5: クイックリンクバー
       * 主要ページへのショートカット
       * ======================================== */}
      <section className="flex flex-wrap gap-3">
        <Link
          href="/team/standings"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Icon name="leaderboard" size={16} />
          順位表を見る
        </Link>
        <Link
          href="/team"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <Icon name="bar_chart" size={16} />
          チーム成績
        </Link>
        <Link
          href="/games"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <Icon name="calendar_month" size={16} />
          試合一覧
        </Link>
      </section>

      {/* ========================================
       * セクション6: 最新ニュース
       * ======================================== */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Icon name="newspaper" size={20} className="text-primary" />
          最新ニュース
        </h2>
        <NewsTabs officialNews={officialNews} mediaNews={mediaNews} />
      </section>
    </div>
  );
}
