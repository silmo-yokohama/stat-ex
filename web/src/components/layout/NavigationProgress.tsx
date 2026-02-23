"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * ナビゲーションプログレスバー
 *
 * ページ遷移中にビューポート最上部に細いプログレスバーを表示する。
 * - リンククリック / ブラウザの戻る・進むを検知してプログレス開始
 * - pathname の変化でプログレス完了
 * - 高速遷移（80ms未満）では表示をスキップしてちらつきを防止
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "loading" | "completing">(
    "idle"
  );
  const [progress, setProgress] = useState(0);

  const prevPathRef = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);

  /** タイマー類をすべてクリアする */
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
  }, []);

  // リンククリック・popstate でプログレス開始
  useEffect(() => {
    /**
     * プログレスバーの表示を開始する
     *
     * 80ms の遅延を挟み、高速遷移ではバーを表示しない。
     * 表示後は 200ms ごとに進捗を漸増させる（最大90%まで）。
     */
    const startProgress = () => {
      if (pendingRef.current) return;
      pendingRef.current = true;
      cleanup();

      // 高速遷移のちらつき防止: 80ms 後に表示開始
      delayRef.current = setTimeout(() => {
        setState("loading");
        setProgress(20);

        // 徐々にプログレスを進める（最大90%で頭打ち）
        timerRef.current = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) return prev;
            return prev + (90 - prev) * 0.08;
          });
        }, 200);
      }, 80);
    };

    /**
     * クリックイベントからナビゲーション開始を検知する
     *
     * 外部リンク・ハッシュリンク・新しいタブで開くリンク・
     * 同一ページへのリンクは無視する。
     */
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        anchor.target === "_blank" ||
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:")
      )
        return;

      // 同一ページへのナビゲーションは無視
      try {
        const url = new URL(href, window.location.origin);
        if (url.pathname === pathname) return;
      } catch {
        return;
      }

      startProgress();
    };

    /** ブラウザの戻る・進むボタンを検知 */
    const handlePopState = () => startProgress();

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname, cleanup]);

  // pathname 変化でプログレス完了
  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    pendingRef.current = false;
    cleanup();

    if (state === "loading") {
      // ローディング中だった → 完了アニメーション
      // requestAnimationFrame でラップして next paint で state 更新する
      const rafId = requestAnimationFrame(() => {
        setProgress(100);
        setState("completing");
      });

      const completeTimer = setTimeout(() => {
        setState("idle");
        setProgress(0);
      }, 400);
      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(completeTimer);
      };
    }

    // 遅延中に遷移完了 → バーを表示せずリセット
    const rafId = requestAnimationFrame(() => {
      setState("idle");
      setProgress(0);
    });
    return () => cancelAnimationFrame(rafId);
  }, [pathname, state, cleanup]);

  if (state === "idle") return null;

  return (
    <div className="pointer-events-none fixed top-0 right-0 left-0 z-[200] h-[3px]">
      <div
        className="h-full"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #006d3b, #00a85a)",
          transition:
            state === "completing"
              ? "width 0.2s ease-out, opacity 0.3s ease-out 0.2s"
              : "width 0.4s ease-out",
          opacity: state === "completing" ? 0 : 1,
          boxShadow: "0 0 10px rgba(0, 109, 59, 0.5)",
        }}
      />
    </div>
  );
}
