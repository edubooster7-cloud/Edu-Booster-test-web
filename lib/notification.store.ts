import { notificationService } from "@/lib/notification.service";
import type {
  Notification,
  NotificationPagination,
} from "@/types/notifications.types";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  pagination: NotificationPagination | null;
  isLoading: boolean;
  isFetchingMore: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (opts?: {
    reset?: boolean;
    unreadOnly?: boolean;
  }) => Promise<void>;
  fetchMore: () => Promise<void>;
  prependNotification: (n: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  decrementUnread: (by?: number) => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>()(
  immer((set, get) => ({
    notifications: [],
    unreadCount: 0,
    pagination: null,
    isLoading: false,
    isFetchingMore: false,
    error: null,

    fetchNotifications: async ({ reset = true, unreadOnly } = {}) => {
      set((s) => {
        s.isLoading = true;
        s.error = null;
        if (reset) s.notifications = [];
      });

      try {
        const res = await notificationService.getAll({
          page: 1,
          limit: 20,
          unreadOnly,
        });
        const { notifications, unreadCount, pagination } = res.data.data;

        set((s) => {
          s.notifications = notifications;
          s.unreadCount = unreadCount;
          s.pagination = pagination;
          s.isLoading = false;
        });
      } catch (err: unknown) {
        set((s) => {
          s.isLoading = false;
          s.error =
            err instanceof Error ? err.message : "Failed to load notifications";
        });
      }
    },

    fetchMore: async () => {
      const { pagination, isFetchingMore } = get();
      if (isFetchingMore || !pagination?.hasNextPage) return;

      set((s) => {
        s.isFetchingMore = true;
      });

      try {
        const res = await notificationService.getAll({
          page: (pagination.currentPage ?? 1) + 1,
          limit: pagination.limit,
        });
        const { notifications, pagination: pg } = res.data.data;

        set((s) => {
          s.notifications.push(...notifications);
          s.pagination = pg;
          s.isFetchingMore = false;
        });
      } catch {
        set((s) => {
          s.isFetchingMore = false;
        });
      }
    },

    prependNotification: (n) => {
      set((s) => {
        // Deduplicate
        if (s.notifications.some((x) => x.id === n.id)) return;
        s.notifications.unshift(n);
        if (!n.isRead) s.unreadCount += 1;
        if (s.pagination) s.pagination.total += 1;
      });
    },

    markAsRead: async (id) => {
      // Optimistic
      set((s) => {
        const notif = s.notifications.find((n) => n.id === id);
        if (notif && !notif.isRead) {
          notif.isRead = true;
          notif.readAt = new Date().toISOString();
          s.unreadCount = Math.max(0, s.unreadCount - 1);
        }
      });

      try {
        await notificationService.markAsRead(id);
      } catch {
        // Rollback
        set((s) => {
          const notif = s.notifications.find((n) => n.id === id);
          if (notif) {
            notif.isRead = false;
            notif.readAt = null;
            s.unreadCount += 1;
          }
        });
      }
    },

    markAllAsRead: async () => {
      const prevUnread = get().unreadCount;

      // Optimistic
      set((s) => {
        s.notifications.forEach((n) => {
          if (!n.isRead) {
            n.isRead = true;
            n.readAt = new Date().toISOString();
          }
        });
        s.unreadCount = 0;
      });

      try {
        await notificationService.markAllAsRead();
      } catch {
        // Rollback
        set((s) => {
          s.unreadCount = prevUnread;
        });
      }
    },

    deleteNotification: async (id) => {
      const prev = get().notifications;
      const target = prev.find((n) => n.id === id);

      set((s) => {
        s.notifications = s.notifications.filter((n) => n.id !== id);
        if (target && !target.isRead)
          s.unreadCount = Math.max(0, s.unreadCount - 1);
        if (s.pagination)
          s.pagination.total = Math.max(0, s.pagination.total - 1);
      });

      try {
        await notificationService.deleteOne(id); // ✅ was: .delete(id)
      } catch {
        set((s) => {
          if (target) s.notifications.unshift(target);
        });
      }
    },

    clearAll: async () => {
      const prev = get().notifications;

      set((s) => {
        s.notifications = [];
        s.unreadCount = 0;
        if (s.pagination) s.pagination.total = 0;
      });

      try {
        await notificationService.clearAll();
      } catch {
        set((s) => {
          s.notifications = prev;
        });
      }
    },

    decrementUnread: (by = 1) => {
      set((s) => {
        s.unreadCount = Math.max(0, s.unreadCount - by);
      });
    },

    setUnreadCount: (count) => {
      set((s) => {
        s.unreadCount = count;
      });
    },
  })),
);
