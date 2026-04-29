'use client';

import Link from 'next/link';
import { SERVICE_MAP } from '@/config/services';
import { useGitHubFeed } from '@/hooks/useGitHubFeed';
import { useNotionFeed } from '@/hooks/useNotionFeed';
import { useDiscordFeed } from '@/hooks/useDiscordFeed';
import { useFigmaFeed } from '@/hooks/useFigmaFeed';
import type { ServiceId, FeedResponse } from '@/types/feed';
import { FeedItem, FeedItemSkeleton } from './FeedItem';

interface FeedPanelProps {
  service: ServiceId;
}

function useFeedForService(service: ServiceId) {
  const github = useGitHubFeed();
  const notion = useNotionFeed();
  const discord = useDiscordFeed();
  const figma = useFigmaFeed();

  const map = { github, notion, discord, figma };
  return map[service];
}

export function FeedPanel({ service }: FeedPanelProps) {
  const config = SERVICE_MAP[service];
  const query = useFeedForService(service);

  const data = query.data as FeedResponse | undefined;
  const isLoading = query.isPending;
  const status = data?.status ?? (isLoading ? 'loading' : 'idle');

  return (
    <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col overflow-hidden min-h-[320px]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: config.color }} />
          <span className="text-sm font-semibold text-[var(--text-primary)]">{config.label}</span>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto py-1">
        {isLoading ? (
          <>
            <FeedItemSkeleton />
            <FeedItemSkeleton />
            <FeedItemSkeleton />
            <FeedItemSkeleton />
          </>
        ) : status === 'not_configured' ? (
          <NotConfiguredState service={service} />
        ) : status === 'error' ? (
          <ErrorState message={data?.message} onRetry={() => query.refetch()} />
        ) : data?.items.length === 0 ? (
          <EmptyState />
        ) : (
          data?.items.map((item) => (
            <FeedItem key={item.id} item={item} accentColor={config.color} />
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { color: string; label: string }> = {
    ok: { color: 'var(--success)', label: 'live' },
    loading: { color: 'var(--warning)', label: '로딩' },
    error: { color: 'var(--error)', label: '오류' },
    not_configured: { color: 'var(--text-muted)', label: '미설정' },
    idle: { color: 'var(--text-muted)', label: '대기' },
  };
  const { color, label } = styles[status] ?? styles.idle;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-mono"
      style={{ color, background: `${color}18` }}
    >
      {label}
    </span>
  );
}

function NotConfiguredState({ service }: { service: ServiceId }) {
  const config = SERVICE_MAP[service];
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center gap-3">
      <div className="text-2xl opacity-40">🔑</div>
      <p className="text-sm text-[var(--text-secondary)]">
        <strong style={{ color: config.color }}>{config.label}</strong> 토큰이 설정되지 않았습니다.
      </p>
      <Link
        href="/settings"
        className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] transition-colors"
      >
        설정 페이지로 이동
      </Link>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center gap-3">
      <div className="text-2xl opacity-40">⚠️</div>
      <p className="text-sm text-[var(--error)]">{message ?? '알 수 없는 오류'}</p>
      <button
        onClick={onRetry}
        className="text-xs px-3 py-1.5 rounded-lg border border-[var(--error)]/30 text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
      >
        재시도
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <p className="text-sm text-[var(--text-muted)]">항목이 없습니다</p>
    </div>
  );
}
