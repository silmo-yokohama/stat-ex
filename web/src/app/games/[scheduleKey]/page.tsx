import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare, MapPin, Users, Gavel } from "lucide-react";

import { TEAM } from "@/lib/constants";
import { getGameDetail } from "@/lib/data";
import { isWin, getExScore, getOppScore } from "@/lib/data/games";
import type { GameDetail, BoxScore, Player } from "@/lib/types/database";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  GameQuarterChart,
  GameScoreFlowChart,
} from "@/components/games/GameCharts";

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
  const scoreText =
    exScore !== null && oppScore !== null
      ? ` ${exScore}-${oppScore}`
      : "";

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
 * スコアフローチャート用の累積スコアデータを構築する
 *
 * 各クォーター終了時点での累積得点を計算し、
 * ScoreFlowChart（折れ線グラフ）で使うデータを返す。
 */
function buildScoreFlowData(
  game: GameDetail
): { label: string; homeTotal: number; awayTotal: number }[] {
  const q1h = game.q1_home ?? 0;
  const q1a = game.q1_away ?? 0;
  const q2h = game.q2_home ?? 0;
  const q2a = game.q2_away ?? 0;
  const q3h = game.q3_home ?? 0;
  const q3a = game.q3_away ?? 0;
  const q4h = game.q4_home ?? 0;
  const q4a = game.q4_away ?? 0;

  return [
    { label: "Q1", homeTotal: q1h, awayTotal: q1a },
    { label: "Q2", homeTotal: q1h + q2h, awayTotal: q1a + q2a },
    { label: "Q3", homeTotal: q1h + q2h + q3h, awayTotal: q1a + q2a + q3a },
    {
      label: "FINAL",
      homeTotal: q1h + q2h + q3h + q4h,
      awayTotal: q1a + q2a + q3a + q4a,
    },
  ];
}

/**
 * ボックススコアから得点上位3名のIDセットを取得する
 */
