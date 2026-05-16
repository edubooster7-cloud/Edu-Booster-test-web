"use client";

import { type Toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import * as React from "react";

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M11 3L3 11M3 3l8 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const SuccessIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M5 8l2 2 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10 6L6 10M6 6l4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M8 2L14 13H2L8 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M8 6v3M8 11v.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M8 7v4M8 5v.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

type VariantConfig = {
  border: string;
  icon: React.ReactNode;
  iconColor: string;
  progress: string;
};

const variantConfig: Record<NonNullable<Toast["variant"]>, VariantConfig> = {
  default: {
    border: "border-border",
    icon: <InfoIcon />,
    iconColor: "text-muted-foreground",
    progress: "bg-primary",
  },
  success: {
    border: "border-[oklch(0.696_0.17_162.48/0.35)]",
    icon: <SuccessIcon />,
    iconColor: "text-[oklch(0.596_0.145_163.225)]",
    progress: "bg-[oklch(0.696_0.17_162.48)]",
  },
  error: {
    border: "border-destructive/30",
    icon: <ErrorIcon />,
    iconColor: "text-destructive",
    progress: "bg-destructive",
  },
  warning: {
    border: "border-[oklch(0.72_0.19_65/0.35)]",
    icon: <WarningIcon />,
    iconColor: "text-[oklch(0.72_0.19_65)]",
    progress: "bg-[oklch(0.72_0.19_65)]",
  },
  info: {
    border: "border-primary/30",
    icon: <InfoIcon />,
    iconColor: "text-primary",
    progress: "bg-primary",
  },
  loading: {
    border: "border-border",
    icon: <Loader className="animate-spin size-4" />,
    iconColor: "text-muted-foreground",
    progress: "bg-primary",
  },
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [entered, setEntered] = React.useState(false);
  const variant = toast.variant ?? "default";
  const config = variantConfig[variant];
  const duration = toast.duration ?? (variant === "loading" ? 0 : 10_000);
  const dismissing = toast._dismissing;

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleDismiss = () => onDismiss(toast.id);
  const visible = entered && !dismissing;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        transition:
          "transform 350ms cubic-bezier(0.32,0.72,0,1), opacity 350ms ease",
        transform: visible
          ? "translateX(0)"
          : "translateX(calc(100% + 1.5rem))",
        opacity: visible ? 1 : 0,
      }}
      className={`
        relative flex w-full items-start gap-3 overflow-hidden
        rounded-lg border bg-card text-card-foreground
        px-4 py-3.5 shadow-lg
        min-w-75 max-w-105
        ${config.border}
      `}
    >
      {/* Icon */}
      <span className={`mt-0.5 shrink-0 ${config.iconColor}`}>
        {config.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold leading-snug tracking-tight">
            {toast.title}
          </p>
        )}
        {toast.description && (
          <p
            className={`text-sm leading-snug ${toast.title ? "mt-0.5 text-muted-foreground" : ""}`}
          >
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              handleDismiss();
            }}
            className="mt-2 text-xs font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close — hidden for loading toasts */}
      {variant !== "loading" && (
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 mt-0.5 rounded-sm text-muted-foreground opacity-50 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CloseIcon />
        </button>
      )}

      {/* Progress bar — only when auto-dismissing */}
      {duration > 0 && variant !== "loading" && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full">
          <div
            key={`${toast.id}-${variant}`}
            className={`h-full ${config.progress} opacity-50`}
            style={{
              animation: `toast-progress ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes toast-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
