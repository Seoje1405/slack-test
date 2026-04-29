import { transformGitHubEvents } from '@/lib/github';
import type { FeedResponse } from '@/types/feed';

export const dynamic = 'force-dynamic';

const GITHUB_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

export async function GET(request: Request): Promise<Response> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return Response.json({ items: [], status: 'not_configured' } satisfies FeedResponse);
  }

  const headers = { ...GITHUB_HEADERS, Authorization: `Bearer ${token}` };

  const { searchParams } = new URL(request.url);
  const reposParam = searchParams.get('repos');

  let repos: string[] = [];
  if (reposParam) {
    repos = reposParam.split(',').map((r) => r.trim()).filter(Boolean);
  } else if (process.env.GITHUB_REPOS) {
    repos = process.env.GITHUB_REPOS.split(',').map((r) => r.trim()).filter(Boolean);
  } else if (process.env.GITHUB_REPO) {
    repos = [process.env.GITHUB_REPO];
  }

  try {
    if (repos.length === 0) {
      const res = await fetch('https://api.github.com/user/received_events?per_page=30', { headers });
      if (!res.ok) {
        const text = await res.text();
        return Response.json({ items: [], status: 'error', message: `GitHub API ${res.status}: ${text.slice(0, 200)}` } satisfies FeedResponse);
      }
      const events = await res.json();
      const items = transformGitHubEvents(Array.isArray(events) ? events : []);
      return Response.json({ items, status: 'ok' } satisfies FeedResponse);
    }

    const results = await Promise.allSettled(
      repos.map((repo) =>
        fetch(`https://api.github.com/repos/${repo}/events?per_page=20`, { headers }).then(
          async (res) => {
            if (!res.ok) throw new Error(`GitHub API ${res.status} for ${repo}`);
            return res.json();
          }
        )
      )
    );

    const allEvents = results.flatMap((r) =>
      r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []
    );

    const items = transformGitHubEvents(allEvents)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 30);

    return Response.json({ items, status: 'ok' } satisfies FeedResponse);
  } catch (err) {
    return Response.json({
      items: [],
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    } satisfies FeedResponse);
  }
}
