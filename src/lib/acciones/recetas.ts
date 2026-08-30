"use server";

import { createClient } from "@/lib/supabase/server";
import { PROTEINAS, type Proteina } from "@/lib/menu";

/**
 * Las recetas: cuánto de cada ingrediente lleva cada producto.
 *
 * El descuento NO pasa por acá. Lo hace un trigger de la base al marcar un
 * pedido como entregado (migración 0018), por dos motivos: un admin puede
 * mover el estado de un pedido pegándole directo a la API sin abrir el panel,
 * y sobre todo porque así el descuento es atómico con el cambio de estado —o
 * pasan las dos cosas o no pasa ninguna. Acá solo se cargan las recetas.
 */

export type LineaReceta = {
  id: string;
  inventarioId: string;
  /** null = la línea aplica siempre, sin importar la proteína elegida */
  proteina: Proteina | null;
  cantidad: number;
};

export type RecetaProducto = {
  menuItemId: string;
  nombre: string;
  categoria: string;
  lineas: LineaReceta[];
};

export type Resultado = { ok: true } | { ok: false; error: string };

function esProteina(v: unknown): v is Proteina {
  return typeof v === "string" && (PROTEINAS as readonly string[]).includes(v);
}

const num = (v: string | number) => (typeof v === "number" ? v : Number(v));

/**
 * Todos los productos del menú con su receta, hayan cargado alguna o no.
 *
 * Se devuelven también los que no tienen ninguna línea: la pantalla tiene que
 * poder mostrar "a este producto todavía no le cargaste nada", que es
 * justamente lo que el dueño necesita ver para saber qué le falta.
 */
export async function listarRecetas(): Promise<RecetaProducto[]> {
  const supabase = await createClient();

  const [{ data: productos, error: e1 }, { data: filas, error: e2 }] =
    await Promise.all([
      supabase
        .from("menu_items")
        .select("id, nombre, categoria, orden")
        .order("categoria")
        .order("orden"),
      supabase
        .from("recetas")
        .select("id, menu_item_id, inventory_id, proteina, cantidad"),
    ]);

  if (e1 || e2 || !productos) {
    console.error("No se pudieron leer las recetas:", e1?.message ?? e2?.message);
    return [];
  }

  const porProducto = new Map<string, LineaReceta[]>();
  for (const f of filas ?? []) {
    const lista = porProducto.get(f.menu_item_id) ?? [];
    lista.push({
      id: f.id,
      inventarioId: f.inventory_id,
      proteina: esProteina(f.proteina) ? f.proteina : null,
      cantidad: num(f.cantidad),
    });
    porProducto.set(f.menu_item_id, lista);
  }

  return productos.map((p) => ({
    menuItemId: p.id,
    nombre: p.nombre,
    categoria: p.categoria,
    lineas: porProducto.get(p.id) ?? [],
  }));
}

/**
 * Agrega o pisa una línea. El índice único de la base es
 * (producto, ingrediente, proteína) con `nulls not distinct`, así que cargar
 * dos veces el mismo par actualiza la cantidad en vez de duplicar — que es lo
 * que uno espera al corregir un número, y además evita descontar dos veces.
 */
export async function guardarLinea(datos: {
  menuItemId: string;
  inventarioId: string;
  proteina: Proteina | null;
  cantidad: number;
}): Promise<Resultado> {
  if (!(datos.cantidad > 0)) {
    return { ok: false, error: "La cantidad tiene que ser mayor que cero." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("recetas").upsert(
    {
      menu_item_id: datos.menuItemId,
      inventory_id: datos.inventarioId,
      proteina: datos.proteina,
      cantidad: datos.cantidad,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "menu_item_id,inventory_id,proteina" },
  );

  if (error) {
    console.error("No se pudo guardar la línea de receta:", error.message);
    return { ok: false, error: "No se pudo guardar. Probá de nuevo." };
  }
  return { ok: true };
}

export async function borrarLinea(id: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from("recetas").delete().eq("id", id);
  if (error) {
    console.error("No se pudo borrar la línea de receta:", error.message);
    return { ok: false, error: "No se pudo borrar." };
  }
  return { ok: true };
}
