"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * El registro de quién cambió qué.
 *
 * Las filas las escribe un trigger de la base (`registrar_actividad`, migración
 * 0017), no esta app. Es a propósito: un admin con su token puede escribir en
 * `inventory` pegándole directo a la API de Supabase sin pasar por el panel, y
 * un registro que solo anota lo que pasa por el panel se pierde justo el caso
 * que preocupa. Acá solo se lee.
 *
 * Leer lo permite únicamente el dueño, y eso lo decide el RLS: `actividad`
 * tiene una sola política, de select, con `es_dueno()`. Si esta función la
 * llamara un encargado, volvería vacía en vez de fallar — así que la pantalla
 * también se cierra en `secciones.ts`, para no mostrar una tabla vacía que
 * parezca "no pasó nada".
 */

export type Cambio = { campo: string; antes: string | null; despues: string | null };

export type Movimiento = {
  id: number;
  cuandoISO: string;
  quien: string;
  tabla: string;
  operacion: "alta" | "edicion" | "baja";
  etiqueta: string | null;
  cambios: Cambio[];
};

/** Y cada columna. Lo que no esté acá sale con su nombre crudo. */
const CAMPO_ETIQUETA: Record<string, string> = {
  nombre: "nombre",
  cantidad: "cantidad",
  unidad: "unidad",
  umbral_alerta: "avisar en",
  inventory_id: "ingrediente",
  menu_item_id: "producto",
  proteina: "proteína",
  precio: "precio",
  precio_suelto: "precio suelto",
  categoria: "categoría",
  descripcion: "descripción",
  disponible: "disponible",
  agotado: "agotado",
  orden: "orden",
  slug: "slug",
  tags: "tags",
  foto_url: "foto",
  foto_completa_url: "foto completa",
  es_promo: "es promo",
  incluye: "incluye",
  visible: "visible",
};

function valor(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? "sí" : "no";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/**
 * Las columnas que guardan un id y no un nombre, y de qué tabla sale ese nombre.
 *
 * `recetas` es la única que las tiene, y sin esto la pantalla mostraba
 * "ingrediente 0280dd33-96db-4f71-b1bc-60b97784585c". El dueño viene acá a
 * saber qué cambió: un UUID no se lo dice.
 */
const CAMPO_ES_ID: Record<string, "inventory" | "menu_items"> = {
  inventory_id: "inventory",
  menu_item_id: "menu_items",
};

type Fila = {
  id: number;
  ocurrio_en: string;
  actor_email: string;
  tabla: string;
  operacion: Movimiento["operacion"];
  etiqueta: string | null;
  cambios: Record<string, { antes: unknown; despues: unknown }> | null;
};

export async function listarActividad(limite = 200): Promise<Movimiento[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("actividad")
    .select("id, ocurrio_en, actor_email, tabla, operacion, etiqueta, cambios")
    .order("ocurrio_en", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("No se pudo leer la actividad:", error.message);
    return [];
  }

  const filas = data as Fila[];
  const nombres = await nombresDeLosIds(supabase, filas);

  /**
   * El id se resuelve al leer, no al escribir: la fila de `actividad` queda
   * cruda y sin tocar —es lo que la hace un registro— y el nombre lo pone la
   * pantalla. Si el ingrediente ya no existe queda un pedazo del id, que es
   * poco, pero es más que nada.
   */
  const legible = (campo: string, v: unknown): string | null => {
    const tabla = CAMPO_ES_ID[campo];
    if (tabla && typeof v === "string") {
      return nombres[tabla].get(v) ?? `${v.slice(0, 8)}…`;
    }
    // En una receta, proteína vacía no es "sin dato": es "aplica siempre".
    if (campo === "proteina" && (v === null || v === undefined)) return "siempre";
    return valor(v);
  };

  return filas.map((f) => ({
    id: f.id,
    cuandoISO: f.ocurrio_en,
    quien: f.actor_email,
    tabla: f.tabla,
    etiqueta: f.etiqueta ?? etiquetaDeReceta(f, nombres.menu_items),
    operacion: f.operacion,
    cambios: Object.entries(f.cambios ?? {})
      // El producto pasa a ser el título de la fila: repetirlo abajo es ruido.
      .filter(([campo]) => !(f.tabla === "recetas" && campo === "menu_item_id"))
      .map(([campo, v]) => ({
        campo: CAMPO_ETIQUETA[campo] ?? campo,
        antes: legible(campo, v?.antes),
        despues: legible(campo, v?.despues),
      }))
      // Alfabético y no el orden del jsonb: así el mismo cambio se lee igual
      // dos veces seguidas.
      .sort((a, b) => a.campo.localeCompare(b.campo)),
  }));
}

/**
 * `recetas` no tiene columna `nombre`, así que el trigger deja la etiqueta en
 * null y la fila salía titulada "—". El nombre que le sirve al dueño es el del
 * producto: "Cheese Burger", no el id de la línea de receta.
 */
function etiquetaDeReceta(f: Fila, menu: Map<string, string>): string | null {
  if (f.tabla !== "recetas") return null;
  const c = f.cambios?.menu_item_id;
  const id = c?.despues ?? c?.antes;
  return typeof id === "string" ? (menu.get(id) ?? null) : null;
}

/**
 * Los nombres de todo lo que las filas nombran por id, en dos consultas y no
 * una por fila. Va después de leer `actividad` a propósito: solo se piden los
 * ids que de verdad aparecieron, que en la mayoría de las cargas son ninguno.
 */
async function nombresDeLosIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filas: Fila[],
): Promise<Record<"inventory" | "menu_items", Map<string, string>>> {
  const ids: Record<string, Set<string>> = {
    inventory: new Set(),
    menu_items: new Set(),
  };

  for (const f of filas) {
    for (const [campo, v] of Object.entries(f.cambios ?? {})) {
      const tabla = CAMPO_ES_ID[campo];
      if (!tabla) continue;
      for (const x of [v?.antes, v?.despues]) {
        if (typeof x === "string") ids[tabla].add(x);
      }
    }
  }

  const buscar = async (tabla: "inventory" | "menu_items") => {
    const lista = [...ids[tabla]];
    if (lista.length === 0) return new Map<string, string>();
    const { data } = await supabase
      .from(tabla)
      .select("id, nombre")
      .in("id", lista);
    return new Map(
      ((data ?? []) as { id: string; nombre: string }[]).map((r) => [
        r.id,
        r.nombre,
      ]),
    );
  };

  const [inventory, menu_items] = await Promise.all([
    buscar("inventory"),
    buscar("menu_items"),
  ]);
  return { inventory, menu_items };
}
