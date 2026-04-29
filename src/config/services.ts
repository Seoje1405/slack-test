import type { ServiceId } from '@/types/feed';

export interface ServiceConfig {
  id: ServiceId;
  label: string;
  color: string;
  icon: string;
  description: string;
}

export const SERVICES: ServiceConfig[] = [
  {
    id: 'github',
    label: 'GitHub',
    color: 'var(--github)',
    icon: 'github',
    description: '커밋, PR, 이슈 이벤트',
  },
  {
    id: 'notion',
    label: 'Notion',
    color: 'var(--notion)',
    icon: 'notion',
    description: '데이터베이스 페이지 변경',
  },
  {
    id: 'discord',
    label: 'Discord',
    color: 'var(--discord)',
    icon: 'discord',
    description: '채널 메시지',
  },
  {
    id: 'figma',
    label: 'Figma',
    color: 'var(--figma)',
    icon: 'figma',
    description: '파일 버전 변경',
  },
];

export const SERVICE_MAP = Object.fromEntries(
  SERVICES.map((s) => [s.id, s])
) as Record<ServiceId, ServiceConfig>;

export const POLLING_INTERVALS: Record<ServiceId, number> = {
  discord: 30_000,
  github: 60_000,
  notion: 120_000,
  figma: 300_000,
};