function getTopIds(
  boxScores: (BoxScore & { player: Player })[],
  key: "pts" | "eff"
): Set<string> {
  return new Set(
    [...boxScores]
      .sort((a, b) => b[key] - a[key])
      .slice(0, 3)
      .map((bs) => bs.id)
  );
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
        <span className="text-sm text-muted-foreground">
          {formatFullDate(game.game_date)}
        </span>
        {game.status === "FINAL" && (
          <Badge variant="secondary">FINAL</Badge>
        )}
        {game.status === "LIVE" && (
          <Badge className="live-pulse bg-red-600 text-white">LIVE</Badge>
        )}
        {game.status === "SCHEDULED" && (
          <Badge variant="outline">
            {game.game_time ?? "TBD"}
          </Badge>
        )}
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
            <span className="font-display text-5xl text-muted-foreground">
              vs
            </span>
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
                <td className="py-1.5 text-xs font-medium text-foreground">
                  {homeName}
                </td>
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
                <td className="py-1.5 text-xs font-medium text-foreground">
                  {awayName}
                </td>
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
 * ボックススコアテーブル
 *
 * 選手別の個人成績を一覧表示する。
 * - スターターは太字で強調
 * - 得点(PTS)上位3名はセル背景をハイライト
 * - EFF上位3名はテキストをグリーン太字で強調
 * - +/-がプラスならグリーン、マイナスなら赤で色分け
 */
function BoxScoreTable({
  boxScores,
}: {
  boxScores: (BoxScore & { player: Player })[];
}) {
  if (boxScores.length === 0) return null;

  // スターターを先頭に表示
  const sorted = [...boxScores].sort((a, b) => {
    if (a.is_starter && !b.is_starter) return -1;
    if (!a.is_starter && b.is_starter) return 1;
    return 0;
  });

  // 得点上位3名・EFF上位3名のIDセットを算出
  const ptsTop3 = getTopIds(boxScores, "pts");
  const effTop3 = getTopIds(boxScores, "eff");

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        ボックススコア
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>選手名</TableHead>
            <TableHead className="text-center">MIN</TableHead>
            <TableHead className="text-center">PTS</TableHead>
            <TableHead className="text-center">FG%</TableHead>
            <TableHead className="text-center">3P%</TableHead>
            <TableHead className="text-center">FT%</TableHead>
            <TableHead className="text-center">REB</TableHead>
            <TableHead className="text-center">AST</TableHead>
            <TableHead className="text-center">TO</TableHead>
            <TableHead className="text-center">STL</TableHead>
            <TableHead className="text-center">BLK</TableHead>
            <TableHead className="text-center">F</TableHead>
            <TableHead className="text-center">EFF</TableHead>
            <TableHead className="text-center">+/-</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((bs, index) => {
            const rowClass = bs.is_starter ? "font-semibold" : "";
            // スターターとベンチの境界にセパレータを挿入するためのフラグ
            const isFirstBench =
              !bs.is_starter &&
              index > 0 &&
              sorted[index - 1].is_starter;

            // 得点上位3名はセル背景をハイライト
            const isPtsTop = ptsTop3.has(bs.id);
            const ptsHighlight = isPtsTop ? "bg-[#e8f5ee]" : "";

            // EFF上位3名はテキストをグリーン太字で強調
            const isEffTop = effTop3.has(bs.id);
            const effHighlight = isEffTop
              ? "text-[#006d3b] font-bold"
              : "";

            // +/-の色分け: プラスはグリーン、マイナスは赤
            const plusMinusColor =
              bs.plus_minus > 0
                ? "text-[#006d3b]"
                : bs.plus_minus < 0
                  ? "text-[#ef4444]"
                  : "";

            return (
              <TableRow
                key={bs.id}
                className={`${isFirstBench ? "border-t-2 border-border" : ""}`}
              >
                <TableCell className={`text-center ${rowClass}`}>
                  {bs.player.number ?? "-"}
                </TableCell>
                <TableCell className={rowClass}>
                  {bs.player.name}
                </TableCell>
                <TableCell className={`text-center ${rowClass}`}>
                  {bs.minutes ?? "-"}
                </TableCell>
                {/* 得点: 上位3名はセル背景ハイライト */}
                <TableCell
                  className={`text-center ${rowClass} ${ptsHighlight}`}
                >
                  {bs.pts}
                </TableCell>
                <TableCell className={`text-center ${rowClass}`}>
                  {bs.fg_pct !== null ? `${bs.fg_pct}%` : "-"}
                </TableCell>
                <TableCell className={`text-center ${rowClass}`}>
                  {bs.tp_pct !== null ? `${bs.tp_pct}%` : "-"}
                </TableCell>
                <TableCell className={`text-center ${rowClass}`}>
                  {bs.ft_pct !== null ? `${bs.ft_pct}%` : "-"}
                </TableCell>
                <TableCell className={`text-center ${rowClass}`}>
                  {bs.reb}
                </TableCell>
                <TableCell className={`text-center ${rowClass}`}>
                  {bs.ast}
                </TableCell>
                <TableCell className={`text-center ${rowClass}`}>
                  {bs.tov}
                </TableCell>
                <TableCell className={`text-center ${rowClass}`}>
                  {bs.stl}
                </TableCell>
                <TableCell className={`text-center ${rowClass}`}>
                  {bs.blk}
                </TableCell>
                <TableCell className={`text-center ${rowClass}`}>
                  {bs.fouls}
                </TableCell>
                {/* EFF: 上位3名はグリーン太字で強調 */}
                <TableCell
                  className={`text-center ${rowClass} ${effHighlight}`}
                >
                  {bs.eff}
                </TableCell>
                {/* +/-: プラスはグリーン、マイナスは赤 */}
                <TableCell
                  className={`text-center ${rowClass} ${plusMinusColor}`}
                >
                  {bs.plus_minus > 0 ? `+${bs.plus_minus}` : bs.plus_minus}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
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
        <MessageSquare size={18} className="text-primary" />
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
function GameInfo({
  game,
}: {
  game: GameDetail;
}) {
  // 表示する情報がない場合はレンダリングしない
  if (!game.venue && !game.attendance && !game.referee) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-3 text-lg font-semibold text-foreground">試合情報</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {/* 会場 */}
        {game.venue && (
          <div className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">会場</p>
              <p className="text-sm font-medium text-foreground">{game.venue}</p>
            </div>
          </div>
        )}

        {/* 観客数 */}
        {game.attendance !== null && (
          <div className="flex items-start gap-2">
            <Users size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
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
            <Gavel size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">審判</p>
              <p className="text-sm font-medium text-foreground">
                {game.referee}
              </p>
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
  const homeName =
    game.home_away === "HOME" ? TEAM.shortName : game.opponent.short_name;
  const awayName =
    game.home_away === "HOME" ? game.opponent.short_name : TEAM.shortName;

  // チャート用データの事前計算
  const quarterChartData = buildQuarterChartData(game);
  const scoreFlowData = buildScoreFlowData(game);

  return (
    <div className="space-y-6">
      {/* 戻るリンク */}
      <Link
        href="/games"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} />
        試合一覧に戻る
      </Link>

      {/* セクション1: スコアボードヘッダー */}
      <Scoreboard game={game} homeName={homeName} awayName={awayName} />

      {/* セクション2: Q別スコア分析チャート（2列グリッド） */}
      {game.q1_home !== null && (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Q別得点比較</h2>
            <GameQuarterChart
              data={quarterChartData}
              homeTeamName={homeName}
              awayTeamName={awayName}
            />
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">スコア推移</h2>
            <GameScoreFlowChart
              data={scoreFlowData}
              homeTeamName={homeName}
              awayTeamName={awayName}
            />
          </div>
        </section>
      )}

      {/* セクション3: ボックススコアテーブル */}
      <BoxScoreTable boxScores={game.box_scores} />

      {/* セクション4: AI試合寸評 */}
      {game.comment && <AICommentary content={game.comment.content} />}

      {/* セクション5: 試合情報 */}
      <GameInfo game={game} />
    </div>
  );
}
