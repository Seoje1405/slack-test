import { transformNotionPages } from '@/lib/notion';
import type { UserMap } from '@/lib/notion';
import type { FeedResponse } from '@/types/feed';

export const revalidate = 120;

const NOTION_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28',
});

// 프로세스 수명 동안 유지되는 유저 정보 캐시
const userCache = new Map<string, { name: string; avatarUrl: string | null }>();

async function fetchUserInfo(
  token: string,
  userId: string
): Promise<{ name: string; avatarUrl: string | null }> {
  if (userCache.has(userId)) return userCache.get(userId)!;

  try {
    const res = await fetch(`https://api.notion.com/v1/users/${userId}`, {
      headers: NOTION_HEADERS(token),
    });
    if (res.ok) {
      const data = await res.json();
      const info = { name: data.name ?? 'Unknown', avatarUrl: data.avatar_url ?? null };
      userCache.set(userId, info);
      return info;
    }
  } catch {
    // ignore
  }

  const fallback = { name: 'Unknown', avatarUrl: null };
  userCache.set(userId, fallback);
  return fallback;
}

async function buildUserMap(
  token: string,
  results: Array<{ last_edited_by?: { id?: string } }>
): Promise<UserMap> {
  const ids = [
    ...new Set(
      results
        .map((r) => r.last_edited_by?.id)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const entries = await Promise.all(
    ids.map(async (id) => [id, await fetchUserInfo(token, id)] as const)
  );
  return Object.fromEntries(entries);
}

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

  let body: { mode?: string; database_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No body
  }

  // mode가 명시적으로 'search'면 Search API, 'database'면 DB ID 우선 사용
  // mode 미지정 시 DB ID 여부로 결정 (기존 동작)
  let databaseId: string | null = null;
  if (body.mode === 'database') {
    databaseId = body.database_id ?? envDatabaseId ?? null;
  } else if (body.mode === 'search') {
    databaseId = null;
  } else {
    databaseId = body.database_id ?? envDatabaseId ?? null;
  }

  try {
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
    const results = data.results ?? [];
    const userMap = await buildUserMap(token, results);
    const items = transformNotionPages(results, userMap);

    return Response.json({ items, status: 'ok' } satisfies FeedResponse);
  } catch (err) {
    return Response.json({
      items: [],
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    } satisfies FeedResponse);
  }
}
