import type { FeedItem } from '@/types/feed';

interface GitHubActor {
  login: string;
  avatar_url: string;
}

interface GitHubEvent {
  id: string;
  type: string;
  actor: GitHubActor;
  repo: { name: string; url: string };
  payload: Record<string, unknown>;
  created_at: string;
}

function extractTitle(event: GitHubEvent): { title: string; tag: string | null; url: string | null } {
  const payload = event.payload;
  const repoUrl = `https://github.com/${event.repo.name}`;
  const repoShortName = event.repo.name.split('/').pop() ?? event.repo.name;

  function t(action: string): string {
    return `${repoShortName} · ${action}`;
  }

  switch (event.type) {
    case 'PushEvent': {
      const commits = payload.commits as Array<{ message: string }> | undefined;
      const branch = (payload.ref as string | undefined)?.replace('refs/heads/', '') ?? '';
      const message = commits?.[commits.length - 1]?.message ?? 'Push';
      return { title: message.split('\n')[0], tag: t(`Push · ${branch}`), url: repoUrl };
    }
    case 'PullRequestEvent': {
      const pr = payload.pull_request as { title: string; html_url: string } | undefined;
      const action = payload.action as string;
      return {
        title: `PR ${action}: ${pr?.title ?? ''}`,
        tag: t('PR'),
        url: pr?.html_url ?? repoUrl,
      };
    }
    case 'IssuesEvent': {
      const issue = payload.issue as { title: string; html_url: string } | undefined;
      const action = payload.action as string;
      return {
        title: `이슈 ${action}: ${issue?.title ?? ''}`,
        tag: t('Issue'),
        url: issue?.html_url ?? repoUrl,
      };
    }
    case 'CreateEvent': {
      const refType = payload.ref_type as string;
      const ref = payload.ref as string | null;
      return {
        title: `${refType} 생성: ${ref ?? event.repo.name}`,
        tag: t('Create'),
        url: repoUrl,
      };
    }
    case 'ReleaseEvent': {
      const release = payload.release as { tag_name: string; html_url: string } | undefined;
      return {
        title: `릴리즈: ${release?.tag_name ?? ''}`,
        tag: t('Release'),
        url: release?.html_url ?? repoUrl,
      };
    }
    default: {
      return {
        title: event.type.replace('Event', ''),
        tag: t(event.type.replace('Event', '')),
        url: repoUrl,
      };
    }
  }
}

export function transformGitHubEvents(events: GitHubEvent[]): FeedItem[] {
  return events.map((event) => {
    const { title, tag, url } = extractTitle(event);
    return {
      id: event.id,
      service: 'github' as const,
      title,
      user: event.actor.login,
      avatarUrl: event.actor.avatar_url,
      time: event.created_at,
      tag,
      url,
    };
  });
}
