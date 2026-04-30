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
  const lines = content.split('\n');
  const blocks: object[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].slice(0, 2000);

    if (line.startsWith('### ')) {
      blocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: line.slice(4) } }] } });
    } else if (line.startsWith('## ')) {
      blocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: line.slice(3) } }] } });
    } else if (line.startsWith('# ')) {
      blocks.push({ object: 'block', type: 'heading_1', heading_1: { rich_text: [{ type: 'text', text: { content: line.slice(2) } }] } });
    } else if (line.startsWith('- [ ] ') || line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
      const checked = !line.startsWith('- [ ] ');
      blocks.push({ object: 'block', type: 'to_do', to_do: { rich_text: [{ type: 'text', text: { content: line.slice(6) } }], checked } });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({ object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line.slice(2) } }] } });
    } else if (/^\d+\. /.test(line)) {
      blocks.push({ object: 'block', type: 'numbered_list_item', numbered_list_item: { rich_text: [{ type: 'text', text: { content: line.replace(/^\d+\. /, '') } }] } });
    } else if (line.startsWith('> ')) {
      blocks.push({ object: 'block', type: 'quote', quote: { rich_text: [{ type: 'text', text: { content: line.slice(2) } }] } });
    } else if (line.trim() === '---') {
      blocks.push({ object: 'block', type: 'divider', divider: {} });
    } else if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'plain text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ object: 'block', type: 'code', code: { rich_text: [{ type: 'text', text: { content: codeLines.join('\n').slice(0, 2000) } }], language: lang } });
    } else {
      blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: line ? [{ type: 'text', text: { content: line } }] : [] } });
    }

    i++;
  }

  return blocks;
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
