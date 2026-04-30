import Anthropic from '@anthropic-ai/sdk';
import type { FeedItem } from '@/types/feed';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are a meeting facilitator for a software development team. Turn the activity log into a structured, actionable meeting agenda written entirely in Korean.

Output exactly four sections in this order using these Markdown headers:

## 1. 완료 현황
Summarize recently completed work as bullet points. Name the person and the specific item (repo, page, channel, task).

## 2. 논의 필요 항목
List topics that need team discussion or a decision. Be concrete about what exactly needs to be decided.

## 3. 액션 아이템
List next steps as bullet points. Each item must include an owner (담당자) and a specific deliverable.

## 4. 활동 멤버
List the most active members and which services they used.

Guidelines:
- Write in Korean only. Keep service names (GitHub, Notion, Discord, Figma) in English exactly as given.
- Ground every point in the activity log — do not mention people, tasks, or events not present in the log.
- Be specific: vague summaries like "다양한 작업 진행" are not acceptable.
- If an activity log entry is ambiguous, use the most reasonable interpretation rather than skipping it.`;

function buildUserMessage(events: FeedItem[]): string {
  const lines = events
    .slice(0, 50)
    .map((e) => `[${e.service.toUpperCase()}] ${e.user}: ${e.title}${e.tag ? ` (${e.tag})` : ''}`)
    .join('\n');

  return `다음은 최근 팀 활동 로그입니다:

${lines}

위 활동을 바탕으로 회의 아젠다를 작성해주세요. 아래 4개 섹션을 순서대로 작성하세요:

## 1. 완료 현황
최근 완료된 작업을 불릿 포인트로 정리

## 2. 논의 필요 항목
팀 결정이나 논의가 필요한 항목을 불릿 포인트로 정리

## 3. 액션 아이템
담당자와 함께 구체적인 다음 단계를 불릿 포인트로 정리

## 4. 활동 멤버
가장 활발하게 활동한 멤버와 해당 서비스를 불릿 포인트로 정리`;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let events: FeedItem[] = [];
  try {
    const body = await request.json() as { events?: unknown };
    events = Array.isArray(body.events) ? body.events : [];
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (events.length === 0) {
    return Response.json({ error: 'No events provided' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const model = process.env.NEXT_PUBLIC_CLAUDE_MODEL ?? 'claude-haiku-4-5';
  const messageStream = client.messages.stream({
    model,
    max_tokens: 1024,
    system: [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: buildUserMessage(events) }],
  });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of messageStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const status = (err as { status?: number }).status;
        const msg = status === 429
          ? '[오류: 요청 한도 초과. 잠시 후 다시 시도해주세요.]'
          : `[오류: ${err instanceof Error ? err.message : 'Anthropic API error'}]`;
        controller.enqueue(encoder.encode(`\n\n${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
