'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';

export function Topbar() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const meetingMode = useDashboardStore((s) => s.meetingMode);
  const toggleMeetingMode = useDashboardStore((s) => s.toggleMeetingMode);

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['feed'] });
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex-shrink-0">
      <h1 className="text-sm font-semibold text-[var(--text-primary)]">대시보드</h1>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMeetingMode}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            meetingMode
              ? 'border-green-500 bg-green-500/10 text-green-600'
              : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>{meetingMode ? '●' : '○'}</span>
          Meeting
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-colors"
        >
          <span className={refreshing ? 'animate-spin' : ''}>↻</span>
          새로고침
        </button>
      </div>
    </header>
  );
}
