'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotionSettingsStore } from '@/stores/notionSettingsStore';

export function NotionQuickAdd() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const queryClient = useQueryClient();
  const mode = useNotionSettingsStore((s) => s.mode);
  const databaseId = useNotionSettingsStore((s) => s.databaseId);

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || loading) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/notion/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          content: content.trim() || undefined,
          database_id: databaseId || undefined,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? '페이지 생성에 실패했습니다.');
        return;
      }
      setTitle('');
      setContent('');
      setExpanded(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      queryClient.invalidateQueries({ queryKey: ['feed', 'notion', mode, databaseId] });
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(null); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !expanded) handleSubmit();
            if (e.key === 'Enter' && e.shiftKey) handleSubmit();
          }}
          onFocus={() => setExpanded(true)}
          placeholder="새 페이지 제목..."
          disabled={loading}
          className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus,#555)] disabled:opacity-50 transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || loading}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 flex-shrink-0"
          style={{ background: '#000', color: '#fff' }}
        >
          {loading ? '...' : success ? '✓' : '+'}
        </button>
      </div>

      {expanded && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(); }}
          placeholder="내용 입력 (선택사항) — Ctrl+Enter로 저장"
          rows={4}
          disabled={loading}
          className="mt-2 w-full text-xs px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus,#555)] disabled:opacity-50 resize-none transition-colors"
        />
      )}

      {error && (
        <p className="mt-1.5 text-xs text-[var(--error)]">{error}</p>
      )}
    </div>
  );
}
