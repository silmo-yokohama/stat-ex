/**
 * Supabase クライアントサイドクライアント
 *
 * Client Components（"use client"）から使用する。
 * 主にリアルタイム更新機能で使用する。
 */

import { createBrowserClient } from "@supabase/ssr";

/**
 * クライアントサイド用 Supabase クライアントを作成する
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
