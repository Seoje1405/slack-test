'use client';

import { SERVICES } from '@/config/services';

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
      {
        name: 'NOTION_DATABASE_ID',
        label: 'Database ID',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpUrl: 'https://www.notion.so',
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
          <section key={svc.id} className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden">
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
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

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
