'use client';

import { useQuery } from '@tanstack/react-query';
import type { FeedResponse } from '@/types/feed';
import { useGitHubSettingsStore } from '@/stores/githubSettingsStore';

export function useGitHubFeed() {
  const repos = useGitHubSettingsStore((s) => s.repos);
  const reposParam = repos.length > 0 ? `?repos=${repos.join(',')}` : '';

  return useQuery<FeedResponse>({
    queryKey: ['feed', 'github', repos],
    queryFn: async () => {
      const res = await fetch(`/api/github${reposParam}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 55 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    retry: 1,
    retryDelay: 5_000,
  });
}
