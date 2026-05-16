"use client";

import { useNotificationStore } from "@/lib/notification.store";
import { socketManager } from "@/lib/socket.manager";
import type { Notification } from "@/types/notifications.types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface SocketContextValue {
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ isConnected: false });

export function useSocket() {
  return useContext(SocketContext);
}

interface SocketProviderProps {
  getToken: () => string | null;
  children: React.ReactNode;
}

export function SocketProvider({ getToken, children }: SocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const prependNotification = useNotificationStore(
    (s) => s.prependNotification,
  );
  const mountedRef = useRef(true);

  const handleNewNotification = useCallback(
    (notification: Notification) => {
      if (!mountedRef.current) return;
      prependNotification(notification);

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.visibilityState === "hidden"
      ) {
        new Notification(notification.title, {
          body: notification.body,
          icon: "/icon-192.png",
        });
      }
    },
    [prependNotification],
  );

  useEffect(() => {
    mountedRef.current = true;

    let socket: ReturnType<typeof socketManager.connect> | null = null;

    try {
      socket = socketManager.connect(getToken);

      socket.on("connect", () => {
        if (mountedRef.current) setIsConnected(true);
      });
      socket.on("disconnect", () => {
        if (mountedRef.current) setIsConnected(false);
      });
      socket.on("notification:new", handleNewNotification);

      setIsConnected(socket.connected);
    } catch (err) {
      console.warn("[SocketProvider] Could not connect:", err);
    }

    return () => {
      mountedRef.current = false;
      socket?.off("notification:new", handleNewNotification);
      // Don't call disconnect here — socket is a singleton shared across renders.
      // Call socketManager.disconnect() explicitly on logout.
    };
  }, [getToken, handleNewNotification]);

  return (
    <SocketContext.Provider value={{ isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
