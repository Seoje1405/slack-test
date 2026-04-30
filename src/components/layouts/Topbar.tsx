'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';

export function Topbar() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const toggleSidebar = useDashboardStore((s) => s.toggleSidebar);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['feed'] }),
      queryClient.invalidateQueries({ queryKey: ['stats'] }),
    ]);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* 모바일 전용 햄버거 */}
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="메뉴 열기"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="text-sm font-semibold text-[var(--text-primary)]">대시보드</h1>
      </div>

      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-colors"
      >
        <span className={refreshing ? 'animate-spin' : ''}>↻</span>
        <span className="hidden sm:inline">새로고침</span>
      </button>
    </header>
  );
}
