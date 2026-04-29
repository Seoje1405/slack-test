import { transformDiscordMessages } from '@/lib/discord';
import type { FeedResponse } from '@/types/feed';

export const revalidate = 30;

export async function GET(): Promise<Response> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  if (!token || !channelId) {
    return Response.json({ items: [], status: 'not_configured' } satisfies FeedResponse);
  }

  try {
    const res = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages?limit=20`,
      {
        headers: { Authorization: `Bot ${token}` },
      }
    );

    if (!res.ok) {
      let errorMessage = `Discord API ${res.status}`;
      try {
        const json = await res.json();
        if (json.code === 10003) {
          errorMessage =
            'DISCORD_CHANNEL_ID가 올바르지 않습니다. ' +
            'Discord 설정 → 고급 → 개발자 모드를 활성화한 뒤, ' +
            '채널을 우클릭 → "ID 복사"로 정확한 채널 ID를 확인하세요.';
        } else if (res.status === 403) {
          errorMessage =
            'Bot이 채널에 접근할 수 없습니다. ' +
            'Bot을 서버에 초대했는지, 해당 채널의 읽기 권한이 있는지 확인하세요.';
        } else if (typeof json.message === 'string') {
          errorMessage = json.message;
        }
      } catch {
        // JSON 파싱 실패 시 상태 코드만 표시
      }
      return Response.json({
        items: [],
        status: 'error',
        message: errorMessage,
      } satisfies FeedResponse);
    }

    const messages = await res.json();
    const items = transformDiscordMessages(Array.isArray(messages) ? messages : [], channelId);
    return Response.json({ items, status: 'ok' } satisfies FeedResponse);
  } catch (err) {
    return Response.json({
      items: [],
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    } satisfies FeedResponse);
  }
}
