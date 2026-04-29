import { useQuery } from '@tanstack/react-query';
import { useNotionSettingsStore } from '@/stores/notionSettingsStore';
import type { FeedResponse } from '@/types/feed';

export function useNotionFeed() {
  const mode = useNotionSettingsStore((s) => s.mode);
  const databaseId = useNotionSettingsStore((s) => s.databaseId);

  return useQuery<FeedResponse>({
    queryKey: ['feed', 'notion', mode, databaseId],
    queryFn: () =>
      fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, database_id: databaseId || undefined }),
      }).then((r) => r.json()),
    staleTime: 115 * 1000,
    refetchInterval: 120 * 1000,
    retry: 2,
  });
}
