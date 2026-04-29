import { useQuery } from '@tanstack/react-query';
import type { FeedResponse } from '@/types/feed';

export function useFigmaFeed() {
  return useQuery<FeedResponse>({
    queryKey: ['feed', 'figma'],
    queryFn: () => fetch('/api/figma').then((r) => r.json()),
    staleTime: 115 * 1000,
    refetchInterval: 120 * 1000,
    retry: 2,
  });
}
