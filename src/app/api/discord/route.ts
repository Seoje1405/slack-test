import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { FeedResponse, FeedItem } from '@/types/feed';

export const dynamic = 'force-dynamic';

const EVENTS_PATH = join(process.cwd(), 'bot', 'events.json');

export async function GET(): Promise<Response> {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    return Response.json({ items: [], status: 'not_configured' } satisfies FeedResponse);
  }

  try {
    if (!existsSync(EVENTS_PATH)) {
      return Response.json({
        items: [],
        status: 'ok',
      } satisfies FeedResponse);
    }

    const raw: unknown[] = JSON.parse(readFileSync(EVENTS_PATH, 'utf-8'));
    const items: FeedItem[] = (Array.isArray(raw) ? raw : []).map((e) => {
      const ev = e as Record<string, unknown>;
      return {
        id: String(ev.id),
        service: 'discord' as const,
        title: String(ev.title),
        user: String(ev.user),
        avatarUrl: (ev.avatarUrl as string | null) ?? null,
        time: String(ev.time),
        tag: (ev.tag as string | null) ?? null,
        url: (ev.url as string | null) ?? null,
      };
    });

    return Response.json({ items, status: 'ok' } satisfies FeedResponse);
  } catch (err) {
    return Response.json({
      items: [],
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    } satisfies FeedResponse);
  }
}
