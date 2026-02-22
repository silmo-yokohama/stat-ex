/**
 * Supabase サーバーサイドクライアント
 *
 * Server Components や API Route から使用する。
 * anon キーを使用するため、RLSが適用される（READ ONLY）。
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * サーバーサイド用 Supabase クライアントを作成する
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component から呼ばれた場合は set できないが、問題ない
          }
        },
      },
    }
  );
}
