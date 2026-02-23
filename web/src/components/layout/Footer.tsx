import { SITE } from "@/lib/constants";
import { Icon } from "@/components/ui/Icon";

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
          <p className="flex items-center gap-1">
            <Icon name="info" size={14} />
            データ出典:{" "}
            <a
              href="https://www.bleague.jp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 underline hover:text-primary"
            >
              B.LEAGUE公式
              <Icon name="open_in_new" size={10} />
            </a>
            {" / "}
            <a
              href="https://sports.yahoo.co.jp/basket/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 underline hover:text-primary"
            >
              スポナビ
              <Icon name="open_in_new" size={10} />
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
