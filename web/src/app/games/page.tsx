import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

import { getGames, getTeamStats } from "@/lib/data";
import { isWin, getExScore, getOppScore } from "@/lib/data/games";
import type { GameWithOpponent, TeamStats } from "@/lib/types/database";

import { Badge } from "@/components/ui/badge";
import { SeasonRecordChart } from "@/components/games/SeasonRecordChart";
import type { SeasonRecordData } from "@/components/games/SeasonRecordChart";

/**
 * P2: 試合一覧ページ
 *
 * シーズン全試合（終了済み + 予定）を一覧で確認。
 * - シーズン戦績チャート（Recharts横棒グラフで勝敗を可視化）
 * - 終了済み試合 / 今後の試合を分割したカードグリッド
 */

export const metadata: Metadata = {
  title: "試合一覧",
};

// ================================================
// ヘルパー
// ================================================

/**
 * 日付文字列を「M/D（曜日）」形式にフォーマットする
 */
function formatGameDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[date.getDay()];
  return `${month}/${day}（${weekday}）`;
}

/**
 * 試合データをSeasonRecordChart用のデータに変換する
 *
 * 日付の古い順（時系列順）にソートして返す。
 */
function toSeasonRecordData(games: GameWithOpponent[]): SeasonRecordData[] {
  return [...games]
    .sort((a, b) => a.game_date.localeCompare(b.game_date))
    .map((game) => ({
      date: game.game_date,
      opponent: game.opponent.short_name,
      win: isWin(game),
      exScore: getExScore(game),
      oppScore: getOppScore(game),
    }));
}

// ================================================
// サブコンポーネント
// ================================================

/**
 * シーズン概要カード
 *
 * 勝敗、勝率、ホーム成績、アウェイ成績の4つのスタッツを表示する。
 */
function SeasonSummaryCards({ teamStats }: { teamStats: TeamStats }) {
  /** 勝率を小数点3桁のフォーマットに変換する */
  const winPctDisplay =
    teamStats.win_pct !== null
      ? teamStats.win_pct.toFixed(3).replace(/^0/, "")
      : "---";

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {/* 勝敗 */}
      <div className="stat-card-green rounded-xl border border-border bg-card p-4 text-center animate-fade-in-up delay-1">
        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Icon name="scoreboard" size={14} />勝敗</p>
        <p className="font-display text-3xl leading-tight text-foreground">
          {teamStats.wins}-{teamStats.losses}
        </p>
      </div>

      {/* 勝率 */}
      <div className="stat-card-emerald rounded-xl border border-border bg-card p-4 text-center animate-fade-in-up delay-2">
        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Icon name="percent" size={14} />勝率</p>
        <p className="font-display text-3xl leading-tight text-foreground">
          {winPctDisplay}
        </p>
      </div>

      {/* ホーム成績 */}
      <div className="stat-card-teal rounded-xl border border-border bg-card p-4 text-center animate-fade-in-up delay-3">
        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Icon name="home" size={14} />ホーム</p>
        <p className="font-display text-3xl leading-tight text-foreground">
          {teamStats.home_wins}-{teamStats.home_losses}
        </p>
      </div>

      {/* アウェイ成績 */}
      <div className="stat-card-indigo rounded-xl border border-border bg-card p-4 text-center animate-fade-in-up delay-4">
        <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Icon name="flight" size={14} />アウェイ</p>
        <p className="font-display text-3xl leading-tight text-foreground">
          {teamStats.away_wins}-{teamStats.away_losses}
        </p>
      </div>
    </section>
  );
}

/**
 * 試合カード（終了済み試合用）
 *
 * スコアを大きく表示し、勝ちカードには左グリーンボーダー + 薄いグリーン背景を付与する。
 * WIN/LOSSバッジを大きく表示し、勝利時は自チームスコアをグリーンで強調する。
 */
