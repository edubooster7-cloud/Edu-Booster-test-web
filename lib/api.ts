declare module "axios" {
  interface InternalAxiosRequestConfig {
    _skipAuthRedirect?: boolean;
  }
}

import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

export interface ApiErrorPayload {
  status: "fail" | "error";
  message: string;
  errorType: string;
  canRestore?: boolean;
  requiresVerification?: boolean;
  redirectTo?: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorType: string;
  public readonly payload: ApiErrorPayload;

  constructor(payload: ApiErrorPayload, statusCode: number) {
    super(payload.message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorType = payload.errorType;
    this.payload = payload;
  }

  get isUnauthorized() {
    return this.statusCode === 401;
  }
  get isForbidden() {
    return this.statusCode === 403;
  }
  get isNotFound() {
    return this.statusCode === 404;
  }
  get isConflict() {
    return this.statusCode === 409;
  }
  get isRateLimit() {
    return this.statusCode === 429;
  }
  get isServerError() {
    return this.statusCode >= 500;
  }
}

// ─── Redirect guard ───────────────────────────────────────────────────────────
// Uses sessionStorage so the flag survives the full-page reload that
// window.location.href triggers (unlike a module-level variable which resets).

function isRedirecting(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem("auth_redirecting") === "1";
}

function setRedirecting(): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("auth_redirecting", "1");
  }
}

export function resetAuthRedirectFlag(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("auth_redirecting");
  }
}

function redirectToSessionExpired(): void {
  if (typeof window !== "undefined" && !isRedirecting()) {
    setRedirecting();
    window.location.href = "/auth/session-expired";
  }
}

function redirectTo(path: string): void {
  if (typeof window !== "undefined" && !isRedirecting()) {
    setRedirecting();
    window.location.href = path;
  }
}

// ─── Refresh state ────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: () => void;
  reject: (err: unknown) => void;
}> = [];

function processRefreshQueue(error: unknown) {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  refreshQueue = [];
}

const SESSION_REDIRECT_ERRORS = new Set(["INVALID_TOKEN"]);
const TOKEN_REFRESH_ERRORS = new Set(["TOKEN_EXPIRED"]);

// ─── Axios instance ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v2`,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: AxiosError<ApiErrorPayload>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;
    const payload = error.response?.data;
    const errorType = payload?.errorType;

    if (error.response && payload?.errorType) {
      const apiError = new ApiError(payload, status!);

      // Server-directed redirect (e.g. deleted account)
      if (payload.redirectTo) {
        redirectTo(payload.redirectTo);
        return Promise.reject(apiError);
      }

      // 1. Expired token → silent refresh + replay
      if (
        status === 401 &&
        TOKEN_REFRESH_ERRORS.has(errorType!) &&
        !originalRequest._retry
      ) {
        if (isRefreshing) {
          return new Promise<AxiosResponse>((resolve, reject) => {
            refreshQueue.push({
              resolve: () => resolve(api(originalRequest)),
              reject,
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await api.post("/auth/refresh");
          processRefreshQueue(null);
          return api(originalRequest);
        } catch (refreshError) {
          processRefreshQueue(refreshError);
          redirectToSessionExpired();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // 2. Invalid / missing token → redirect immediately
      if (
        status === 401 &&
        SESSION_REDIRECT_ERRORS.has(errorType!) &&
        !originalRequest._skipAuthRedirect // ← add this guard
      ) {
        redirectToSessionExpired();
        return Promise.reject(apiError);
      }

      return Promise.reject(apiError);
    }

    if (error.code === "ECONNABORTED") {
      return Promise.reject(
        new ApiError(
          {
            status: "error",
            message: "La requête a expiré. Vérifiez votre connexion.",
            errorType: "REQUEST_TIMEOUT",
          },
          408,
        ),
      );
    }

    if (!error.response) {
      return Promise.reject(
        new ApiError(
          {
            status: "error",
            message:
              "Impossible de joindre le serveur. Vérifiez votre connexion.",
            errorType: "NETWORK_ERROR",
          },
          0,
        ),
      );
    }

    return Promise.reject(error);
  },
);

export default api;
