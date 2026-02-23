/**
 * リアルタイム試合データ API Route
 *
 * B.LEAGUE 公式サイトの game_detail ページから試合データを直接取得し、
 * クライアントに返す。DB書き込みは行わない（22:00バッチで確定データを格納）。
 *
 * GET /api/live/[scheduleKey]
 */

import { NextRequest, NextResponse } from "next/server";

// ================================================
// 定数
// ================================================

const BLEAGUE_BASE_URL = "https://www.bleague.jp";
const USER_AGENT = "STAT-EX/1.0 (+https://stat-ex.vercel.app)";

/**
 * リクエストタイムアウト（ミリ秒）
 * Vercel無料枠のタイムアウト10秒以内に収めるため、8秒に設定
 */
const FETCH_TIMEOUT_MS = 8_000;

// ================================================
// 型定義
// ================================================

/** ライブスコア・クォーター別得点 */
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

/** ライブボックススコア（1選手分） */
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

/** APIレスポンス型 */
type LiveResponse = {
  game: LiveGameScore;
  home_box_scores: LiveBoxScore[];
  away_box_scores: LiveBoxScore[];
  fetched_at: string;
};

/** エラーレスポンス型 */
type ErrorResponse = {
  error: string;
  schedule_key: string;
};

// ================================================
// メインハンドラ
// ================================================

/**
 * GET /api/live/[scheduleKey]
 *
 * B.LEAGUE game_detail からリアルタイムデータを取得して返す。
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scheduleKey: string }> }
): Promise<NextResponse<LiveResponse | ErrorResponse>> {
  const { scheduleKey } = await params;

  // ScheduleKey のバリデーション（数字のみ許可）
  if (!/^\d+$/.test(scheduleKey)) {
    return NextResponse.json(
      { error: "無効なScheduleKeyです", schedule_key: scheduleKey },
      { status: 400 }
    );
  }

  try {
    const result = await fetchLiveGameData(scheduleKey);

    return NextResponse.json(result, {
      headers: {
        // 10秒キャッシュ（CDN経由でのリクエスト頻度を抑制）
        "Cache-Control": "public, max-age=10, s-maxage=10",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラーが発生しました";

    return NextResponse.json({ error: message, schedule_key: scheduleKey }, { status: 502 });
  }
}

// ================================================
// データ取得・パース
// ================================================

/**
 * B.LEAGUE game_detail ページからライブデータを取得する
 *
 * HTML内のJSオブジェクト（_contexts_s3id.data）を抽出してJSONパースする。
 * スクレイパー（bleague.py fetch_box_score）のTypeScript移植版。
 */
async function fetchLiveGameData(scheduleKey: string): Promise<LiveResponse> {
  const url = `${BLEAGUE_BASE_URL}/game_detail/?ScheduleKey=${scheduleKey}&tab=2`;

  // タイムアウト付きfetch
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let html: string;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
      // Next.js のキャッシュを無効化（常に最新データを取得）
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`B.LEAGUEサイトからの取得失敗: HTTP ${response.status}`);
    }

    html = await response.text();
  } finally {
    clearTimeout(timeoutId);
  }

  // HTML内のJSオブジェクトからゲームデータを抽出
  const gameData = extractGameDataFromHtml(html);
  if (!gameData) {
    throw new Error("ゲームデータの抽出に失敗しました");
  }

  // ゲーム情報を構築
  const game: LiveGameScore = {
    schedule_key: scheduleKey,
    home_team_name: String(gameData.HomeTeamName ?? ""),
    away_team_name: String(gameData.AwayTeamName ?? ""),
    score_home: safeInt(gameData.HomeTeamScore),
    score_away: safeInt(gameData.AwayTeamScore),
    q1_home: safeInt(gameData.HomeTeamScore01),
    q1_away: safeInt(gameData.AwayTeamScore01),
    q2_home: safeInt(gameData.HomeTeamScore02),
    q2_away: safeInt(gameData.AwayTeamScore02),
    q3_home: safeInt(gameData.HomeTeamScore03),
    q3_away: safeInt(gameData.AwayTeamScore03),
    q4_home: safeInt(gameData.HomeTeamScore04),
    q4_away: safeInt(gameData.AwayTeamScore04),
    venue: String(gameData.Arena ?? ""),
    attendance: safeInt(gameData.Attendance),
  };

  // ボックススコアをパース（配列でなければ空配列にフォールバック）
  const rawHome = gameData.HomeBoxscores;
  const rawAway = gameData.AwayBoxscores;
  const homeBoxScores = parseBoxScores(Array.isArray(rawHome) ? rawHome : [], "home");
  const awayBoxScores = parseBoxScores(Array.isArray(rawAway) ? rawAway : [], "away");

  return {
    game,
    home_box_scores: homeBoxScores,
    away_box_scores: awayBoxScores,
    fetched_at: new Date().toISOString(),
  };
}

