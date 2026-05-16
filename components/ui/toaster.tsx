"use client";

import { ToastItem } from "@/components/ui/toast";
import { useToastStore } from "@/hooks/use-toast";
import * as React from "react";
import { createPortal } from "react-dom";

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return createPortal(
    <div
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 sm:top-6 sm:right-6"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>,
    document.body,
  );
}
