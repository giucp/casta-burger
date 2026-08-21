"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Corregir los números del día: sacar una venta que no fue, o devolver una
 * que se anuló por error.
 *
 * Esto NO es la cocina. `PanelDueno` dice, y con razón, que los estados los
 * maneja la pantalla de cocina: dos personas avanzando el mismo pedido desde
 * pantallas distintas termina en entregar dos veces. Esa regla sigue en pie y
 * estas dos acciones no la tocan, porque no avanzan nada — solo se meten con
 * pedidos que ya terminaron, donde la cocina no tiene nada más que hacer.
 *
 * De ahí que cada una exija un estado de partida y rechace todo lo demás. Un
 * pedido en juego no se anula desde acá ni por error: para eso está el botón
 * Cancelar de la cocina, que solo vive mientras el pedido está en `nuevo`.
 *
 * Por qué `cancelado` y no borrar la fila: `ventas_por_dia` suma todo pedido
 * cuyo estado no sea `cancelado`, así que cancelar ya lo saca de las ventas,
 * de los pedidos y de la ganancia. El pedido queda en la base con su número,
 * su cliente y su comanda. Un negocio no borra pedidos: los anula.
 */

type Resultado = { ok: boolean; error?: string };

/**
 * Solo el dueño. El RLS deja que la cocina cambie estados —lo necesita para
 * despachar— así que sin esta pregunta el cocinero podría borrar las ventas
 * del día pegándole directo a la acción. La lista de quién es quién sale de
 * la misma función que usan las políticas de la base.
 */
async function soloDueno() {
  const supabase = await createClient();
  const { data: rol } = await supabase.rpc("mi_rol");
  return { supabase, esDueno: rol === "dueno" };
}

async function moverVenta(
  id: string,
  desde: string,
  hasta: string,
  queNoSePudo: string,
): Promise<Resultado> {
  const { supabase, esDueno } = await soloDueno();
  if (!esDueno) {
    return { ok: false, error: "Solo el dueño puede tocar las ventas." };
  }

  /**
   * El `.eq("estado", desde)` es la parte que importa: hace que la condición
   * se verifique dentro del mismo UPDATE, no antes. Si se leyera el estado y
   * después se escribiera, entre las dos cosas la cocina podría haber movido
   * el pedido y esto lo pisaría igual.
   */
  const { data, error } = await supabase
    .from("orders")
    .update({ estado: hasta })
    .eq("id", id)
    .eq("estado", desde)
    .select("numero")
    .single();

  if (error || !data) {
    console.error(`No se pudo ${queNoSePudo}:`, error?.message);
    return { ok: false, error: `El pedido ya no está en ${desde}.` };
  }

  return { ok: true };
}

/** Saca de las ventas del día un pedido que figura entregado y no fue. */
export async function anularVenta(id: string): Promise<Resultado> {
  return moverVenta(id, "entregado", "cancelado", "anular la venta");
}

/**
 * Devuelve a las ventas un pedido anulado. Vuelve a `entregado` porque es el
 * único estado desde el que se pudo haber anulado: no se adivina nada.
 */
export async function restaurarVenta(id: string): Promise<Resultado> {
  return moverVenta(id, "cancelado", "entregado", "restaurar la venta");
}
