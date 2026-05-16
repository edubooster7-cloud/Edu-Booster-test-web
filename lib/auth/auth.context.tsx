"use client";

import { ApiError, resetAuthRedirectFlag } from "@/lib/api";
import {
  LoginPayload,
  RegisterPayload,
  User,
  VerifyEmailPayload,
} from "@/types/auth.types";
import { useRouter } from "next/navigation";
import * as React from "react";
import { AUTH_PAGES } from "./auth.constants";
import { authService, userService } from "./auth.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  verifyEmail: (payload: VerifyEmailPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  googleLogin: (idToken: string, ref?: string) => Promise<User>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = React.createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // ── Boot: fetch current user on mount ──────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      // A redirect is already in flight (flag survives the page reload) —
      // skip getMe entirely to break the loop.
      const alreadyRedirecting =
        typeof window !== "undefined" &&
        sessionStorage.getItem("auth_redirecting") === "1";

      if (alreadyRedirecting) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const { data } = await userService.getMe();
        if (!cancelled) setUser(data.data.user);
      } catch {
        if (!cancelled) setUser(null);
        // api.ts interceptor already called setRedirecting() + window.location.href
        // before this catch runs — nothing else needed here.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const login = React.useCallback(
    async (payload: LoginPayload): Promise<User> => {
      resetAuthRedirectFlag();
      const { data } = await authService.login(payload);
      const loggedInUser = data.data.user;
      setUser(loggedInUser);
      return loggedInUser;
    },
    [],
  );

  const register = React.useCallback(
    async (payload: RegisterPayload): Promise<User> => {
      resetAuthRedirectFlag();
      const { data } = await authService.register(payload);
      const newUser = data.data.user;
      setUser(newUser);
      return newUser;
    },
    [],
  );

  const verifyEmail = React.useCallback(
    async (payload: VerifyEmailPayload): Promise<User> => {
      resetAuthRedirectFlag();
      const { data } = await authService.verifyEmail(payload);
      const verifiedUser = data.data.user;
      setUser(verifiedUser);
      return verifiedUser;
    },
    [],
  );
  const logout = React.useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Swallow — always clear state regardless
    } finally {
      setUser(null);
      router.push(AUTH_PAGES.LOGIN);
    }
  }, [router]);

  const refreshUser = React.useCallback(async () => {
    try {
      const { data } = await userService.getMe();
      setUser(data.data.user);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        setUser(null);
      }
    }
  }, []);

  const googleLogin = React.useCallback(
    async (code: string, ref?: string): Promise<User> => {
      resetAuthRedirectFlag();
      const { data } = await authService.googleLogin(code);
      const loggedInUser = data.data.user;
      setUser(loggedInUser);
      return loggedInUser;
    },
    [],
  );

  // ── Value ──────────────────────────────────────────────────────────────────

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      verifyEmail,
      logout,
      refreshUser,
      setUser,
      googleLogin,
    }),
    [
      user,
      isLoading,
      login,
      register,
      verifyEmail,
      logout,
      refreshUser,
      googleLogin,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Consumer ─────────────────────────────────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside <AuthProvider>");
  }
  return ctx;
}
