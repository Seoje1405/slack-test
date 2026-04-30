'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SERVICES } from '@/config/services';
import { useNotionSettingsStore } from '@/stores/notionSettingsStore';
import type { NotionMode } from '@/stores/notionSettingsStore';
import { useGitHubSettingsStore } from '@/stores/githubSettingsStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useQueryClient } from '@tanstack/react-query';

interface ServiceTokenConfig {
  fields: { name: string; label: string; placeholder: string; helpUrl: string }[];
}

const SERVICE_FIELDS: Record<string, ServiceTokenConfig> = {
  github: {
    fields: [
      {
        name: 'GITHUB_TOKEN',
        label: 'Personal Access Token',
        placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
        helpUrl: 'https://github.com/settings/tokens/new',
      },
    ],
  },
  notion: {
    fields: [
      {
        name: 'NOTION_TOKEN',
        label: 'Integration Token',
        placeholder: 'secret_xxxxxxxxxxxxxxxxxxxx',
        helpUrl: 'https://www.notion.so/my-integrations',
      },
    ],
  },
  discord: {
    fields: [
      {
        name: 'DISCORD_BOT_TOKEN',
        label: 'Bot Token',
        placeholder: 'MTxxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpUrl: 'https://discord.com/developers/applications',
      },
      {
        name: 'DISCORD_GUILD_ID',
        label: 'Guild(서버) ID (선택)',
        placeholder: '000000000000000000',
        helpUrl: 'https://discord.com/developers/applications',
      },
    ],
  },
  figma: {
    fields: [
      {
        name: 'FIGMA_TOKEN',
        label: 'Personal Access Token',
        placeholder: 'figd_xxxxxxxxxxxxxxxxxxxx',
        helpUrl: 'https://www.figma.com/settings',
      },
      {
        name: 'FIGMA_FILE_KEY',
        label: 'File Key',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxx',
        helpUrl: 'https://www.figma.com',
      },
    ],
  },
};

const REPO_PALETTE = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
function getRepoColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return REPO_PALETTE[h % REPO_PALETTE.length];
}

