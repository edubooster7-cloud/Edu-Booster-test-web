export type NotificationChannel = "in_app" | "push" | "email";

export type NotificationType =
  | "account_created"
  | "account_deleted"
  | "account_restored"
  | "account_deactivated"
  | "account_reactivated"
  | "password_changed"
  | "password_reset"
  | "login_new_device"
  | "new_course"
  | "course_completed"
  | "system_alert"
  | "promo"
  | "payment_initiated"
  | "payment_success"
  | "payment_failed"
  | "free_plan_activated";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  channels: NotificationChannel[];
  createdAt: string;
}

export interface NotificationPagination {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GetNotificationsResponse {
  status: "success";
  data: {
    notifications: Notification[];
    unreadCount: number;
    pagination: NotificationPagination;
  };
}

export interface NotificationPreference {
  id: string;
  userId: string;
  channel: NotificationChannel;
  type: NotificationType;
  enabled: boolean;
}

export interface GetPreferencesResponse {
  status: "success";
  data: { preferences: NotificationPreference[] };
}
