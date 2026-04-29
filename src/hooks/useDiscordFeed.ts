import { useQuery } from '@tanstack/react-query';
import type { FeedResponse } from '@/types/feed';

export function useDiscordFeed() {
  return useQuery<FeedResponse>({
    queryKey: ['feed', 'discord'],
    queryFn: () => fetch('/api/discord').then((r) => r.json()),
    staleTime: 25 * 1000,
    refetchInterval: 30 * 1000,
    retry: 2,
  });
}
