/**
 * Vitest テストセットアップ
 *
 * Supabase クライアントとシーズンIDのモックを登録する。
 * 全テストファイルで共通のモック設定を適用。
 */

import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import { createMockSupabaseClient } from "./mock-supabase";

// Supabase サーバークライアントをモック
// createClient() がモッククライアントを返すようにする
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => createMockSupabaseClient()),
}));

// シーズンID取得をモック（モックデータの season-0001 を返す）
vi.mock("@/lib/data/season", () => ({
  getCurrentSeasonId: vi.fn(async () => "season-0001"),
}));
