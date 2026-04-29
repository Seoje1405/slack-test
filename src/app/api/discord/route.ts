import { Redis } from '@upstash/redis';
import type { FeedResponse, FeedItem } from '@/types/feed';

export const dynamic = 'force-dynamic';

const KEY = 'discord:events';

export async function GET(): Promise<Response> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!botToken || !redisUrl || !redisToken) {
    return Response.json({ items: [], status: 'not_configured' } satisfies FeedResponse);
  }

  try {
    const redis = new Redis({ url: redisUrl, token: redisToken });
    const raw = await redis.lrange(KEY, 0, 199);

    const items: FeedItem[] = (raw as unknown as Record<string, unknown>[]).map((ev) => ({
      id: String(ev.id),
      service: 'discord' as const,
      title: String(ev.title),
      user: String(ev.user),
      avatarUrl: (ev.avatarUrl as string | null) ?? null,
      time: String(ev.time),
      tag: (ev.tag as string | null) ?? null,
      url: (ev.url as string | null) ?? null,
    }));

    return Response.json({ items, status: 'ok' } satisfies FeedResponse);
  } catch (err) {
    return Response.json({
      items: [],
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    } satisfies FeedResponse);
  }
}
