import type { FeedItem } from '@/types/feed';

interface FigmaUser {
  id?: string;
  handle?: string;
  name?: string;
  img_url?: string;
}

interface FigmaVersion {
  id: string;
  created_at: string;
  label?: string;
  description?: string;
  user?: FigmaUser;
}

interface FigmaComment {
  id: string;
  message: string;
  created_at: string;
  user?: FigmaUser;
}

export async function fetchFigmaVersions(token: string, fileKey: string): Promise<FeedItem[]> {
  const res = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/versions?page_size=10`,
    { headers: { 'X-Figma-Token': token } }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Figma versions API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const versions: FigmaVersion[] = data.versions ?? [];

  return versions.map((v) => ({
    id: `version-${v.id}`,
    service: 'figma' as const,
    title: v.label || v.description || '버전 저장',
    user: v.user?.name ?? v.user?.handle ?? 'Unknown',
    avatarUrl: v.user?.img_url ?? null,
    time: v.created_at,
    tag: 'version',
    url: `https://www.figma.com/file/${fileKey}`,
  }));
}

export async function fetchFigmaComments(token: string, fileKey: string): Promise<FeedItem[]> {
  const res = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/comments`,
    { headers: { 'X-Figma-Token': token } }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Figma comments API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const comments: FigmaComment[] = data.comments ?? [];

  return comments.map((c) => ({
    id: `comment-${c.id}`,
    service: 'figma' as const,
    title: c.message.slice(0, 100) + (c.message.length > 100 ? '…' : ''),
    user: c.user?.name ?? c.user?.handle ?? 'Unknown',
    avatarUrl: c.user?.img_url ?? null,
    time: c.created_at,
    tag: 'comment',
    url: `https://www.figma.com/file/${fileKey}`,
  }));
}
