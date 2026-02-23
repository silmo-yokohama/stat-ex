import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlayerById, getPlayerAverage, getPlayerGameLog } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/Icon";
import { Separator } from "@/components/ui/separator";
import { PlayerAbilityRadar, PlayerGameLogChart } from "@/components/players/PlayerCharts";
import { PlayerAvatar } from "@/components/players/PlayerAvatar";

/** ページProps型（Next.js 16のPromise params） */
type Props = {
  params: Promise<{ playerId: string }>;
};

/**
 * 動的メタデータ生成
 *
 * 選手名をタイトルに含め、SEOに適したメタデータを返す。
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerId } = await params;
  const player = await getPlayerById(playerId);

  if (!player) {
    return { title: "選手が見つかりません" };
  }

  return {
    title: `${player.name} - 選手詳細`,
    description: `${player.name}（#${player.number ?? "-"}）の2025-26シーズン成績詳細。`,
  };
}

/**
 * ポジション別のバッジ背景色マッピング
 */
const POSITION_BADGE_COLORS: Record<string, string> = {
  PG: "bg-blue-100 text-blue-800",
  SG: "bg-green-100 text-green-800",
  SF: "bg-orange-100 text-orange-800",
  PF: "bg-red-100 text-red-800",
  C: "bg-purple-100 text-purple-800",
};

/**
 * シューティングスプリットのプログレスバーコンポーネント
 *
 * FG%、3P%、FT%をバー形式で可視化する。
 * バーの長さがパーセンテージに対応し、実際の数値も表示する。
 * animate-grow-width アニメーションでバーが伸びる演出付き。
 *
 * @param label - スタッツのラベル（例: "FG%"）
 * @param value - パーセンテージ値（0〜100）
 */
function ShootingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-display text-base">{value.toFixed(1)}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#006d3b] animate-grow-width"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * P5: 選手詳細ページ
 *
 * 特定選手のシーズン成績と主要指標を深掘りするページ。
 * - 選手ヘッダー（背番号ウォーターマーク・名前・ポジション・身体情報・出身地）
 * - Season Averageカード（PPG, RPG, APG, FG% アクセントカラー付き）
 * - 選手能力レーダーチャート + 直近試合の得点推移チャート
 * - シューティングスプリット（FG%, 3P%, FT% プログレスバー）
 * - スタッツサマリーテーブル（全平均スタッツ）
 */
