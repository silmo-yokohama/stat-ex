import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

import { TEAM } from "@/lib/constants";
import { getGameDetail } from "@/lib/data";
import { isWin, getExScore, getOppScore } from "@/lib/data/games";
import type { GameDetail } from "@/lib/types/database";

import { Badge } from "@/components/ui/badge";
import { GameQuarterChart, GameScoreFlowChart } from "@/components/games/GameCharts";
import { LiveScoreboard } from "@/components/games/LiveScoreboard";
import { BoxScoreTable } from "@/components/games/BoxScoreTable";

/**
 * P3: 試合詳細ページ
 *
 * 1試合の全情報を集約するページ。
 * - スコアボードヘッダー（ビッグスコア + クォーター別得点）
 * - ボックススコアテーブル
 * - AI試合寸評
 * - 試合情報（会場・観客数・審判）
 */

// ================================================
// 型定義
// ================================================

type Props = {
  params: Promise<{ scheduleKey: string }>;
};

// ================================================
// メタデータ
// ================================================

/**
 * 動的メタデータ生成
 *
 * scheduleKey に基づいて試合情報を取得し、タイトルに反映する。
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { scheduleKey } = await params;
  const game = await getGameDetail(scheduleKey);

  if (!game) {
    return { title: "試合が見つかりません" };
  }

  // スコアがある場合はタイトルに含める
  const exScore = getExScore(game);
  const oppScore = getOppScore(game);
  const scoreText = exScore !== null && oppScore !== null ? ` ${exScore}-${oppScore}` : "";

  return {
    title: `vs ${game.opponent.short_name}${scoreText} - ${game.game_date}`,
  };
}

// ================================================
// ヘルパー
// ================================================

/**
 * 日付文字列を「YYYY年M月D日（曜日）」形式にフォーマットする
 */
