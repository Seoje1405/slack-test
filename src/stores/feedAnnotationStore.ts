import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FeedAnnotationStore {
  favorites: Record<string, boolean>;
  toggleFavorite: (id: string) => void;
}

export const useFeedAnnotationStore = create<FeedAnnotationStore>()(
  persist(
    (set) => ({
      favorites: {},
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: { ...s.favorites, [id]: !s.favorites[id] },
        })),
    }),
    { name: 'feed-annotations' }
  )
);
