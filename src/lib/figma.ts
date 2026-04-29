import type { FeedItem } from '@/types/feed';

interface FigmaUser {
  handle: string;
  img_url?: string;
}

interface FigmaVersion {
  id: string;
  created_at: string;
  label?: string;
  description?: string;
  user: FigmaUser;
}

export function transformFigmaVersions(versions: FigmaVersion[], fileKey: string): FeedItem[] {
  return versions.map((version) => ({
    id: version.id,
    service: 'figma' as const,
    title: version.label || version.description || '버전 저장됨',
    user: version.user.handle,
    avatarUrl: version.user.img_url ?? null,
    time: version.created_at,
    tag: 'Version',
    url: `https://www.figma.com/file/${fileKey}`,
  }));
}
