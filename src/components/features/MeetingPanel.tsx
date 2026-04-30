'use client';

import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboardStore } from '@/stores/dashboardStore';
import { cn } from '@/lib/utils';
import type { FeedItem, FeedResponse } from '@/types/feed';

const SERVICE_KEYS = ['github', 'notion', 'discord', 'figma'] as const;

function collectEvents(queryClient: ReturnType<typeof useQueryClient>): FeedItem[] {
  const items: FeedItem[] = [];
  for (const svc of SERVICE_KEYS) {
    const data = queryClient.getQueryData<FeedResponse>(['feed', svc]);
    if (data?.items) items.push(...data.items);
  }
  items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return items.slice(0, 50);
}

export function MeetingPanel() {
  const meetingMode = useDashboardStore((s) => s.meetingMode);
  const toggleMeetingMode = useDashboardStore((s) => s.toggleMeetingMode);
  const queryClient = useQueryClient();

  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    const events = collectEvents(queryClient);
    if (events.length === 0) {
      setError('피드 데이터가 없습니다. 먼저 새로고침을 해주세요.');
      return;
    }
    setSummary('');
    setError('');
    setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/ai/meeting-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? `오류 ${res.status}`);
        return;
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setSummary((prev) => prev + decoder.decode(value, { stream: true }));
      }
      // 버퍼에 남은 멀티바이트 문자 플러시
      const tail = decoder.decode();
      if (tail) setSummary((prev) => prev + tail);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message ?? '알 수 없는 오류');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    abortRef.current?.abort();
    setSummary('');
    setError('');
    setLoading(false);
    toggleMeetingMode();
  };

  return (
    <aside
      className={cn(
        'flex-shrink-0 bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] flex flex-col h-full overflow-hidden transition-[width] duration-300',
        meetingMode ? 'w-[520px]' : 'w-0'
      )}
    >
      <div className="w-[520px] flex flex-col h-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">회의 모드</span>
          </div>
          <button
            onClick={handleClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors text-lg leading-none"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 생성 버튼 */}
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex-shrink-0">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-[var(--accent-default)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? (
              <>
                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                생성 중…
              </>
            ) : (
              '아젠다 생성'
            )}
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

          {!summary && !loading && !error && (
            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
              &quot;아젠다 생성&quot;을 눌러 최근 팀 활동을 기반으로 회의 아젠다를 만들어보세요.
            </p>
          )}

          {summary && <PanelMarkdown content={summary} />}
        </div>
      </div>
    </aside>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyBold(raw: string): string {
  return escapeHtml(raw).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function PanelMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="text-xs text-[var(--text-primary)] space-y-1 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('## ') || line.startsWith('### ')) {
          return (
            <h3
              key={i}
              className="font-semibold text-[var(--text-primary)] mt-3 first:mt-0"
              dangerouslySetInnerHTML={{ __html: applyBold(line.replace(/^#{2,3}\s/, '')) }}
            />
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={i} className="font-bold text-[var(--text-primary)] mt-2 first:mt-0">
              {line.replace(/^#\s/, '')}
            </h2>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="text-[var(--text-tertiary)] shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: applyBold(line.replace(/^[-*]\s/, '')) }} />
            </div>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          return (
            <div key={i} className="text-[var(--text-secondary)]">
              {line}
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i} dangerouslySetInnerHTML={{ __html: applyBold(line) }} />;
      })}
    </div>
  );
}
