'use client';

import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useNotionSettingsStore } from '@/stores/notionSettingsStore';
import { cn } from '@/lib/utils';

type SuggestionOption = { label: string; syntax: string; icon: string; desc: string };
type Suggestion = { options: SuggestionOption[]; selectedIndex: number; lineStart: number; triggerLen: number };

const HEADING_OPTIONS: SuggestionOption[] = [
  { label: 'Heading 1', syntax: '# ', icon: 'H1', desc: '큰 제목' },
  { label: 'Heading 2', syntax: '## ', icon: 'H2', desc: '중간 제목' },
  { label: 'Heading 3', syntax: '### ', icon: 'H3', desc: '작은 제목' },
];

const OTHER_BLOCK_OPTIONS: SuggestionOption[] = [
  { label: 'Bullet List', syntax: '- ', icon: '•', desc: '불릿 리스트' },
  { label: 'Quote', syntax: '> ', icon: '❝', desc: '인용구' },
  { label: 'To-do', syntax: '- [ ] ', icon: '☐', desc: '체크박스' },
  { label: 'Divider', syntax: '---\n', icon: '—', desc: '구분선' },
  { label: 'Code Block', syntax: '```\n\n```\n', icon: '</>', desc: '코드 블록' },
];

function detectSuggestion(value: string, cursorPos: number): Suggestion | null {
  const textBefore = value.slice(0, cursorPos);
  const lastNewline = textBefore.lastIndexOf('\n');
  const lineStart = lastNewline + 1;
  const currentLine = textBefore.slice(lineStart);

  const headingMatch = currentLine.match(/^(#{1,3})$/);
  if (headingMatch) {
    const count = headingMatch[1].length;
    return { options: HEADING_OPTIONS.slice(count - 1), selectedIndex: 0, lineStart, triggerLen: count };
  }

  if (currentLine === '/') {
    return { options: [...HEADING_OPTIONS, ...OTHER_BLOCK_OPTIONS], selectedIndex: 0, lineStart, triggerLen: 1 };
  }

  return null;
}

export function NotionAddPanel() {
  const notionAddMode = useDashboardStore((s) => s.notionAddMode);
  const toggleNotionAddMode = useDashboardStore((s) => s.toggleNotionAddMode);

  const queryClient = useQueryClient();
  const mode = useNotionSettingsStore((s) => s.mode);
  const databaseId = useNotionSettingsStore((s) => s.databaseId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleClose() {
    toggleNotionAddMode();
    setTitle('');
    setContent('');
    setError('');
    setCreatedUrl(null);
    setSuggestion(null);
  }

  function applyOption(option: SuggestionOption, sug: Suggestion) {
    const before = content.slice(0, sug.lineStart);
    const after = content.slice(sug.lineStart + sug.triggerLen);
    const newContent = before + option.syntax + after;
    setContent(newContent);
    setSuggestion(null);
    setTimeout(() => {
      if (!textareaRef.current) return;
      // For code block, place cursor between the ``` fences
      let pos = sug.lineStart + option.syntax.length;
      if (option.syntax.startsWith('```\n')) pos = sug.lineStart + 4;
      textareaRef.current.setSelectionRange(pos, pos);
      textareaRef.current.focus();
    }, 0);
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    const cursor = e.target.selectionStart ?? val.length;
    setSuggestion(detectSuggestion(val, cursor));
  }

  function handleContentKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (suggestion) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestion((s) => s ? { ...s, selectedIndex: Math.min(s.selectedIndex + 1, s.options.length - 1) } : s);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestion((s) => s ? { ...s, selectedIndex: Math.max(s.selectedIndex - 1, 0) } : s);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.ctrlKey && !e.metaKey)) {
        const opt = suggestion.options[suggestion.selectedIndex];
        if (opt) {
          e.preventDefault();
          applyOption(opt, suggestion);
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestion(null);
        return;
      }
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  }

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || loading) return;

    setLoading(true);
    setError('');
    setCreatedUrl(null);

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
      const data = await res.json() as { error?: string; url?: string };
      if (!res.ok) {
        setError(data.error ?? '페이지 생성에 실패했습니다.');
        return;
      }
      setTitle('');
      setContent('');
      setCreatedUrl(data.url ?? null);
      queryClient.invalidateQueries({ queryKey: ['feed', 'notion', mode, databaseId] });
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside
      className={cn(
        'flex-shrink-0 bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] flex flex-col h-full overflow-hidden transition-[width] duration-300',
        notionAddMode ? 'w-[400px]' : 'w-0'
      )}
    >
      <div className="w-[400px] flex flex-col h-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">📝</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">Notion 페이지 추가</span>
          </div>
          <button
            onClick={handleClose}
            className="text-xs px-2 py-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 폼 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); setCreatedUrl(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(); }}
              placeholder="페이지 제목 입력"
              disabled={loading}
              autoFocus={notionAddMode}
              className="text-sm px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus,#555)] disabled:opacity-50 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              내용 <span className="text-[var(--text-muted)]">(선택사항)</span>
            </label>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleContentKeyDown}
                onBlur={() => setTimeout(() => setSuggestion(null), 150)}
                placeholder={"# 또는 /로 블록 선택\n내용을 입력하세요"}
                rows={10}
                disabled={loading}
                className="w-full text-sm px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus,#555)] disabled:opacity-50 resize-none transition-colors"
              />

              {/* 블록 타입 제안 드롭다운 */}
              {suggestion && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-xl overflow-hidden z-20">
                  <div className="px-3 py-1.5 border-b border-[var(--border-subtle)]">
                    <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">블록 유형</p>
                  </div>
                  {suggestion.options.map((opt, idx) => (
                    <button
                      key={opt.syntax}
                      onMouseDown={(e) => { e.preventDefault(); applyOption(opt, suggestion); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                        idx === suggestion.selectedIndex
                          ? 'bg-[var(--bg-overlay)]'
                          : 'hover:bg-[var(--bg-overlay)]/60'
                      )}
                    >
                      <span className="text-xs font-bold text-[var(--text-muted)] w-7 text-center shrink-0">
                        {opt.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{opt.label}</p>
                        <p className="text-xs text-[var(--text-muted)]">{opt.desc}</p>
                      </div>
                      {idx === suggestion.selectedIndex && (
                        <span className="ml-auto text-[10px] text-[var(--text-muted)] shrink-0">↵ Enter</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* 명령어 레퍼런스 */}
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2.5 flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-0.5">마크다운 단축키</p>
              {[
                { cmd: '#',       desc: 'Heading 1' },
                { cmd: '##',      desc: 'Heading 2' },
                { cmd: '###',     desc: 'Heading 3' },
                { cmd: '-',       desc: '불릿 리스트' },
                { cmd: '1.',      desc: '번호 리스트' },
                { cmd: '- [ ]',   desc: '체크박스' },
                { cmd: '>',       desc: '인용구' },
                { cmd: '---',     desc: '구분선' },
                { cmd: '```',     desc: '코드 블록' },
                { cmd: '/',       desc: '전체 블록 선택' },
              ].map(({ cmd, desc }) => (
                <div key={cmd} className="flex items-center gap-2">
                  <code className="text-[11px] font-mono bg-[var(--bg-overlay)] px-1.5 py-0.5 rounded text-[var(--text-secondary)] min-w-[52px] text-center">
                    {cmd}
                  </code>
                  <span className="text-xs text-[var(--text-muted)]">{desc}</span>
                </div>
              ))}
              <p className="text-[10px] text-[var(--text-muted)] border-t border-[var(--border-subtle)] mt-1 pt-1.5">
                Ctrl+Enter 저장 · ↑↓ 블록 선택 · Esc 닫기
              </p>
            </div>
          </div>

          {error && (
            <p className="text-xs text-[var(--error)] bg-[var(--error)]/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          {createdUrl && (
            <div className="text-xs bg-green-500/10 border border-green-500/30 text-green-600 px-3 py-2 rounded-lg flex items-center justify-between gap-2">
              <span>✓ 페이지가 생성되었습니다</span>
              <a
                href={createdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 flex-shrink-0"
              >
                Notion에서 열기
              </a>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-4 py-4 border-t border-[var(--border-subtle)] flex-shrink-0 flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 text-sm py-2 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] transition-colors"
          >
            닫기
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || loading}
            className="flex-1 text-sm py-2 rounded-lg font-medium transition-colors disabled:opacity-40"
            style={{ background: '#000', color: '#fff' }}
          >
            {loading ? '생성 중...' : '페이지 생성'}
          </button>
        </div>
      </div>
    </aside>
  );
}
