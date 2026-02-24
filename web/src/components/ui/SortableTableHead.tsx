"use client";

/**
 * ソート可能テーブルヘッダーセル
 *
 * カラムヘッダーをクリックするとソート方向を切り替える。
 * 現在のソートカラムには昇順/降順の矢印アイコンを表示する。
 * サイト全体のスタッツテーブルで共通利用する。
 */

import { Icon } from "@/components/ui/Icon";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Props = {
  /** このカラムのソートキー */
  sortKey: string;
  /** 現在アクティブなソートキー */
  currentSortKey: string;
  /** 現在のソート方向 */
  currentDirection: "asc" | "desc";
  /** 初回クリック時のデフォルト方向（trueなら降順） */
  defaultDesc?: boolean;
  /** ソート切替コールバック */
  onSort: (key: string, defaultDesc: boolean) => void;
  /** 追加のCSSクラス */
  className?: string;
  /** ヘッダーラベル */
  children: React.ReactNode;
};

/**
 * クリックでソートを切り替えるテーブルヘッダーセル
 *
 * - 未選択カラム: クリックでデフォルト方向にソート
 * - 選択中カラム: クリックで方向を反転
 * - アクティブカラムには矢印アイコンを表示
 *
 * @example
 * ```tsx
 * <SortableTableHead
 *   sortKey="pts"
 *   currentSortKey={sortKey}
 *   currentDirection={sortDir}
 *   defaultDesc
 *   onSort={handleSort}
 * >
 *   PTS
 * </SortableTableHead>
 * ```
 */
export function SortableTableHead({
  sortKey,
  currentSortKey,
  currentDirection,
  defaultDesc = true,
  onSort,
  className,
  children,
}: Props) {
  const isActive = sortKey === currentSortKey;

  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none text-center transition-colors hover:bg-muted/50",
        className
      )}
      onClick={() => onSort(sortKey, defaultDesc)}
    >
      <span className="inline-flex items-center gap-0.5">
        {children}
        {/* ソート方向インジケーター */}
        {isActive && (
          <Icon
            name={currentDirection === "desc" ? "arrow_downward" : "arrow_upward"}
            size={12}
            className="text-primary"
          />
        )}
      </span>
    </TableHead>
  );
}
