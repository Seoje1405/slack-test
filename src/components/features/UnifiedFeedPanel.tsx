'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useGitHubFeed } from '@/hooks/useGitHubFeed';
import { useNotionFeed } from '@/hooks/useNotionFeed';
import { useDiscordFeed } from '@/hooks/useDiscordFeed';
import { useFigmaFeed } from '@/hooks/useFigmaFeed';
import { useFeedAnnotationStore } from '@/stores/feedAnnotationStore';
import { SERVICES } from '@/config/services';
import type { FeedItem, ServiceId } from '@/types/feed';
import { FeedItem as FeedItemComponent, FeedItemSkeleton } from './FeedItem';

const INITIAL_LIMIT = 20;
const ACCENT = 'var(--accent-light)';

export function UnifiedFeedPanel() {
  const github = useGitHubFeed();
  const notion = useNotionFeed();
  const discord = useDiscordFeed();
  const figma = useFigmaFeed();

  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT);
  const [favOnly, setFavOnly] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<ServiceId | null>(null);

  const favorites = useFeedAnnotationStore((s) => s.favorites);
  const markSeen = useFeedAnnotationStore((s) => s.markSeen);
  const markedRef = useRef<Set<ServiceId>>(new Set());

  const isLoading = [github, notion, discord, figma].every((q) => q.isPending);

  const allItems = useMemo<FeedItem[]>(() => {
    return [
      ...(github.data?.items ?? []),
      ...(notion.data?.items ?? []),
      ...(discord.data?.items ?? []),
      ...(figma.data?.items ?? []),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [github.data, notion.data, discord.data, figma.data]);

  // Mark each service as seen when its data loads
  useEffect(() => {
    const queries: [typeof github, ServiceId][] = [
      [github, 'github'],
      [notion, 'notion'],
      [discord, 'discord'],
      [figma, 'figma'],
    ];
    for (const [q, id] of queries) {
      if (q.data?.status === 'ok' && !markedRef.current.has(id)) {
        markedRef.current.add(id);
        markSeen(id);
      }
    }
  }, [github.data, notion.data, discord.data, figma.data, markSeen]);

  const serviceFiltered = serviceFilter
    ? allItems.filter((item) => item.service === serviceFilter)
    : allItems;

  const filteredItems = favOnly
    ? serviceFiltered.filter((item) => favorites[item.id])
    : serviceFiltered;

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;
  const favCount = allItems.filter((item) => favorites[item.id]).length;

  return (
    <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col overflow-hidden min-h-[320px]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[var(--text-primary)]">통합 피드</span>
          {!isLoading && (
            <span className="text-xs text-[var(--text-muted)] font-mono">{filteredItems.length}</span>
          )}

          {/* 서비스 필터 칩 */}
          <div className="flex items-center gap-1">
            {SERVICES.map((svc) => {
              const active = serviceFilter === svc.id;
              return (
                <button
                  key={svc.id}
                  onClick={() => {
                    setServiceFilter(active ? null : svc.id);
                    setVisibleCount(INITIAL_LIMIT);
                  }}
                  className="text-xs px-2 py-0.5 rounded-full transition-colors font-mono"
                  style={
                    active
                      ? { background: svc.color, color: '#fff' }
                      : { color: 'var(--text-muted)', border: '1px solid var(--border-default)' }
                  }
                >
                  {svc.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {favCount > 0 && (
            <button
              onClick={() => { setFavOnly((v) => !v); setVisibleCount(INITIAL_LIMIT); }}
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${
                favOnly
                  ? 'text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-default)]'
              }`}
              style={favOnly ? { background: ACCENT } : {}}
              title="즐겨찾기만 보기"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {favCount}
            </button>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto py-1" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <FeedItemSkeleton key={i} />)
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-2">
            <p className="text-sm text-[var(--text-muted)]">
              {favOnly ? '즐겨찾기한 항목이 없습니다' : '항목이 없습니다'}
            </p>
            {favOnly && (
              <button
                onClick={() => setFavOnly(false)}
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] transition-colors"
              >
                전체 보기
              </button>
            )}
          </div>
        ) : (
          <>
            {visibleItems.map((item) => (
              <FeedItemComponent
                key={item.id}
                item={item}
                accentColor={ACCENT}
                showServiceBadge
              />
            ))}
            {hasMore && (
              <div className="px-4 py-3">
                <button
                  onClick={() => setVisibleCount((c) => c + INITIAL_LIMIT)}
                  className="w-full text-xs py-2 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)] transition-colors"
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
