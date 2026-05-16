import api from "@/lib/api";
import {
  AuthResponse,
  CreatePasswordPayload,
  DeleteAccountPayload,
  ForgotPasswordPayload,
  LoginPayload,
  MeResponse,
  MessageResponse,
  RegisterPayload,
  ResendCodePayload,
  ResetPasswordPayload,
  StudyRemindersResponse,
  UpdatePasswordPayload,
  UpdateProfilePayload,
  VerifyEmailPayload,
} from "@/types/auth.types";
import {
  GetMySubscriptionResponse,
  GetPlanByIdResponse,
  GetPlansResponse,
  InitiateChargeResponse,
} from "@/types/plans.types";
import { AUTH_ROUTES, PLAN_ROUTES, USER_ROUTES } from "./auth.constants";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authService = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>(AUTH_ROUTES.REGISTER, payload),

  verifyEmail: (payload: VerifyEmailPayload) =>
    api.post<AuthResponse>(AUTH_ROUTES.VERIFY_EMAIL, payload),

  resendCode: (payload: ResendCodePayload) =>
    api.post<MessageResponse>(AUTH_ROUTES.RESEND_CODE, payload),

  login: (payload: LoginPayload) =>
    api.post<AuthResponse>(AUTH_ROUTES.LOGIN, payload),

  loginWithGoogle: (idToken: string) =>
    api.post<AuthResponse>(AUTH_ROUTES.LOGIN_GOOGLE, { idToken }),

  googleLogin: (code: string, ref?: string) =>
    api.post<AuthResponse>(AUTH_ROUTES.LOGIN_GOOGLE, {
      code,
      ...(ref && { ref }),
    }),

  disconnectGoogle: (payload: { email: string; password: string }) =>
    api.delete("/auth/google/disconnect", { data: payload }),

  refresh: () => api.post<MessageResponse>(AUTH_ROUTES.REFRESH),

  logout: () => api.post<MessageResponse>(AUTH_ROUTES.LOGOUT),

  getStudyReminders: () =>
    api.get<StudyRemindersResponse>(USER_ROUTES.STUDY_REMINDERS),

  setupStudyReminders: (payload: {
    studyHoursEnabled?: boolean;
    studyTime?: string;
    studyFrequency?: "daily" | "3h";
    selectedDays?: string[];
  }) => api.put<StudyRemindersResponse>(USER_ROUTES.STUDY_REMINDERS, payload),

  toggleStudyReminders: (payload: { enabled: boolean }) =>
    api.patch<StudyRemindersResponse>(
      USER_ROUTES.STUDY_REMINDERS_TOGGLE,
      payload,
    ),

  updateStudyDays: (payload: { selectedDays: string[] }) =>
    api.patch<StudyRemindersResponse>(
      USER_ROUTES.STUDY_REMINDERS_DAYS,
      payload,
    ),

  updateStudyTime: (payload: {
    studyTime: string;
    studyFrequency?: "daily" | "3h";
  }) =>
    api.patch<StudyRemindersResponse>(
      USER_ROUTES.STUDY_REMINDERS_TIME,
      payload,
    ),
};

// ─── User ─────────────────────────────────────────────────────────────────────

export const userService = {
  getMe: () =>
    api.get<MeResponse>(USER_ROUTES.ME, { _skipAuthRedirect: true } as any),
  updateProfile: (payload: UpdateProfilePayload) =>
    api.patch<MeResponse>(USER_ROUTES.UPDATE_PROFILE, payload),
  deleteAccount: (payload: DeleteAccountPayload) =>
    api.delete<MessageResponse>(USER_ROUTES.DELETE_ACCOUNT, { data: payload }),
  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post<MessageResponse>(USER_ROUTES.FORGOT_PASSWORD, payload),
  resetPassword: (payload: ResetPasswordPayload) =>
    api.post<MessageResponse>(USER_ROUTES.RESET_PASSWORD, payload),
  updatePassword: (payload: UpdatePasswordPayload) =>
    api.post<MessageResponse>(USER_ROUTES.UPDATE_PASSWORD, payload),
  createPassword: (payload: CreatePasswordPayload) =>
    api.post<MessageResponse>(USER_ROUTES.CREATE_PASSWORD, payload),
  updateAppearance: (payload: { darkMode: boolean }) =>
    api.patch<MeResponse>(USER_ROUTES.SETTINGS_APPEARANCE, payload),
  updateNotifications: (payload: {
    pushEnabled?: boolean;
    newCourses?: boolean;
  }) => api.patch<MeResponse>(USER_ROUTES.SETTINGS_NOTIFICATIONS, payload),
  updateStudyHours: (payload: {
    studyHoursEnabled?: boolean;
    studyTime?: string;
    studyFrequency?: string;
    selectedDays?: string[];
  }) => api.patch<MeResponse>(USER_ROUTES.SETTINGS_STUDY_HOURS, payload),

  getStudyReminders: () =>
    api.get<StudyRemindersResponse>(USER_ROUTES.STUDY_REMINDERS),
  setupStudyReminders: (payload: {
    studyHoursEnabled?: boolean;
    studyTime?: string;
    studyFrequency?: "daily" | "3h";
    selectedDays?: string[];
  }) => api.put<StudyRemindersResponse>(USER_ROUTES.STUDY_REMINDERS, payload),
  toggleStudyReminders: (payload: { enabled: boolean }) =>
    api.patch<StudyRemindersResponse>(
      USER_ROUTES.STUDY_REMINDERS_TOGGLE,
      payload,
    ),
  updateStudyDays: (payload: { selectedDays: string[] }) =>
    api.patch<StudyRemindersResponse>(
      USER_ROUTES.STUDY_REMINDERS_DAYS,
      payload,
    ),
  updateStudyTime: (payload: {
    studyTime: string;
    studyFrequency?: "daily" | "3h";
  }) =>
    api.patch<StudyRemindersResponse>(
      USER_ROUTES.STUDY_REMINDERS_TIME,
      payload,
    ),
};

// ─── plans ─────────────────────────────────────────────────────────────────────
export const plansService = {
  getPlans: () => api.get<GetPlansResponse>(PLAN_ROUTES.GET_PLANS),
  getPlanById: (id: string) =>
    api.get<GetPlanByIdResponse>(PLAN_ROUTES.GET_PLAN_BY_ID(id)),
};

// ─── Account restore (public) ─────────────────────────────────────────────────

export const restoreService = {
  requestRestore: (payload: { email: string }) =>
    api.post<MessageResponse>(USER_ROUTES.REQUEST_RESTORE, payload),

  restoreAccount: (payload: { email: string; code: string }) =>
    api.post<MessageResponse>(USER_ROUTES.RESTORE_ACCOUNT, payload),
};

export const paymentService = {
  initiateCharge: (payload: {
    planId: string;
    clientPhone: string;
    currency: string;
    telecom?: string;
  }) => api.post<InitiateChargeResponse>("/payments/charge", payload),

  activateFreePlan: () => api.post<MessageResponse>("/payments/free"),

  // 🔧 DEV ONLY — simulate SerdiPay webhook callback
  simulateCallback: (payload: {
    payment: { sessionId: string; status: string; transactionId: string };
  }) => api.post<MessageResponse>("/payments/callback", payload),

  getMySubscription: () =>
    api.get<GetMySubscriptionResponse>("/payments/my-subscription"),

  upgradeToPro: (payload: {
    planId: string;
    clientPhone: string;
    currency: "USD" | "CDF";
    telecom?: string;
  }) => api.post("/payments/upgrade", payload),
};
