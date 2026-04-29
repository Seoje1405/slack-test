import { useQuery } from '@tanstack/react-query';
import type { FeedResponse } from '@/types/feed';

export function useNotionFeed() {
  return useQuery<FeedResponse>({
    queryKey: ['feed', 'notion'],
    queryFn: () =>
      fetch('/api/notion', { method: 'POST', headers: { 'Content-Type': 'application/json' } }).then(
        (r) => r.json()
      ),
    staleTime: 115 * 1000,
    refetchInterval: 120 * 1000,
    retry: 2,
  });
}
