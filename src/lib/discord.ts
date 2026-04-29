import type { FeedItem } from '@/types/feed';

interface DiscordAuthor {
  id: string;
  username: string;
  avatar: string | null;
}

interface DiscordMessage {
  id: string;
  content: string;
  author: DiscordAuthor;
  timestamp: string;
  channel_id: string;
}

export function transformDiscordMessages(
  messages: DiscordMessage[],
  channelId: string
): FeedItem[] {
  return messages.map((msg) => {
    const avatarUrl = msg.author.avatar
      ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
      : null;

    const content = msg.content.slice(0, 100) + (msg.content.length > 100 ? '…' : '');

    return {
      id: msg.id,
      service: 'discord' as const,
      title: content || '(첨부파일 또는 임베드)',
      user: msg.author.username,
      avatarUrl,
      time: msg.timestamp,
      tag: `#${channelId}`,
      url: null,
    };
  });
}
