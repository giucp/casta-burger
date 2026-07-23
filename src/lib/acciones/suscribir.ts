"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Guarda la suscripción push del cliente ligada a su pedido. Se llama justo
 * después de crear el pedido, si el cliente aceptó recibir avisos.
 *
 * Usa la llave secreta (server-side): el público puede crear su suscripción
 * pero no leer las de nadie.
 */
export async function guardarSuscripcion(
  orderId: string,
  sub: { endpoint: string; p256dh: string; auth: string },
): Promise<{ ok: boolean }> {
  if (!orderId || !sub.endpoint || !sub.p256dh || !sub.auth) {
    return { ok: false };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      order_id: orderId,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
    { onConflict: "order_id,endpoint" },
  );

  return { ok: !error };
}
