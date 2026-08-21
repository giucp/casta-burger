import { APP_ADMIN, manifiesto } from "@/lib/manifiestos";

/**
 * El manifest de la app del dueño. Se sirve a mano porque la convención
 * `manifest.ts` de Next solo funciona en la raíz de `app/`, y acá hacen falta
 * tres. El detalle de por qué cuelga de la raíz está en `manifiestos.ts`.
 */
/** No depende del request: se sirve como archivo, no como función. */
export const dynamic = "force-static";

export function GET() {
  return Response.json(manifiesto(APP_ADMIN), {
    headers: { "content-type": "application/manifest+json" },
  });
}
