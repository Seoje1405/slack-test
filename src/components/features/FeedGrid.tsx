'use client';

import { useState, useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { SERVICES } from '@/config/services';
import type { ServiceId } from '@/types/feed';
import { FeedPanel } from './FeedPanel';

export function FeedGrid() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const activeFilter = useDashboardStore((s) => s.activeFilter);

  if (!mounted) return <FeedGridSkeleton />;

  const services: ServiceId[] = activeFilter
    ? [activeFilter]
    : SERVICES.map((s) => s.id);

  return (
    <div
      className={`grid gap-4 ${
        services.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
      }`}
    >
      {services.map((service) => (
        <FeedPanel key={service} service={service} />
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
