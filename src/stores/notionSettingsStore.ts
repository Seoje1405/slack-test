import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotionMode = 'search' | 'database';

interface NotionSettingsStore {
  mode: NotionMode;
  databaseId: string;
  setMode: (mode: NotionMode) => void;
  setDatabaseId: (id: string) => void;
}

export const useNotionSettingsStore = create<NotionSettingsStore>()(
  persist(
    (set) => ({
      mode: 'search',
      databaseId: '',
      setMode: (mode) => set({ mode }),
      setDatabaseId: (databaseId) => set({ databaseId }),
    }),
    { name: 'notion-settings' }
  )
);
