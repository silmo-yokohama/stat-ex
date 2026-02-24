"use client";

/**
 * チャート補足情報ヘルプボタン
 *
 * インフォアイコン（i）をクリック/タップすると、
 * チャートの見方や用語の説明を Popover で表示する。
 * モバイルでも操作可能なように click/tap トリガーを使用。
 *
 * 使用例:
 * ```tsx
 * <h2>
 *   得点推移
 *   <ChartHelpButton details={CHART_HELP.scoreTrend.details} />
 * </h2>
 * ```
 */

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Icon } from "@/components/ui/Icon";

type Props = {
  /** Popover 内に表示する詳細説明テキスト */
  details: string;
};

/**
 * チャートセクション用のヘルプボタン
 *
 * @param details - タップ時に表示する詳細な説明文
 */
export function ChartHelpButton({ details }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="このセクションの説明を表示"
        >
          <Icon name="help" size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="max-w-xs text-sm leading-relaxed"
        side="bottom"
        align="start"
      >
        {details}
      </PopoverContent>
    </Popover>
  );
}
