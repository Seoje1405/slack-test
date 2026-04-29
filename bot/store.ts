import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const STORE_PATH = join(__dirname, 'events.json');
const MAX_EVENTS = 200;

export interface DiscordEvent {
  id: string;
  type: 'message' | 'mention' | 'voice_join' | 'voice_leave' | 'voice_move' | 'member_join' | 'member_leave';
  title: string;
  user: string;
  avatarUrl: string | null;
  time: string;
  tag: string | null;
  url: string | null;
}

export function readEvents(): DiscordEvent[] {
  if (!existsSync(STORE_PATH)) return [];
  try {
    return JSON.parse(readFileSync(STORE_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

export function appendEvent(event: DiscordEvent): void {
  const events = readEvents();
  // 중복 방지
  if (events.some((e) => e.id === event.id)) return;
  events.unshift(event);
  if (events.length > MAX_EVENTS) events.splice(MAX_EVENTS);
  writeFileSync(STORE_PATH, JSON.stringify(events, null, 2), 'utf-8');
}
