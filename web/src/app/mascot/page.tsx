import type { Metadata } from "next";
import { getMascot } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export const metadata: Metadata = {
  title: "マスコット紹介",
  description:
    "横浜エクセレンスの公式マスコット「ピック」と「ロール」のプロフィール。世界一幸せな動物・クオッカの幼なじみコンビ。",
};

// ================================================
// マスコットデータ定義
// 将来的にDBへ移行する際は getMascots() に置き換える
// ================================================

/** マスコット1匹分のデータ型 */
type MascotData = {
  name: string;
  nameEn: string;
  number: number;
  initial: string;
  model: string;
  origin: string;
  height: string;
  weight: string;
  birthday: string;
  birthdayNote: string;
  role: string;
  personality: string;
  skills: string;
  favorite: string;
  debut: string;
  relationship: string;
  officialUrl: string;
};

/** ピック のプロフィールデータ */
const PICK: MascotData = {
  name: "ピック",
  nameEn: "Pick",
  number: 45,
  initial: "P",
  model: "クオッカ（世界一幸せな動物）",
  origin: "オーストラリア西部 ロットネスト島",
  height: "170cm",
  weight: "100kg",
  birthday: "2月5日",
  birthdayNote: "ニコニコで「笑顔の日」",
  role: "特別広報＆営業部",
  personality: "にぎやかな芸人タイプ。盛り上げ上手。意外な運動神経の持ち主",
  skills: "ダンスとバスケットボール。ピックアップして笑顔に変えるのが得意",
  favorite: "豚まん",
  debut: "2023年1月6日（B3リーグ レギュラーシーズン 第13節）",
  relationship: "幼なじみ。裏で段取りを仕切る兄貴分",
  officialUrl: "https://yokohama-ex.jp/team/cheers/Pick",
};

/** ロール のプロフィールデータ */
const ROLL: MascotData = {
  name: "ロール",
  nameEn: "Roll",
  number: 80,
  initial: "R",
  model: "クオッカ（世界一幸せな動物）",
  origin: "オーストラリア西部 ロットネスト島",
  height: "190cm",
  weight: "60kg",
  birthday: "2月5日",
  birthdayNote: "ニコニコで「笑顔の日」",
  role: "特別広報＆営業部",
  personality: "切り返し上手。MC対応も巧み。ピックに甘えがちで、たまにヤキモチも",
  skills: "シュートが上手い。どんな状況もロールして乗り越える",
  favorite: "豚まん",
  debut: "2023年1月6日（B3リーグ レギュラーシーズン 第13節 vs 湘南ユナイテッド）",
  relationship: "幼なじみ。ピックのボケに切れ味鋭いツッコミ",
  officialUrl: "https://yokohama-ex.jp/team/cheers/Roll",
};

/**
 * プロフィール詳細セクションで表示するフィールド定義
 *
 * icon: Material Symbols のアイコン名
 * label: 表示ラベル
 * key: MascotData のキー名
 */
const PROFILE_FIELDS: {
  icon: string;
  label: string;
  key: keyof MascotData;
}[] = [
  { icon: "pets", label: "モデル", key: "model" },
  { icon: "public", label: "出身", key: "origin" },
  { icon: "cake", label: "誕生日", key: "birthday" },
  { icon: "badge", label: "役職", key: "role" },
  { icon: "mood", label: "性格", key: "personality" },
  { icon: "star", label: "特技", key: "skills" },
  { icon: "restaurant", label: "好物", key: "favorite" },
  { icon: "event", label: "デビュー", key: "debut" },
  { icon: "group", label: "相方との関係", key: "relationship" },
];

/**
 * 二匹の共通点リスト
 *
 * 「幼なじみコンビ」セクションで表示する共通情報
 */
const COMMON_TRAITS: { icon: string; label: string; value: string }[] = [
  { icon: "pets", label: "モデル", value: "クオッカ（世界一幸せな動物）" },
  {
    icon: "public",
    label: "出身地",
    value: "オーストラリア西部 ロットネスト島",
  },
  {
    icon: "cake",
    label: "誕生日",
    value: "2月5日（ニコニコで「笑顔の日」）",
  },
  { icon: "restaurant", label: "好物", value: "豚まん" },
  {
    icon: "event",
    label: "デビュー",
    value: "2023年1月6日 B3リーグ レギュラーシーズン 第13節",
  },
];

// ================================================
// サブコンポーネント
// ================================================

/**
 * マスコットアバター（プレースホルダー）
 *
 * 画像が用意されるまでの間、イニシャルを大きく表示する丸型アバター。
 * 背景はダークグリーンの半透明で統一する。
 *
 * @param initial - 表示するイニシャル文字（"P" or "R"）
 * @param size - アバターのサイズ（"lg" = 128px, "sm" = 80px）
 */
