"use client";

import {
  getWebPushToken,
  isPushSupported,
  subscribeWebPush,
  unsubscribeWebPush,
} from "@/lib/webpush";
import { useEffect, useState } from "react";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

export function useWebPush() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PermissionState);

    getWebPushToken().then((token) => {
      setIsSubscribed(!!token);
    });
  }, []);

  const subscribe = async () => {
    setIsLoading(true);
    try {
      const token = await subscribeWebPush();
      setIsSubscribed(!!token);
      setPermission(Notification.permission as PermissionState);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      await unsubscribeWebPush();
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported: isPushSupported(),
    subscribe,
    unsubscribe,
  };
}
