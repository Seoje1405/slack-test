'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SERVICE_MAP } from '@/config/services';
import { useGitHubFeed } from '@/hooks/useGitHubFeed';
import { useNotionFeed } from '@/hooks/useNotionFeed';
import { useDiscordFeed } from '@/hooks/useDiscordFeed';
import { useFigmaFeed } from '@/hooks/useFigmaFeed';
import { useFeedAnnotationStore } from '@/stores/feedAnnotationStore';
import { useUserProfileStore, matchesMyUsername } from '@/stores/userProfileStore';
import type { ServiceId, FeedResponse } from '@/types/feed';
import { FeedItem, FeedItemSkeleton } from './FeedItem';

const INITIAL_LIMIT = 5;

interface FeedPanelProps {
  service: ServiceId;
  expanded?: boolean;
}

function useFeedForService(service: ServiceId) {
  const github = useGitHubFeed();
  const notion = useNotionFeed();
  const discord = useDiscordFeed();
  const figma = useFigmaFeed();

  const map = { github, notion, discord, figma };
  return map[service];
}

export function FeedPanel({ service, expanded = false }: FeedPanelProps) {
  const config = SERVICE_MAP[service];
  const query = useFeedForService(service);
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT);
  const [favOnly, setFavOnly] = useState(false);

  const favorites = useFeedAnnotationStore((s) => s.favorites);
  const myUsername = useUserProfileStore((s) => s.myUsername);

  const data = query.data as FeedResponse | undefined;
  const isLoading = query.isPending;
  const status = data?.status ?? (isLoading ? 'loading' : 'idle');
  const allItems = data?.items ?? [];
  const filteredItems = favOnly ? allItems.filter((item) => favorites[item.id]) : allItems;
  const visibleItems = expanded ? filteredItems : filteredItems.slice(0, visibleCount);
  const hasMore = !expanded && visibleCount < filteredItems.length;
  const favCount = allItems.filter((item) => favorites[item.id]).length;

  return (
    <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col overflow-hidden min-h-[320px]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: config.color }} />
          <span className="text-sm font-semibold text-[var(--text-primary)]">{config.label}</span>
          {!isLoading && filteredItems.length > 0 && (
            <span className="text-xs text-[var(--text-muted)] font-mono">
              {expanded
                ? filteredItems.length
                : visibleCount < filteredItems.length
                ? `${visibleCount}/${filteredItems.length}`
                : filteredItems.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && favCount > 0 && (
            <button
              onClick={() => { setFavOnly((v) => !v); setVisibleCount(INITIAL_LIMIT); }}
              className={cn(
                'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors',
                favOnly
                  ? 'text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-default)]'
              )}
              style={favOnly ? { background: config.color } : {}}
              title="즐겨찾기만 보기"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {favCount}
            </button>
          )}
          <StatusBadge status={status} />
        </div>
      </div>

      {/* 본문 */}
      <div
        className={cn('flex-1 py-1', expanded && 'overflow-y-auto')}
        style={expanded ? { maxHeight: 'calc(100vh - 260px)' } : {}}
      >
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
        ) : filteredItems.length === 0 ? (
          favOnly ? <FavEmptyState onClear={() => setFavOnly(false)} /> : <EmptyState />
        ) : (
          <>
            {visibleItems.map((item) => (
              <FeedItem
                key={item.id}
                item={item}
                accentColor={config.color}
                isMine={!!myUsername && matchesMyUsername(item, myUsername)}
              />
            ))}
            {hasMore && (
              <div className="px-4 py-2">
                <button
                  onClick={() => setVisibleCount((c) => c + INITIAL_LIMIT)}
                  className="w-full text-xs py-2 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)] transition-colors"
                  style={{ borderColor: `${config.color}40` }}
                >
                  더보기 ({filteredItems.length - visibleCount}개 남음)
                </button>
              </div>
            )}
          </>
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

function FavEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center gap-3">
      <div className="text-2xl opacity-40">⭐</div>
      <p className="text-sm text-[var(--text-muted)]">즐겨찾기한 항목이 없습니다</p>
      <button
        onClick={onClear}
        className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] transition-colors"
      >
        전체 보기
      </button>
    </div>
  );
}
