import api from "@/lib/api";
import type {
  NotificationChannel,
  NotificationType,
} from "@/types/notifications.types";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  imageUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  channels: NotificationChannel[];
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  channel: NotificationChannel;
  type: NotificationType;
  enabled: boolean;
}

interface PaginatedNotificationsResponse {
  status: "success";
  data: {
    notifications: NotificationItem[];
    unreadCount: number;
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

interface PreferencesResponse {
  status: "success";
  data: {
    preferences: NotificationPreference[];
  };
}

interface PreferenceResponse {
  status: "success";
  data: {
    preference: NotificationPreference;
  };
}

interface MessageResponse {
  status: "success";
  message: string;
  data?: { updated?: number };
}

export const notificationService = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get<PaginatedNotificationsResponse>("/notifications", { params }),

  markAsRead: (id: string) =>
    api.patch<MessageResponse>(`/notifications/${id}/read`),

  markAllAsRead: () => api.patch<MessageResponse>("/notifications/read-all"),

  deleteOne: (id: string) =>
    api.delete<MessageResponse>(`/notifications/${id}`),

  clearAll: () => api.delete<MessageResponse>("/notifications"),

  getPreferences: () =>
    api.get<PreferencesResponse>("/notifications/preferences"),

  updatePreference: (payload: {
    channel: NotificationChannel;
    type: NotificationType;
    enabled: boolean;
  }) => api.put<PreferenceResponse>("/notifications/preferences", payload),

  registerDevice: (payload: {
    platform: "expo" | "web";
    token: string;
    deviceInfo?: Record<string, unknown> | string;
  }) => api.post("/notifications/devices/register", payload),

  unregisterDevice: (token: string) =>
    api.post("/notifications/devices/unregister", { token }),
};
