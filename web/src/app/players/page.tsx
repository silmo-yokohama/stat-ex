import type { Metadata } from "next";
import Link from "next/link";
import { getPlayers } from "@/lib/data";
import { getAllPlayerAverages } from "@/lib/data/players";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/Icon";
import { PlayersScatterChart } from "@/components/players/PlayerCharts";
import { PlayerAvatar } from "@/components/players/PlayerAvatar";
import type { Player } from "@/lib/types/database";
import type { PlayerSeasonAverage } from "@/lib/data/players";

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
 * 選手ロウカードコンポーネント（1カラムレイアウト）
 *
 * 横長の1行カードで、左にアバター画像、中央に選手情報、右にスタッツを表示。
 * クリックで選手詳細ページへ遷移する。
 */
function PlayerRow({
  player,
  average,
}: {
  player: Player;
  average: (PlayerSeasonAverage & { player: Player }) | undefined;
}) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md sm:gap-5 sm:p-5"
    >
      {/* 選手アバター画像 */}
      <PlayerAvatar player={player} size="lg" />

      {/* 選手情報（名前・背番号・ポジション） */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-display text-2xl leading-none text-[#006d3b]">
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
        <p className="text-base font-semibold text-foreground group-hover:text-[#006d3b]">
          {player.name}
        </p>
        {player.name_en && (
          <p className="text-xs text-muted-foreground">{player.name_en}</p>
        )}
        {/* モバイル: 身長・体重 */}
        <div className="mt-1 flex gap-3 text-xs text-muted-foreground sm:hidden">
          {player.height && <span>{player.height}cm</span>}
          {player.weight && <span>{player.weight}kg</span>}
        </div>
      </div>

      {/* 身体情報（デスクトップのみ） */}
      <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
        {player.height && <p>{player.height}cm</p>}
        {player.weight && <p>{player.weight}kg</p>}
        {player.birthplace && <p>{player.birthplace}</p>}
      </div>

      {/* 主要スタッツ（PPG, RPG, APG） */}
      {average && (
        <div className="hidden shrink-0 gap-5 sm:flex">
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
      <p className="font-display text-2xl leading-tight">{value.toFixed(1)}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * P4: 選手一覧ページ
 *
 * ロスター全体を把握し、主要スタッツを比較するページ。
 * - スタッツ分布散布図（PPG vs RPG、バブルサイズ = APG）
 * - 1カラムのロスターリスト（選手画像 + 名前 + スタッツ）
 * - 各カードにポジション別カラーのアバター画像
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
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Icon name="scatter_plot" size={20} className="text-primary" />スタッツ分布</h2>
        <p className="mb-2 text-xs text-muted-foreground">
          PPG vs RPG（バブルサイズ = APG）
        </p>
        <PlayersScatterChart data={scatterData} />
      </section>

      {/* 選手ロスターリスト（1カラム） */}
      <div className="space-y-3">
        {players.map((player) => {
          // 該当選手の平均スタッツを検索
          const average = allAverages.find(
            (a) => a.player_id === player.id
          );
          return (
            <PlayerRow key={player.id} player={player} average={average} />
          );
        })}
      </div>
    </div>
  );
}
