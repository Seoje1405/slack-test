import { create } from 'zustand';
import type { ServiceId } from '@/types/feed';

interface DashboardStore {
  activeFilter: ServiceId | null;
  setFilter: (service: ServiceId | null) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeFilter: null,
  setFilter: (service) => set({ activeFilter: service }),
}));
