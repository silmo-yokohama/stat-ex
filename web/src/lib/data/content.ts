/**
 * コンテンツデータ取得関数（ニュース・動画・マスコット）
 *
 * Supabase から Server Components 経由でデータを取得する。
 */

import { createClient } from "@/lib/supabase/server";
import type { News, Video, Mascot, NewsSource } from "@/lib/types/database";

// ================================================
// コンテンツ取得関数
// ================================================

/**
 * ニュース一覧を取得する（ソースフィルタ対応）
 *
 * @param source ニュースソース（official/media）、未指定で全件
 * @param limit 取得件数（デフォルト10）
 */
export async function getNews(source?: NewsSource, limit: number = 10): Promise<News[]> {
  const supabase = await createClient();

  let query = supabase
    .from("news")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (source) {
    query = query.eq("source", source);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return data as unknown as News[];
}

/**
 * YouTube動画一覧を取得する
 *
 * @param limit 取得件数（デフォルト10）
 */
export async function getVideos(limit: number = 10): Promise<Video[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as unknown as Video[];
}

/**
 * マスコット情報を取得する
 */
export async function getMascot(): Promise<Mascot | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("mascot").select("*").limit(1).single();

  if (error || !data) return null;
  return data as unknown as Mascot;
}
