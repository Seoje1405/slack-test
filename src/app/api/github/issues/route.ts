export const dynamic = 'force-dynamic';

interface CreateIssueBody {
  repo?: unknown;
  title?: unknown;
  body?: unknown;
  labels?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return Response.json({ error: 'GITHUB_TOKEN not configured' }, { status: 503 });
  }

  let payload: CreateIssueBody;
  try {
    payload = await request.json() as CreateIssueBody;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const repo = typeof payload.repo === 'string' ? payload.repo.trim() : '';
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const body = typeof payload.body === 'string' ? payload.body.trim() : '';
  const labels = Array.isArray(payload.labels)
    ? payload.labels.filter((l): l is string => typeof l === 'string')
    : [];

  if (!repo || !title) {
    return Response.json({ error: 'repo and title are required' }, { status: 400 });
  }

  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ title, body: body || undefined, labels: labels.length ? labels : undefined }),
  });

  const data = await res.json() as { html_url?: string; message?: string };

  if (!res.ok) {
    return Response.json({ error: data.message ?? 'GitHub API error' }, { status: res.status });
  }

  return Response.json({ url: data.html_url });
}
