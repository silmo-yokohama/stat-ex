import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, MapPin, ExternalLink } from "lucide-react";

import { getGames, getTeamStats } from "@/lib/data";
import { isWin, getExScore, getOppScore } from "@/lib/data/games";
import type { GameWithOpponent, TeamStats } from "@/lib/types/database";

import { Badge } from "@/components/ui/badge";

/**
 * P2: 試合一覧ページ
 *
 * シーズン全試合（終了済み + 予定）を一覧で確認。
 * - ストリークバー（勝敗を色で可視化）
 * - 試合カードグリッド（終了済み / 予定）
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
        <p className="text-xs text-muted-foreground">勝敗</p>
        <p className="font-display text-3xl leading-tight text-foreground">
          {teamStats.wins}-{teamStats.losses}
        </p>
      </div>

      {/* 勝率 */}
      <div className="stat-card-emerald rounded-xl border border-border bg-card p-4 text-center animate-fade-in-up delay-2">
        <p className="text-xs text-muted-foreground">勝率</p>
        <p className="font-display text-3xl leading-tight text-foreground">
          {winPctDisplay}
        </p>
      </div>

      {/* ホーム成績 */}
      <div className="stat-card-teal rounded-xl border border-border bg-card p-4 text-center animate-fade-in-up delay-3">
        <p className="text-xs text-muted-foreground">ホーム</p>
        <p className="font-display text-3xl leading-tight text-foreground">
          {teamStats.home_wins}-{teamStats.home_losses}
        </p>
      </div>

      {/* アウェイ成績 */}
      <div className="stat-card-indigo rounded-xl border border-border bg-card p-4 text-center animate-fade-in-up delay-4">
        <p className="text-xs text-muted-foreground">アウェイ</p>
        <p className="font-display text-3xl leading-tight text-foreground">
          {teamStats.away_wins}-{teamStats.away_losses}
        </p>
      </div>
    </section>
  );
}

/**
 * ストリークバー
 *
 * 全試合を時系列順に小さなブロックで表示し、
 * 勝ち=グリーン、負け=グレー、予定=白枠で可視化する。
 */
function StreakBar({ games }: { games: GameWithOpponent[] }) {
  // 日付の古い順にソート（時系列表示のため）
  const sortedGames = [...games].sort((a, b) =>
    a.game_date.localeCompare(b.game_date)
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {sortedGames.map((game) => {
        const win = isWin(game);
        const exScore = getExScore(game);
        const oppScore = getOppScore(game);

        // ブロックの背景色（勝ち=グリーン、負け=グレー、予定=白枠）
        let bgClass = "border border-border bg-white"; // 予定
        if (win === true) bgClass = "bg-win";
        if (win === false) bgClass = "bg-loss";

        // ツールチップ: 対戦相手名＋スコア（終了済みのみ）
        const titleText =
          exScore !== null && oppScore !== null
            ? `vs ${game.opponent.short_name} ${exScore}-${oppScore}`
            : `${formatGameDate(game.game_date)} vs ${game.opponent.short_name}`;

        return (
          <Link
            key={game.id}
            href={`/games/${game.schedule_key}`}
            title={titleText}
            className={`h-7 w-7 rounded transition-transform hover:scale-125 ${bgClass}`}
          />
        );
      })}
    </div>
  );
}

/**
 * 試合カード（終了済み試合用）
 *
 * スコアを大きく表示し、勝ちカードには左グリーンボーダーを付与する。
 */
function FinishedGameCard({ game }: { game: GameWithOpponent }) {
  const win = isWin(game);
  const exScore = getExScore(game);
  const oppScore = getOppScore(game);

  // 勝ち試合にはグラデーション背景、負け試合は通常背景
  const cardBg = win ? "section-gradient" : "bg-card";

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
                className={
                  win ? "bg-win text-white" : "bg-loss text-white"
                }
              >
                {win ? "W" : "L"}
              </Badge>
            )}
          </div>
        </div>

        {/* 対戦相手名 */}
        <p className="text-sm font-semibold text-foreground">
          vs {game.opponent.name}
        </p>

        {/* スコア */}
        {exScore !== null && oppScore !== null && (
          <div className="mt-2 flex items-baseline gap-2">
            <span className="animate-number-pop font-display text-3xl leading-none text-foreground">
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
            <MapPin size={12} />
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
 */
function ScheduledGameCard({ game }: { game: GameWithOpponent }) {
  return (
    <Link href={`/games/${game.schedule_key}`}>
      <div className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
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
              <Calendar size={12} className="mr-1 inline" />
              {game.game_time}
            </span>
          )}
        </div>

        {/* 会場 + チケットリンク */}
        <div className="mt-2 flex items-center justify-between">
          {game.venue && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={12} />
              {game.venue}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            <ExternalLink size={12} />
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

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">試合一覧</h1>
        <p className="text-sm text-muted-foreground">2025-26 シーズン</p>
      </div>

      {/* シーズン概要カード */}
      <SeasonSummaryCards teamStats={teamStats} />

      {/* ストリークバー */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          シーズン戦績
        </h2>
        <StreakBar games={games} />
      </section>

      {/* 試合カードグリッド */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) =>
          game.status === "FINAL" ? (
            <FinishedGameCard key={game.id} game={game} />
          ) : (
            <ScheduledGameCard key={game.id} game={game} />
          )
        )}
      </section>

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
