import { create } from 'zustand';
import { countUnread, subscribeToNotifications } from '@/api/notifications';
import type { AppNotification } from '@/types';

interface NotificationState {
  unreadCount: number;
  latest: AppNotification | null;
  refreshUnread: (userId: string) => Promise<void>;
  setUnread: (count: number) => void;
  /** Starts the realtime feed; returns a cleanup function. */
  start: (userId: string, onNew?: (n: AppNotification) => void) => () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  latest: null,

  refreshUnread: async (userId) => {
    try {
      set({ unreadCount: await countUnread(userId) });
    } catch (err) {
      console.warn('[notifications] unread count failed', err);
    }
  },

  setUnread: (unreadCount) => set({ unreadCount: Math.max(0, unreadCount) }),

  start: (userId, onNew) => {
    useNotificationStore.getState().refreshUnread(userId);
    return subscribeToNotifications(userId, (notification) => {
      set((s) => ({ unreadCount: s.unreadCount + 1, latest: notification }));
      onNew?.(notification);
    });
  },

  reset: () => set({ unreadCount: 0, latest: null }),
}));
