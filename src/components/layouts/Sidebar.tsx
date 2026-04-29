'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SERVICES } from '@/config/services';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useFeedAnnotationStore } from '@/stores/feedAnnotationStore';
import { useGitHubFeed } from '@/hooks/useGitHubFeed';
import { useNotionFeed } from '@/hooks/useNotionFeed';
import { useDiscordFeed } from '@/hooks/useDiscordFeed';
import { useFigmaFeed } from '@/hooks/useFigmaFeed';
import type { FeedItem, ServiceId } from '@/types/feed';

function useUnreadCounts(): Record<ServiceId, number> {
  const github = useGitHubFeed();
  const notion = useNotionFeed();
  const discord = useDiscordFeed();
  const figma = useFigmaFeed();

  const lastSeenAt = useFeedAnnotationStore((s) => s.lastSeenAt);

  function count(items: FeedItem[], service: ServiceId): number {
    const seenAt = lastSeenAt[service];
    if (!seenAt || !items.length) return 0;
    return items.filter((item) => new Date(item.time) > new Date(seenAt)).length;
  }

  return {
    github: count(github.data?.items ?? [], 'github'),
    notion: count(notion.data?.items ?? [], 'notion'),
    discord: count(discord.data?.items ?? [], 'discord'),
    figma: count(figma.data?.items ?? [], 'figma'),
  };
}

export function Sidebar() {
  const pathname = usePathname();
  const { activeFilter, viewMode, setFilter, setViewMode } = useDashboardStore();
  const unread = useUnreadCounts();
  const isDashboard = pathname === '/dashboard';

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  return (
    <aside className="w-[220px] flex-shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col h-full">
      {/* 로고 */}
      <div className="px-5 py-5 border-b border-[var(--border-subtle)]">
        <span className="font-mono text-base font-semibold text-[var(--accent-light)]">
          팀 허브
        </span>
      </div>

      {/* 대시보드 네비 */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {/* 전체 그리드 */}
        <button
          className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            isDashboard && activeFilter === null && viewMode === 'grid'
              ? 'bg-[var(--bg-overlay)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => setFilter(null)}
        >
          <span className="text-base">🏠</span>
          <span className="flex-1">전체</span>
          {totalUnread > 0 && isDashboard && viewMode !== 'unified' && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-mono text-white bg-[var(--accent-light)]">
              {totalUnread}
            </span>
          )}
        </button>

        {/* 통합 보기 */}
        <button
          className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            isDashboard && viewMode === 'unified'
              ? 'bg-[var(--bg-overlay)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => setViewMode('unified')}
        >
          <span className="text-base">⚡</span>
          <span className="flex-1">통합 보기</span>
          {totalUnread > 0 && isDashboard && viewMode === 'unified' && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-mono text-white bg-[var(--accent-light)]">
              {totalUnread}
            </span>
          )}
        </button>

        {/* 구분선 */}
        <div className="my-2 border-t border-[var(--border-subtle)]" />

        {/* 서비스별 */}
        {SERVICES.map((svc) => (
          <button
            key={svc.id}
            className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isDashboard && activeFilter === svc.id && viewMode === 'grid'
                ? 'bg-[var(--bg-overlay)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]'
            }`}
            onClick={() => setFilter(svc.id as ServiceId)}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: svc.color }}
            />
            <span className="flex-1">{svc.label}</span>
            {unread[svc.id] > 0 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-mono text-white"
                style={{ background: svc.color }}
              >
                {unread[svc.id]}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* 하단 설정 링크 */}
      <div className="px-2 py-3 border-t border-[var(--border-subtle)]">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)] transition-colors"
        >
          <span className="text-base">⚙️</span>
          <span>설정</span>
        </Link>
      </div>
    </aside>
  );
}
