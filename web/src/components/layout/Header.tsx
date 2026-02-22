import Link from "next/link";
import { NAV_ITEMS, SITE } from "@/lib/constants";

/**
 * グローバルヘッダー
 *
 * サイトロゴ + グローバルナビゲーション
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* サイトロゴ */}
        <Link href="/" className="text-xl font-bold text-primary">
          {SITE.name}
        </Link>

        {/* デスクトップナビゲーション */}
        <nav className="hidden gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* TODO: モバイルハンバーガーメニュー */}
      </div>
    </header>
  );
}
