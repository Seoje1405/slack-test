'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/stores/dashboardStore';

export function BottomNav() {
  const pathname = usePathname();
  const { viewMode, setFilter, setViewMode, notionAddMode, toggleNotionAddMode } =
    useDashboardStore();

  const isDashboard = pathname === '/dashboard';

  const itemClass = (active: boolean) =>
    cn(
      'flex flex-col items-center justify-center gap-1 flex-1 py-2 text-[10px] font-medium transition-colors',
      active
        ? 'text-[var(--accent-light)]'
        : 'text-[var(--text-muted)]'
    );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-bottom-nav bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex items-stretch">
      {/* 홈 */}
      <button
        className={itemClass(isDashboard && viewMode === 'grid')}
        onClick={() => { setFilter(null); }}
      >
        <span className="text-lg leading-none">🏠</span>
        <span>홈</span>
      </button>

      {/* 통합 피드 */}
      <button
        className={itemClass(isDashboard && viewMode === 'unified')}
        onClick={() => setViewMode('unified')}
      >
        <span className="text-lg leading-none">⚡</span>
        <span>피드</span>
      </button>

      {/* Notion 추가 */}
      <button
        className={itemClass(notionAddMode)}
        onClick={toggleNotionAddMode}
      >
        <span className="text-lg leading-none">📝</span>
        <span>추가</span>
      </button>

      {/* 설정 */}
      <Link href="/settings" className={itemClass(pathname === '/settings')}>
        <span className="text-lg leading-none">⚙️</span>
        <span>설정</span>
      </Link>
    </nav>
  );
}
