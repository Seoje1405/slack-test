import { create } from 'zustand';
import type { ServiceId } from '@/types/feed';

type ViewMode = 'grid' | 'unified';

interface DashboardStore {
  activeFilter: ServiceId | null;
  viewMode: ViewMode;
  meetingMode: boolean;
  notionAddMode: boolean;
  githubIssueMode: boolean;
  sidebarOpen: boolean;
  setFilter: (service: ServiceId | null) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleMeetingMode: () => void;
  toggleNotionAddMode: () => void;
  toggleGithubIssueMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeFilter: null,
  viewMode: 'grid',
  meetingMode: false,
  notionAddMode: false,
  githubIssueMode: false,
  sidebarOpen: false,
  setFilter: (service) => set({ activeFilter: service, viewMode: 'grid', sidebarOpen: false }),
  setViewMode: (mode) => set({ viewMode: mode, activeFilter: null, sidebarOpen: false }),
  toggleMeetingMode: () => set((s) => ({ meetingMode: !s.meetingMode, notionAddMode: false, githubIssueMode: false })),
  toggleNotionAddMode: () => set((s) => ({ notionAddMode: !s.notionAddMode, meetingMode: false, githubIssueMode: false })),
  toggleGithubIssueMode: () => set((s) => ({ githubIssueMode: !s.githubIssueMode, meetingMode: false, notionAddMode: false })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
