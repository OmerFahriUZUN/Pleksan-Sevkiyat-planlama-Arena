import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, Notification, SyncStatus } from '../types';

interface AppState {
  currentUser: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;

  syncStatus: SyncStatus;
  triggerSync: () => void;

  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  initializeData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      login: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),

      syncStatus: { last_sync: null, syncing: false, error: null, next_sync_in: 60 },

      triggerSync: () => {
        set((s) => ({ syncStatus: { ...s.syncStatus, syncing: true, error: null } }));
        setTimeout(() => {
          set((s) => ({
            syncStatus: { ...s.syncStatus, syncing: false, last_sync: new Date().toISOString(), next_sync_in: 60 },
          }));
          get().addNotification({ type: 'success', message: 'ERP verisi başarıyla senkronize edildi.' });
        }, 2000);
      },

      notifications: [],

      addNotification: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: `notif-${Date.now()}-${Math.random()}`, timestamp: new Date().toISOString(), read: false },
            ...s.notifications,
          ].slice(0, 50),
        })),

      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

      clearNotifications: () => set({ notifications: [] }),

      initializeData: () => {
        // In production, all data comes from backend APIs.
        // This is just a placeholder for compatibility.
      },
    }),
    {
      name: 'mes-shipment-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
      }),
    }
  )
);