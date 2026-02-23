/**
 * STAT-EX データアクセス層
 *
 * Supabase から Server Components 経由でデータを取得する。
 * フロントエンドのコンポーネントはこのモジュール経由でデータを取得する。
 */

export { getLatestGame, getNextGame, getGames, getGameByScheduleKey, getGameDetail } from "./games";

export { getPlayers, getPlayerById, getPlayerAverage, getPlayerGameLog } from "./players";

export {
  getTeamStats,
  getStandings,
  getH2HRecords,
  getInjuries,
  getTeamLeaders,
  getMonthlyRecord,
  getQuarterTrend,
} from "./team";

export { getNews, getVideos, getMascot } from "./content";
