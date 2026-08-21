import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Antes esto era `src/middleware.ts`. Next 16 renombró la convención a
 * `proxy` —el nombre viejo se confundía con el middleware de Express— y avisa
 * en cada build que el otro está deprecado. Es solo el nombre: corre en el
 * mismo momento y hace exactamente lo mismo.
 *
 * Ojo con esto si alguna vez se toca: si el archivo o la función quedan mal
 * nombrados, Next no falla — simplemente no los carga, y `/admin` se queda sin
 * puerta en silencio. Lo que confirma que sigue enganchado es la línea
 * `ƒ Proxy (Middleware)` al final de `npm run build`.
 *
 * La lógica de verdad vive en `@/lib/supabase/middleware`. Ese archivo NO
 * cambia de nombre: es un módulo nuestro, no una convención de Next.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todo menos archivos estáticos e imágenes. La web pública también pasa
     * por acá para que la sesión del dueño se mantenga fresca mientras navega.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|ico)$).*)",
  ],
};
