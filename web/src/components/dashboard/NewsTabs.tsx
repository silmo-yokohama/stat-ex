"use client";

/**
 * ニュースタブ切替コンポーネント
 *
 * 「公式」と「メディア」の2つのタブでニュースを切り替え表示する。
 * クライアントコンポーネント（タブ操作にインタラクションが必要なため）。
 */

import type { News } from "@/lib/types/database";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Props = {
  /** 公式ニュース一覧 */
  officialNews: News[];
  /** メディアニュース一覧 */
  mediaNews: News[];
};

/**
 * 日付を「M/D」形式にフォーマットするヘルパー
 */
function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * ニュース項目の表示コンポーネント
 */
function NewsItem({ news }: { news: News }) {
  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
    >
      {/* 日付 */}
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatShortDate(news.published_at)}
      </span>

      {/* タイトル + ソース名 */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium text-foreground">{news.title}</p>
        {news.source_name && (
          <p className="mt-0.5 text-xs text-muted-foreground">{news.source_name}</p>
        )}
      </div>
    </a>
  );
}

export function NewsTabs({ officialNews, mediaNews }: Props) {
  return (
    <Tabs defaultValue="official">
      <TabsList>
        <TabsTrigger value="official">公式</TabsTrigger>
        <TabsTrigger value="media">メディア</TabsTrigger>
      </TabsList>

      {/* 公式ニュース */}
      <TabsContent value="official">
        <div className="divide-y divide-border">
          {officialNews.length > 0 ? (
            officialNews.map((news) => <NewsItem key={news.id} news={news} />)
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">ニュースはありません</p>
          )}
        </div>
      </TabsContent>

      {/* メディアニュース */}
      <TabsContent value="media">
        <div className="divide-y divide-border">
          {mediaNews.length > 0 ? (
            mediaNews.map((news) => <NewsItem key={news.id} news={news} />)
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">ニュースはありません</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
