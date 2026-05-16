"use client";

import { useNotificationStore } from "@/lib/notification.store";
import { useEffect } from "react";

export function useNotifications() {
  const store = useNotificationStore();

  useEffect(() => {
    store.fetchNotifications();
  }, []);

  return store;
}
