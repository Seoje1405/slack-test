import { transformNotionPages } from '@/lib/notion';
import type { FeedResponse } from '@/types/feed';

export const revalidate = 120;

const NOTION_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28',
});

async function parseNotionError(res: Response): Promise<string> {
  try {
    const json = await res.json();
    if (json.code === 'validation_error' && typeof json.message === 'string') {
      if (json.message.includes('is a page, not a database')) {
        return (
          'NOTION_DATABASE_ID가 페이지 ID입니다. ' +
          'Notion에서 데이터베이스를 풀페이지로 열고 URL의 32자리 hex 값을 사용하세요.'
        );
      }
      return json.message;
    }
    if (json.code === 'object_not_found') {
      return (
        '데이터베이스를 찾을 수 없습니다. ' +
        'Notion DB 우측 상단 ··· → 연결 추가 에서 Integration을 연결하세요.'
      );
    }
    if (json.code === 'unauthorized') return 'NOTION_TOKEN이 올바르지 않습니다.';
    if (typeof json.message === 'string') return json.message;
  } catch {
    // ignore
  }
  return `Notion API ${res.status}`;
}

/** Integration이 접근 가능한 모든 페이지 변경사항 (Search API) */
async function fetchAllPages(token: string): Promise<Response> {
  return fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: NOTION_HEADERS(token),
    body: JSON.stringify({
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
      page_size: 20,
    }),
  });
}

/** 특정 데이터베이스의 페이지만 조회 (Database Query API) */
async function fetchDatabase(token: string, databaseId: string): Promise<Response> {
  return fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: NOTION_HEADERS(token),
    body: JSON.stringify({
      sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
      page_size: 20,
    }),
  });
}

export async function POST(request: Request): Promise<Response> {
  const token = process.env.NOTION_TOKEN;
  const envDatabaseId = process.env.NOTION_DATABASE_ID;

  if (!token) {
    return Response.json({ items: [], status: 'not_configured' } satisfies FeedResponse);
  }

  let body: { database_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No body — use env defaults
  }

  const databaseId = body.database_id ?? envDatabaseId;

  try {
    // DB ID가 없으면 Search API로 전체 페이지 변경사항 조회
    const res = databaseId
      ? await fetchDatabase(token, databaseId)
      : await fetchAllPages(token);

    if (!res.ok) {
      return Response.json({
        items: [],
        status: 'error',
        message: await parseNotionError(res),
      } satisfies FeedResponse);
    }

    const data = await res.json();
    // Search API는 data.results, Database Query도 data.results
    const items = transformNotionPages(data.results ?? []);
    return Response.json({ items, status: 'ok' } satisfies FeedResponse);
  } catch (err) {
    return Response.json({
      items: [],
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    } satisfies FeedResponse);
  }
}
