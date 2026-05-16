"use client";

import * as React from "react";

export type ToastVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "loading";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  _dismissing?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

type ToastInput = Omit<Toast, "id" | "_dismissing">;

type Action =
  | { type: "ADD"; toast: Toast }
  | { type: "UPDATE"; id: string; toast: Partial<Toast> }
  | { type: "REMOVE"; id: string };

const toastReducer = (
  state: { toasts: Toast[] },
  action: Action,
): { toasts: Toast[] } => {
  switch (action.type) {
    case "ADD":
      return { toasts: [action.toast, ...state.toasts].slice(0, 5) };
    case "UPDATE":
      return {
        toasts: state.toasts.map((t) =>
          t.id === action.id ? { ...t, ...action.toast } : t,
        ),
      };
    case "REMOVE":
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
};

// Global dispatch — toasts fired before Toaster mounts are buffered
let dispatch: React.Dispatch<Action> | null = null;
const pendingActions: Action[] = [];
let toastCount = 0;

function globalDispatch(action: Action) {
  if (dispatch) {
    dispatch(action);
  } else {
    pendingActions.push(action);
  }
}

export function useToastStore() {
  const [state, localDispatch] = React.useReducer(toastReducer, { toasts: [] });

  React.useEffect(() => {
    dispatch = localDispatch;
    pendingActions.splice(0).forEach((a) => localDispatch(a));
    return () => {
      dispatch = null;
    };
  }, [localDispatch]);

  const dismiss = React.useCallback((id: string) => {
    localDispatch({ type: "UPDATE", id, toast: { _dismissing: true } });
    setTimeout(() => localDispatch({ type: "REMOVE", id }), 380);
  }, []);

  return { toasts: state.toasts, dismiss };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function scheduleAutoDismiss(id: string, duration: number) {
  setTimeout(() => {
    globalDispatch({ type: "UPDATE", id, toast: { _dismissing: true } });
    setTimeout(() => globalDispatch({ type: "REMOVE", id }), 380);
  }, duration);
}

function addToast(input: ToastInput): string {
  const id = String(++toastCount);
  const variant = input.variant ?? "default";
  const duration = input.duration ?? (variant === "loading" ? 0 : 4000);
  globalDispatch({ type: "ADD", toast: { ...input, id, duration } });
  if (duration > 0) scheduleAutoDismiss(id, duration);
  return id;
}

function updateToast(id: string, input: Partial<ToastInput>) {
  const duration = input.duration ?? (input.variant === "loading" ? 0 : 4000);
  globalDispatch({
    type: "UPDATE",
    id,
    toast: { ...input, duration, _dismissing: false },
  });
  if (duration > 0) scheduleAutoDismiss(id, duration);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function toast(input: ToastInput) {
  return addToast(input);
}

toast.success = (input: Omit<ToastInput, "variant">) =>
  addToast({ ...input, variant: "success" });

toast.error = (input: Omit<ToastInput, "variant">) =>
  addToast({ ...input, variant: "error" });

toast.warning = (input: Omit<ToastInput, "variant">) =>
  addToast({ ...input, variant: "warning" });

toast.info = (input: Omit<ToastInput, "variant">) =>
  addToast({ ...input, variant: "info" });

toast.loading = (input: Omit<ToastInput, "variant" | "duration">) =>
  addToast({ ...input, variant: "loading", duration: 0 });

toast.dismiss = (id: string) => {
  globalDispatch({ type: "UPDATE", id, toast: { _dismissing: true } });
  setTimeout(() => globalDispatch({ type: "REMOVE", id }), 380);
};

// ─── Promise toast ────────────────────────────────────────────────────────────

type MsgResolver<T> =
  | string
  | { title?: string; description?: string }
  | ((data: T) => string | { title?: string; description?: string });

function resolveMsg<T>(
  msg: MsgResolver<T>,
  arg: T,
): { title?: string; description?: string } {
  const r = typeof msg === "function" ? msg(arg) : msg;
  return typeof r === "string" ? { title: r } : r;
}

toast.promise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string | { title?: string; description?: string };
    success: MsgResolver<T>;
    error: MsgResolver<unknown>;
  },
): Promise<T> => {
  const loadingMsg =
    typeof messages.loading === "string"
      ? { title: messages.loading }
      : messages.loading;

  const id = addToast({ ...loadingMsg, variant: "loading", duration: 0 });

  promise
    .then((data) =>
      updateToast(id, {
        ...resolveMsg(messages.success, data),
        variant: "success",
      }),
    )
    .catch((err) =>
      updateToast(id, { ...resolveMsg(messages.error, err), variant: "error" }),
    );

  return promise;
};
