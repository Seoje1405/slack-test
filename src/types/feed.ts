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

export interface TaskFrequency {
  type: string;
  count: number;
}

export interface ContributorEntry {
  user: string;
  count: number;
}

export interface StatsData {
  taskFrequency: TaskFrequency[];
  topContributors: ContributorEntry[];
}
