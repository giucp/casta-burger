/**
 * Service worker de Casta Burger.
 *
 * Su único trabajo por ahora es recibir las notificaciones push y mostrarlas,
 * incluso con la web cerrada. No cachea nada: no queremos servir un menú o
 * precios viejos sin querer.
 */

self.addEventListener("push", (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = {};
  }

  const titulo = datos.titulo || "Casta Burger";
  const opciones = {
    body: datos.cuerpo || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    // Vibración corta: un pedido listo merece que se sienta
    vibrate: [90, 40, 90],
    // Reemplaza el aviso anterior del mismo pedido en vez de apilarlos
    tag: datos.tag || "casta-pedido",
    renotify: true,
    data: { url: datos.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(titulo, opciones));
});

// Al tocar la notificación, abrir/enfocar la web
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientes) => {
        for (const c of clientes) {
          if ("focus" in c) return c.focus();
        }
        return self.clients.openWindow(destino);
      }),
  );
});
