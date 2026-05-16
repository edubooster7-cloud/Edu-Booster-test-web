"use client";

import { useAuthContext } from "@/lib/auth/auth.context";
import { User } from "@/types/auth.types";

// ─── Main hook ────────────────────────────────────────────────────────────────

/**
 * Primary hook for consuming auth state anywhere in the app.
 *
 * @example
 * const { user, isAuthenticated, logout } = useAuth();
 */
export function useAuth() {
  const ctx = useAuthContext();

  const isStudent = ctx.user?.role === "student";
  const isPremium = ctx.user?.isPremium ?? false;
  const isEmailVerified = ctx.user?.isEmailVerified ?? false;

  return {
    // State
    user: ctx.user,
    isLoading: ctx.isLoading,
    isAuthenticated: ctx.isAuthenticated,

    isStudent,
    isPremium,
    isEmailVerified,

    // Actions
    login: ctx.login,
    register: ctx.register,
    verifyEmail: ctx.verifyEmail,
    logout: ctx.logout,
    refreshUser: ctx.refreshUser,
    setUser: ctx.setUser,
    googleLogin: ctx.googleLogin,
  };
}

// ─── Typed user hook (throws if not authenticated) ───────────────────────────

/**
 * Like useAuth() but asserts the user is authenticated.
 * Use only inside protected routes/components.
 *
 * @example
 * const user = useRequiredUser(); // User, never null
 */
export function useRequiredUser(): User {
  const { user } = useAuthContext();
  if (!user) {
    throw new Error(
      "useRequiredUser: user is null. Make sure this component is inside a protected route.",
    );
  }
  return user;
}
