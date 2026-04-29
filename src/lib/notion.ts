import type { FeedItem } from '@/types/feed';

interface NotionUser {
  id?: string;
  name?: string;
  avatar_url?: string | null;
}

interface NotionPage {
  id: string;
  object: 'page' | 'database';
  url: string;
  last_edited_time: string;
  last_edited_by?: NotionUser;
  properties: Record<string, {
    type: string;
    title?: Array<{ plain_text: string }>;
    [key: string]: unknown;
  }>;
  title?: Array<{ plain_text: string }>; // database 객체의 title 필드
}

export type UserMap = Record<string, { name: string; avatarUrl: string | null }>;

function extractTitle(page: NotionPage): string {
  if (page.object === 'database' && Array.isArray(page.title)) {
    return page.title.map((t) => t.plain_text).join('') || '(제목 없음)';
  }
  for (const prop of Object.values(page.properties ?? {})) {
    if (prop.type === 'title' && Array.isArray(prop.title)) {
      return prop.title.map((t) => t.plain_text).join('') || '(제목 없음)';
    }
  }
  return '(제목 없음)';
}

export function transformNotionPages(pages: NotionPage[], userMap: UserMap = {}): FeedItem[] {
  return pages.map((page) => {
    const userId = page.last_edited_by?.id;
    const userInfo = userId ? userMap[userId] : undefined;
    return {
      id: page.id,
      service: 'notion' as const,
      title: extractTitle(page),
      user: userInfo?.name ?? page.last_edited_by?.name ?? 'Unknown',
      avatarUrl: userInfo?.avatarUrl ?? page.last_edited_by?.avatar_url ?? null,
      time: page.last_edited_time,
      tag: page.object === 'database' ? 'DB' : 'Page',
      url: page.url,
    };
  });
}
