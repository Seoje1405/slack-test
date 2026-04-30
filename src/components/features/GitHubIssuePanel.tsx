'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useGitHubSettingsStore } from '@/stores/githubSettingsStore';
import { cn } from '@/lib/utils';

const COMMON_LABELS = ['bug', 'enhancement', 'documentation', 'question', 'help wanted', 'good first issue'];

export function GitHubIssuePanel() {
  const githubIssueMode = useDashboardStore((s) => s.githubIssueMode);
  const toggleGithubIssueMode = useDashboardStore((s) => s.toggleGithubIssueMode);

  const queryClient = useQueryClient();
  const repos = useGitHubSettingsStore((s) => s.repos);

  const [selectedRepo, setSelectedRepo] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  function handleClose() {
    toggleGithubIssueMode();
    setTitle('');
    setBody('');
    setError('');
    setCreatedUrl(null);
    setSelectedLabels([]);
  }

  function toggleLabel(label: string) {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  async function handleSubmit() {
    const repo = selectedRepo || repos[0] || '';
    if (!repo || !title.trim() || loading) return;

    setLoading(true);
    setError('');
    setCreatedUrl(null);

    try {
      const res = await fetch('/api/github/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          title: title.trim(),
          body: body.trim() || undefined,
          labels: selectedLabels.length ? selectedLabels : undefined,
        }),
      });
      const data = await res.json() as { error?: string; url?: string };
      if (!res.ok) {
        setError(data.error ?? '이슈 생성에 실패했습니다.');
        return;
      }
      setTitle('');
      setBody('');
      setSelectedLabels([]);
      setCreatedUrl(data.url ?? null);
      queryClient.invalidateQueries({ queryKey: ['feed', 'github'] });
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const activeRepo = selectedRepo || repos[0] || '';

  return (
    <aside
      className={cn(
        'flex-shrink-0 bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] flex flex-col h-full overflow-hidden transition-[width] duration-300',
        githubIssueMode ? 'w-[400px]' : 'w-0'
      )}
    >
      <div className="w-[400px] flex flex-col h-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--text-primary)]">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span className="text-sm font-semibold text-[var(--text-primary)]">GitHub 이슈 생성</span>
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
          {repos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--text-muted)]">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <p className="text-sm text-[var(--text-muted)]">설정에서 GitHub 저장소를 먼저 추가해주세요.</p>
              <a
                href="/settings"
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] transition-colors"
              >
                설정으로 이동
              </a>
            </div>
          ) : (
            <>
              {/* 저장소 선택 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">저장소 *</label>
                <select
                  value={activeRepo}
                  onChange={(e) => { setSelectedRepo(e.target.value); setError(''); setCreatedUrl(null); }}
                  className="text-sm px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus,#555)] transition-colors"
                >
                  {repos.map((repo) => (
                    <option key={repo} value={repo}>{repo}</option>
                  ))}
                </select>
              </div>

              {/* 제목 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">제목 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setError(''); setCreatedUrl(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(); }}
                  placeholder="이슈 제목 입력"
                  disabled={loading}
                  autoFocus={githubIssueMode}
                  className="text-sm px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus,#555)] disabled:opacity-50 transition-colors"
                />
              </div>

              {/* 본문 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  내용 <span className="text-[var(--text-muted)]">(선택사항)</span>
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(); }}
                  placeholder={"## 문제 설명\n\n## 재현 방법\n\n## 예상 결과"}
                  rows={8}
                  disabled={loading}
                  className="w-full text-sm px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus,#555)] disabled:opacity-50 resize-none transition-colors"
                />
              </div>

              {/* 라벨 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  라벨 <span className="text-[var(--text-muted)]">(선택사항)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_LABELS.map((label) => {
                    const active = selectedLabels.includes(label);
                    return (
                      <button
                        key={label}
                        onClick={() => toggleLabel(label)}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-full border transition-colors',
                          active
                            ? 'border-transparent text-white'
                            : 'border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-focus,#555)] hover:text-[var(--text-secondary)]'
                        )}
                        style={active ? { background: labelColor(label) } : {}}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-[var(--error)] bg-[var(--error)]/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          {createdUrl && (
            <div className="text-xs bg-green-500/10 border border-green-500/30 text-green-600 px-3 py-2 rounded-lg flex items-center justify-between gap-2">
              <span>✓ 이슈가 생성되었습니다</span>
              <a
                href={createdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 flex-shrink-0"
              >
                GitHub에서 열기
              </a>
            </div>
          )}
        </div>

        {/* 푸터 */}
        {repos.length > 0 && (
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
              style={{ background: '#238636', color: '#fff' }}
            >
              {loading ? '생성 중...' : '이슈 생성'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function labelColor(label: string): string {
  const colors: Record<string, string> = {
    'bug': '#d73a4a',
    'enhancement': '#a2eeef',
    'documentation': '#0075ca',
    'question': '#d876e3',
    'help wanted': '#008672',
    'good first issue': '#7057ff',
  };
  return colors[label] ?? '#555';
}
