import { createClient } from "./supabase/server";
import type { Categoria, MenuItem } from "./menu";

/** Fila cruda de `menu_items`, en snake_case como viene de Postgres. */
type FilaMenu = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  precio: string | number | null;
  precio_white_meal: string | number | null;
  categoria: string;
  foto_url: string | null;
  disponible: boolean;
  orden: number;
  tags: string[] | null;
};

/**
 * Postgres devuelve `numeric` como string para no perder precisión. Si se
 * usara tal cual, sumar precios concatenaría texto en vez de sumar.
 */
function aNumero(v: string | number | null): number | null {
  if (v === null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function aMenuItem(f: FilaMenu): MenuItem {
  const whiteMeal = aNumero(f.precio_white_meal);
  return {
    id: f.id,
    slug: f.slug,
    nombre: f.nombre,
    descripcion: f.descripcion ?? undefined,
    precio: aNumero(f.precio),
    precioWhiteMeal: whiteMeal ?? undefined,
    categoria: f.categoria as Categoria,
    fotoUrl: f.foto_url ?? undefined,
    disponible: f.disponible,
    orden: f.orden,
    tags: f.tags ?? [],
  };
}

/**
 * El menú visible en la web pública.
 *
 * Se lee con la llave pública, así que lo que llega es exactamente lo que el
 * RLS deja ver: solo los productos disponibles.
 */
export async function obtenerMenu(): Promise<MenuItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select(
      "id, slug, nombre, descripcion, precio, precio_white_meal, categoria, foto_url, disponible, orden, tags",
    )
    .order("categoria")
    .order("orden");

  if (error) {
    // Que falle la base no puede tumbar la página entera: se muestra el sitio
    // sin menú y el error queda en los logs del servidor.
    console.error("No se pudo leer el menú:", error.message);
    return [];
  }

  return (data as FilaMenu[]).map(aMenuItem);
}
