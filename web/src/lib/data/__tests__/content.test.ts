/**
 * コンテンツデータ取得関数のテスト
 *
 * getNews, getVideos, getMascot をテストする。
 */

import { describe, it, expect } from "vitest";
import { getNews, getVideos, getMascot } from "@/lib/data/content";
import { mockNews, mockVideos, mockMascot } from "@/lib/mock-data";

// ================================================
// getNews
// ================================================

describe("getNews", () => {
  it("引数なしで全ニュースを返す（デフォルト10件上限）", async () => {
    const news = await getNews();

    // モックデータ全10件 <= デフォルトlimit 10 なので全件返る
    expect(news).toHaveLength(mockNews.length);
  });

  it("公開日時の新しい順にソートされている", async () => {
    const news = await getNews();

    for (let i = 0; i < news.length - 1; i++) {
      const current = news[i].published_at;
      const next = news[i + 1].published_at;
      // 降順（新しい順）
      expect(current.localeCompare(next)).toBeGreaterThanOrEqual(0);
    }
  });

  it("source 'official' でフィルタリングできる", async () => {
    const news = await getNews("official");
    const expectedCount = mockNews.filter((n) => n.source === "official").length;

    expect(news).toHaveLength(expectedCount);
    news.forEach((n) => {
      expect(n.source).toBe("official");
    });
  });

  it("source 'media' でフィルタリングできる", async () => {
    const news = await getNews("media");
    const expectedCount = mockNews.filter((n) => n.source === "media").length;

    expect(news).toHaveLength(expectedCount);
    news.forEach((n) => {
      expect(n.source).toBe("media");
    });
  });

  it("limitで取得件数を制限できる", async () => {
    const limit = 3;
    const news = await getNews(undefined, limit);

    expect(news).toHaveLength(limit);
  });

  it("sourceとlimitを組み合わせてフィルタリングできる", async () => {
    const limit = 2;
    const news = await getNews("official", limit);

    expect(news.length).toBeLessThanOrEqual(limit);
    news.forEach((n) => {
      expect(n.source).toBe("official");
    });
  });

  it("limit=1で最新の1件のみ返す", async () => {
    const news = await getNews(undefined, 1);

    expect(news).toHaveLength(1);

    // 全ニュース中で最新のpublished_atであることを確認
    const allSorted = [...mockNews].sort((a, b) =>
      b.published_at.localeCompare(a.published_at)
    );
    expect(news[0].id).toBe(allSorted[0].id);
  });
});

// ================================================
// getVideos
// ================================================

describe("getVideos", () => {
  it("動画一覧を返す（デフォルト10件上限）", async () => {
    const videos = await getVideos();

    // モックデータ5件 <= デフォルトlimit 10 なので全件返る
    expect(videos).toHaveLength(mockVideos.length);
  });

  it("公開日時の新しい順にソートされている", async () => {
    const videos = await getVideos();

    for (let i = 0; i < videos.length - 1; i++) {
      const current = videos[i].published_at;
      const next = videos[i + 1].published_at;
      // 降順（新しい順）
      expect(current.localeCompare(next)).toBeGreaterThanOrEqual(0);
    }
  });

  it("limitで取得件数を制限できる", async () => {
    const limit = 2;
    const videos = await getVideos(limit);

    expect(videos).toHaveLength(limit);
  });

  it("各動画にvideo_id, title, published_atが含まれる", async () => {
    const videos = await getVideos();

    videos.forEach((v) => {
      expect(v).toHaveProperty("video_id");
      expect(v).toHaveProperty("title");
      expect(v).toHaveProperty("published_at");
      expect(typeof v.video_id).toBe("string");
      expect(typeof v.title).toBe("string");
      expect(v.video_id.length).toBeGreaterThan(0);
    });
  });
});

// ================================================
// getMascot
// ================================================

describe("getMascot", () => {
  it("マスコット情報を返す", async () => {
    const mascot = await getMascot();

    expect(mascot).toBeDefined();
    expect(mascot.name).toBe(mockMascot.name);
  });

  it("profile_jsonにプロフィール情報が含まれる", async () => {
    const mascot = await getMascot();

    expect(mascot.profile_json).not.toBeNull();
    expect(mascot.profile_json).toHaveProperty("birthday");
    expect(mascot.profile_json).toHaveProperty("personality");
    expect(mascot.profile_json).toHaveProperty("description");
  });

  it("マスコット名が「エクセル」である", async () => {
    const mascot = await getMascot();

    expect(mascot.name).toBe("エクセル");
  });
});
