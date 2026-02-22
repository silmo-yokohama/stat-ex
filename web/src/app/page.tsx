import { SITE, TEAM } from "@/lib/constants";

/**
 * P1: トップページ（ダッシュボード）
 *
 * サイトを開いた瞬間に今知りたい情報が全部見えるページ。
 * - Heroカード（直近試合 / 次の試合）
 * - Stats Cards（順位・勝率・連勝/敗・平均得点）
 * - 直近10試合 得点推移グラフ
 * - チームリーダー
 * - ニュース（公式 / メディア タブ切替）
 */
export default function Home() {
  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{TEAM.name}</h1>
        <p className="text-sm text-muted-foreground">{SITE.concept}</p>
      </div>

      {/* TODO: Heroカード（直近試合 / 次の試合） */}
      <section className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">Heroカード</p>
        <p className="text-sm">直近の試合結果 / 次の試合カウントダウン</p>
      </section>

      {/* TODO: Stats Cards */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {["順位", "勝率", "連勝/敗", "平均得点"].map((label) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-card p-4 text-center"
          >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">--</p>
          </div>
        ))}
      </section>

      {/* TODO: 得点推移グラフ + チームリーダー */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">直近10試合 得点推移</h2>
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            グラフ（Recharts）
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">チームリーダー</h2>
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            得点王 / リバウンド王 / アシスト王
          </div>
        </div>
      </section>

      {/* TODO: ニュース */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">最新ニュース</h2>
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          [公式] [メディア] タブ切替
        </div>
      </section>
    </div>
  );
}
