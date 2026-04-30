import type { NextRequest } from 'next/server';

const NOTION_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28',
});

async function getTitlePropertyName(token: string, databaseId: string): Promise<string> {
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    headers: NOTION_HEADERS(token),
  });
  if (!res.ok) return 'Name';
  const data = await res.json();
  const titleProp = Object.entries(
    data.properties as Record<string, { type: string }>
  ).find(([, prop]) => prop.type === 'title');
  return titleProp?.[0] ?? 'Name';
}

function buildContentBlocks(content: string) {
  return content
    .split('\n')
    .map((line) => line.slice(0, 2000))
    .map((line) => ({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: line
          ? [{ type: 'text', text: { content: line } }]
          : [],
      },
    }));
}

export async function POST(request: NextRequest) {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return Response.json({ error: 'NOTION_TOKEN이 설정되지 않았습니다.' }, { status: 400 });
  }

  const body = await request.json() as { title?: string; content?: string; database_id?: string };
  const title = body.title?.trim();
  const content = body.content?.trim();
  const databaseId = body.database_id || process.env.NOTION_DATABASE_ID;

  if (!title) {
    return Response.json({ error: '제목을 입력하세요.' }, { status: 400 });
  }
  if (!databaseId) {
    return Response.json({ error: 'NOTION_DATABASE_ID가 설정되지 않았습니다.' }, { status: 400 });
  }

  const titlePropName = await getTitlePropertyName(token, databaseId);

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: NOTION_HEADERS(token),
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        [titlePropName]: {
          title: [{ text: { content: title } }],
        },
      },
      ...(content ? { children: buildContentBlocks(content) } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return Response.json(
      { error: (err as { message?: string }).message ?? `Notion API ${res.status}` },
      { status: res.status }
    );
  }

  const page = await res.json();
  return Response.json({ id: page.id, url: page.url });
}
