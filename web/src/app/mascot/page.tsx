import type { Metadata } from "next";
import { getMascot } from "@/lib/data";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "マスコット紹介",
  description: "横浜エクセレンスの公式マスコット「エクセル」のプロフィールとギャラリー。",
};

/**
 * プロフィール項目のラベルマッピング
 *
 * profile_jsonのキーを日本語ラベルに変換する。
 * 表示順はこの配列の順番に従う。
 */
const PROFILE_FIELDS: { key: string; label: string }[] = [
  { key: "birthday", label: "誕生日" },
  { key: "personality", label: "性格" },
  { key: "skills", label: "特技" },
  { key: "favorites", label: "好きなもの" },
  { key: "height", label: "身長" },
  { key: "dream", label: "夢" },
  { key: "description", label: "紹介" },
];

/**
 * P8: マスコット紹介ページ
 *
 * チームマスコット「エクセル」の紹介ページ。
 * - ヒーローセクション（名前を大きく表示、グリーングラデーション背景）
 * - プロフィール（profile_jsonの内容をdl/dt/ddで表示）
 * - ギャラリー（画像が登録されるまではプレースホルダー表示）
 */
export default async function MascotPage() {
  const mascot = await getMascot();

  return (
    <div className="space-y-8">
      {/* ================================================
       * セクション1: ヒーローセクション
       * グリーングラデーション背景に名前を大きく表示
       * ================================================ */}
      <section className="relative overflow-hidden rounded-xl bg-linear-to-br from-[#006d3b] to-[#00a85a] px-8 py-16 text-center text-white">
        {/* 背景の装飾（円形のオーバーレイ） */}
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />

        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-white/80">
          Official Mascot
        </p>
        <h1 className="font-display text-6xl leading-tight md:text-8xl">
          {mascot.name}
        </h1>
        <p className="mt-3 text-base text-white/80">
          横浜エクセレンス 公式マスコット
        </p>
      </section>

      {/* ================================================
       * セクション2: プロフィール
       * profile_jsonのフィールドをdt/ddのペアで表示
       * ================================================ */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">プロフィール</h2>
        <Separator className="mb-6" />

        {mascot.profile_json ? (
          <dl className="space-y-4">
            {PROFILE_FIELDS.map(({ key, label }) => {
              // profile_jsonから該当フィールドの値を取得
              const value = mascot.profile_json?.[key];
              if (value === undefined || value === null) return null;

              return (
                <div key={key} className="grid grid-cols-1 gap-1 sm:grid-cols-[140px_1fr] sm:gap-4">
                  <dt className="text-sm font-semibold text-[#006d3b]">
                    {label}
                  </dt>
                  <dd className="text-sm text-foreground">
                    {String(value)}
                  </dd>
                </div>
              );
            })}
          </dl>
        ) : (
          <p className="text-center text-muted-foreground">
            プロフィール情報がありません
          </p>
        )}
      </section>

      {/* ================================================
       * セクション3: ギャラリー（プレースホルダー）
       * 画像が手動登録された後に表示される
       * ================================================ */}
      <section className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <h2 className="mb-2 text-lg font-semibold">ギャラリー</h2>
        <p className="text-sm text-muted-foreground">
          画像は手動登録後に表示されます
        </p>
      </section>
    </div>
  );
}
