import type { Player } from "@/lib/types/database";

/**
 * ポジション別のグラデーション背景色
 *
 * PG=ブルー, SG=エメラルド, SF=オレンジ, PF=レッド, C=パープル
 */
const POSITION_COLORS: Record<string, { from: string; to: string }> = {
  PG: { from: "#3b82f6", to: "#1d4ed8" },
  SG: { from: "#10b981", to: "#047857" },
  SF: { from: "#f97316", to: "#c2410c" },
  PF: { from: "#ef4444", to: "#b91c1c" },
  C: { from: "#8b5cf6", to: "#6d28d9" },
};

/** デフォルトカラー（ポジション未設定時） */
const DEFAULT_COLORS = { from: "#6b7280", to: "#374151" };

/** サイズ別のCSSクラス */
const SIZE_CLASSES: Record<string, string> = {
  sm: "h-10 w-10 text-xs",
  md: "h-14 w-14 text-sm",
  lg: "h-20 w-20 text-lg",
  xl: "h-28 w-28 text-2xl",
};

/**
 * 選手アバターコンポーネント
 *
 * 選手の画像が未設定の場合はポジション別グラデーション背景に背番号を表示する
 * プレースホルダーアバター。実際の画像URLがある場合はそちらを表示する。
 *
 * @param player - 選手データ
 * @param size - アバターサイズ（sm=40px, md=48px, lg=64px, xl=96px）
 */
export function PlayerAvatar({
  player,
  size = "md",
}: {
  player: Player;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const colors = POSITION_COLORS[player.position ?? ""] ?? DEFAULT_COLORS;
  const sizeClass = SIZE_CLASSES[size];
  const numberText = player.number !== null ? `#${player.number}` : "?";

  // 将来的に image_url が設定されたら実画像を表示する
  if (player.image_url) {
    return (
      <img
        src={player.image_url}
        alt={player.name}
        className={`shrink-0 rounded-full object-cover ${sizeClass}`}
      />
    );
  }

  return (
    <div
      className={`shrink-0 rounded-full flex items-center justify-center font-display font-bold text-white shadow-md ${sizeClass}`}
      style={{
        background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
      }}
      aria-label={`${player.name} #${player.number ?? "-"}`}
    >
      {numberText}
    </div>
  );
}
