import type { Metadata } from "next";
import Link from "next/link";
import { getPlayers } from "@/lib/data";
import { getAllPlayerAverages } from "@/lib/data/players";
import { Badge } from "@/components/ui/badge";
import { PlayersScatterChart } from "@/components/players/PlayerCharts";
import type { Player } from "@/lib/types/database";
import type { PlayerSeasonAverage } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "選手一覧",
  description: "横浜エクセレンスの選手一覧。背番号、ポジション、主要スタッツを確認できます。",
};

/**
 * ポジション別のバッジ背景色マッピング
 * 各ポジションを視覚的に区別するためのカラー定義
 */
const POSITION_BADGE_COLORS: Record<string, string> = {
  PG: "bg-blue-100 text-blue-800",
  SG: "bg-green-100 text-green-800",
  SF: "bg-orange-100 text-orange-800",
  PF: "bg-red-100 text-red-800",
  C: "bg-purple-100 text-purple-800",
};

/**
 * ポジション別の上辺アクセントボーダーカラー
 * 選手カードにポジションを視覚的に示す色付きボーダーを追加する
 */
const POSITION_BORDER_COLORS: Record<string, string> = {
  PG: "border-t-3 border-t-blue-400",
  SG: "border-t-3 border-t-green-400",
  SF: "border-t-3 border-t-orange-400",
  PF: "border-t-3 border-t-red-400",
  C: "border-t-3 border-t-purple-400",
};

/**
 * ポジションのバッジ背景色を取得する
 *
 * @param position - 選手のポジション（PG, SG, SF, PF, C）
 * @returns Tailwindクラス文字列
 */
function getPositionBadgeColor(position: string | null): string {
  if (!position) return "bg-gray-100 text-gray-800";
  return POSITION_BADGE_COLORS[position] ?? "bg-gray-100 text-gray-800";
}

/**
 * ポジション別の上辺ボーダー色を取得する
 *
 * @param position - 選手のポジション（PG, SG, SF, PF, C）
 * @returns Tailwindクラス文字列（ボーダー未設定時は空文字）
 */
function getPositionBorderColor(position: string | null): string {
  if (!position) return "";
  return POSITION_BORDER_COLORS[position] ?? "";
}

/**
 * 選手カードコンポーネント
 *
 * 選手の背番号・名前・ポジション・主要スタッツ（PPG, RPG, APG）を表示する。
 * ポジション別に上辺のアクセントカラーボーダーを付与し、
 * クリックで選手詳細ページへ遷移する。
 */
function PlayerCard({
  player,
  average,
}: {
  player: Player;
  average: (PlayerSeasonAverage & { player: Player }) | undefined;
}) {
  const borderClass = getPositionBorderColor(player.position);

  return (
    <Link
      href={`/players/${player.id}`}
      className={`group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md ${borderClass}`}
    >
      {/* 背番号とポジション */}
      <div className="mb-3 flex items-start justify-between">
        <span className="font-display text-4xl leading-none text-[#006d3b]">
          #{player.number ?? "-"}
        </span>
        {player.position && (
          <Badge
            variant="outline"
            className={`border-0 ${getPositionBadgeColor(player.position)}`}
          >
            {player.position}
          </Badge>
        )}
      </div>

      {/* 選手名 */}
      <p className="mb-1 text-base font-semibold text-foreground group-hover:text-[#006d3b]">
        {player.name}
      </p>
      {player.name_en && (
        <p className="mb-4 text-xs text-muted-foreground">{player.name_en}</p>
      )}

      {/* 主要スタッツ（PPG, RPG, APG） */}
      {average && (
        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
          <StatItem label="PPG" value={average.ppg} />
          <StatItem label="RPG" value={average.rpg} />
          <StatItem label="APG" value={average.apg} />
        </div>
      )}
    </Link>
  );
}

/**
 * スタッツ表示アイテム
 *
 * ラベルと数値を縦に並べて表示する小型コンポーネント。
 */
function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-display text-lg leading-tight">{value.toFixed(1)}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * P4: 選手一覧ページ
 *
 * ロスター全体を把握し、主要スタッツを比較するページ。
 * - スタッツ分布散布図（PPG vs RPG、バブルサイズ = APG）
 * - 選手カードグリッド（2列モバイル / 3列タブレット / 4列デスクトップ）
 * - 各カードに背番号・名前・ポジションバッジ・PPG/RPG/APG
 * - ポジション別アクセントカラーボーダー
 * - カードをクリックすると選手詳細ページへ遷移
 */
export default async function PlayersPage() {
  // 選手一覧と全選手の平均スタッツを並行取得
  const [players, allAverages] = await Promise.all([
    getPlayers(),
    getAllPlayerAverages(),
  ]);

  // 散布図用データ: 選手ごとのPPG・RPG・APG・ポジション情報
  const scatterData = allAverages.map((a) => ({
    name: a.player.name,
    ppg: a.ppg,
    rpg: a.rpg,
    apg: a.apg,
    position: a.player.position ?? "?",
  }));

  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div>
        <h1 className="text-2xl font-bold">選手一覧</h1>
        <p className="text-sm text-muted-foreground">
          {players.length}名のロスター
        </p>
      </div>

      {/* スタッツ分布チャート */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">スタッツ分布</h2>
        <p className="mb-2 text-xs text-muted-foreground">
          PPG vs RPG（バブルサイズ = APG）
        </p>
        <PlayersScatterChart data={scatterData} />
      </section>

      {/* 選手カードグリッド */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {players.map((player) => {
          // 該当選手の平均スタッツを検索
          const average = allAverages.find(
            (a) => a.player_id === player.id
          );
          return (
            <PlayerCard key={player.id} player={player} average={average} />
          );
        })}
      </div>
    </div>
  );
}
