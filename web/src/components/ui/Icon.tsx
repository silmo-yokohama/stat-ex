/**
 * Google Material Symbols アイコンコンポーネント
 *
 * Google Fonts の Material Symbols Outlined をラップし、
 * サイズ・塗りつぶし・追加クラスをプロパティで制御できるようにする。
 *
 * @see https://fonts.google.com/icons
 *
 * @param name - Material Symbols のアイコン名（例: "dashboard", "sports_basketball"）
 * @param size - フォントサイズ（px）。デフォルト 20
 * @param fill - 塗りつぶしアイコンにするか。デフォルト false
 * @param className - 追加の Tailwind クラス
 */
export function Icon({
  name,
  size = 20,
  fill = false,
  className = "",
}: {
  name: string;
  size?: number;
  fill?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined leading-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: fill ? "'FILL' 1" : undefined,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