function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日（${weekday}）`;
}

/**
 * クォーター得点テーブルのデータを構築する
 */
function buildQuarterScores(game: GameDetail): {
  label: string;
  homeScore: number | null;
  awayScore: number | null;
}[] {
  return [
    { label: "Q1", homeScore: game.q1_home, awayScore: game.q1_away },
    { label: "Q2", homeScore: game.q2_home, awayScore: game.q2_away },
    { label: "Q3", homeScore: game.q3_home, awayScore: game.q3_away },
    { label: "Q4", homeScore: game.q4_home, awayScore: game.q4_away },
    { label: "TOTAL", homeScore: game.score_home, awayScore: game.score_away },
  ];
}

/**
 * Q別得点チャート用のデータを構築する
 *
 * QuarterChart（棒グラフ）で使う各クォーターの得点データを返す。
 */
function buildQuarterChartData(
  game: GameDetail
): { quarter: string; home: number; away: number }[] {
  return [
    { quarter: "Q1", home: game.q1_home ?? 0, away: game.q1_away ?? 0 },
    { quarter: "Q2", home: game.q2_home ?? 0, away: game.q2_away ?? 0 },
    { quarter: "Q3", home: game.q3_home ?? 0, away: game.q3_away ?? 0 },
    { quarter: "Q4", home: game.q4_home ?? 0, away: game.q4_away ?? 0 },
  ];
}

/**
 * 文字列から簡易ハッシュ値を生成する
 *
 * schedule_key をシードとして使い、同じ試合は常に同じ得点分布パターンになるようにする。
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * クォーター得点を個別のスコアリングイベント（2点/3点/1点）に分解する
 *
 * バスケットボールの得点構成を模した分解:
 * - 約50%: 2ポイントシュート
 * - 約30%: 3ポイントシュート
 * - 約20%: フリースロー（1点）
 *
 * @param total - クォーターの合計得点
 * @param seed - 決定論的な得点パターン生成用のシード値
 * @returns 個別の得点値の配列（合計がtotalと一致することを保証）
 */
function decomposeScore(total: number, seed: number): number[] {
  if (total <= 0) return [];

  const events: number[] = [];
  let remaining = total;
  let i = 0;

  while (remaining > 0) {
    // シードベースで得点パターンを決定（擬似ランダム）
    const pattern = (seed + i * 7 + i * i * 3) % 10;
    let pts: number;

    if (remaining === 1) {
      pts = 1;
    } else if (remaining === 2) {
      pts = 2;
    } else if (pattern < 5) {
      pts = 2; // 50%: 2ポイント
    } else if (pattern < 8) {
      pts = 3; // 30%: 3ポイント
    } else {
      pts = 1; // 20%: フリースロー
    }

    events.push(pts);
    remaining -= pts;
    i++;
  }

  return events;
}

/**
 * Play-by-Play スコア推移データを構築する
 *
 * 各クォーターの得点を個別のスコアリングイベントに分解し、
 * 2チームの得点を交互にインターリーブして試合の流れを再現する。
 * schedule_key をシードに使い、同じ試合は常に同じパターンを生成する。
 *
 * @param game - 試合詳細データ
 * @returns 得点イベントごとの累積スコア配列
 */
function buildPlayByPlayData(
  game: GameDetail
): { homeTotal: number; awayTotal: number; quarter: string }[] {
  if (game.q1_home === null) return [];

  const quarters = [
    { home: game.q1_home ?? 0, away: game.q1_away ?? 0 },
    { home: game.q2_home ?? 0, away: game.q2_away ?? 0 },
    { home: game.q3_home ?? 0, away: game.q3_away ?? 0 },
    { home: game.q4_home ?? 0, away: game.q4_away ?? 0 },
  ];

  const seed = simpleHash(game.schedule_key);
  const points: { homeTotal: number; awayTotal: number; quarter: string }[] = [];
  let homeTotal = 0;
  let awayTotal = 0;

  // 試合開始点（0-0）
  points.push({ homeTotal: 0, awayTotal: 0, quarter: "START" });

  for (let qi = 0; qi < 4; qi++) {
    const q = quarters[qi];
    const qLabel = `Q${qi + 1}`;
    const qSeed = seed + qi * 31;

    // 各チームの得点をスコアリングイベントに分解
    const homeEvents = decomposeScore(q.home, qSeed);
    const awayEvents = decomposeScore(q.away, qSeed + 17);

    // 交互にスコアリングイベントを配置（時々連続得点 "ラン" を挟む）
    let hi = 0;
    let ai = 0;
    let turnHome = qSeed % 2 === 0;

    while (hi < homeEvents.length || ai < awayEvents.length) {
      // "ラン"のシミュレーション: 時々同じチームが2連続で得点
      const doRun = ((qSeed + hi + ai) * 13) % 5 === 0;
      const burst = doRun ? 2 : 1;

      for (let b = 0; b < burst; b++) {
        if (turnHome && hi < homeEvents.length) {
          homeTotal += homeEvents[hi++];
          points.push({ homeTotal, awayTotal, quarter: qLabel });
        } else if (!turnHome && ai < awayEvents.length) {
          awayTotal += awayEvents[ai++];
          points.push({ homeTotal, awayTotal, quarter: qLabel });
        } else if (hi < homeEvents.length) {
          homeTotal += homeEvents[hi++];
          points.push({ homeTotal, awayTotal, quarter: qLabel });
        } else if (ai < awayEvents.length) {
          awayTotal += awayEvents[ai++];
          points.push({ homeTotal, awayTotal, quarter: qLabel });
        }
      }

      turnHome = !turnHome;
    }
  }

  return points;
}

// ================================================
// サブコンポーネント
// ================================================

/**
 * スコアボードヘッダー
 *
 * 大きなスコア表示とクォーター別得点テーブル。
 * 勝利時は薄いグリーングラデーション背景でインパクトを出す。
 */
function Scoreboard({
  game,
  homeName,
  awayName,
}: {
  game: GameDetail;
  homeName: string;
  awayName: string;
}) {
  const win = isWin(game);
  const quarterScores = buildQuarterScores(game);

  // 勝利時はグラデーション背景を適用し、敗北・未確定時は通常背景
  const containerClass = win
    ? "rounded-xl border border-border overflow-hidden section-gradient p-6"
    : "rounded-xl border border-border overflow-hidden bg-card p-6";

  return (
    <div className={containerClass}>
      {/* ステータスバッジ */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground">{formatFullDate(game.game_date)}</span>
        {game.status === "FINAL" && <Badge variant="secondary">FINAL</Badge>}
        {game.status === "LIVE" && <Badge className="live-pulse bg-red-600 text-white">LIVE</Badge>}
        {game.status === "SCHEDULED" && <Badge variant="outline">{game.game_time ?? "TBD"}</Badge>}
      </div>

      {/* メインスコア */}
      <div className="flex items-center justify-center gap-6">
        {/* ホームチーム */}
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{homeName}</p>
          <p className="text-xs text-muted-foreground">HOME</p>
        </div>

        {/* スコア */}
        {game.score_home !== null && game.score_away !== null ? (
          <div className="flex items-center gap-3">
            <span
              className={`font-display text-6xl leading-none ${
                game.home_away === "HOME"
                  ? win
                    ? "text-foreground"
                    : "text-muted-foreground"
                  : win
                    ? "text-muted-foreground"
                    : "text-foreground"
              }`}
            >
              {game.score_home}
            </span>
            <span className="font-display text-4xl text-muted-foreground">-</span>
            <span
              className={`font-display text-6xl leading-none ${
                game.home_away === "AWAY"
                  ? win
                    ? "text-foreground"
                    : "text-muted-foreground"
                  : win
                    ? "text-muted-foreground"
                    : "text-foreground"
              }`}
            >
              {game.score_away}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="font-display text-5xl text-muted-foreground">vs</span>
          </div>
        )}

        {/* アウェイチーム */}
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{awayName}</p>
          <p className="text-xs text-muted-foreground">AWAY</p>
        </div>
      </div>

      {/* クォーター別得点テーブル */}
      {game.q1_home !== null && (
        <div className="mx-auto mt-6 max-w-md">
          <table className="w-full text-center text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-1 text-xs font-medium text-muted-foreground" />
                {quarterScores.map((q) => (
                  <th
                    key={q.label}
                    className={`py-1 text-xs font-medium text-muted-foreground ${
                      q.label === "TOTAL" ? "font-semibold" : ""
                    }`}
                  >
                    {q.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* ホーム行 */}
              <tr className="border-b border-border">
                <td className="py-1.5 text-xs font-medium text-foreground">{homeName}</td>
                {quarterScores.map((q) => (
                  <td
                    key={`home-${q.label}`}
                    className={`py-1.5 ${
                      q.label === "TOTAL"
                        ? "font-display text-lg font-bold text-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {q.homeScore ?? "-"}
                  </td>
                ))}
              </tr>
              {/* アウェイ行 */}
              <tr>
                <td className="py-1.5 text-xs font-medium text-foreground">{awayName}</td>
                {quarterScores.map((q) => (
                  <td
                    key={`away-${q.label}`}
                    className={`py-1.5 ${
                      q.label === "TOTAL"
                        ? "font-display text-lg font-bold text-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {q.awayScore ?? "-"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * AI試合寸評セクション
 *
 * Gemini による自動生成コメントをカード形式で表示する。
 */
function AICommentary({ content }: { content: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="smart_toy" size={20} className="text-primary" />
        <h2 className="text-lg font-semibold text-foreground">AI 試合寸評</h2>
      </div>
      <p className="leading-relaxed text-foreground">{content}</p>
      <p className="mt-3 text-xs text-muted-foreground">
        ※ この寸評はAI（Gemini）により自動生成されたものです。
      </p>
    </div>
  );
}

/**
 * 試合情報セクション
 *
 * 会場・観客数・審判の情報を表示する。
 */
function GameInfo({ game }: { game: GameDetail }) {
  // 表示する情報がない場合はレンダリングしない
  if (!game.venue && !game.attendance && !game.referee) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Icon name="info" size={20} className="text-primary" />
        試合情報
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {/* 会場 */}
        {game.venue && (
          <div className="flex items-start gap-2">
            <Icon name="location_on" size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">会場</p>
              <p className="text-sm font-medium text-foreground">{game.venue}</p>
            </div>
          </div>
        )}

        {/* 観客数 */}
        {game.attendance !== null && (
          <div className="flex items-start gap-2">
            <Icon name="group" size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">観客数</p>
              <p className="text-sm font-medium text-foreground">
                {game.attendance.toLocaleString()}人
              </p>
            </div>
          </div>
        )}

        {/* 審判 */}
        {game.referee && (
          <div className="flex items-start gap-2">
            <Icon name="gavel" size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">審判</p>
              <p className="text-sm font-medium text-foreground">{game.referee}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================
// ページ本体
// ================================================

export default async function GameDetailPage({ params }: Props) {
  const { scheduleKey } = await params;
  const game = await getGameDetail(scheduleKey);

  // 試合が見つからない場合は 404
  if (!game) {
    notFound();
  }

  // ホームチーム名・アウェイチーム名をページレベルで算出
  // （Scoreboard・チャートなど複数コンポーネントで共有するため）
  const homeName = game.home_away === "HOME" ? TEAM.shortName : game.opponent.short_name;
  const awayName = game.home_away === "HOME" ? game.opponent.short_name : TEAM.shortName;

  // チャート用データの事前計算
  const quarterChartData = buildQuarterChartData(game);
  const scoreFlowData = buildPlayByPlayData(game);

  // ライブモード判定
  const isLive = game.status === "LIVE";

  return (
    <div className="space-y-6">
      {/* 戻るリンク */}
      <Link
        href="/games"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon name="arrow_back" size={16} />
        試合一覧に戻る
      </Link>

      {isLive ? (
        /* ========================================
         * ライブモード: クライアントコンポーネントで
         * 30秒間隔自動更新するスコアボード＋ボックススコア
         * ======================================== */
        <LiveScoreboard
          scheduleKey={game.schedule_key}
          homeName={homeName}
          awayName={awayName}
          isExHome={game.home_away === "HOME"}
        />
      ) : (
        /* ========================================
         * 通常モード: Server Component で描画した
         * 確定データ（FINAL / SCHEDULED）
         * ======================================== */
        <>
          {/* セクション1: スコアボードヘッダー */}
          <Scoreboard game={game} homeName={homeName} awayName={awayName} />

          {/* セクション2: Q別スコア分析チャート（2列グリッド） */}
          {game.q1_home !== null && (
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Icon name="bar_chart" size={20} className="text-primary" />
                  Q別得点比較
                </h2>
                <GameQuarterChart
                  data={quarterChartData}
                  homeTeamName={homeName}
                  awayTeamName={awayName}
                />
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Icon name="show_chart" size={20} className="text-primary" />
                  スコア推移
                </h2>
                <GameScoreFlowChart
                  data={scoreFlowData}
                  homeTeamName={homeName}
                  awayTeamName={awayName}
                />
              </div>
            </section>
          )}

          {/* セクション3: ボックススコアテーブル（タブ切替・ソート付き） */}
          <BoxScoreTable
            boxScores={game.box_scores}
            isExHome={game.home_away === "HOME"}
            homeName={homeName}
            awayName={awayName}
          />

          {/* セクション4: AI試合寸評 */}
          {game.comment && <AICommentary content={game.comment.content} />}
        </>
      )}

      {/* セクション5: 試合情報（ライブ・通常共通） */}
      <GameInfo game={game} />
    </div>
  );
}