function ProfileSection() {
  const myUsername = useUserProfileStore((s) => s.myUsername);
  const setMyUsername = useUserProfileStore((s) => s.setMyUsername);
  const [input, setInput] = useState(myUsername);

  function handleSave() {
    setMyUsername(input.trim());
  }

  const saved = myUsername && myUsername === input.trim();

  return (
    <section className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border-subtle)]">
        <h2 className="font-semibold text-sm text-[var(--text-primary)]">내 프로필</h2>
      </div>
      <div className="p-5 flex flex-col gap-3">
        <p className="text-xs text-[var(--text-muted)]">
          설정한 이름과 일치하거나 멘션된 항목이 피드에서 강조 표시됩니다. GitHub username 또는 Discord 닉네임을 입력하세요.
        </p>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">사용자명</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="username"
              className="flex-1 text-xs font-mono bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-light)]"
            />
            <button
              onClick={handleSave}
              disabled={!input.trim() || saved === true}
              className="px-3 py-2 text-xs rounded-lg bg-[var(--accent-light)] text-white hover:opacity-90 transition-opacity font-medium disabled:opacity-40"
            >
              저장
            </button>
          </div>
          {myUsername && (
            <p className="text-xs" style={{ color: 'var(--accent-light)' }}>
              현재: <code className="font-mono">{myUsername}</code> — 이 이름과 일치하거나 @멘션된 항목이 강조됩니다.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function GitHubReposManager() {
  const repos = useGitHubSettingsStore((s) => s.repos);
  const setRepos = useGitHubSettingsStore((s) => s.setRepos);
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');

  function addRepo() {
    const val = input.trim();
    if (!val || repos.includes(val)) { setInput(''); return; }
    const next = [...repos, val];
    setRepos(next);
    queryClient.invalidateQueries({ queryKey: ['feed', 'github'] });
    setInput('');
  }

  function removeRepo(repo: string) {
    setRepos(repos.filter((r) => r !== repo));
    queryClient.invalidateQueries({ queryKey: ['feed', 'github'] });
  }

  return (
    <div className="flex flex-col gap-3 pb-4 border-b border-[var(--border-subtle)]">
      <p className="text-xs font-medium text-[var(--text-secondary)]">모니터링 레포지토리</p>

      {repos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {repos.map((repo) => {
            const shortName = repo.split('/').pop() ?? repo;
            const color = getRepoColor(shortName);
            return (
              <span
                key={repo}
                className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full"
                style={{ color, background: `${color}20`, border: `1px solid ${color}40` }}
              >
                {repo}
                <button
                  onClick={() => removeRepo(repo)}
                  className="opacity-60 hover:opacity-100 transition-opacity leading-none"
                  title="제거"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addRepo()}
          placeholder="owner/repo-name"
          className="flex-1 text-xs font-mono bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--github)]"
        />
        <button
          onClick={addRepo}
          className="px-3 py-2 text-xs rounded-lg bg-[var(--github)] text-white hover:opacity-90 transition-opacity font-medium"
        >
          추가
        </button>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        레포 미설정 시 <code className="font-mono">GITHUB_REPOS</code> 환경변수(쉼표 구분)를 사용합니다.
      </p>
    </div>
  );
}

function NotionModeSelector() {
  const mode = useNotionSettingsStore((s) => s.mode);
  const databaseId = useNotionSettingsStore((s) => s.databaseId);
  const setMode = useNotionSettingsStore((s) => s.setMode);
  const setDatabaseId = useNotionSettingsStore((s) => s.setDatabaseId);
  const queryClient = useQueryClient();

  const [inputValue, setInputValue] = useState(databaseId);

  function handleModeChange(next: NotionMode) {
    setMode(next);
    queryClient.invalidateQueries({ queryKey: ['feed', 'notion'] });
  }

  function handleApply() {
    setDatabaseId(inputValue.trim());
    queryClient.invalidateQueries({ queryKey: ['feed', 'notion'] });
  }

  return (
    <div className="flex flex-col gap-3 pb-4 border-b border-[var(--border-subtle)]">
      <p className="text-xs font-medium text-[var(--text-secondary)]">조회 모드</p>

      <div className="flex gap-2">
        {(
          [
            { value: 'search', label: '전체 검색', desc: 'Integration이 접근 가능한 모든 페이지' },
            { value: 'database', label: '특정 데이터베이스', desc: 'Database ID로 단일 DB 조회' },
          ] as { value: NotionMode; label: string; desc: string }[]
        ).map((opt) => {
          const active = mode === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleModeChange(opt.value)}
              className={cn(
                'flex-1 text-left px-3 py-2.5 rounded-lg border text-xs transition-colors',
                active
                  ? 'border-[var(--notion)] bg-[var(--notion)]/10 text-[var(--text-primary)]'
                  : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]'
              )}
            >
              <span className={cn('block font-medium mb-0.5', active && 'text-[var(--notion)]')}>
                {opt.label}
              </span>
              <span className="text-[var(--text-muted)]">{opt.desc}</span>
            </button>
          );
        })}
      </div>

      {mode === 'database' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[var(--text-muted)]">
            Database ID{' '}
            <span className="text-[var(--text-muted)]/60">
              (미입력 시 <code className="font-mono">NOTION_DATABASE_ID</code> 환경변수 사용)
            </span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="flex-1 text-xs font-mono bg-[var(--bg-overlay)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--notion)]"
            />
            <button
              onClick={handleApply}
              className="px-3 py-2 text-xs rounded-lg bg-[var(--notion)] text-white hover:opacity-90 transition-opacity font-medium"
            >
              적용
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--text-muted)]">
        모드 변경은 즉시 적용됩니다. 토큰은 아래 환경변수로 설정하세요.
      </p>
    </div>
  );
}

function DiscordBotGuide() {
  const steps = [
    {
      label: '1. Upstash Redis 생성',
      desc: 'upstash.com → Redis → Create Database → REST URL / Token 복사',
    },
    {
      label: '2. Discord Privileged Intents 활성화',
      desc: 'Discord Developer Portal → Bot → SERVER MEMBERS INTENT, MESSAGE CONTENT INTENT 켜기',
    },
    {
      label: '3. Railway에 봇 배포',
      desc: 'railway.app → New Project → GitHub 레포 연결 → 환경변수 설정 후 배포',
    },
  ];

  return (
    <div className="flex flex-col gap-3 pb-4 border-b border-[var(--border-subtle)]">
      <p className="text-xs font-medium text-[var(--text-secondary)]">Gateway 봇 배포 순서</p>
      <div className="rounded-lg bg-[var(--bg-overlay)] border border-[var(--border-subtle)] p-3 flex flex-col gap-3">
        {steps.map((step) => (
          <div key={step.label} className="flex flex-col gap-0.5">
            <p className="text-xs font-medium text-[var(--text-secondary)]">{step.label}</p>
            <p className="text-xs text-[var(--text-muted)]">{step.desc}</p>
          </div>
        ))}
        <div className="border-t border-[var(--border-subtle)] pt-2">
          <p className="text-xs text-[var(--text-muted)]">
            Vercel과 Railway 양쪽에{' '}
            <code className="font-mono">UPSTASH_REDIS_REST_URL</code>,{' '}
            <code className="font-mono">UPSTASH_REDIS_REST_TOKEN</code> 환경변수를 추가하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

export function SettingsForm() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <ProfileSection />

      <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--warning)]/30 p-4">
        <p className="text-sm text-[var(--warning)]">
          <strong>토큰 설정 방법:</strong> 프로젝트 루트의{' '}
          <code className="font-mono bg-[var(--bg-overlay)] px-1.5 py-0.5 rounded text-xs">
            .env.local
          </code>{' '}
          파일을 편집하고 서버를 재시작하세요.
        </p>
      </div>

      {SERVICES.map((svc) => {
        const config = SERVICE_FIELDS[svc.id];
        return (
          <section
            key={svc.id}
            className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden"
          >
            <div
              className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center gap-2"
              style={{ borderTop: `2px solid ${svc.color}` }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: svc.color }} />
              <h2 className="font-semibold text-sm" style={{ color: svc.color }}>
                {svc.label}
              </h2>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {svc.id === 'github' && <GitHubReposManager />}
              {svc.id === 'notion' && <NotionModeSelector />}
              {svc.id === 'discord' && <DiscordBotGuide />}
              {config.fields.map((field) => (
                <div key={field.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">
                      {field.label}
                    </label>
                    <a
                      href={field.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--accent-light)] hover:underline"
                    >
                      토큰 생성 →
                    </a>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-overlay)] border border-[var(--border-subtle)] px-3 py-2">
                    <code className="text-xs text-[var(--text-muted)] font-mono flex-shrink-0">
                      {field.name}=
                    </code>
                    <span className="text-xs text-[var(--text-muted)] font-mono truncate">
                      {field.placeholder}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <section className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          .env.local 예시
        </h3>
        <pre className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-overlay)] rounded-lg p-4 overflow-x-auto whitespace-pre leading-relaxed">
{`# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_REPOS=owner/frontend,owner/backend  # 쉼표로 여러 레포 구분

# Notion
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Discord (Gateway 봇)
DISCORD_BOT_TOKEN=MTxxxxxxxxxxxxxxxxxxxxxxxxxx
DISCORD_GUILD_ID=000000000000000000  # 선택: 특정 서버만 수신

# Upstash Redis (Vercel + Railway 공통)
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxxxx

# Figma
FIGMA_TOKEN=figd_xxxxxxxxxxxxxxxxxxxx
FIGMA_FILE_KEY=xxxxxxxxxxxxxxxxxxxxxx`}
        </pre>
        <p className="text-xs text-[var(--text-muted)] mt-3">
          파일 수정 후 <code className="font-mono">pnpm dev</code>를 재시작하면 변경이 적용됩니다.
        </p>
      </section>
    </div>
  );
}
