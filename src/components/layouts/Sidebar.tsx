'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SERVICES } from '@/config/services';
import { useDashboardStore } from '@/stores/dashboardStore';
import type { ServiceId } from '@/types/feed';

export function Sidebar() {
  const pathname = usePathname();
  const { activeFilter, viewMode, setFilter, setViewMode, meetingMode, toggleMeetingMode, notionAddMode, toggleNotionAddMode } =
    useDashboardStore();
  const isDashboard = pathname === '/dashboard';

  const navItemClass = (active: boolean) =>
    cn(
      'w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
      active
        ? 'bg-[var(--bg-overlay)] text-[var(--text-primary)]'
        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]'
    );

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

        {SERVICES.map((svc) => (
          <button
            key={svc.id}
            className={navItemClass(isDashboard && activeFilter === svc.id && viewMode === 'grid')}
            onClick={() => setFilter(svc.id as ServiceId)}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: svc.color }}
            />
            <span>{svc.label}</span>
          </button>
        ))}

        <div className="my-2 border-t border-[var(--border-subtle)]" />

        {/* 디스코드 음성채널 */}
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

        {/* 회의 모드 토글 */}
        <button
          onClick={toggleMeetingMode}
          className={cn(
            'w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
            meetingMode
              ? 'bg-green-500/10 text-green-600 border border-green-500/30'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]'
          )}
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              meetingMode ? 'bg-green-500 animate-pulse' : 'bg-[var(--text-tertiary)]'
            )}
          />
          <span>회의 모드</span>
        </button>
      </nav>

      {/* 하단 설정 링크 */}
      <div className="px-2 py-3 border-t border-[var(--border-subtle)]">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
            'text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]'
          )}
        >
          <span className="text-base">⚙️</span>
          <span>설정</span>
        </Link>
      </div>
    </aside>
  );
}
