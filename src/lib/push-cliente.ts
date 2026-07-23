/**
 * Lado del navegador de las notificaciones. Registra el service worker y pide
 * la suscripción push del cliente.
 *
 * Todo devuelve null en silencio si el navegador no soporta push o el cliente
 * niega el permiso: el pedido sale igual, solo que sin avisos.
 */

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function base64UrlABytes(base64: string): Uint8Array {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export type SubGuardable = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

/** true si este navegador puede recibir notificaciones push. */
export function soportaPush(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    Boolean(VAPID)
  );
}

/**
 * Pide permiso, registra el service worker y devuelve la suscripción lista
 * para guardar. null si no se puede o el cliente dice que no.
 */
export async function suscribirCliente(): Promise<SubGuardable | null> {
  if (!soportaPush() || !VAPID) return null;

  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") return null;

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    // .buffer da un ArrayBuffer, que es lo que exige el tipo de la Push API
    applicationServerKey: base64UrlABytes(VAPID).buffer as ArrayBuffer,
  });

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null;

  return {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  };
}
