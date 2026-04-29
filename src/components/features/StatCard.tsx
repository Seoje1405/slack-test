import { SERVICE_MAP } from '@/config/services';
import type { ServiceId, ServiceStatus } from '@/types/feed';

interface StatCardProps {
  service: ServiceId;
  count: number;
  status: ServiceStatus;
}

const STATUS_LABEL: Record<ServiceStatus, string> = {
  idle: '대기',
  loading: '로딩 중',
  ok: '정상',
  error: '오류',
  not_configured: '미설정',
};

const STATUS_COLOR: Record<ServiceStatus, string> = {
  idle: 'var(--text-muted)',
  loading: 'var(--warning)',
  ok: 'var(--success)',
  error: 'var(--error)',
  not_configured: 'var(--text-muted)',
};

export function StatCard({ service, count, status }: StatCardProps) {
  const config = SERVICE_MAP[service];

  return (
    <div
      className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4 flex flex-col gap-3"
      style={{ borderTop: `2px solid ${config.color}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-secondary)]">{config.label}</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-mono"
          style={{
            color: STATUS_COLOR[status],
            background: `${STATUS_COLOR[status]}18`,
          }}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>
      <div className="font-mono text-3xl font-semibold" style={{ color: config.color }}>
        {count}
      </div>
      <p className="text-xs text-[var(--text-muted)]">{config.description}</p>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] border-t-2 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-16 rounded skeleton-shimmer" />
        <div className="h-4 w-12 rounded-full skeleton-shimmer" />
      </div>
      <div className="h-9 w-12 rounded skeleton-shimmer" />
      <div className="h-3 w-32 rounded skeleton-shimmer" />
    </div>
  );
}
