import { test, expect } from "@playwright/test";

test.describe("トップページ", () => {
  test("ページが正常に表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/STAT-EX/);
  });
});
