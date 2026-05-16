// ─── Routes ───────────────────────────────────────────────────────────────────

export const AUTH_ROUTES = {
  REGISTER: "/auth/register",
  VERIFY_EMAIL: "/auth/verify-email",
  RESEND_CODE: "/auth/resend-code",
  LOGIN: "/auth/login",
  LOGIN_GOOGLE: "/auth/login/google",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",
} as const;

export const USER_ROUTES = {
  ME: "/users/me",
  UPDATE_PROFILE: "/users/update/profile",
  DELETE_ACCOUNT: "/users/delete-account",
  REQUEST_RESTORE: "/users/request-restore",
  RESTORE_ACCOUNT: "/users/restore-account",
  FORGOT_PASSWORD: "/users/password/forgot",
  RESET_PASSWORD: "/users/password/reset",
  UPDATE_PASSWORD: "/users/password/update",
  CREATE_PASSWORD: "/users/password/create",
  SETTINGS_APPEARANCE: "/users/settings/appearance",
  SETTINGS_NOTIFICATIONS: "/users/settings/notifications",
  SETTINGS_STUDY_HOURS: "/users/settings/study-hours",
  STUDY_REMINDERS: "/users/reminders/study",
  STUDY_REMINDERS_TOGGLE: "/users/reminders/study/toggle",
  STUDY_REMINDERS_DAYS: "/users/reminders/study/days",
  STUDY_REMINDERS_TIME: "/users/reminders/study/time",
} as const;

// ─── App navigation ───────────────────────────────────────────────────────────

export const AUTH_PAGES = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  VERIFY_EMAIL: "/auth/verify-email",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  SESSION_EXPIRED: "/auth/session-expired",
  RESTORE_ACCOUNT: "/auth/restore-account",
} as const;

export const APP_PAGES = {
  DASHBOARD: (userId: string) => `/accounts/${userId}`,
  HOME: "/",
} as const;

// ─── Query keys ───────────────────────────────────────────────────────────────

export const AUTH_QUERY_KEYS = {
  ME: ["auth", "me"] as const,
} as const;

export const PLAN_ROUTES = {
  GET_PLANS: "/plans",
  GET_PLAN_BY_ID: (id: string) => `/plans/${id}`,
} as const;
