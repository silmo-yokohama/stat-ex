"use client";

import { usePathname } from "next/navigation";

/**
 * ページ遷移アニメーションラッパー
 *
 * pathname をキーとして DOM を再マウントし、
 * CSS アニメーション（fade-in + slide-up）をトリガーする。
 * 初回表示時にもアニメーションが再生される。
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-page-enter">
      {children}
    </div>
  );
}
