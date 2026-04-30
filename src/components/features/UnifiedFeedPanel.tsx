'use client';

import { useState, useDeferredValue } from 'react';
import { cn } from '@/lib/utils';
import { useGitHubFeed } from '@/hooks/useGitHubFeed';
import { useNotionFeed } from '@/hooks/useNotionFeed';
import { useDiscordFeed } from '@/hooks/useDiscordFeed';
import { useFigmaFeed } from '@/hooks/useFigmaFeed';
import { useFeedAnnotationStore } from '@/stores/feedAnnotationStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useUserProfileStore, matchesMyUsername } from '@/stores/userProfileStore';
import { SERVICES } from '@/config/services';
import type { FeedItem, ServiceId } from '@/types/feed';
import { FeedItem as FeedItemComponent, FeedItemSkeleton } from './FeedItem';

const INITIAL_LIMIT = 20;
const ACCENT = 'var(--accent-light)';

type DateFilter = '1d' | '7d' | '30d' | null;

const DATE_OPTIONS: { label: string; value: DateFilter }[] = [
  { label: '오늘', value: '1d' },
  { label: '7일', value: '7d' },
  { label: '30일', value: '30d' },
  { label: '전체', value: null },
];

const DATE_MS: Record<'1d' | '7d' | '30d', number> = {
  '1d': 86_400_000,
  '7d': 604_800_000,
  '30d': 2_592_000_000,
};

export function UnifiedFeedPanel() {
  const github = useGitHubFeed();
  const notion = useNotionFeed();
  const discord = useDiscordFeed();
  const figma = useFigmaFeed();

  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT);
  const [favOnly, setFavOnly] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<ServiceId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>(null);

  const deferredSearch = useDeferredValue(searchQuery);

  const myItemsFilter = useDashboardStore((s) => s.myItemsFilter);
  const setMyItemsFilter = useDashboardStore((s) => s.setMyItemsFilter);
  const myUsername = useUserProfileStore((s) => s.myUsername);

  const favorites = useFeedAnnotationStore((s) => s.favorites);

  const isLoading = [github, notion, discord, figma].some((q) => q.isPending);

  const allItems: FeedItem[] = [
    ...(github.data?.items ?? []),
    ...(notion.data?.items ?? []),
    ...(discord.data?.items ?? []),
    ...(figma.data?.items ?? []),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const now = Date.now();

  const serviceFiltered = serviceFilter
    ? allItems.filter((item) => item.service === serviceFilter)
    : allItems;

  const dateFiltered = dateFilter
    ? serviceFiltered.filter((item) => now - new Date(item.time).getTime() <= DATE_MS[dateFilter])
    : serviceFiltered;

  const searchFiltered = deferredSearch.trim()
    ? dateFiltered.filter((item) => {
        const q = deferredSearch.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.user.toLowerCase().includes(q) ||
          (item.tag ?? '').toLowerCase().includes(q)
        );
      })
    : dateFiltered;

  const myFiltered = myItemsFilter && myUsername
    ? searchFiltered.filter((item) => matchesMyUsername(item, myUsername))
    : searchFiltered;

  const filteredItems = favOnly
    ? myFiltered.filter((item) => favorites[item.id])
    : myFiltered;

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;
  const favCount = allItems.filter((item) => favorites[item.id]).length;
  const myItemsCount = myUsername ? allItems.filter((item) => matchesMyUsername(item, myUsername)).length : 0;

  const hasActiveFilter = !!serviceFilter || !!dateFilter || !!deferredSearch.trim() || favOnly || myItemsFilter;

  function resetFilters() {
    setServiceFilter(null);
    setDateFilter(null);
    setSearchQuery('');
    setFavOnly(false);
    setMyItemsFilter(false);
    setVisibleCount(INITIAL_LIMIT);
  }

  return (
    <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col overflow-hidden min-h-[320px]">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex flex-col gap-2">
        {/* 상단 행: 제목 + 서비스 필터 + 즐겨찾기 */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--text-primary)]">통합 피드</span>
            {!isLoading && (
              <span className="text-xs text-[var(--text-muted)] font-mono">{filteredItems.length}</span>
            )}
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
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full transition-colors font-mono',
                      active
                        ? 'text-white'
                        : 'text-[var(--text-muted)] border border-[var(--border-default)]'
                    )}
                    style={active ? { background: svc.color } : {}}
                  >
                    {svc.label}
                  </button>
                );
              })}
              {myUsername && (
                <button
                  onClick={() => { setMyItemsFilter(!myItemsFilter); setVisibleCount(INITIAL_LIMIT); }}
                  className={cn(
                    'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors font-mono',
                    myItemsFilter
                      ? 'text-white bg-[var(--accent-light)]'
                      : 'text-[var(--text-muted)] border border-[var(--border-default)]'
                  )}
                  title={`내 항목 (${myItemsCount}개)`}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                  </svg>
                  나{myItemsCount > 0 && !myItemsFilter && <span className="ml-0.5 opacity-60">{myItemsCount}</span>}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 날짜 필터 */}
            <div className="flex items-center gap-0.5 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-full px-1 py-0.5">
              {DATE_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => { setDateFilter(opt.value); setVisibleCount(INITIAL_LIMIT); }}
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full transition-colors',
                    dateFilter === opt.value
                      ? 'bg-[var(--text-primary)] text-[var(--bg-base)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 즐겨찾기 필터 */}
            {favCount > 0 && (
              <button
                onClick={() => { setFavOnly((v) => !v); setVisibleCount(INITIAL_LIMIT); }}
                className={cn(
                  'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors',
                  favOnly
                    ? 'text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-default)]'
                )}
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

        {/* 검색 입력 */}
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
            width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(INITIAL_LIMIT); }}
            placeholder="제목, 작성자, 태그 검색..."
            className="w-full text-xs pl-7 pr-7 py-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus,#555)] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setVisibleCount(INITIAL_LIMIT); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 활성 필터 리셋 */}
        {hasActiveFilter && (
          <button
            onClick={resetFilters}
            className="self-start text-[10px] px-2 py-0.5 rounded-full border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] transition-colors"
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto py-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <FeedItemSkeleton key={i} />)
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-2">
            <p className="text-sm text-[var(--text-muted)]">
              {deferredSearch.trim()
                ? `"${deferredSearch}" 검색 결과가 없습니다`
                : favOnly
                ? '즐겨찾기한 항목이 없습니다'
                : '항목이 없습니다'}
            </p>
            {hasActiveFilter && (
              <button
                onClick={resetFilters}
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] transition-colors"
              >
                필터 초기화
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
                isMine={!!myUsername && matchesMyUsername(item, myUsername)}
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
