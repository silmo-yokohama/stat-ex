/**
 * STAT-EX データアクセス層
 *
 * 現在はモックデータを返す。Supabase接続後は各関数の中身をDBクエリに置き換える。
 * フロントエンドのコンポーネントはこのモジュール経由でデータを取得する。
 */

export {
  getLatestGame,
  getNextGame,
  getGames,
  getGameByScheduleKey,
  getGameDetail,
} from "./games";

export {
  getPlayers,
  getPlayerById,
  getPlayerAverage,
  getPlayerGameLog,
} from "./players";

export {
  getTeamStats,
  getStandings,
  getH2HRecords,
  getInjuries,
  getTeamLeaders,
  getMonthlyRecord,
  getQuarterTrend,
} from "./team";

export {
  getNews,
  getVideos,
  getMascot,
} from "./content";
