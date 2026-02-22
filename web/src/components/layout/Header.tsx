"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS, SITE, TICKET_URL } from "@/lib/constants";

/**
 * グローバルヘッダー
 *
 * サイトロゴ + グローバルナビゲーション + モバイルメニュー
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* サイトロゴ */}
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl tracking-wider text-primary">
            {SITE.name}
          </span>
          <span className="hidden text-[10px] font-medium tracking-widest text-muted-foreground uppercase sm:inline">
            Stats × Excellence
          </span>
        </Link>

        {/* デスクトップナビゲーション */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <a
            href={TICKET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            チケット
          </a>
        </nav>

        {/* モバイルハンバーガーボタン */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted md:hidden"
          aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* モバイルメニュー */}
      {isMenuOpen && (
        <nav className="border-t border-border bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-light text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <a
              href={TICKET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 rounded-md bg-primary px-3 py-2.5 text-center text-sm font-semibold text-white"
            >
              チケット購入
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
