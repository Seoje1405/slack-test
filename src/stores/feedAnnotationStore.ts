import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ServiceId } from '@/types/feed';

interface FeedAnnotationStore {
  favorites: Record<string, boolean>;
  lastSeenAt: Record<string, string>;
  toggleFavorite: (id: string) => void;
  markSeen: (service: ServiceId) => void;
}

export const useFeedAnnotationStore = create<FeedAnnotationStore>()(
  persist(
    (set) => ({
      favorites: {},
      lastSeenAt: {},
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: { ...s.favorites, [id]: !s.favorites[id] },
        })),
      markSeen: (service) =>
        set((s) => ({
          lastSeenAt: { ...s.lastSeenAt, [service]: new Date().toISOString() },
        })),
    }),
    { name: 'feed-annotations' }
  )
);
