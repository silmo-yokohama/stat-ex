/**
 * ペナントレースチャート用データ構築ヘルパー
 *
 * 順位表データと横浜EXの試合結果から、
 * 全チームのシーズン推移データを生成する。
 *
 * - 横浜EX: 試合結果から実際の推移を計算
 * - 他チーム: 最終成績から線形補間で推移を近似
 * - 各チームに地区情報（東地区/西地区）を付与
 *   - DBの division カラムを優先、なければ B2_DIVISIONS 定数でフォールバック
 */

import type { PennantRaceTeam } from "@/components/charts/GamesAbove500Chart";
import { B2_DIVISIONS } from "@/lib/constants";

/** buildPennantRaceData が受け取る順位表の1行型 */
type StandingInput = {
  short_name: string;
  wins: number;
  losses: number;
  /** DBから取得した地区情報（あればこちらを優先） */
  division?: string | null;
};

/**
 * ペナントレースデータを構築する
 *
 * 横浜EXの推移は実際の試合結果（勝敗の配列）から正確に計算し、
 * 他チームの推移は最終成績（W-L）から線形補間で近似する。
 * 地区情報はDBデータを優先し、なければ定数テーブルでフォールバックする。
 *
 * @param standings - 順位表（チーム名・勝敗・地区情報含む）
 * @param exGameResults - 横浜EXの試合結果（日付昇順、true=勝ち）
 * @param exShortName - 横浜EXの短縮名
 * @returns 全チームの推移データ（地区情報付き）
 */
export function buildPennantRaceData(
  standings: StandingInput[],
  exGameResults: boolean[],
  exShortName: string
): PennantRaceTeam[] {
  // 横浜EXの累積 gamesAbove500 を試合ごとに計算
  let wins = 0;
  let losses = 0;
  const exProgression = exGameResults.map((isWin) => {
    if (isWin) wins++;
    else losses++;
    return (wins - losses) / 2;
  });

  return standings.map((s) => {
    // 地区情報: DBデータを優先、なければ定数テーブルでフォールバック
    const division = (s.division as "東地区" | "西地区" | null)
      ?? B2_DIVISIONS[s.short_name]
      ?? null;

    // 横浜EXは実データを使用
    if (s.short_name === exShortName) {
      return {
        teamName: s.short_name,
        isExcellence: true,
        division,
        progression: exProgression,
      };
    }

    // 他チーム: 0 → 最終値 を線形補間
    // 実際の試合データがないため、最終成績に向けて直線的に推移すると仮定
    const totalGames = s.wins + s.losses;
    const finalGA = (s.wins - s.losses) / 2;
    const progression: number[] = [];

    for (let i = 1; i <= totalGames; i++) {
      // 0.5刻みに丸めて現実的な推移にする
      const raw = (i / totalGames) * finalGA;
      progression.push(Math.round(raw * 2) / 2);
    }

    return {
      teamName: s.short_name,
      isExcellence: false,
      division,
      progression,
    };
  });
}
