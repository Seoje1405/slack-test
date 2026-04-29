import type { FeedItem } from '@/types/feed';

interface NotionUser {
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

function extractTitle(page: NotionPage): string {
  // database 객체는 최상위 title 배열을 가짐
  if (page.object === 'database' && Array.isArray(page.title)) {
    return page.title.map((t) => t.plain_text).join('') || '(제목 없음)';
  }
  // page 객체는 properties 안에 title 타입 프로퍼티가 있음
  for (const prop of Object.values(page.properties ?? {})) {
    if (prop.type === 'title' && Array.isArray(prop.title)) {
      return prop.title.map((t) => t.plain_text).join('') || '(제목 없음)';
    }
  }
  return '(제목 없음)';
}

export function transformNotionPages(pages: NotionPage[]): FeedItem[] {
  return pages.map((page) => ({
    id: page.id,
    service: 'notion' as const,
    title: extractTitle(page),
    user: page.last_edited_by?.name ?? 'Unknown',
    avatarUrl: page.last_edited_by?.avatar_url ?? null,
    time: page.last_edited_time,
    tag: page.object === 'database' ? 'DB' : 'Page',
    url: page.url,
  }));
}
