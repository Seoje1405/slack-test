import { transformGitHubEvents, transformGitHubNotifications } from '@/lib/github';
import type { FeedItem, FeedResponse } from '@/types/feed';

export const dynamic = 'force-dynamic';

const GITHUB_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

type RawEvent = {
  id: string;
  type: string;
  actor: { login: string; avatar_url: string };
  repo: { name: string; url: string };
  payload: Record<string, unknown>;
  created_at: string;
};

// GitHub Events API omits payload.commits for some push events.
// Fall back to fetching the HEAD commit directly.
async function enrichPushEvents(events: RawEvent[], headers: Record<string, string>): Promise<void> {
  const toEnrich = events.filter((e) => {
    if (e.type !== 'PushEvent') return false;
    const commits = e.payload.commits as Array<{ message?: string }> | undefined;
    return (!commits || !commits.some((c) => c?.message)) && !!e.payload.head;
  });

  const unique = new Map<string, RawEvent[]>();
  for (const e of toEnrich) {
    const key = `${e.repo.name}/${e.payload.head as string}`;
    if (!unique.has(key)) unique.set(key, []);
    unique.get(key)!.push(e);
  }

  await Promise.allSettled(
    [...unique.entries()].slice(0, 10).map(async ([, evs]) => {
      const repoName = evs[0].repo.name;
      const head = evs[0].payload.head as string;
      const res = await fetch(`https://api.github.com/repos/${repoName}/commits/${head}`, {
        headers,
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return;
      const data = await res.json();
      const message = (data?.commit?.message as string | undefined);
      if (!message) return;
      for (const e of evs) {
        e.payload.commits = [{ message }];
      }
    })
  );
}

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
    // Fetch notifications (including already-read) from the last 7 days, filtered to configured repos
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const notifPromise = fetch(`https://api.github.com/notifications?all=true&per_page=50&since=${since}`, {
      headers,
      signal: AbortSignal.timeout(20_000),
    })
      .then(async (res) => {
        if (!res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data)) return [];
        if (repos.length === 0) return data;
        return data.filter((n: { repository?: { full_name?: string } }) =>
          repos.includes(n.repository?.full_name ?? '')
        );
      })
      .catch(() => []);

    let eventItems: FeedItem[];

    if (repos.length === 0) {
      const res = await fetch('https://api.github.com/user/received_events?per_page=30', {
        headers,
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        const text = await res.text();
        return Response.json({ items: [], status: 'error', message: `GitHub API ${res.status}: ${text.slice(0, 200)}` } satisfies FeedResponse);
      }
      const raw = await res.json();
      const events: RawEvent[] = Array.isArray(raw) ? raw : [];
      await enrichPushEvents(events, headers);
      eventItems = transformGitHubEvents(events);
    } else {
      const results = await Promise.allSettled(
        repos.map((repo) =>
          fetch(`https://api.github.com/repos/${repo}/events?per_page=20`, {
            headers,
            signal: AbortSignal.timeout(20_000),
          }).then(
            async (res) => {
              if (!res.ok) throw new Error(`GitHub API ${res.status} for ${repo}`);
              return res.json();
            }
          )
        )
      );

      const allEvents: RawEvent[] = results.flatMap((r) =>
        r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []
      );
      await enrichPushEvents(allEvents, headers);
      eventItems = transformGitHubEvents(allEvents);
    }

    const notifications = await notifPromise;
    const notifItems = transformGitHubNotifications(notifications);

    // Merge, deduplicate by id, sort newest first, cap at 30
    const seen = new Set<string>();
    const items = [...notifItems, ...eventItems]
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
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
