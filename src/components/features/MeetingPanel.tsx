'use client';

import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboardStore } from '@/stores/dashboardStore';
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
      setError('No feed data available yet. Try refreshing the dashboard first.');
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
        setError(json.error ?? `Error ${res.status}`);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setSummary((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message ?? 'Unknown error');
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

  if (!meetingMode) return null;

  return (
    <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">Meeting Mode</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--accent-default)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? (
              <>
                <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              'Generate Agenda'
            )}
          </button>
          <button
            onClick={handleClose}
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <div className="p-4 min-h-[120px]">
        {error && (
          <p className="text-xs text-red-500 mb-2">{error}</p>
        )}

        {!summary && !loading && !error && (
          <p className="text-sm text-[var(--text-tertiary)]">
            Click &ldquo;Generate Agenda&rdquo; to create a meeting summary from your recent team activity.
          </p>
        )}

        {summary && (
          <MarkdownRenderer content={summary} />
        )}
      </div>
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="text-sm text-[var(--text-primary)] space-y-1 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('## ') || line.startsWith('### ')) {
          const text = line.replace(/^#{2,3}\s/, '');
          const bold = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return (
            <h3
              key={i}
              className="font-semibold text-[var(--text-primary)] mt-4 first:mt-0"
              dangerouslySetInnerHTML={{ __html: bold }}
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
          const text = line.replace(/^[-*]\s/, '');
          const bold = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return (
            <div key={i} className="flex gap-2">
              <span className="text-[var(--text-tertiary)] shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: bold }} />
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
        const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: bold }} />
        );
      })}
    </div>
  );
}
