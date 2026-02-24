import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlayerById, getPlayerAverage, getPlayerGameLog, getInjuries } from "@/lib/data";
import { getCurrentSeasonName } from "@/lib/constants";
import { CHART_HELP, PLAYER_STATS } from "@/lib/glossary";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/Icon";
import { Separator } from "@/components/ui/separator";
import { ChartHelpButton } from "@/components/ui/ChartHelpButton";
import { PlayerAbilityRadar, PlayerGameLogChart } from "@/components/players/PlayerCharts";
import { PlayerAvatar } from "@/components/players/PlayerAvatar";
import { GameLogTable } from "@/components/players/GameLogTable";

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
    description: `${player.name}（#${player.number ?? "-"}）の${getCurrentSeasonName()}シーズン成績詳細。`,
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
 * @param description - 初心者向けの用語説明（ヘルプボタンで表示）
 */
function ShootingBar({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1 font-medium text-foreground">
          {label}
          {description && <ChartHelpButton details={description} />}
        </span>
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

  // 選手情報・シーズン平均・試合ログ・ケガ人リストを並行取得
  const [player, average, gameLog, injuries] = await Promise.all([
    getPlayerById(playerId),
    getPlayerAverage(playerId),
    getPlayerGameLog(playerId),
    getInjuries(),
  ]);

  // 選手が見つからない場合は404
  if (!player) {
    notFound();
  }

  // この選手がInjury Listに登録されているかチェック
  const injury = injuries.find((inj) => inj.player_id === playerId);

  // レーダーチャート用データ: 各スタッツを0-100にスケーリング（チーム内相対評価）
  // rawValue に元の実数値を保持し、ツールチップで表示する
  const radarData = average
    ? [
        { stat: "得点", value: Math.min((average.ppg / 25) * 100, 100), rawValue: average.ppg, fullMark: 100 },
        { stat: "リバウンド", value: Math.min((average.rpg / 10) * 100, 100), rawValue: average.rpg, fullMark: 100 },
        { stat: "アシスト", value: Math.min((average.apg / 8) * 100, 100), rawValue: average.apg, fullMark: 100 },
        { stat: "スティール", value: Math.min((average.spg / 2.5) * 100, 100), rawValue: average.spg, fullMark: 100 },
        { stat: "効率", value: Math.min((average.eff / 25) * 100, 100), rawValue: average.eff, fullMark: 100 },
      ]
    : [];

  // ゲームログチャート用データ: 対戦相手名と得点・勝敗
  // getPlayerGameLogは新しい順で返すため、reverseで時系列順（古い→新しい）にする
  // 直近15試合に絞ってチャートの視認性を確保
  const recentGames = gameLog.slice(0, 15).reverse();
  const gameLogData = recentGames.map((g) => ({
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

      {/* ================================================
       * Injury List バナー
       * この選手がケガ人リストに登録されている場合に警告バナーを表示
       * ================================================ */}
      {injury && (
        <section className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <Icon name="healing" size={22} className="shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-800">Injury List 登録中</p>
            <p className="text-xs text-amber-700">{injury.reason}（{injury.registered_date} 登録）</p>
          </div>
        </section>
      )}

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
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
              <Icon name="star" size={20} className="text-primary" />
              Season Average
              <ChartHelpButton details={CHART_HELP.seasonAverage.details} />
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              {CHART_HELP.seasonAverage.summary}
            </p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <SeasonAverageCard
                label="PPG"
                value={average.ppg.toFixed(1)}
                sublabel="得点"
                description={PLAYER_STATS.PPG.shortDesc}
                accentClass="stat-card-green"
                animationClass="animate-fade-in-up delay-1"
              />
              <SeasonAverageCard
                label="RPG"
                value={average.rpg.toFixed(1)}
                sublabel="リバウンド"
                description={PLAYER_STATS.RPG.shortDesc}
                accentClass="stat-card-emerald"
                animationClass="animate-fade-in-up delay-2"
              />
              <SeasonAverageCard
                label="APG"
                value={average.apg.toFixed(1)}
                sublabel="アシスト"
                description={PLAYER_STATS.APG.shortDesc}
                accentClass="stat-card-teal"
                animationClass="animate-fade-in-up delay-3"
              />
              <SeasonAverageCard
                label="FG%"
                value={`${average.fg_pct.toFixed(1)}%`}
                sublabel="フィールドゴール"
                description={PLAYER_STATS["FG%"].shortDesc}
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
              <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
                <Icon name="radar" size={20} className="text-primary" />
                選手能力
                <ChartHelpButton details={CHART_HELP.playerRadar.details} />
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                {CHART_HELP.playerRadar.summary}
              </p>
              <PlayerAbilityRadar data={radarData} />
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
                <Icon name="show_chart" size={20} className="text-primary" />
                直近試合の得点推移
                <ChartHelpButton details={CHART_HELP.gameLog.details} />
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                {CHART_HELP.gameLog.summary}
              </p>
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
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
              <Icon name="gps_fixed" size={20} className="text-primary" />
              Shooting Split
              <ChartHelpButton details={CHART_HELP.shootingSplit.details} />
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              {CHART_HELP.shootingSplit.summary}
            </p>
            <div className="space-y-4">
              <ShootingBar label="FG%" value={average.fg_pct} description={PLAYER_STATS["FG%"].description} />
              <ShootingBar label="3P%" value={average.tp_pct} description={PLAYER_STATS["3P%"].description} />
              <ShootingBar label="FT%" value={average.ft_pct} description={PLAYER_STATS["FT%"].description} />
            </div>
          </section>

          {/* ================================================
           * セクション5: スタッツサマリー
           * 試合数、MPG、SPG、BPG、TOPG、EFFを一覧表示
           * ================================================ */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
              <Icon name="analytics" size={20} className="text-primary" />
              Stats Summary
              <ChartHelpButton details={CHART_HELP.statsSummary.details} />
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              {CHART_HELP.statsSummary.summary}
            </p>
            <Separator className="mb-4" />
            <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
              <StatsSummaryItem label="試合数" value={String(average.games_played)} />
              <StatsSummaryItem label="MPG" value={average.mpg} description={PLAYER_STATS.MPG.description} />
              <StatsSummaryItem label="SPG" value={average.spg.toFixed(1)} description={PLAYER_STATS.SPG.description} />
              <StatsSummaryItem label="BPG" value={average.bpg.toFixed(1)} description={PLAYER_STATS.BPG.description} />
              <StatsSummaryItem label="TOPG" value={average.topg.toFixed(1)} description={PLAYER_STATS.TOPG.description} />
              <StatsSummaryItem label="EFF" value={average.eff.toFixed(1)} description={PLAYER_STATS.EFF.description} />
            </div>
          </section>

          {/* ================================================
           * セクション6: 試合別スタッツ（ゲームログ）
           * 全試合のボックススコアを新しい順で一覧表示
           * カラムヘッダークリックでソート切替可能
           * ================================================ */}
          {gameLog.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
                <Icon name="format_list_numbered" size={20} className="text-primary" />
                Game Log
                <ChartHelpButton details={CHART_HELP.gameLogTable.details} />
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                {CHART_HELP.gameLogTable.summary}
              </p>
              <GameLogTable data={gameLog} />
            </section>
          )}
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
 * @param description - スタッツの簡潔な説明（カード下部に表示）
 * @param accentClass - カード上辺のアクセントカラークラス（例: "stat-card-green"）
 * @param animationClass - アニメーションクラス（例: "animate-fade-in-up delay-1"）
 */
function SeasonAverageCard({
  label,
  value,
  sublabel,
  description,
  accentClass,
  animationClass,
}: {
  label: string;
  value: string;
  sublabel: string;
  description?: string;
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
      {description && (
        <p className="mt-1 text-[10px] text-muted-foreground/70">{description}</p>
      )}
    </div>
  );
}

/**
 * スタッツサマリーアイテム
 *
 * ラベルと値を縦に並べて表示する小型コンポーネント。
 * ヘルプボタンで用語説明を確認できる。
 *
 * @param label - スタッツラベル
 * @param value - 値（フォーマット済み文字列）
 * @param description - 初心者向けの用語説明（ヘルプボタンで表示）
 */
function StatsSummaryItem({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="text-center">
      <p className="flex items-center justify-center gap-0.5 text-xs text-muted-foreground">
        {label}
        {description && <ChartHelpButton details={description} />}
      </p>
      <p className="font-display text-xl leading-tight">{value}</p>
    </div>
  );
}