export default async function PlayerDetailPage({ params }: Props) {
  const { playerId } = await params;

  // 選手情報・シーズン平均・試合ログを並行取得
  const [player, average, gameLog] = await Promise.all([
    getPlayerById(playerId),
    getPlayerAverage(playerId),
    getPlayerGameLog(playerId),
  ]);

  // 選手が見つからない場合は404
  if (!player) {
    notFound();
  }

  // レーダーチャート用データ: 各スタッツを0-100にスケーリング（チーム内相対評価）
  const radarData = average
    ? [
        { stat: "得点", value: Math.min((average.ppg / 25) * 100, 100), fullMark: 100 },
        { stat: "リバウンド", value: Math.min((average.rpg / 10) * 100, 100), fullMark: 100 },
        { stat: "アシスト", value: Math.min((average.apg / 8) * 100, 100), fullMark: 100 },
        { stat: "スティール", value: Math.min((average.spg / 2.5) * 100, 100), fullMark: 100 },
        { stat: "効率", value: Math.min((average.eff / 25) * 100, 100), fullMark: 100 },
      ]
    : [];

  // ゲームログチャート用データ: 対戦相手名と得点・勝敗
  const gameLogData = gameLog.map((g) => ({
    label: g.opponent_name ?? "不明",
    pts: g.pts,
    result: g.result?.startsWith("W") ? "W" : "L",
  }));

  return (
    <div className="space-y-8">
      {/* ================================================
       * セクション1: 選手ヘッダー
       * グラデーション背景、背番号ウォーターマーク、名前、ポジション等
       * ================================================ */}
      <section className="player-header-gradient rounded-xl border border-border p-6 relative overflow-hidden">
        {/* 背番号をウォーターマーク的に大きく配置 */}
        <div className="absolute -right-4 -top-4 font-display text-[120px] leading-none text-[#006d3b]/5 select-none pointer-events-none">
          #{player.number ?? ""}
        </div>

        <div className="flex items-start gap-5 relative sm:gap-6">
          {/* 選手アバター画像 */}
          <PlayerAvatar player={player} size="xl" />

          {/* 選手基本情報 */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{player.name}</h1>
              {player.position && (
                <Badge
                  variant="outline"
                  className={`border-0 ${
                    POSITION_BADGE_COLORS[player.position] ?? "bg-gray-100 text-gray-800"
                  }`}
                >
                  {player.position}
                </Badge>
              )}
            </div>

            {player.name_en && (
              <p className="mb-3 text-sm text-muted-foreground">{player.name_en}</p>
            )}

            {/* 身体情報と出身地 */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              {player.height && <span>身長: {player.height}cm</span>}
              {player.weight && <span>体重: {player.weight}kg</span>}
              {player.birthplace && <span>出身: {player.birthplace}</span>}
              {player.birthdate && <span>生年月日: {player.birthdate}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* スタッツが取得できない場合のフォールバック */}
      {!average ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          <p>シーズンスタッツデータがありません</p>
        </div>
      ) : (
        <>
          {/* ================================================
           * セクション2: Season Averageカード
           * PPG, RPG, APG, FG%の4つを大きな数字で表示
           * アクセントカラーとフェードインアニメーション付き
           * ================================================ */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Icon name="star" size={20} className="text-primary" />
              Season Average
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <SeasonAverageCard
                label="PPG"
                value={average.ppg.toFixed(1)}
                sublabel="得点"
                accentClass="stat-card-green"
                animationClass="animate-fade-in-up delay-1"
              />
              <SeasonAverageCard
                label="RPG"
                value={average.rpg.toFixed(1)}
                sublabel="リバウンド"
                accentClass="stat-card-emerald"
                animationClass="animate-fade-in-up delay-2"
              />
              <SeasonAverageCard
                label="APG"
                value={average.apg.toFixed(1)}
                sublabel="アシスト"
                accentClass="stat-card-teal"
                animationClass="animate-fade-in-up delay-3"
              />
              <SeasonAverageCard
                label="FG%"
                value={`${average.fg_pct.toFixed(1)}%`}
                sublabel="フィールドゴール"
                accentClass="stat-card-indigo"
                animationClass="animate-fade-in-up delay-4"
              />
            </div>
          </section>

          {/* ================================================
           * セクション3: 選手能力レーダー + 直近得点推移
           * 左: 5角形レーダーチャート / 右: 折れ線グラフ
           * ================================================ */}
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Icon name="radar" size={20} className="text-primary" />
                選手能力
              </h2>
              <PlayerAbilityRadar data={radarData} />
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Icon name="show_chart" size={20} className="text-primary" />
                直近試合の得点推移
              </h2>
              {gameLogData.length > 0 ? (
                <PlayerGameLogChart data={gameLogData} averagePts={average.ppg} />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  試合データがありません
                </p>
              )}
            </div>
          </section>

          {/* ================================================
           * セクション4: シューティングスプリット
           * FG%, 3P%, FT%を水平プログレスバーで表示
           * ================================================ */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Icon name="gps_fixed" size={20} className="text-primary" />
              Shooting Split
            </h2>
            <div className="space-y-4">
              <ShootingBar label="FG%" value={average.fg_pct} />
              <ShootingBar label="3P%" value={average.tp_pct} />
              <ShootingBar label="FT%" value={average.ft_pct} />
            </div>
          </section>

          {/* ================================================
           * セクション5: スタッツサマリー
           * 試合数、MPG、SPG、BPG、TOPG、EFFを一覧表示
           * ================================================ */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Icon name="analytics" size={20} className="text-primary" />
              Stats Summary
            </h2>
            <Separator className="mb-4" />
            <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
              <StatsSummaryItem label="試合数" value={String(average.games_played)} />
              <StatsSummaryItem label="MPG" value={average.mpg} />
              <StatsSummaryItem label="SPG" value={average.spg.toFixed(1)} />
              <StatsSummaryItem label="BPG" value={average.bpg.toFixed(1)} />
              <StatsSummaryItem label="TOPG" value={average.topg.toFixed(1)} />
              <StatsSummaryItem label="EFF" value={average.eff.toFixed(1)} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/**
 * Season Averageカードコンポーネント
 *
 * 1つの主要スタッツ指標を大きな数字で表示するカード。
 * アクセントカラーの上辺ボーダーとフェードインアニメーション対応。
 *
 * @param label - スタッツの英略称（例: "PPG"）
 * @param value - 表示する値（フォーマット済み文字列）
 * @param sublabel - 日本語のスタッツ名（例: "得点"）
 * @param accentClass - カード上辺のアクセントカラークラス（例: "stat-card-green"）
 * @param animationClass - アニメーションクラス（例: "animate-fade-in-up delay-1"）
 */
function SeasonAverageCard({
  label,
  value,
  sublabel,
  accentClass,
  animationClass,
}: {
  label: string;
  value: string;
  sublabel: string;
  accentClass?: string;
  animationClass?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 text-center ${accentClass ?? ""} ${animationClass ?? ""}`}
    >
      <p className="text-xs text-muted-foreground">{sublabel}</p>
      <p className="font-display text-3xl leading-tight text-[#006d3b]">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * スタッツサマリーアイテム
 *
 * ラベルと値を縦に並べて表示する小型コンポーネント。
 *
 * @param label - スタッツラベル
 * @param value - 値（フォーマット済み文字列）
 */
function StatsSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-xl leading-tight">{value}</p>
    </div>
  );
}
