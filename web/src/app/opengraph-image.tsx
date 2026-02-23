/**
 * OGP画像（動的生成）
 *
 * SNSシェア時に表示される1200x630のOGP画像を生成する。
 * ダークグリーンのグラデーション背景にサイト名とコンセプトを表示。
 */
import { ImageResponse } from "next/og";

export const alt = "STAT-EX - 横浜エクセレンス 情報ダッシュボード";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #004d2a 0%, #006d3b 50%, #008c4a 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* サイト名 */}
        <div
          style={{
            fontSize: "120px",
            fontWeight: 900,
            color: "white",
            letterSpacing: "4px",
            marginBottom: "16px",
          }}
        >
          STAT-EX
        </div>

        {/* 区切り線 */}
        <div
          style={{
            width: "120px",
            height: "4px",
            background: "rgba(255,255,255,0.5)",
            borderRadius: "2px",
            marginBottom: "24px",
          }}
        />

        {/* サブタイトル */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            marginBottom: "12px",
          }}
        >
          横浜エクセレンス 情報ダッシュボード
        </div>

        {/* コンセプト */}
        <div
          style={{
            fontSize: "24px",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          5クリックかかる情報を1クリックで
        </div>

        {/* リーグ表示 */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "60px",
            fontSize: "20px",
            color: "rgba(255,255,255,0.4)",
            fontWeight: 600,
          }}
        >
          B.LEAGUE B2 2025-26
        </div>
      </div>
    ),
    { ...size },
  );
}
