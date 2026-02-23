"use client";

/**
 * ライブスコアボード コンポーネント
 *
 * 試合中（status === "LIVE"）にAPIポーリングでリアルタイムデータを取得し、
 * スコアボード・クォーター得点・ボックススコアを自動更新する。
 *
 * - 30秒間隔の自動更新（setInterval）
 * - visibilitychange で非アクティブタブ時に停止
 * - 手動更新ボタン + 最終更新日時表示
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { LIVE_UPDATE_INTERVAL } from "@/lib/constants";

// ================================================
// 型定義
// ================================================

/** API Route のレスポンス型 */
type LiveGameScore = {
  schedule_key: string;
  home_team_name: string;
  away_team_name: string;
  score_home: number | null;
  score_away: number | null;
  q1_home: number | null;
  q1_away: number | null;
  q2_home: number | null;
  q2_away: number | null;
  q3_home: number | null;
  q3_away: number | null;
  q4_home: number | null;
  q4_away: number | null;
  venue: string;
  attendance: number | null;
};

type LiveBoxScore = {
  player_id: string;
  player_name: string;
  player_number: string;
  team_side: "home" | "away";
  is_starter: boolean;
  minutes: string;
  pts: number;
  fgm: number;
  fga: number;
  fg_pct: number | null;
  tpm: number;
  tpa: number;
  tp_pct: number | null;
  ftm: number;
  fta: number;
  ft_pct: number | null;
  or_reb: number;
  dr_reb: number;
  reb: number;
  ast: number;
  tov: number;
  stl: number;
  blk: number;
  fouls: number;
  eff: number;
  plus_minus: number;
};

type LiveResponse = {
  game: LiveGameScore;
  home_box_scores: LiveBoxScore[];
  away_box_scores: LiveBoxScore[];
  fetched_at: string;
};

/** コンポーネントのProps */
type LiveScoreboardProps = {
  /** scheduleKey（API Route呼び出し用） */
  scheduleKey: string;
  /** ホームチーム名 */
  homeName: string;
  /** アウェイチーム名 */
  awayName: string;
  /** 横浜EXがホーム側かどうか */
  isExHome: boolean;
};

// ================================================
// メインコンポーネント
// ================================================

/**
 * ライブスコアボード
 *
 * 試合中にマウントされ、30秒間隔でB.LEAGUEからリアルタイムデータを取得する。
 */
export function LiveScoreboard({
  scheduleKey,
  homeName,
  awayName,
  isExHome,
}: LiveScoreboardProps) {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * APIからライブデータを取得する
   */
  const fetchLiveData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/live/${scheduleKey}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ?? `取得エラー: HTTP ${response.status}`
        );
      }

      const result: LiveResponse = await response.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "データの取得に失敗しました";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [scheduleKey]);

  /**
   * ポーリングを開始する
   */
  const startPolling = useCallback(() => {
    // 既存のインターバルをクリア
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(fetchLiveData, LIVE_UPDATE_INTERVAL);
  }, [fetchLiveData]);

  /**
   * ポーリングを停止する
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 初回取得 + ポーリング開始
  useEffect(() => {
    fetchLiveData();
    startPolling();

    return () => stopPolling();
  }, [fetchLiveData, startPolling, stopPolling]);

  // visibilitychange で非アクティブタブ時にポーリング停止
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // タブがアクティブに戻ったら即時取得 + ポーリング再開
        fetchLiveData();
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchLiveData, startPolling, stopPolling]);

  /**
   * 手動更新ハンドラ
   */
  const handleManualRefresh = () => {
    fetchLiveData();
    // ポーリングタイマーをリセット（次の自動更新まで30秒）
    startPolling();
  };

  // データ未取得時のローディング表示
  if (!data && isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-card p-12">
        <div className="text-center">
          <Icon
            name="sync"
            size={32}
            className="mx-auto mb-2 animate-spin text-primary"
          />
          <p className="text-sm text-muted-foreground">
            ライブデータを取得中...
          </p>
        </div>
      </div>
    );
  }

  // 横浜EX側のスコア（勝敗判定用）
  const exScore = data
    ? isExHome
      ? data.game.score_home
      : data.game.score_away
    : null;
  const oppScore = data
    ? isExHome
      ? data.game.score_away
      : data.game.score_home
    : null;

  // 横浜EX側のボックススコア
  const exBoxScores = data
    ? isExHome
      ? data.home_box_scores
      : data.away_box_scores
    : [];

  return (
    <div className="space-y-6">
      {/* ライブステータスバー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className="live-pulse bg-red-600 text-white">LIVE</Badge>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              最終更新: {lastUpdated.toLocaleTimeString("ja-JP")}
            </span>
          )}
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          <Icon
            name="refresh"
            size={14}
            className={isLoading ? "animate-spin" : ""}
          />
          更新
        </button>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <Icon name="error" size={16} className="mr-1 inline-block" />
          {error}
        </div>
      )}

      {/* スコアボード */}
      {data && (
        <LiveScoreboardCard
          game={data.game}
          homeName={homeName}
          awayName={awayName}
          exScore={exScore}
          oppScore={oppScore}
        />
      )}

      {/* 横浜EX ボックススコアテーブル */}
      {exBoxScores.length > 0 && (
        <LiveBoxScoreTable boxScores={exBoxScores} />
      )}
    </div>
  );
}