function FinishedGameCard({ game }: { game: GameWithOpponent }) {
  const win = isWin(game);
  const exScore = getExScore(game);
  const oppScore = getOppScore(game);

  // 勝ち試合: 薄いグリーン背景、負け試合: 通常のカード背景
  const cardBg = win ? "bg-[#e8f5ee]" : "bg-card";

  return (
    <Link href={`/games/${game.schedule_key}`}>
      <div
        className={`animate-fade-in-up rounded-xl border border-border ${cardBg} p-4 transition-shadow hover:shadow-md ${
          win ? "win-border" : "loss-border"
        }`}
      >
        {/* 日付 + バッジ行 */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatGameDate(game.game_date)}
          </span>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              {game.home_away}
            </Badge>
            {win !== null && (
              <Badge
                className={`text-sm px-2.5 py-0.5 ${
                  win ? "bg-win text-white" : "bg-loss text-white"
                }`}
              >
                {win ? "WIN" : "LOSS"}
              </Badge>
            )}
          </div>
        </div>

        {/* 対戦相手名 */}
        <p className="text-sm font-semibold text-foreground">
          vs {game.opponent.name}
        </p>

        {/* スコア（勝利時は自チームスコアをグリーンで強調） */}
        {exScore !== null && oppScore !== null && (
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`animate-number-pop font-display text-3xl leading-none ${
                win ? "font-bold text-win" : "text-foreground"
              }`}
            >
              {exScore}
            </span>
            <span className="font-display text-xl text-muted-foreground">-</span>
            <span className="animate-number-pop font-display text-3xl leading-none text-muted-foreground">
              {oppScore}
            </span>
            <Badge variant="secondary" className="ml-auto text-[10px]">
              FINAL
            </Badge>
          </div>
        )}

        {/* 会場 */}
        {game.venue && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Icon name="location_on" size={12} />
            {game.venue}
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * 試合カード（予定試合用）
 *
 * "vs" と対戦時刻を表示し、チケットリンクを付与する。
 * 点線ボーダーで予定試合であることを視覚的に区別する。
 */
function ScheduledGameCard({ game }: { game: GameWithOpponent }) {
  return (
    <Link href={`/games/${game.schedule_key}`}>
      <div className="rounded-xl border border-dashed border-border bg-card p-4 transition-shadow hover:shadow-md">
        {/* 日付 + バッジ行 */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatGameDate(game.game_date)}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {game.home_away}
          </Badge>
        </div>

        {/* 対戦相手名 */}
        <p className="text-sm font-semibold text-foreground">
          vs {game.opponent.name}
        </p>

        {/* vs + 時刻 */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-3xl leading-none text-muted-foreground">
            vs
          </span>
          {game.game_time && (
            <span className="text-sm text-muted-foreground">
              <Icon name="calendar_today" size={12} />
              {game.game_time}
            </span>
          )}
        </div>

        {/* 会場 + チケットリンク */}
        <div className="mt-2 flex items-center justify-between">
          {game.venue && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon name="location_on" size={12} />
              {game.venue}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            <Icon name="open_in_new" size={12} />
            チケット
          </span>
        </div>
      </div>
    </Link>
  );
}

// ================================================
// ページ本体
// ================================================

export default async function GamesPage() {
  // チーム成績と試合一覧を並列で取得
  const [teamStats, games] = await Promise.all([getTeamStats(), getGames()]);

  // チャート用データ（日付の古い順）
  const seasonRecordData = toSeasonRecordData(games);

  // 終了済み試合（新しい順）と今後の試合（古い順）に分割
  const finishedGames = games
    .filter((g) => g.status === "FINAL")
    .sort((a, b) => b.game_date.localeCompare(a.game_date));

  const scheduledGames = games
    .filter((g) => g.status !== "FINAL")
    .sort((a, b) => a.game_date.localeCompare(b.game_date));

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">試合一覧</h1>
        <p className="text-sm text-muted-foreground">2025-26 シーズン</p>
      </div>

      {/* シーズン概要カード */}
      <SeasonSummaryCards teamStats={teamStats} />

      {/* シーズン戦績チャート（旧ストリークバーの代替） */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <Icon name="timeline" size={16} />シーズン戦績
        </h2>
        <SeasonRecordChart data={seasonRecordData} />
      </section>

      {/* 終了済みの試合セクション */}
      {finishedGames.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="flex items-center gap-1.5 text-lg font-bold text-foreground">
              <Icon name="sports_score" size={20} />
              終了済みの試合
            </h2>
            <Badge variant="secondary" className="text-xs">
              {finishedGames.length}件
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {finishedGames.map((game) => (
              <FinishedGameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* 今後の試合セクション */}
      {scheduledGames.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="flex items-center gap-1.5 text-lg font-bold text-foreground">
              <Icon name="event" size={20} />
              今後の試合
            </h2>
            <Badge variant="secondary" className="text-xs">
              {scheduledGames.length}件
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scheduledGames.map((game) => (
              <ScheduledGameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* データが空の場合 */}
      {games.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            試合データがありません
          </p>
        </div>
      )}
    </div>
  );
}
