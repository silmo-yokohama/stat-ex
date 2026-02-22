import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSSのクラス名をマージするユーティリティ関数
 * clsx + tailwind-merge で重複クラスを適切に処理する
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
