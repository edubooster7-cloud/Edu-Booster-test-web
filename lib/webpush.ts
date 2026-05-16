"use client";

import { notificationService } from "./notification.service";

const STORAGE_KEY = "wb_push_sub";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function subscribeWebPush(): Promise<string | null> {
  if (!isSupported()) {
    console.info("[Push] Not supported in this browser");
    return null;
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.warn("[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set");
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.info("[Push] Permission denied");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const token = JSON.stringify(subscription);

    localStorage.setItem(STORAGE_KEY, token);

    await notificationService.registerDevice({
      platform: "web",
      token,
      deviceInfo: {
        userAgent: navigator.userAgent,
        endpoint: subscription.endpoint,
      },
    });

    console.info("[Push] Web push subscribed");
    return token;
  } catch (err) {
    console.error("[Push] Subscription failed:", err);
    return null;
  }
}

export async function unsubscribeWebPush(): Promise<void> {
  if (!isSupported()) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();

    if (subscription) {
      const token = JSON.stringify(subscription);
      await subscription.unsubscribe();
      await notificationService.unregisterDevice(token);
      localStorage.removeItem(STORAGE_KEY);
      console.info("[Push] Web push unsubscribed");
    }
  } catch (err) {
    console.warn("[Push] Unsubscribe failed:", err);
  }
}

export async function getWebPushToken(): Promise<string | null> {
  if (!isSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    return subscription ? JSON.stringify(subscription) : null;
  } catch {
    return null;
  }
}

export { isSupported as isPushSupported };
