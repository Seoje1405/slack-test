'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SERVICES } from '@/config/services';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useServiceBadgeCounts } from '@/hooks/useServiceBadgeCounts';
import type { ServiceId } from '@/types/feed';

export function Sidebar() {
  const pathname = usePathname();
  const {
    activeFilter, viewMode, setFilter, setViewMode,
    meetingMode, toggleMeetingMode,
    notionAddMode, toggleNotionAddMode,
    githubIssueMode, toggleGithubIssueMode,
    sidebarOpen, setSidebarOpen,
  } = useDashboardStore();

  const isDashboard = pathname === '/dashboard';
  const markSeen = useNotificationStore((s) => s.markSeen);
  const badgeCounts = useServiceBadgeCounts();

  const navItemClass = (active: boolean) =>
    cn(
      'w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
      active
        ? 'bg-[var(--bg-overlay)] text-[var(--text-primary)]'
        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]'
    );

  const sidebarContent = (
    <aside className="w-[220px] flex-shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col h-full">
      {/* 로고 */}
      <div className="px-5 py-5 border-b border-[var(--border-subtle)]">
        <span className="font-mono text-base font-semibold text-[var(--accent-light)]">
          팀 허브
        </span>
      </div>

      {/* 네비 */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <button
          className={navItemClass(isDashboard && activeFilter === null && viewMode === 'grid')}
          onClick={() => setFilter(null)}
        >
          <span className="text-base">🏠</span>
          <span>전체</span>
        </button>

        <button
          className={navItemClass(isDashboard && viewMode === 'unified')}
          onClick={() => setViewMode('unified')}
        >
          <span className="text-base">⚡</span>
          <span>통합 보기</span>
        </button>

        <div className="my-2 border-t border-[var(--border-subtle)]" />

        {SERVICES.map((svc) => {
          const count = badgeCounts[svc.id as ServiceId];
          return (
            <button
              key={svc.id}
              className={navItemClass(isDashboard && activeFilter === svc.id && viewMode === 'grid')}
              onClick={() => {
                setFilter(svc.id as ServiceId);
                markSeen(svc.id as ServiceId);
              }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: svc.color }} />
              <span className="flex-1">{svc.label}</span>
              {count > 0 && (
                <span
                  className="text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: svc.color }}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}

        <div className="my-2 border-t border-[var(--border-subtle)]" />

        {process.env.NEXT_PUBLIC_DISCORD_VOICE_URL && (
          <a
            href={process.env.NEXT_PUBLIC_DISCORD_VOICE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]"
          >
            <span className="text-base">🎙️</span>
            <span>음성채널 참가</span>
          </a>
        )}

        <div className="my-2 border-t border-[var(--border-subtle)]" />

        {/* GitHub 이슈 생성 */}
        <button
          onClick={toggleGithubIssueMode}
          className={cn(
            'w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
            githubIssueMode
              ? 'bg-[var(--github)]/10 text-[var(--text-primary)] border border-[var(--github)]/30'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]'
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <span>이슈 생성</span>
        </button>

        {/* Notion 페이지 추가 */}
        <button
          onClick={toggleNotionAddMode}
          className={cn(
            'w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
            notionAddMode
              ? 'bg-[var(--notion)]/10 text-[var(--text-primary)] border border-[var(--notion)]/30'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]'
          )}
        >
          <span className="text-base">📝</span>
          <span>Notion 추가</span>
        </button>

        {/* 회의 모드 */}
        <button
          onClick={toggleMeetingMode}
          className={cn(
            'w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
            meetingMode
              ? 'bg-green-500/10 text-green-600 border border-green-500/30'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]'
          )}
        >
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', meetingMode ? 'bg-green-500 animate-pulse' : 'bg-[var(--text-tertiary)]')} />
          <span>회의 모드</span>
        </button>
      </nav>

      {/* 설정 */}
      <div className="px-2 py-3 border-t border-[var(--border-subtle)]">
        <Link
          href="/settings"
          className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors', 'text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]')}
        >
          <span className="text-base">⚙️</span>
          <span>설정</span>
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* 데스크톱: 항상 표시 */}
      <div className="hidden md:flex h-full">{sidebarContent}</div>

      {/* 모바일: drawer */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          onClick={() => setSidebarOpen(false)}
        >
          {/* 오버레이 */}
          <div className="absolute inset-0 bg-black/60" />
          {/* 사이드바 */}
          <div className="relative z-10 h-full" onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
