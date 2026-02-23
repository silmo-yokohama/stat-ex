"use client";

/**
 * Google Analytics 4 コンポーネント
 *
 * NEXT_PUBLIC_GA_ID 環境変数が設定されている場合のみ GA4 スクリプトを読み込む。
 * 未設定時やローカル開発時はスクリプトを挿入しない。
 */

import Script from "next/script";

/** GA4 測定ID（環境変数から取得） */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google Analytics 4 スクリプトタグ
 *
 * layout.tsx の <body> 内に配置する。
 * afterInteractive 戦略で、ページの初期読み込みをブロックしない。
 */
export function GoogleAnalytics() {
  // GA IDが未設定の場合はレンダリングしない（ローカル開発環境対応）
  if (!GA_ID) return null;

  return (
    <>
      {/* gtag.js ライブラリの読み込み */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      {/* gtag 初期化 */}
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
