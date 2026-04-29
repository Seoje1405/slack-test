import { transformFigmaVersions } from '@/lib/figma';
import type { FeedResponse } from '@/types/feed';

export const revalidate = 300;

export async function GET(): Promise<Response> {
  const token = process.env.FIGMA_TOKEN;
  const fileKey = process.env.FIGMA_FILE_KEY;

  if (!token || !fileKey) {
    return Response.json({ items: [], status: 'not_configured' } satisfies FeedResponse);
  }

  try {
    const res = await fetch(
      `https://api.figma.com/v1/files/${fileKey}/versions?page_size=20`,
      {
        headers: { 'X-Figma-Token': token },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return Response.json({
        items: [],
        status: 'error',
        message: `Figma API ${res.status}: ${text.slice(0, 200)}`,
      } satisfies FeedResponse);
    }

    const data = await res.json();
    const items = transformFigmaVersions(data.versions ?? [], fileKey);
    return Response.json({ items, status: 'ok' } satisfies FeedResponse);
  } catch (err) {
    return Response.json({
      items: [],
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    } satisfies FeedResponse);
  }
}
