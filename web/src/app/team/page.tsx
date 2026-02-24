import type { Metadata } from "next";
import Link from "next/link";
import {
  getTeamStats,
  getStandings,
  getH2HRecords,
  getInjuries,
  getMonthlyRecord,
  getQuarterTrend,
  getGames,
} from "@/lib/data";
import { isWin } from "@/lib/data/games";
import { getCurrentSeasonName } from "@/lib/constants";
import {
  TeamMonthlyChart,
  TeamQuarterRadar,
  TeamHomeAwayDonut,
  TeamCumulativeWins,
} from "@/components/team/TeamCharts";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/Icon";
import { ChartHelpButton } from "@/components/ui/ChartHelpButton";
import { CHART_HELP, TEAM_STATS } from "@/lib/glossary";
import { GamesAbove500Chart } from "@/components/charts/GamesAbove500Chart";
import { H2HTable } from "@/components/team/H2HTable";
import { buildPennantRaceData } from "@/lib/data/pennant-race";
import { TEAM } from "@/lib/constants";
import type { Game } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "チーム成績",
  description: "横浜エクセレンスのシーズン成績、対戦成績、ケガ人情報を確認できます。",
};

/**
 * 全試合データから累積勝利数を計算する
 *
 * シーズン全日程（終了済み + 未消化）を横軸に表示するため、
 * 終了済みの試合には累積勝利数を、未消化の試合にはnullを設定する。
 * 理想ペース（勝率60%想定）はシーズン全日程分を生成する。
 *
 * @param games - 全試合データ（GameWithOpponent配列）
 * @returns 試合番号・累積勝利数（null=未消化）・理想ペースの配列
 */
function buildCumulativeWins(
  games: Game[]
): { game: number; wins: number | null; ideal: number }[] {
  const totalGames = games.length;

  // 終了済み試合を日付昇順でソート
  const finished = games
    .filter((g) => g.status === "FINAL")
    .sort((a, b) => a.game_date.localeCompare(b.game_date));

  const data: { game: number; wins: number | null; ideal: number }[] = [];
  let wins = 0;

  // 終了済み試合: 累積勝利数を計算
  finished.forEach((g, i) => {
    const isWinResult = isWin(g);
    if (isWinResult) wins++;

    data.push({
      game: i + 1,
      wins,
      ideal: Math.round((i + 1) * 0.6 * 10) / 10,
    });
  });

  // 未消化試合: 理想ペースのみ表示（累積勝利数はnull）
  for (let i = finished.length; i < totalGames; i++) {
    data.push({
      game: i + 1,
      wins: null,
      ideal: Math.round((i + 1) * 0.6 * 10) / 10,
    });
  }

  return data;
}

/**
 * P6: チーム成績ページ
 *
 * チーム全体のパフォーマンスを分析するページ。
 * - シーズンサマリー（W-L、勝率、平均得点、平均失点）
 * - ホーム vs アウェイ比較（ドーナツチャート付き）
 * - 月別成績チャート
 * - Q別得点傾向レーダーチャート
 * - シーズン推移（累積勝利数チャート）
 * - H2H対戦成績テーブル
 * - インジュアリーリスト
 */
