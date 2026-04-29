import { Redis } from '@upstash/redis';

const KEY = 'discord:events';
const MAX_EVENTS = 200;
const TASK_FREQ_KEY = 'stats:task_frequency';
const CONTRIBUTORS_KEY = 'stats:contributors';

export interface DiscordEvent {
  id: string;
  type: 'message' | 'mention' | 'voice_join' | 'voice_leave' | 'voice_move' | 'member_join' | 'member_leave';
  title: string;
  user: string;
  avatarUrl: string | null;
  time: string;
  tag: string | null;
  url: string | null;
}

// dotenv가 먼저 로드된 뒤 함수가 호출되므로 lazy 초기화
function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export async function appendEvent(event: DiscordEvent): Promise<void> {
  const redis = getRedis();
  await redis.lpush(KEY, event);
  await redis.ltrim(KEY, 0, MAX_EVENTS - 1);
}

export async function readEvents(): Promise<DiscordEvent[]> {
  const redis = getRedis();
  return redis.lrange<DiscordEvent>(KEY, 0, MAX_EVENTS - 1);
}

export async function incrementTaskStat(eventType: string): Promise<void> {
  const redis = getRedis();
  await redis.hincrby(TASK_FREQ_KEY, `discord:${eventType}`, 1);
}

export async function incrementContributorStat(user: string): Promise<void> {
  const redis = getRedis();
  await redis.hincrby(CONTRIBUTORS_KEY, user, 1);
}

export async function readTaskStats(): Promise<Record<string, number>> {
  const redis = getRedis();
  const result = await redis.hgetall(TASK_FREQ_KEY);
  if (!result) return {};
  return Object.fromEntries(
    Object.entries(result).map(([k, v]) => [k, Number(v)])
  );
}

export async function readContributorStats(): Promise<Record<string, number>> {
  const redis = getRedis();
  const result = await redis.hgetall(CONTRIBUTORS_KEY);
  if (!result) return {};
  return Object.fromEntries(
    Object.entries(result).map(([k, v]) => [k, Number(v)])
  );
}
