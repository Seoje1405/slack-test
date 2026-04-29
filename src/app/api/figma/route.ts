import { fetchFigmaVersions, fetchFigmaComments } from '@/lib/figma';
import type { FeedItem, FeedResponse } from '@/types/feed';

export const revalidate = 120;

export async function GET(): Promise<Response> {
  const token = process.env.FIGMA_TOKEN;
  const fileKey = process.env.FIGMA_FILE_KEY;

  if (!token || !fileKey) {
    return Response.json({ items: [], status: 'not_configured' } satisfies FeedResponse);
  }

  const [versionsResult, commentsResult] = await Promise.allSettled([
    fetchFigmaVersions(token, fileKey),
    fetchFigmaComments(token, fileKey),
  ]);

  const items: FeedItem[] = [];
  const errors: string[] = [];

  if (versionsResult.status === 'fulfilled') {
    items.push(...versionsResult.value);
  } else {
    errors.push(versionsResult.reason?.message ?? 'versions fetch failed');
  }

  if (commentsResult.status === 'fulfilled') {
    items.push(...commentsResult.value);
  } else {
    errors.push(commentsResult.reason?.message ?? 'comments fetch failed');
  }

  // 둘 다 실패한 경우에만 error 상태
  if (items.length === 0 && errors.length === 2) {
    return Response.json({
      items: [],
      status: 'error',
      message: errors.join(' / '),
    } satisfies FeedResponse);
  }

  // time 기준 내림차순 정렬
  items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return Response.json({
    items,
    status: 'ok',
    ...(errors.length > 0 && { message: `일부 데이터 로드 실패: ${errors.join(', ')}` }),
  } satisfies FeedResponse);
}
