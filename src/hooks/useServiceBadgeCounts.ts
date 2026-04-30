'use client';

import { useGitHubFeed } from './useGitHubFeed';
import { useNotionFeed } from './useNotionFeed';
import { useDiscordFeed } from './useDiscordFeed';
import { useFigmaFeed } from './useFigmaFeed';
import { useNotificationStore } from '@/stores/notificationStore';
import type { FeedItem, ServiceId } from '@/types/feed';

function countNew(items: FeedItem[] | undefined, lastSeenAt: string | undefined): number {
  if (!items || items.length === 0) return 0;
  if (!lastSeenAt) return items.length;
  return items.filter((item) => item.time > lastSeenAt).length;
}

export function useServiceBadgeCounts(): Record<ServiceId, number> {
  const github = useGitHubFeed();
  const notion = useNotionFeed();
  const discord = useDiscordFeed();
  const figma = useFigmaFeed();
  const lastSeen = useNotificationStore((s) => s.lastSeen);

  return {
    github: countNew(github.data?.items, lastSeen.github),
    notion: countNew(notion.data?.items, lastSeen.notion),
    discord: countNew(discord.data?.items, lastSeen.discord),
    figma: countNew(figma.data?.items, lastSeen.figma),
  };
}