// ================================================
// サブコンポーネント
// ================================================

/**
 * ライブスコアボードカード
 *
 * 大きなスコア表示とクォーター別得点テーブル。
 */
function LiveScoreboardCard({
  game,
  homeName,
  awayName,
  exScore,
  oppScore,
}: {
  game: LiveGameScore;
  homeName: string;
  awayName: string;
  exScore: number | null;
  oppScore: number | null;
}) {
  // 試合中は勝敗グラデーションなし
  const isLeading =
    exScore !== null && oppScore !== null && exScore > oppScore;

  const containerClass = isLeading
    ? "rounded-xl border border-border overflow-hidden section-gradient p-6"
    : "rounded-xl border border-border overflow-hidden bg-card p-6";

  const quarterScores = [
    { label: "Q1", homeScore: game.q1_home, awayScore: game.q1_away },
    { label: "Q2", homeScore: game.q2_home, awayScore: game.q2_away },
    { label: "Q3", homeScore: game.q3_home, awayScore: game.q3_away },
    { label: "Q4", homeScore: game.q4_home, awayScore: game.q4_away },
    { label: "TOTAL", homeScore: game.score_home, awayScore: game.score_away },
  ];

  return (
    <div className={containerClass}>
      {/* メインスコア */}
      <div className="flex items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{homeName}</p>
          <p className="text-xs text-muted-foreground">HOME</p>
        </div>

        {game.score_home !== null && game.score_away !== null ? (
          <div className="flex items-center gap-3">
            <span className="font-display text-6xl leading-none text-foreground">
              {game.score_home}
            </span>
            <span className="font-display text-4xl text-muted-foreground">
              -
            </span>
            <span className="font-display text-6xl leading-none text-foreground">
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
 * ライブボックススコアテーブル
 *
 * リアルタイム取得した選手別スタッツを表示する。
 * DB版と同じハイライトロジック（得点上位3名、EFF上位3名、+/-色分け）を適用。
 */
function LiveBoxScoreTable({
  boxScores,
}: {
  boxScores: LiveBoxScore[];
}) {
  if (boxScores.length === 0) return null;

  // スターターを先頭に表示
  const sorted = [...boxScores].sort((a, b) => {
    if (a.is_starter && !b.is_starter) return -1;
    if (!a.is_starter && b.is_starter) return 1;
    return 0;
  });

  // 得点上位3名・EFF上位3名のID
  const ptsTop3 = new Set(
    [...boxScores]
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 3)
      .map((bs) => bs.player_id)
  );
  const effTop3 = new Set(
    [...boxScores]
      .sort((a, b) => b.eff - a.eff)
      .slice(0, 3)
      .map((bs) => bs.player_id)
  );

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Icon name="table_chart" size={20} className="text-primary" />
        ボックススコア
        <Badge className="live-pulse bg-red-600 text-white text-[10px]">
          LIVE
        </Badge>
      </h2>
      <div className="overflow-x-auto">
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
              const isFirstBench =
                !bs.is_starter &&
                index > 0 &&
                sorted[index - 1].is_starter;

              const isPtsTop = ptsTop3.has(bs.player_id);
              const ptsHighlight = isPtsTop ? "bg-[#e8f5ee]" : "";

              const isEffTop = effTop3.has(bs.player_id);
              const effHighlight = isEffTop
                ? "text-[#006d3b] font-bold"
                : "";

              const plusMinusColor =
                bs.plus_minus > 0
                  ? "text-[#006d3b]"
                  : bs.plus_minus < 0
                    ? "text-[#ef4444]"
                    : "";

              return (
                <TableRow
                  key={bs.player_id}
                  className={`${isFirstBench ? "border-t-2 border-border" : ""} ${index % 2 === 1 ? "bg-muted/50" : ""}`}
                >
                  <TableCell className={`text-center ${rowClass}`}>
                    {bs.player_number || "-"}
                  </TableCell>
                  <TableCell className={rowClass}>
                    {bs.player_name}
                  </TableCell>
                  <TableCell className={`text-center ${rowClass}`}>
                    {bs.minutes || "-"}
                  </TableCell>
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
                  <TableCell
                    className={`text-center ${rowClass} ${effHighlight}`}
                  >
                    {bs.eff}
                  </TableCell>
                  <TableCell
                    className={`text-center ${rowClass} ${plusMinusColor}`}
                  >
                    {bs.plus_minus > 0
                      ? `+${bs.plus_minus}`
                      : bs.plus_minus}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
