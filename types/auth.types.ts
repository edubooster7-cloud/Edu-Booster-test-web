export type Role = "student";
export type StudyDay = "lun" | "mar" | "mer" | "jeu" | "ven" | "sam" | "dim";
export type StudyFrequency = "daily" | "3h";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isPremium: boolean;
  hasActiveSubscription: boolean;
  googleId: string | null;
  provinceId: string | null;
  sectionId: string | null;
  expoPushToken: string | null;

  // Stats
  coursesCompleted: number | null;
  averageScore: number | null;
  predictedSuccessRate: number | null;

  // Settings
  darkMode: boolean;
  timezone: string;
  pushEnabled: boolean;
  newCourses: boolean;
  hasPassword: boolean;

  // Study hours
  studyHoursEnabled: boolean;
  studyTime: string;
  studyFrequency: StudyFrequency;
  selectedDays: StudyDay[];

  // Soft delete
  isDeleted: boolean;
  deletedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  ref?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ResendCodePayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  code: string;
  password: string;
  email: string;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface CreatePasswordPayload {
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  provinceId?: string;
  sectionId?: string;
}

export interface AuthResponse {
  status: "success";
  message: string;
  data: {
    user: User;
  };
}

export interface MeResponse {
  status: "success";
  data: {
    user: User;
  };
}

export interface MessageResponse {
  status: "success";
  message: string;
}

export interface DeleteAccountPayload {
  email: string;
  password: string;
}

export interface StudyRemindersData {
  studyHoursEnabled: boolean;
  studyTime: string; // "HH:MM"
  studyFrequency: "daily" | "3h";
  selectedDays: ("lun" | "mar" | "mer" | "jeu" | "ven" | "sam" | "dim")[];
  timezone: string;
  pushEnabled: boolean;
  isFullyConfigured: boolean;
}

export interface StudyRemindersResponse {
  status: "success";
  data: StudyRemindersData;
}
