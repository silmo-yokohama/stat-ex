import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Bebas_Neue, Noto_Sans_JP, Alfa_Slab_One } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { PageTransition } from "@/components/layout/PageTransition";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { SITE } from "@/lib/constants";
import "./globals.css";

/**
 * Plus Jakarta Sans: メインフォント（ラテン文字・数字の視認性が高い）
 */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Bebas Neue: スコア・ディスプレイ用（スポーツ放送風の凝縮フォント）
 */
const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Noto Sans JP: 日本語フォント
 */
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Alfa Slab One: ロゴ専用フォント（太く力強いスラブセリフ）
 */
const alfaSlabOne = Alfa_Slab_One({
  variable: "--font-alfa-slab",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/**
 * サイト全体のメタデータ
 *
 * SEO・OGP・Twitter Card・ファビコン等の設定を一括管理する。
 * 各ページの固有メタデータは各 page.tsx の `metadata` エクスポートで上書きされる。
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://stat-ex.vercel.app"),
  title: {
    default: `${SITE.name} - ${SITE.description}`,
    template: `%s | ${SITE.name}`,
  },
  description: `${SITE.concept}。横浜エクセレンス（B.LEAGUE B2）の試合結果・選手スタッツ・チーム成績を一箇所に集約。`,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: SITE.name,
    title: `${SITE.name} - ${SITE.description}`,
    description: `${SITE.concept}。横浜エクセレンス（B.LEAGUE B2）の試合結果・選手スタッツ・チーム成績を一箇所に集約。`,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} - ${SITE.description}`,
    description: `${SITE.concept}。横浜エクセレンスの全試合・全選手スタッツを一箇所に。`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * ルートレイアウト
 *
 * 全ページ共通のヘッダー・フッター・フォント設定を提供する。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* Google Material Symbols（アイコンフォント） */}
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${jakarta.variable} ${bebas.variable} ${notoSansJP.variable} ${alfaSlabOne.variable} antialiased`}
      >
        <GoogleAnalytics />
        <div className="flex min-h-screen flex-col">
          <NavigationProgress />
          <Header />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
