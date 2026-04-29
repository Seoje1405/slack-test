import Groq from 'groq-sdk';
import type { FeedItem } from '@/types/feed';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are a meeting facilitator for a software development team.
Your job is to generate a concise, structured meeting agenda in Markdown based on recent team activity.

Rules:
- Write ONLY in Korean (한국어). Do not mix in Chinese characters or other languages.
- Use the exact service names: GitHub, Notion, Discord, Figma — never alter them.
- Be specific and actionable. Reference actual user names and actual work items from the activity.
- Do not hallucinate tasks or members that are not in the activity log.
- Format output with exactly these four sections using bold headers.`;

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
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GROQ_API_KEY not configured' }, { status: 503 });
  }

  let events: FeedItem[] = [];
  try {
    const body = await request.json();
    events = Array.isArray(body.events) ? body.events : [];
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (events.length === 0) {
    return Response.json({ error: 'No events provided' }, { status: 400 });
  }

  const client = new Groq({ apiKey });
  const encoder = new TextEncoder();

  let stream: AsyncIterable<Groq.Chat.Completions.ChatCompletionChunk>;
  try {
    stream = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(events) },
      ],
      temperature: 0.4,
      stream: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Groq API error';
    const status = (err as { status?: number }).status === 429 ? 429 : 502;
    return Response.json({ error: msg }, { status });
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
