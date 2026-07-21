import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el navegador.
 *
 * Usa la llave publicable, que es pública a propósito: viaja en el JavaScript
 * que descarga cualquier visitante. Lo que protege los datos es el RLS de la
 * base, no el secreto de esta llave.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
