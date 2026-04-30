import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ServiceId } from '@/types/feed';

interface NotificationStore {
  lastSeen: Partial<Record<ServiceId, string>>;
  markSeen: (service: ServiceId) => void;
  markAllSeen: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      lastSeen: {},
      markSeen: (service) =>
        set((s) => ({ lastSeen: { ...s.lastSeen, [service]: new Date().toISOString() } })),
      markAllSeen: () =>
        set({
          lastSeen: {
            github: new Date().toISOString(),
            notion: new Date().toISOString(),
            discord: new Date().toISOString(),
            figma: new Date().toISOString(),
          },
        }),
    }),
    { name: 'notification-store' }
  )
);
