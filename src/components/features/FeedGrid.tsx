'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/stores/dashboardStore';
import { SERVICES } from '@/config/services';
import type { ServiceId } from '@/types/feed';
import { FeedPanel } from './FeedPanel';
import { UnifiedFeedPanel } from './UnifiedFeedPanel';

export function FeedGrid() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const activeFilter = useDashboardStore((s) => s.activeFilter);
  const viewMode = useDashboardStore((s) => s.viewMode);

  if (!mounted) return <FeedGridSkeleton />;

  if (viewMode === 'unified') {
    return <UnifiedFeedPanel />;
  }

  const services: ServiceId[] = activeFilter
    ? [activeFilter]
    : SERVICES.map((s) => s.id);

  const isExpanded = services.length === 1;

  return (
    <div className={cn('grid gap-4', isExpanded ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2')}>
      {services.map((service) => (
        <FeedPanel key={service} service={service} expanded={isExpanded} />
      ))}
    </div>
  );
}

export function FeedGridSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] min-h-[320px] skeleton-shimmer"
        />
      ))}
    </div>
  );
}
