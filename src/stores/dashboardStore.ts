import { create } from 'zustand';
import type { ServiceId } from '@/types/feed';

type ViewMode = 'grid' | 'unified';

interface DashboardStore {
  activeFilter: ServiceId | null;
  viewMode: ViewMode;
  myItemsFilter: boolean;
  meetingMode: boolean;
  notionAddMode: boolean;
  githubIssueMode: boolean;
  sidebarOpen: boolean;
  setFilter: (service: ServiceId | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setMyItemsFilter: (v: boolean) => void;
  activateMyItems: () => void;
  toggleMeetingMode: () => void;
  toggleNotionAddMode: () => void;
  toggleGithubIssueMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeFilter: null,
  viewMode: 'grid',
  myItemsFilter: false,
  meetingMode: false,
  notionAddMode: false,
  githubIssueMode: false,
  sidebarOpen: false,
  setFilter: (service) => set({ activeFilter: service, viewMode: 'grid', myItemsFilter: false, sidebarOpen: false }),
  setViewMode: (mode) => set((s) => ({ viewMode: mode, activeFilter: null, myItemsFilter: mode === 'grid' ? false : s.myItemsFilter, sidebarOpen: false })),
  setMyItemsFilter: (v) => set({ myItemsFilter: v }),
  activateMyItems: () => set({ myItemsFilter: true, viewMode: 'unified', activeFilter: null, sidebarOpen: false }),
  toggleMeetingMode: () => set((s) => ({ meetingMode: !s.meetingMode, notionAddMode: false, githubIssueMode: false })),
  toggleNotionAddMode: () => set((s) => ({ notionAddMode: !s.notionAddMode, meetingMode: false, githubIssueMode: false })),
  toggleGithubIssueMode: () => set((s) => ({ githubIssueMode: !s.githubIssueMode, meetingMode: false, notionAddMode: false })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
