import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la llave secreta. Se salta TODO el RLS.
 *
 * El `import "server-only"` de arriba no es decorativo: si algún día alguien
 * importa este archivo desde un componente de cliente, el build falla en vez
 * de mandar la llave secreta al navegador de cada visitante.
 *
 * Se usa solo donde el servidor tiene que ser la autoridad: crear el pedido
 * calculando el total contra los precios reales de la base.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secreta = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secreta) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(url, secreta, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
