import "server-only";
import webpush from "web-push";
import { createAdminClient } from "./supabase/admin";
import type { EstadoPedido } from "./admin/pedidos";

/**
 * Notificaciones push al cliente cuando su pedido cambia de estado.
 *
 * Solo se avisan los dos momentos que al cliente le importan: cuando su comida
 * sale para allá (delivery) o cuando ya la puede pasar a buscar (retiro). No
 * se le notifica "preparando" ni "nuevo": sería ruido.
 */

let configurado = false;
function configurar(): boolean {
  if (configurado) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:casta@burger.com";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configurado = true;
  return true;
}

/** El texto del aviso según el estado y el tipo de entrega, con voz de marca. */
export function textoAviso(
  estado: EstadoPedido,
  tipo: "retiro" | "delivery",
  numero: number,
): { titulo: string; cuerpo: string } | null {
  if (estado === "listo" && tipo === "retiro") {
    return {
      titulo: `Tu pedido #${numero} ya está`,
      cuerpo: "Recién hecha y calentica. Pásala buscando cuando quieras.",
    };
  }
  if (estado === "listo" && tipo === "delivery") {
    return {
      titulo: `Tu pedido #${numero} va en camino`,
      cuerpo: "Ya salió para allá. Tené el teléfono a mano por si el motorizado te escribe.",
    };
  }
  // Los demás estados no le avisan nada al cliente
  return null;
}

/** Suscripción tal como la guardamos en la base. */
type FilaSub = { endpoint: string; p256dh: string; auth: string };

/**
 * Manda el aviso a todos los dispositivos suscritos a un pedido. Nunca lanza:
 * un fallo de push no puede afectar el cambio de estado en la cocina.
 */
export async function avisarClientePush(
  orderId: string,
  numero: number,
  tipo: "retiro" | "delivery",
  estado: EstadoPedido,
): Promise<void> {
  const texto = textoAviso(estado, tipo, numero);
  if (!texto || !configurar()) return;

  const supabase = createAdminClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("order_id", orderId);

  if (!subs || subs.length === 0) return;

  const payload = JSON.stringify({
    titulo: texto.titulo,
    cuerpo: texto.cuerpo,
    tag: `casta-pedido-${numero}`,
    url: "/",
  });

  await Promise.all(
    (subs as FilaSub[]).map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          payload,
        );
      } catch (e: unknown) {
        // 404/410 = el cliente desinstaló o revocó: limpiamos su suscripción
        const status = (e as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", s.endpoint);
        } else {
          console.error("Push falló:", e);
        }
      }
    }),
  );
}
