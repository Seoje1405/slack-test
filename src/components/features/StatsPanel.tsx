'use client';

import { useQuery } from '@tanstack/react-query';
import type { StatsData, TaskFrequency, ContributorEntry } from '@/types/feed';

const EVENT_LABELS: Record<string, string> = {
  'discord:message': 'Message',
  'discord:mention': 'Mention',
  'discord:voice_join': 'Voice Join',
  'discord:voice_leave': 'Voice Leave',
  'discord:voice_move': 'Voice Move',
  'discord:member_join': 'Member Join',
  'discord:member_leave': 'Member Leave',
};

async function fetchStats(): Promise<StatsData> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

function FrequencyBar({ item, max }: { item: TaskFrequency; max: number }) {
  const pct = max > 0 ? Math.round((item.count / max) * 100) : 0;
  const label = EVENT_LABELS[item.type] ?? item.type;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--text-secondary)] w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--accent-default)] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[var(--text-tertiary)] w-8 text-right shrink-0">{item.count}</span>
    </div>
  );
}

function ContributorRow({ entry, rank }: { entry: ContributorEntry; rank: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-[var(--text-tertiary)] w-5 shrink-0">{rank}</span>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-full bg-[var(--bg-overlay)] flex items-center justify-center shrink-0">
          <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase">
            {entry.user.charAt(0)}
          </span>
        </div>
        <span className="text-xs text-[var(--text-primary)] truncate">{entry.user}</span>
      </div>
      <span className="text-xs text-[var(--text-secondary)] shrink-0">{entry.count} events</span>
    </div>
  );
}

function StatsPanelSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4 h-48 skeleton-shimmer"
        />
      ))}
    </div>
  );
}

export function StatsPanel() {
  const { data, isPending, isError } = useQuery<StatsData>({
    queryKey: ['stats'],
    queryFn: fetchStats,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  if (isPending) return <StatsPanelSkeleton />;
  if (isError || !data) return null;

  const hasTaskData = data.taskFrequency.length > 0;
  const hasContribData = data.topContributors.length > 0;
  const maxCount = data.taskFrequency[0]?.count ?? 1;

  if (!hasTaskData && !hasContribData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {hasTaskData && (
        <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
            Task Frequency
          </h3>
          <div className="flex flex-col gap-2.5">
            {data.taskFrequency.map((item) => (
              <FrequencyBar key={item.type} item={item} max={maxCount} />
            ))}
          </div>
        </div>
      )}

      {hasContribData && (
        <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
            Top Contributors
          </h3>
          <div className="flex flex-col gap-2.5">
            {data.topContributors.map((entry, i) => (
              <ContributorRow key={entry.user} entry={entry} rank={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
