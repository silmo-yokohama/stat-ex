/**
 * コンテンツデータ取得関数（ニュース・動画・マスコット）
 *
 * 現在はモックデータを返す。Supabase接続後はDBクエリに置き換える。
 */

import type { News, Video, Mascot, NewsSource } from "@/lib/types/database";
import { mockNews, mockVideos, mockMascot } from "@/lib/mock-data";

// ================================================
// コンテンツ取得関数
// ================================================

/**
 * ニュース一覧を取得する（ソースフィルタ対応）
 *
 * @param source ニュースソース（official/media）、未指定で全件
 * @param limit 取得件数（デフォルト10）
 */
export async function getNews(
  source?: NewsSource,
  limit: number = 10
): Promise<News[]> {
  let news = [...mockNews];

  if (source) {
    news = news.filter((n) => n.source === source);
  }

  // 公開日時の新しい順
  news.sort((a, b) => b.published_at.localeCompare(a.published_at));

  return news.slice(0, limit);
}

/**
 * YouTube動画一覧を取得する
 *
 * @param limit 取得件数（デフォルト10）
 */
export async function getVideos(limit: number = 10): Promise<Video[]> {
  return [...mockVideos]
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
    .slice(0, limit);
}

/**
 * マスコット情報を取得する
 */
export async function getMascot(): Promise<Mascot> {
  return mockMascot;
}
