'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SERVICES } from '@/config/services';
import { useNotionSettingsStore } from '@/stores/notionSettingsStore';
import type { NotionMode } from '@/stores/notionSettingsStore';
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
      {
        name: 'GITHUB_REPO',
        label: 'Repository (선택)',
        placeholder: 'owner/repo',
        helpUrl: 'https://github.com',
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
        name: 'DISCORD_CHANNEL_ID',
        label: 'Channel ID',
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

export function SettingsForm() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl">
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
              {svc.id === 'notion' && <NotionModeSelector />}
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
GITHUB_REPO=owner/repo

# Notion
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # database 모드 기본값

# Discord
DISCORD_BOT_TOKEN=MTxxxxxxxxxxxxxxxxxxxxxxxxxx
DISCORD_CHANNEL_ID=000000000000000000

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
