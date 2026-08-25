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

  return (data as Fila[]).map((f) => ({
    id: f.id,
    cuandoISO: f.ocurrio_en,
    quien: f.actor_email,
    tabla: f.tabla,
    operacion: f.operacion,
    etiqueta: f.etiqueta,
    cambios: Object.entries(f.cambios ?? {})
      .map(([campo, v]) => ({
        campo: CAMPO_ETIQUETA[campo] ?? campo,
        antes: valor(v?.antes),
        despues: valor(v?.despues),
      }))
      // Alfabético y no el orden del jsonb: así el mismo cambio se lee igual
      // dos veces seguidas.
      .sort((a, b) => a.campo.localeCompare(b.campo)),
  }));
}
