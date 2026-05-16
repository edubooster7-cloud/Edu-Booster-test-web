import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const socketManager = {
  connect(getToken: () => string | null): Socket {
    if (socket?.connected) return socket;

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }

    const token = getToken?.();

    socket = io(
      process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_API_URL!,
      {
        ...(token ? { auth: { token } } : {}),
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1_000,
        reconnectionDelayMax: 30_000,
        timeout: 20_000,
      },
    );

    socket.on("connect", () => {
      console.info("[Socket] Connected", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.info("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    return socket;
  },

  disconnect(): void {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
  },

  getSocket(): Socket | null {
    return socket;
  },

  isConnected(): boolean {
    return socket?.connected ?? false;
  },
};
