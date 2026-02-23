/**
 * Apple Touch Icon（動的生成）
 *
 * ホーム画面追加時に表示される180x180のアイコンを生成する。
 * ダークグリーン背景に白い "EX" テキスト。
 */
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#006d3b",
          borderRadius: "36px",
        }}
      >
        <span
          style={{
            fontSize: "90px",
            fontWeight: 900,
            color: "white",
            letterSpacing: "-2px",
          }}
        >
          EX
        </span>
      </div>
    ),
    { ...size },
  );
}
