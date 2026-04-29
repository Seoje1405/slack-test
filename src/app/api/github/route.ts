import { transformGitHubEvents } from '@/lib/github';
import type { FeedResponse } from '@/types/feed';

export const revalidate = 60;

export async function GET(): Promise<Response> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;

  if (!token) {
    return Response.json({ items: [], status: 'not_configured' } satisfies FeedResponse);
  }

  const eventsUrl = repo
    ? `https://api.github.com/repos/${repo}/events?per_page=20`
    : `https://api.github.com/user/received_events?per_page=20`;

  try {
    const res = await fetch(eventsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({
        items: [],
        status: 'error',
        message: `GitHub API ${res.status}: ${text.slice(0, 200)}`,
      } satisfies FeedResponse);
    }

    const events = await res.json();
    const items = transformGitHubEvents(Array.isArray(events) ? events : []);
    return Response.json({ items, status: 'ok' } satisfies FeedResponse);
  } catch (err) {
    return Response.json({
      items: [],
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    } satisfies FeedResponse);
  }
}
