import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * 外部画像の最適化許可リスト
   *
   * Supabase接続後にB.LEAGUE公式・スポナビ等から選手画像を取得するため、
   * next/image で使用する外部ドメインを事前に許可しておく。
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.bleague.jp",
      },
      {
        protocol: "https",
        hostname: "**.sportsnavi.yahoo.co.jp",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
};

export default nextConfig;
