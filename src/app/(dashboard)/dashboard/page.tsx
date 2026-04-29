import { Suspense } from 'react';
import { StatGrid } from '@/components/features/StatGrid';
import { FeedGrid, FeedGridSkeleton } from '@/components/features/FeedGrid';
import { StatsPanel } from '@/components/features/StatsPanel';
import { MeetingPanel } from '@/components/features/MeetingPanel';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 max-w-screen-xl mx-auto">
      <MeetingPanel />

      <Suspense
        fallback={
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] border-t-2 h-28 skeleton-shimmer"
              />
            ))}
          </div>
        }
      >
        <StatGrid />
      </Suspense>

      <StatsPanel />

      <Suspense fallback={<FeedGridSkeleton />}>
        <FeedGrid />
      </Suspense>
    </div>
  );
}
