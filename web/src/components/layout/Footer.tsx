import { SITE } from "@/lib/constants";

/**
 * グローバルフッター
 *
 * データ出典・最終更新日時を表示
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-muted">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <p>
            データ出典:{" "}
            <a
              href="https://www.bleague.jp"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              B.LEAGUE公式
            </a>
            {" / "}
            <a
              href="https://sports.yahoo.co.jp/basket/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              スポナビ
            </a>
          </p>
          <p>
            &copy; {new Date().getFullYear()} {SITE.name} - {SITE.description}
          </p>
        </div>
      </div>
    </footer>
  );
}
