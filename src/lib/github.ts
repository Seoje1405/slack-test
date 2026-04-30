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

interface GitHubNotification {
  id: string;
  subject: {
    title: string;
    url: string | null;
    type: string;
  };
  reason: string;
  repository: {
    full_name: string;
    owner: { avatar_url: string; login: string };
  };
  updated_at: string;
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
      const commits = payload.commits as Array<{ message?: string }> | undefined;
      const branch = (payload.ref as string | undefined)?.replace('refs/heads/', '') ?? '';
      const size = (payload.size as number | undefined) ?? 0;
      const head = payload.head as string | undefined;
      const firstMsg = commits?.find((c) => !!c?.message)?.message;
      const title = firstMsg ? firstMsg.split('\n')[0] : size > 0 ? `커밋 ${size}건 Push` : 'Push';
      const url = head ? `${repoUrl}/commit/${head}` : repoUrl;
      return { title, tag: t(`Push · ${branch}`), url };
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
    case 'IssueCommentEvent': {
      const issue = payload.issue as { title: string; html_url: string } | undefined;
      const action = payload.action as string;
      return {
        title: `이슈 댓글 ${action}: ${issue?.title ?? ''}`,
        tag: t('Issue Comment'),
        url: issue?.html_url ?? repoUrl,
      };
    }
    case 'PullRequestReviewEvent': {
      const pr = payload.pull_request as { title: string; html_url: string } | undefined;
      const action = payload.action as string;
      return {
        title: `PR 리뷰 ${action}: ${pr?.title ?? ''}`,
        tag: t('PR Review'),
        url: pr?.html_url ?? repoUrl,
      };
    }
    case 'PullRequestReviewCommentEvent': {
      const pr = payload.pull_request as { title: string; html_url: string } | undefined;
      const action = payload.action as string;
      return {
        title: `PR 코드 리뷰 ${action}: ${pr?.title ?? ''}`,
        tag: t('PR Comment'),
        url: pr?.html_url ?? repoUrl,
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
    case 'WatchEvent': {
      return {
        title: `${event.actor.login}님이 스타를 눌렀습니다`,
        tag: t('Star'),
        url: repoUrl,
      };
    }
    case 'ForkEvent': {
      const forkee = payload.forkee as { html_url: string; full_name: string } | undefined;
      return {
        title: `${event.actor.login}님이 포크했습니다: ${forkee?.full_name ?? ''}`,
        tag: t('Fork'),
        url: forkee?.html_url ?? repoUrl,
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

// Converts a GitHub API URL (api.github.com/repos/…) to a browser HTML URL (github.com/…)
function apiUrlToHtmlUrl(apiUrl: string | null): string | null {
  if (!apiUrl) return null;
  return apiUrl
    .replace('https://api.github.com/repos/', 'https://github.com/')
    .replace(/\/pulls\/(\d+)$/, '/pull/$1')
    .replace(/\/issues\/(\d+)$/, '/issues/$1')
    .replace(/\/commits\/([a-f0-9]+)$/, '/commit/$1')
    .replace(/\/releases\/(\d+)$/, '/releases/tag');
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

export function transformGitHubNotifications(notifications: GitHubNotification[]): FeedItem[] {
  return notifications.map((n) => {
    const repoShortName = n.repository.full_name.split('/').pop() ?? n.repository.full_name;
    const repoUrl = `https://github.com/${n.repository.full_name}`;

    function t(action: string): string {
      return `${repoShortName} · ${action}`;
    }

    let tag: string;
    let url: string | null;

    switch (n.subject.type) {
      case 'PullRequest':
        tag = t('PR');
        url = apiUrlToHtmlUrl(n.subject.url);
        break;
      case 'Issue':
        tag = t('Issue');
        url = apiUrlToHtmlUrl(n.subject.url);
        break;
      case 'Commit':
        tag = t('Commit');
        url = apiUrlToHtmlUrl(n.subject.url);
        break;
      case 'Release':
        tag = t('Release');
        url = apiUrlToHtmlUrl(n.subject.url);
        break;
      default:
        tag = t(n.subject.type);
        url = apiUrlToHtmlUrl(n.subject.url) ?? repoUrl;
    }

    return {
      id: `notif-${n.id}`,
      service: 'github' as const,
      title: n.subject.title,
      user: n.repository.owner.login,
      avatarUrl: n.repository.owner.avatar_url,
      time: n.updated_at,
      tag,
      url: url ?? repoUrl,
    };
  });
}
