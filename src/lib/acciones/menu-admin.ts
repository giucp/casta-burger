"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Categoria, MenuItem } from "@/lib/menu";

/**
 * CRUD del menú, con la sesión del dueño (el RLS deja al autenticado ver y
 * editar todo, incluso lo agotado y lo sin precio).
 *
 * Cada cambio que el cliente puede ver revalida la home, así que apagar un
 * producto agotado se refleja al toque y no cuando venza el revalidate.
 */

type FilaMenu = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  precio: string | number | null;
  precio_suelto: string | number | null;
  categoria: string;
  disponible: boolean;
  orden: number;
  tags: string[] | null;
};

const num = (v: string | number | null): number | null => {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function aItem(f: FilaMenu): MenuItem {
  return {
    id: f.id,
    slug: f.slug,
    nombre: f.nombre,
    descripcion: f.descripcion ?? undefined,
    precio: num(f.precio),
    precioSuelto: num(f.precio_suelto) ?? undefined,
    categoria: f.categoria as Categoria,
    disponible: f.disponible,
    orden: f.orden,
    tags: f.tags ?? [],
  };
}

const COLS =
  "id, slug, nombre, descripcion, precio, precio_suelto, categoria, disponible, orden, tags";

export type Resultado<T = undefined> =
  | { ok: true; dato?: T }
  | { ok: false; error: string };

/** Todo el menú, incluido lo agotado. */
export async function listarMenuAdmin(): Promise<MenuItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select(COLS)
    .order("categoria")
    .order("orden");

  if (error) {
    console.error("No se pudo leer el menú:", error.message);
    return [];
  }
  return (data as FilaMenu[]).map(aItem);
}

/** El toggle agotado / disponible: lo que más se usa. */
export async function toggleDisponible(
  id: string,
  disponible: boolean,
): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ disponible })
    .eq("id", id);

  if (error) {
    console.error("No se pudo cambiar la disponibilidad:", error.message);
    return { ok: false, error: "No se pudo actualizar." };
  }
  revalidatePath("/");
  return { ok: true };
}

export async function actualizarMenuItem(
  id: string,
  patch: Partial<{ nombre: string; descripcion: string; precio: number | null }>,
): Promise<Resultado> {
  const fila: Record<string, unknown> = {};

  if (patch.nombre !== undefined) {
    const n = patch.nombre.trim();
    if (!n) return { ok: false, error: "El nombre no puede quedar vacío." };
    fila.nombre = n.slice(0, 80);
  }
  if (patch.descripcion !== undefined) {
    fila.descripcion = patch.descripcion.trim().slice(0, 300) || null;
  }
  if (patch.precio !== undefined) {
    if (patch.precio !== null && (!Number.isFinite(patch.precio) || patch.precio < 0))
      return { ok: false, error: "El precio no es válido." };
    fila.precio = patch.precio;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update(fila).eq("id", id);

  if (error) {
    console.error("No se pudo actualizar el producto:", error.message);
    return { ok: false, error: "No se pudo guardar el cambio." };
  }
  revalidatePath("/");
  return { ok: true };
}

export async function crearMenuItem(datos: {
  nombre: string;
  precio: number | null;
  categoria: Categoria;
  descripcion?: string;
}): Promise<Resultado<MenuItem>> {
  const nombre = datos.nombre.trim();
  if (!nombre) return { ok: false, error: "Falta el nombre." };
  if (datos.precio !== null && (!Number.isFinite(datos.precio) || datos.precio < 0))
    return { ok: false, error: "El precio no es válido." };

  const supabase = await createClient();

  // slug único a partir del nombre
  const base = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  const slug = `${base}-${Date.now().toString(36)}`;

  // que aparezca al final de su categoría
  const { data: ultimos } = await supabase
    .from("menu_items")
    .select("orden")
    .eq("categoria", datos.categoria)
    .order("orden", { ascending: false })
    .limit(1);
  const orden = (ultimos?.[0]?.orden ?? 0) + 1;

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      slug,
      nombre: nombre.slice(0, 80),
      descripcion: datos.descripcion?.trim().slice(0, 300) || null,
      precio: datos.precio,
      categoria: datos.categoria,
      orden,
    })
    .select(COLS)
    .single();

  if (error || !data) {
    console.error("No se pudo crear el producto:", error?.message);
    return { ok: false, error: "No se pudo agregar el producto." };
  }
  revalidatePath("/");
  return { ok: true, dato: aItem(data as FilaMenu) };
}

export async function borrarMenuItem(id: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) {
    console.error("No se pudo borrar el producto:", error.message);
    return {
      ok: false,
      error:
        "No se pudo borrar. Si ya tiene ventas, marcalo como agotado en vez de borrarlo.",
    };
  }
  revalidatePath("/");
  return { ok: true };
}