function MascotAvatar({ initial, size = "lg" }: { initial: string; size?: "lg" | "sm" }) {
  const sizeClasses = size === "lg" ? "h-32 w-32 text-5xl" : "h-20 w-20 text-3xl";

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-[#006d3b]/10 font-display text-[#006d3b] ${sizeClasses}`}
    >
      {initial}
    </div>
  );
}

/**
 * マスコット紹介カード
 *
 * 1匹分のマスコット情報を表示するカードコンポーネント。
 * 背番号のウォーターマーク、アバター、基本情報を含む。
 * 選手詳細ページのヘッダーと同様のデザインパターンを使用。
 *
 * @param mascot - マスコットデータ
 * @param animationDelay - フェードインアニメーションの遅延クラス
 */
function MascotCard({ mascot, animationDelay }: { mascot: MascotData; animationDelay: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-card p-6 animate-fade-in-up ${animationDelay}`}
    >
      {/* 背番号ウォーターマーク（選手詳細と同じスタイル） */}
      <div className="pointer-events-none absolute -right-4 -top-4 select-none font-display text-[120px] leading-none text-[#006d3b]/5">
        #{mascot.number}
      </div>

      <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        {/* アバター */}
        <MascotAvatar initial={mascot.initial} size="lg" />

        {/* 基本情報 */}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          {/* 背番号バッジ */}
          <span className="mb-1 inline-block rounded-full bg-[#006d3b]/10 px-3 py-0.5 text-xs font-semibold text-[#006d3b]">
            #{mascot.number}
          </span>

          {/* 名前（日本語＋英語） */}
          <h2 className="font-display text-3xl leading-tight text-foreground md:text-4xl">
            {mascot.name}
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">{mascot.nameEn}</p>

          {/* 身体情報 */}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-muted-foreground sm:justify-start">
            <span className="flex items-center gap-1">
              <Icon name="straighten" size={16} />
              {mascot.height}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="monitor_weight" size={16} />
              {mascot.weight}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="cake" size={16} />
              {mascot.birthday}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * プロフィール詳細カード
 *
 * 1匹分のプロフィールを dt/dd リスト形式で表示する。
 * アイコン付きのラベルとコンテンツで構成される。
 *
 * @param mascot - マスコットデータ
 * @param animationDelay - フェードインアニメーションの遅延クラス
 */
function ProfileDetailCard({
  mascot,
  animationDelay,
}: {
  mascot: MascotData;
  animationDelay: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card p-6 animate-fade-in-up ${animationDelay}`}
    >
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <MascotAvatar initial={mascot.initial} size="sm" />
        <span>
          {mascot.name}
          <span className="ml-1 text-sm font-normal text-muted-foreground">のプロフィール</span>
        </span>
      </h3>
      <Separator className="mb-5" />

      <dl className="space-y-4">
        {PROFILE_FIELDS.map(({ icon, label, key }) => (
          <div key={key} className="grid grid-cols-1 gap-1 sm:grid-cols-[140px_1fr] sm:gap-4">
            <dt className="flex items-center gap-1.5 text-sm font-semibold text-[#006d3b]">
              <Icon name={icon} size={16} />
              {label}
            </dt>
            <dd className="text-sm text-foreground">{mascot[key]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * P8: マスコット紹介ページ（リデザイン版）
 *
 * 横浜エクセレンスの公式マスコット「ピック」と「ロール」の紹介ページ。
 * - ヒーローセクション: "PICK & ROLL" を大きく表示
 * - マスコット紹介カード: 2カラムで背番号ウォーターマーク付き
 * - プロフィール詳細: 各マスコットの詳細情報を並列カードで表示
 * - 幼なじみコンビ: 二匹の関係性と共通点を視覚的に表現
 * - 外部リンク: 公式サイトへのリンクボタン
 */
export default async function MascotPage() {
  // 既存のgetMascot()を維持（将来のDB移行に備える）
  await getMascot();

  return (
    <div className="space-y-8">
      {/* ================================================
       * セクション1: ヒーローセクション
       * グリーングラデーション背景に "PICK & ROLL" を大きく表示
       * クオッカの二匹組であることを印象づけるキャッチコピー
       * ================================================ */}
      <section className="relative overflow-hidden rounded-xl bg-linear-to-br from-[#006d3b] to-[#00a85a] px-6 py-14 text-center text-white md:px-8 md:py-20">
        {/* 背景装飾（円形オーバーレイ） */}
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
        <div className="absolute right-1/4 top-1/3 h-20 w-20 rounded-full bg-white/5" />

        <p className="mb-2 flex items-center justify-center gap-2 text-sm font-medium uppercase tracking-widest text-white/80 animate-fade-in-up">
          <Icon name="stars" size={18} />
          Official Mascots
        </p>

        <h1 className="font-display text-5xl leading-tight animate-fade-in-up delay-1 md:text-8xl">
          PICK & ROLL
        </h1>

        <p className="mt-3 text-base text-white/80 animate-fade-in-up delay-2">
          横浜エクセレンス 公式マスコット
        </p>

        <p className="mx-auto mt-2 max-w-md text-sm text-white/60 animate-fade-in-up delay-3">
          &ldquo;世界一幸せな動物&rdquo; クオッカの二匹組
        </p>
      </section>

      {/* ================================================
       * セクション2: マスコット紹介カード（2カラム）
       * ピック（左）とロール（右）を並べて表示
       * 背番号ウォーターマーク + アバター + 基本情報
       * ================================================ */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon name="sports_basketball" size={20} className="text-primary" />
          マスコット紹介
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <MascotCard mascot={PICK} animationDelay="delay-1" />
          <MascotCard mascot={ROLL} animationDelay="delay-2" />
        </div>
      </section>

      {/* ================================================
       * セクション3: プロフィール詳細（並列カード）
       * 各マスコットの詳細プロフィールをリスト形式で表示
       * ================================================ */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon name="badge" size={20} className="text-primary" />
          プロフィール
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <ProfileDetailCard mascot={PICK} animationDelay="delay-3" />
          <ProfileDetailCard mascot={ROLL} animationDelay="delay-4" />
        </div>
      </section>

      {/* ================================================
       * セクション4: 幼なじみコンビ
       * 二匹の関係性を視覚的に表現するセクション
       * ボケ（ピック） ⇔ ツッコミ（ロール）の構造を明示
       * ================================================ */}
      <section className="rounded-xl border border-border bg-card p-6 animate-fade-in-up delay-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon name="handshake" size={20} className="text-primary" />
          幼なじみコンビ
        </h2>
        <Separator className="mb-6" />

        {/* ボケ ⇔ ツッコミ の関係図 */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
          {/* ピック（ボケ担当） */}
          <div className="flex flex-col items-center rounded-lg bg-[#006d3b]/5 p-5">
            <MascotAvatar initial="P" size="sm" />
            <p className="mt-2 font-display text-xl text-foreground">ピック</p>
            <span className="mt-1 rounded-full bg-[#006d3b]/10 px-3 py-0.5 text-xs font-semibold text-[#006d3b]">
              ボケ担当
            </span>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              にぎやかな芸人タイプ
              <br />
              裏で段取りを仕切る兄貴分
            </p>
          </div>

          {/* 中央の矢印（関係を示す） */}
          <div className="flex items-center justify-center">
            <div className="flex flex-row items-center gap-1">
              <Icon name="swap_horiz" size={32} className="text-[#006d3b]/40" />
              <span className="text-xs font-medium text-muted-foreground">幼なじみ</span>
            </div>
          </div>

          {/* ロール（ツッコミ担当） */}
          <div className="flex flex-col items-center rounded-lg bg-[#006d3b]/5 p-5">
            <MascotAvatar initial="R" size="sm" />
            <p className="mt-2 font-display text-xl text-foreground">ロール</p>
            <span className="mt-1 rounded-full bg-[#006d3b]/10 px-3 py-0.5 text-xs font-semibold text-[#006d3b]">
              ツッコミ担当
            </span>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              切れ味鋭いツッコミ
              <br />
              ピックに甘えがちな一面も
            </p>
          </div>
        </div>

        {/* 共通点リスト */}
        <div>
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[#006d3b]">
            <Icon name="join" size={16} />
            二匹の共通点
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COMMON_TRAITS.map((trait) => (
              <div
                key={trait.label}
                className="flex items-start gap-2 rounded-lg border border-border bg-background p-3"
              >
                <Icon name={trait.icon} size={18} className="mt-0.5 shrink-0 text-[#006d3b]" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">{trait.label}</p>
                  <p className="text-sm text-foreground">{trait.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================
       * セクション5: 外部リンク
       * 公式サイトのマスコット紹介ページへのリンクボタン
       * ================================================ */}
      <section className="animate-fade-in-up delay-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Icon name="link" size={20} className="text-primary" />
          公式サイト
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={PICK.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-[#006d3b]/30 hover:bg-[#006d3b]/5"
          >
            <div className="flex items-center gap-3">
              <MascotAvatar initial="P" size="sm" />
              <div>
                <p className="font-semibold text-foreground">ピック 公式プロフィール</p>
                <p className="text-xs text-muted-foreground">yokohama-ex.jp</p>
              </div>
            </div>
            <Icon name="open_in_new" size={20} className="text-muted-foreground" />
          </Link>

          <Link
            href={ROLL.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-[#006d3b]/30 hover:bg-[#006d3b]/5"
          >
            <div className="flex items-center gap-3">
              <MascotAvatar initial="R" size="sm" />
              <div>
                <p className="font-semibold text-foreground">ロール 公式プロフィール</p>
                <p className="text-xs text-muted-foreground">yokohama-ex.jp</p>
              </div>
            </div>
            <Icon name="open_in_new" size={20} className="text-muted-foreground" />
          </Link>
        </div>
      </section>
    </div>
  );
}
