'use client';

import { useQuery } from '@tanstack/react-query';
import type { FeedResponse } from '@/types/feed';
import { useGitHubSettingsStore } from '@/stores/githubSettingsStore';

export function useGitHubFeed() {
  const repos = useGitHubSettingsStore((s) => s.repos);
  const reposParam = repos.length > 0 ? `?repos=${repos.join(',')}` : '';

  return useQuery<FeedResponse>({
    queryKey: ['feed', 'github', repos],
    queryFn: () => fetch(`/api/github${reposParam}`).then((r) => r.json()),
    staleTime: 55 * 1000,
    refetchInterval: 60 * 1000,
    retry: 2,
  });
}
