import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * El chequeo contra la base, cacheado 60 s.
 *
 * Sin esto, cada visita a la home —la página más vista— dispararía una consulta
 * a Supabase y la volvería dinámica, perdiendo el ISR. La fecha de la cuota
 * cambia una vez al mes: mirarla una vez por minuto para todos los visitantes
 * alcanza de sobra, y encaja con el "vuelve en menos de un minuto".
 */
const leerVencida = unstable_cache(
  async (): Promise<boolean> => {
    const { data, error } = await createAdminClient().rpc(
      "suscripcion_vencida",
    );
    if (error) {
      console.error("No se pudo consultar la suscripción:", error.message);
      return false;
    }
    return data === true;
  },
  ["suscripcion-vencida"],
  { revalidate: 60 },
);

/**
 * ¿Venció la cuota mensual del servicio?
 *
 * La cuenta la hace la base (`suscripcion_vencida()`, migración 0024), en hora
 * de Caracas. Se consulta con la llave secreta porque la tabla está cerrada
 * para todos los demás: si el dueño pudiera leerla con su sesión, también
 * podría intentar escribirla.
 *
 * Ante cualquier error devuelve `false`. Un corte de red o una migración sin
 * correr no pueden tumbarle la web a un negocio que está al día: el costo de
 * equivocarse para ese lado es una noche de cuota sin cobrar, y para el otro
 * es una noche de ventas perdida.
 */
export async function suscripcionVencida(): Promise<boolean> {
  // Solo para probar la pantalla en local sin tocar la fecha real. En el build
  // de producción esta línea no hace nada, aunque la variable exista.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.FORZAR_SUSCRIPCION_VENCIDA === "1"
  ) {
    return true;
  }

  try {
    return await leerVencida();
  } catch (e) {
    console.error("No se pudo consultar la suscripción:", e);
    return false;
  }
}
