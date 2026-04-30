'use client';

import { useGitHubFeed } from '@/hooks/useGitHubFeed';
import { useNotionFeed } from '@/hooks/useNotionFeed';
import { useDiscordFeed } from '@/hooks/useDiscordFeed';
import { useFigmaFeed } from '@/hooks/useFigmaFeed';
import { SERVICES } from '@/config/services';
import type { ServiceId, ServiceStatus } from '@/types/feed';
import { StatCard, StatCardSkeleton } from './StatCard';
import { useHasHydrated } from '@/hooks/useHasHydrated';

export function StatGrid() {
  const mounted = useHasHydrated();

  const github = useGitHubFeed();
  const notion = useNotionFeed();
  const discord = useDiscordFeed();
  const figma = useFigmaFeed();

  const queries = { github, notion, discord, figma };

  if (!mounted) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {SERVICES.map((svc) => <StatCardSkeleton key={svc.id} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {SERVICES.map((svc) => {
        const q = queries[svc.id as ServiceId];
        if (q.isPending) return <StatCardSkeleton key={svc.id} />;
        const status: ServiceStatus = q.data?.status ?? 'idle';
        const count = q.data?.items.length ?? 0;
        return (
          <StatCard key={svc.id} service={svc.id} count={count} status={status} />
        );
      })}
    </div>
  );
}
