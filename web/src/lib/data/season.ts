/**
 * シーズン関連のデータ取得ヘルパー
 *
 * 現在のシーズンIDをDBから取得する。
 * React の cache() で同一レンダリング内での重複クエリを防ぐ。
 */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSeasonYear } from "@/lib/constants";

/**
 * 現在シーズンのUUIDをDBから取得する
 *
 * B.LEAGUEのシーズンは10月〜翌年5月。
 * getCurrentSeasonYear() で算出した年を使ってseasonsテーブルを引く。
 * React cache() により同一レンダリング内では1回しかDBアクセスしない。
 *
 * @returns シーズンUUID（見つからない場合はnull）
 */
export const getCurrentSeasonId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const year = getCurrentSeasonYear();

  const { data, error } = await supabase
    .from("seasons")
    .select("id")
    .eq("year", year)
    .single();

  if (error || !data) return null;
  return data.id as string;
});
