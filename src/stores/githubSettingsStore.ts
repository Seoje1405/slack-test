import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GitHubSettingsStore {
  repos: string[]; // ['owner/frontend', 'owner/backend']
  setRepos: (repos: string[]) => void;
}

export const useGitHubSettingsStore = create<GitHubSettingsStore>()(
  persist(
    (set) => ({
      repos: [],
      setRepos: (repos) => set({ repos }),
    }),
    { name: 'github-settings' }
  )
);