/**
 * HTML内のJSオブジェクトからゲームデータを抽出する
 *
 * B.LEAGUE公式サイトの試合詳細ページでは、`_contexts_s3id.data` に
 * JSONデータが埋め込まれている。
 */
function extractGameDataFromHtml(html: string): Record<string, unknown> | null {
  // パターン1: _contexts_s3id.data = {...};
  // ※ ES2017ターゲットのため s フラグの代わりに [\s\S] を使用
  const patterns = [
    /_contexts_s3id\.data\s*=\s*(\{[\s\S]*?\});/,
    /__NEXT_DATA__[\s\S]*?"gameDetail"\s*:\s*(\{[\s\S]*?\})\s*[,}]/,
    /data-game-detail=['"](\\{[\s\S]*?\\})['"]/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1]) as Record<string, unknown>;
      } catch {
        continue;
      }
    }
  }

  // フォールバック: scriptタグからJSONを探す
  const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch: RegExpExecArray | null;

  while ((scriptMatch = scriptPattern.exec(html)) !== null) {
    const text = scriptMatch[1];
    if (text.includes("HomeBoxscores") || text.includes("HomeTeamScore01")) {
      // JSONっぽい部分を抽出
      const jsonMatch = text.match(/\{[\s\S]*"HomeTeamScore01"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
        } catch {
          continue;
        }
      }
    }
  }

  return null;
}

/**
 * ボックススコア配列をパースする
 *
 * B.LEAGUE APIのフィールド名をSTAT-EXのカラム名にマッピングする。
 */
function parseBoxScores(boxScores: unknown[], teamSide: "home" | "away"): LiveBoxScore[] {
  const result: LiveBoxScore[] = [];

  for (const raw of boxScores) {
    if (!raw || typeof raw !== "object") continue;
    const bs = raw as Record<string, unknown>;

    try {
      result.push({
        player_id: String(bs.PlayerID ?? ""),
        player_name: String(bs.PlayerName ?? ""),
        player_number: String(bs.PlayerNo ?? ""),
        team_side: teamSide,
        is_starter: String(bs.StartingFlg) === "1",
        minutes: String(bs.PlayingTime ?? ""),
        pts: safeInt(bs.Point) ?? 0,
        fgm: safeInt(bs.FieldGoalsMade) ?? 0,
        fga: safeInt(bs.FieldGoalsAttempted) ?? 0,
        fg_pct: safeFloat(bs.FieldGoalsPercentage),
        tpm: safeInt(bs.ThreePointersMade) ?? 0,
        tpa: safeInt(bs.ThreePointersAttempted) ?? 0,
        tp_pct: safeFloat(bs.ThreePointersPercentage),
        ftm: safeInt(bs.FreeThrowsMade) ?? 0,
        fta: safeInt(bs.FreeThrowsAttempted) ?? 0,
        ft_pct: safeFloat(bs.FreeThrowsPercentage),
        or_reb: safeInt(bs.OffensiveRebounds) ?? 0,
        dr_reb: safeInt(bs.DefensiveRebounds) ?? 0,
        reb: safeInt(bs.Rebounds) ?? 0,
        ast: safeInt(bs.Assists) ?? 0,
        tov: safeInt(bs.Turnovers) ?? 0,
        stl: safeInt(bs.Steals) ?? 0,
        blk: safeInt(bs.BlockShots) ?? 0,
        fouls: safeInt(bs.Fouls) ?? 0,
        eff: safeInt(bs.Efficiency) ?? 0,
        plus_minus: safeInt(bs.PlusMinus) ?? 0,
      });
    } catch {
      // パースエラーは無視して続行
      continue;
    }
  }

  return result;
}

// ================================================
// ヘルパー
// ================================================

/** 安全に整数値に変換する（変換できない場合はnull） */
function safeInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** 安全に小数値に変換する（変換できない場合はnull） */
function safeFloat(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}
