"use client";

import { useNotificationStore } from "@/lib/notification.store";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notifications.types";
import {
  Bell,
  BellOff,
  CheckCheck,
  Circle,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "À l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Il y a ${d}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function NotificationRow({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-3.5 transition-colors duration-150 cursor-pointer",
        notification.isRead
          ? "hover:bg-muted/40"
          : "bg-primary/3 hover:bg-primary/6",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (!notification.isRead) onMarkAsRead(notification.id);
      }}
    >
      <div className="mt-1.5 shrink-0">
        <Circle
          className={cn(
            "size-2",
            notification.isRead
              ? "fill-transparent text-transparent"
              : "fill-primary text-primary",
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-snug truncate",
            notification.isRead
              ? "font-normal text-foreground"
              : "font-semibold text-foreground",
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {notification.body}
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-1.5">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className={cn(
          "shrink-0 mt-1 p-1 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all duration-150",
          hovered ? "opacity-100" : "opacity-0",
        )}
        title="Supprimer"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function NotificationDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    notifications,
    unreadCount,
    pagination,
    isLoading,
    isFetchingMore,
    fetchNotifications,
    fetchMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (open && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) fetchMore();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [fetchMore]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[9998] backdrop-blur-sm bg-black/10"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed top-0 right-0 z-[9999] h-full w-full max-w-sm",
          "bg-background border-l border-border shadow-2xl",
          "flex flex-col transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground min-w-5">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Tout marquer comme lu"
              >
                <CheckCheck className="size-3.5" />
                <span className="hidden sm:inline">Tout lire</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Tout effacer"
              >
                <Trash2 className="size-3.5" />
                <span className="hidden sm:inline">Effacer</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                <BellOff className="size-5 text-muted-foreground" />
              </span>
              <p className="text-sm font-medium text-foreground">
                Aucune notification
              </p>
              <p className="text-xs text-muted-foreground">
                Vous êtes à jour. Les nouvelles notifications apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}

              {isFetchingMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {!pagination?.hasNextPage && notifications.length > 0 && (
                <p className="text-center text-[11px] text-muted-foreground/60 py-4">
                  Vous avez tout vu
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function NotificationBell({ collapsed }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  if (collapsed === false) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium w-full transition-all duration-150",
            "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <div className="relative shrink-0">
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-destructive" />
              </span>
            )}
          </div>
          <span className="flex-1 text-left">Notifications</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-semibold px-1.5 py-0.5 min-w-5">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
        <NotificationDrawer open={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "relative inline-flex items-center justify-center rounded-md h-9 w-9",
          "text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
          collapsed === true && "w-full justify-center px-2 py-2.5 rounded-lg",
        )}
        aria-label="Ouvrir les notifications"
        title="Notifications"
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-destructive" />
          </span>
        )}
      </button>
      <NotificationDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
