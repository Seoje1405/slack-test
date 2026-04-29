import { readStats } from '@/lib/stats';
import type { StatsData } from '@/types/feed';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    const empty: StatsData = { taskFrequency: [], topContributors: [] };
    return Response.json(empty);
  }

  try {
    const stats = await readStats();
    return Response.json(stats);
  } catch (err) {
    const empty: StatsData = { taskFrequency: [], topContributors: [] };
    return Response.json(empty, {
      status: 500,
      headers: { 'X-Error': err instanceof Error ? err.message : 'Unknown error' },
    });
  }
}
