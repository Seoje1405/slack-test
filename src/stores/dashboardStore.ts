import { create } from 'zustand';
import type { ServiceId } from '@/types/feed';

type ViewMode = 'grid' | 'unified';

interface DashboardStore {
  activeFilter: ServiceId | null;
  viewMode: ViewMode;
  meetingMode: boolean;
  setFilter: (service: ServiceId | null) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleMeetingMode: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeFilter: null,
  viewMode: 'grid',
  meetingMode: false,
  setFilter: (service) => set({ activeFilter: service, viewMode: 'grid' }),
  setViewMode: (mode) => set({ viewMode: mode, activeFilter: null }),
  toggleMeetingMode: () => set((s) => ({ meetingMode: !s.meetingMode })),
}));
