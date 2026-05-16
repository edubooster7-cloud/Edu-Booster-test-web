self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "EduBooster", body: event.data.text() };
  }

  const { title = "EduBooster", body = "", data = {}, imageUrl } = payload;

  const options = {
    body,
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    data,
    ...(imageUrl ? { image: imageUrl } : {}),
    actions: [{ action: "open", title: "Voir" }],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) =>
          c.url.includes(self.location.origin),
        );
        if (existing) {
          existing.focus();
          existing.postMessage({
            type: "notification:click",
            data: event.notification.data,
          });
        } else {
          self.clients.openWindow(url);
        }
      }),
  );
});
