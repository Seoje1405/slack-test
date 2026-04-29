import { Redis } from '@upstash/redis';
import type { StatsData } from '@/types/feed';

const TASK_FREQ_KEY = 'stats:task_frequency';
const CONTRIBUTORS_KEY = 'stats:contributors';

function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export async function readStats(): Promise<StatsData> {
  const redis = getRedis();

  const [rawFreq, rawContribs] = await Promise.all([
    redis.hgetall(TASK_FREQ_KEY),
    redis.hgetall(CONTRIBUTORS_KEY),
  ]);

  const taskFrequency = rawFreq
    ? Object.entries(rawFreq)
        .map(([type, count]) => ({ type, count: Number(count) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    : [];

  const topContributors = rawContribs
    ? Object.entries(rawContribs)
        .map(([user, count]) => ({ user, count: Number(count) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    : [];

  return { taskFrequency, topContributors };
}
