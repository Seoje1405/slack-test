export type ServiceId = 'github' | 'notion' | 'discord' | 'figma';

export type ServiceStatus =
  | 'idle'
  | 'loading'
  | 'ok'
  | 'error'
  | 'not_configured';

export interface FeedItem {
  id: string;
  service: ServiceId;
  title: string;
  user: string;
  avatarUrl: string | null;
  time: string;
  tag: string | null;
  url: string | null;
}

export interface FeedResponse {
  items: FeedItem[];
  status: ServiceStatus;
  message?: string;
}
