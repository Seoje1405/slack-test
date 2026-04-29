import { useQuery } from '@tanstack/react-query';
import type { FeedResponse } from '@/types/feed';

export function useGitHubFeed() {
  return useQuery<FeedResponse>({
    queryKey: ['feed', 'github'],
    queryFn: () => fetch('/api/github').then((r) => r.json()),
    staleTime: 55 * 1000,
    refetchInterval: 60 * 1000,
    retry: 2,
  });
}
