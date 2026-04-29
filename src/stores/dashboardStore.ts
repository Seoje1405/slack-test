import { create } from 'zustand';
import type { ServiceId } from '@/types/feed';

type ViewMode = 'grid' | 'unified';

interface DashboardStore {
  activeFilter: ServiceId | null;
  viewMode: ViewMode;
  setFilter: (service: ServiceId | null) => void;
  setViewMode: (mode: ViewMode) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeFilter: null,
  viewMode: 'grid',
  setFilter: (service) => set({ activeFilter: service, viewMode: 'grid' }),
  setViewMode: (mode) => set({ viewMode: mode, activeFilter: null }),
}));
