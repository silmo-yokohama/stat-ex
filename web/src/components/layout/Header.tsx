"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, SITE, TICKET_URL } from "@/lib/constants";
import { Icon } from "@/components/ui/Icon";

/**
 * グローバルヘッダー
 *
 * サイトロゴ（Alfa Slab One フォント）+ デスクトップナビ + モバイルフルスクリーンメニュー。
 * ハンバーガーアイコンは3本線 → X にCSSモーフィングする。
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // メニュー展開中はbodyスクロールを無効化
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      <header
        className={`sticky top-0 border-b backdrop-blur-sm transition-colors duration-300 ${
          isMenuOpen ? "z-110 border-transparent bg-transparent" : "z-50 border-border bg-white/95"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {/* サイトロゴ（Alfa Slab One: 太く力強いスラブセリフ） */}
          <Link href="/" className="flex items-center gap-2">
            <span
              className={`font-logo text-[26px] leading-none transition-colors duration-300 ${
                isMenuOpen ? "text-white" : ""
              }`}
            >
              <span className={isMenuOpen ? "text-white" : "text-foreground"}>STAT</span>
              <span className={isMenuOpen ? "text-white/70" : "text-primary"}>-EX</span>
            </span>
            <span
              className={`hidden text-[10px] font-medium tracking-widest uppercase sm:inline transition-colors duration-300 ${
                isMenuOpen ? "text-white/50" : "text-muted-foreground"
              }`}
            >
              {SITE.description}
            </span>
          </Link>

          {/* デスクトップナビゲーション（アイコン付き） */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-light text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon name={item.icon} size={18} />
                  {item.label}
                </Link>
              );
            })}
            <a
              href={TICKET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              <Icon name="confirmation_number" size={16} />
              チケット
            </a>
          </nav>

          {/* ================================================
           * モバイルハンバーガーボタン
           * 3本線 → X へのCSSモーフィングアニメーション
           * ================================================ */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative z-110 flex h-10 w-10 flex-col items-center justify-center gap-[5px] md:hidden"
            aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={isMenuOpen}
          >
            {/* 上の線: 開くと下にずれて45度回転 */}
            <span
              className={`block h-[2px] w-6 transition-all duration-300 ease-out ${
                isMenuOpen ? "translate-y-[7px] rotate-45 bg-white" : "bg-foreground"
              }`}
            />
            {/* 中央の線: 開くと消える */}
            <span
              className={`block h-[2px] w-6 transition-all duration-300 ease-out ${
                isMenuOpen ? "scale-x-0 opacity-0" : "bg-foreground"
              }`}
            />
            {/* 下の線: 開くと上にずれて-45度回転 */}
            <span
              className={`block h-[2px] w-6 transition-all duration-300 ease-out ${
                isMenuOpen ? "-translate-y-[7px] -rotate-45 bg-white" : "bg-foreground"
              }`}
            />
          </button>
        </div>
      </header>

      {/* ================================================
       * モバイルフルスクリーンメニュー
       * ダークグリーングラデーションが画面下から滑り込み、
       * メニュー項目は左からスタガードで入場する。
       *
       * 重要: position: fixed 等の重要スタイルは Tailwind ユーティリティ
       * またはインラインスタイルで直接指定する（Tailwind v4 のカスケード
       * レイヤーでカスタムCSS が上書きされる問題を回避）。
       * ================================================ */}
      <div
        className={`fixed inset-0 z-100 overflow-y-auto md:hidden ${
          isMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{
          background: "linear-gradient(160deg, #003d22 0%, #006d3b 40%, #00a85a 100%)",
          transform: isMenuOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
        }}
        aria-hidden={!isMenuOpen}
      >
        <div className="flex min-h-screen flex-col px-8 pb-10 pt-24">
          {/* ナビゲーションリンク（アイコン付き） */}
          <nav className="flex flex-1 flex-col justify-center gap-2">
            {NAV_ITEMS.map((item, index) => {
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-lg font-semibold transition-colors ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                  style={{
                    opacity: isMenuOpen ? 1 : 0,
                    transform: isMenuOpen ? "translateX(0)" : "translateX(-24px)",
                    transition: isMenuOpen
                      ? `opacity 0.4s ease-out ${0.1 + index * 0.05}s, transform 0.4s ease-out ${0.1 + index * 0.05}s`
                      : "none",
                  }}
                >
                  <Icon name={item.icon} size={22} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* チケット購入ボタン */}
          <a
            href={TICKET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-white/20 px-5 py-3 text-base font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            style={{
              opacity: isMenuOpen ? 1 : 0,
              transform: isMenuOpen ? "translateX(0)" : "translateX(-24px)",
              transition: isMenuOpen
                ? `opacity 0.4s ease-out 0.35s, transform 0.4s ease-out 0.35s`
                : "none",
            }}
          >
            <Icon name="confirmation_number" size={20} />
            チケット購入
          </a>

          {/* サイト情報 */}
          <p
            className="mt-6 text-center text-xs text-white/40"
            style={{
              opacity: isMenuOpen ? 1 : 0,
              transition: isMenuOpen ? "opacity 0.4s ease-out 0.4s" : "none",
            }}
          >
            {SITE.description}
          </p>
        </div>
      </div>
    </>
  );
}
