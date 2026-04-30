import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FeedItem } from '@/types/feed';

interface UserProfileStore {
  myUsername: string;
  setMyUsername: (v: string) => void;
}

export const useUserProfileStore = create<UserProfileStore>()(
  persist(
    (set) => ({
      myUsername: '',
      setMyUsername: (myUsername) => set({ myUsername }),
    }),
    { name: 'user-profile' }
  )
);

export function matchesMyUsername(item: FeedItem, myUsername: string): boolean {
  if (!myUsername.trim()) return false;
  const lower = myUsername.toLowerCase().trim();
  return (
    item.user.toLowerCase() === lower ||
    item.title.toLowerCase().includes('@' + lower)
  );
}