export default async function TeamPage() {
  // 全データを並行取得
  const [teamStats, standings, h2hRecords, injuries, monthlyRecord, quarterTrend, games] =
    await Promise.all([
      getTeamStats(),
      getStandings(),
      getH2HRecords(),
      getInjuries(),
      getMonthlyRecord(),
      getQuarterTrend(),
      getGames(),
    ]);

  // 累積勝利数データを構築
  const cumulativeWinsData = buildCumulativeWins(games);

  // ペナントレースチャート用データを構築
  // 横浜EXの試合結果を日付昇順で取得し、勝敗のみの配列にする
  const exGameResults = [...games]
    .filter((g) => g.status === "FINAL")
    .sort((a, b) => a.game_date.localeCompare(b.game_date))
    .map((g) => isWin(g) === true);

  const pennantRaceData = buildPennantRaceData(standings, exGameResults, TEAM.shortName);

  return (
    <div className="space-y-8">
      {/* ページタイトル */}
      <div>
        <h1 className="text-2xl font-bold">チーム成績</h1>
        <p className="text-sm text-muted-foreground">{getCurrentSeasonName()}シーズン</p>
      </div>

      {/* ================================================
       * セクション1: シーズンサマリー
       * 4カード: W-L、勝率、平均得点、平均失点
       * アクセントカラー付きのカードで視覚的に区別
       * ================================================ */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon name="analytics" size={20} className="text-primary" />
          Season Summary
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <SummaryCard
            label="W-L"
            value={`${teamStats.wins}-${teamStats.losses}`}
            sublabel="勝敗"
            accentClass="stat-card-green"
            animationClass="animate-fade-in-up delay-1"
          />
          <SummaryCard
            label="Win%"
            value={teamStats.win_pct !== null ? `${teamStats.win_pct.toFixed(1)}%` : "-"}
            sublabel="勝率"
            description={TEAM_STATS["Win%"].shortDesc}
            accentClass="stat-card-emerald"
            animationClass="animate-fade-in-up delay-2"
          />
          <SummaryCard
            label="PF"
            value={teamStats.avg_points_for !== null ? teamStats.avg_points_for.toFixed(1) : "-"}
            sublabel="平均得点"
            description={TEAM_STATS.PF.shortDesc}
            accentClass="stat-card-teal"
            animationClass="animate-fade-in-up delay-3"
          />
          <SummaryCard
            label="PA"
            value={
              teamStats.avg_points_against !== null ? teamStats.avg_points_against.toFixed(1) : "-"
            }
            sublabel="平均失点"
            description={TEAM_STATS.PA.shortDesc}
            accentClass="stat-card-indigo"
            animationClass="animate-fade-in-up delay-4"
          />
        </div>
      </section>

      {/* ================================================
       * セクション2: ホーム vs アウェイ
       * 勝敗カード2枚 + ドーナツチャート
       * ================================================ */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <Icon name="compare_arrows" size={20} className="text-primary" />
          Home vs Away
          <ChartHelpButton details={CHART_HELP.homeAwayDonut.details} />
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {CHART_HELP.homeAwayDonut.summary}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* ホーム成績カード（薄いグリーングラデーション背景） */}
          <div className="section-gradient rounded-xl border border-border p-6">
            <div className="mb-2 flex items-center gap-2">
              <Icon name="home" size={16} />
              <h3 className="font-semibold text-foreground">ホーム</h3>
            </div>
            <p className="font-display text-4xl text-[#006d3b]">
              {teamStats.home_wins}-{teamStats.home_losses}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              勝率{" "}
              {teamStats.home_wins + teamStats.home_losses > 0
                ? (
                    (teamStats.home_wins / (teamStats.home_wins + teamStats.home_losses)) *
                    100
                  ).toFixed(1)
                : "0.0"}
              %
            </p>
          </div>

          {/* アウェイ成績カード（白背景にグレーアクセント） */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-2 flex items-center gap-2">
              <Icon name="flight" size={16} />
              <h3 className="font-semibold text-foreground">アウェイ</h3>
            </div>
            <p className="font-display text-4xl text-foreground">
              {teamStats.away_wins}-{teamStats.away_losses}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              勝率{" "}
              {teamStats.away_wins + teamStats.away_losses > 0
                ? (
                    (teamStats.away_wins / (teamStats.away_wins + teamStats.away_losses)) *
                    100
                  ).toFixed(1)
                : "0.0"}
              %
            </p>
          </div>
        </div>

        {/* ホーム／アウェイ勝率ドーナツチャート */}
        <div className="mt-4">
          <TeamHomeAwayDonut
            homeWins={teamStats.home_wins}
            homeLosses={teamStats.home_losses}
            awayWins={teamStats.away_wins}
            awayLosses={teamStats.away_losses}
          />
        </div>
      </section>

      {/* ================================================
       * セクション3: 月別成績チャート
       * 月ごとの勝敗を積み上げ棒グラフで表示
       * ================================================ */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <Icon name="calendar_month" size={20} className="text-primary" />
          月別成績
          <ChartHelpButton details={CHART_HELP.monthlyRecord.details} />
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {CHART_HELP.monthlyRecord.summary}
        </p>
        <TeamMonthlyChart data={monthlyRecord} />
      </section>

      {/* ================================================
       * セクション4: Q別得点傾向チャート
       * クォーターごとの平均得点・失点をレーダーチャートで表示
       * ================================================ */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <Icon name="radar" size={20} className="text-primary" />
          Q別得点傾向
          <ChartHelpButton details={CHART_HELP.quarterRadar.details} />
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {CHART_HELP.quarterRadar.summary}
        </p>
        <TeamQuarterRadar data={quarterTrend} />
      </section>

      {/* ================================================
       * セクション5: シーズン推移
       * 累積勝利数と理想ペース（勝率60%）の比較チャート
       * ================================================ */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <Icon name="trending_up" size={20} className="text-primary" />
          シーズン推移
          <ChartHelpButton details={CHART_HELP.cumulativeWins.details} />
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {CHART_HELP.cumulativeWins.summary}
        </p>
        <TeamCumulativeWins data={cumulativeWinsData} />
      </section>

      {/* ================================================
       * セクション6: ペナントレース（貯金/借金推移チャート）
       * 全チームのシーズン推移を折れ線グラフで可視化
       * ================================================ */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <Icon name="trending_up" size={20} className="text-primary" />
          B2 ペナントレース
          <ChartHelpButton details={CHART_HELP.gamesAbove500.details} />
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {CHART_HELP.gamesAbove500.summary}
        </p>
        <div className="rounded-xl border border-border bg-card p-6">
          {pennantRaceData.length > 0 ? (
            <GamesAbove500Chart teams={pennantRaceData} />
          ) : (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              データがありません
            </div>
          )}
        </div>
      </section>

      {/* ================================================
       * セクション7: H2H対戦成績
       * shadcn Table で対戦相手ごとの勝敗・平均得点/失点を表示
       * 勝敗差の大きい順にソート済み
       * ================================================ */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <Icon name="swap_horiz" size={20} className="text-primary" />
          H2H 対戦成績
          <ChartHelpButton details={CHART_HELP.h2h.details} />
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {CHART_HELP.h2h.summary}
        </p>
        <div className="rounded-xl border border-border bg-card">
          <H2HTable data={h2hRecords} />
        </div>
      </section>

      {/* ================================================
       * セクション8: インジュアリーリスト
       * ケガで離脱中の選手を一覧表示
       * ================================================ */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon name="healing" size={20} className="text-primary" />
          Injury List
        </h2>
        {injuries.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
            <p>現在ケガ人はいません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {injuries.map((injury) => (
              <Link
                key={injury.id}
                href={`/players/${injury.player_id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-shadow hover:shadow-md"
              >
                {/* 背番号 */}
                <span className="font-display text-2xl text-[#9CA3AF]">
                  #{injury.player_number ?? "-"}
                </span>

                <Separator orientation="vertical" className="h-8" />

                {/* 選手名と理由 */}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{injury.player_name}</p>
                  <p className="text-sm text-muted-foreground">{injury.reason}</p>
                </div>

                {/* 登録日 */}
                <span className="shrink-0 text-xs text-muted-foreground">
                  {injury.registered_date}
                </span>

                {/* 矢印アイコン */}
                <Icon name="chevron_right" size={18} className="shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * サマリーカードコンポーネント
 *
 * シーズン成績の主要指標を1つ表示するカード。
 * 上辺のアクセントカラーとフェードインアニメーションで視覚的に強調する。
 *
 * @param label - 英略称（例: "W-L", "Win%"）
 * @param value - 表示する値（フォーマット済み文字列）
 * @param sublabel - 日本語ラベル（例: "勝敗"）
 * @param description - スタッツの簡潔な説明（カード下部に表示）
 * @param accentClass - 上辺アクセントカラーのCSSクラス（例: "stat-card-green"）
 * @param animationClass - アニメーション用のCSSクラス（例: "animate-fade-in-up delay-1"）
 */
function SummaryCard({
  label,
  value,
  sublabel,
  description,
  accentClass,
  animationClass,
}: {
  label: string;
  value: string;
  sublabel: string;
  description?: string;
  accentClass: string;
  animationClass: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 text-center ${accentClass} ${animationClass}`}
    >
      <p className="text-xs text-muted-foreground">{sublabel}</p>
      <p className="font-display text-3xl leading-tight text-[#006d3b]">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {description && (
        <p className="mt-1 text-[10px] text-muted-foreground/70">{description}</p>
      )}
    </div>
  );
}
