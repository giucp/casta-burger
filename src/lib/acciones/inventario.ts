"use server";

import { createClient } from "@/lib/supabase/server";
import { esUnidad, normalizar, type Unidad } from "@/lib/unidades";

/**
 * CRUD del inventario, contra la tabla `inventory` de Supabase.
 *
 * Usan el cliente con la sesión del dueño, no la llave secreta: el RLS de
 * `inventory` solo deja escribir a un usuario autenticado, así que si la
 * sesión venció la base rechaza el cambio en vez de dejarlo pasar.
 */

export type ItemInventario = {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: Unidad;
  umbralAlerta: number;
};

type FilaInventario = {
  id: string;
  nombre: string;
  cantidad: string | number;
  unidad: string;
  umbral_alerta: string | number;
};

const num = (v: string | number) => (typeof v === "number" ? v : Number(v));

function aItem(f: FilaInventario): ItemInventario {
  return {
    id: f.id,
    nombre: f.nombre,
    cantidad: num(f.cantidad),
    // Se normaliza al leer, no solo en la migración: un item que quedó con
    // "gr" tiene que poder mostrarse y editarse sin romper la pantalla.
    unidad: normalizar(f.unidad),
    umbralAlerta: num(f.umbral_alerta),
  };
}

/** Está en alerta cuando la cantidad tocó o bajó del umbral (§6). */
export async function enAlerta(item: ItemInventario): Promise<boolean> {
  return item.cantidad <= item.umbralAlerta;
}

export async function listarInventario(): Promise<ItemInventario[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory")
    .select("id, nombre, cantidad, unidad, umbral_alerta")
    .order("nombre");

  if (error) {
    console.error("No se pudo leer el inventario:", error.message);
    return [];
  }
  return (data as FilaInventario[]).map(aItem);
}

export type Resultado<T = undefined> =
  | { ok: true; dato?: T }
  | { ok: false; error: string };

export async function crearItemInventario(datos: {
  nombre: string;
  cantidad: number;
  unidad: Unidad;
  umbralAlerta: number;
}): Promise<Resultado<ItemInventario>> {
  const nombre = datos.nombre.trim();
  if (!nombre) return { ok: false, error: "Falta el nombre." };
  if (!Number.isFinite(datos.cantidad) || datos.cantidad < 0)
    return { ok: false, error: "La cantidad no es válida." };
  if (!Number.isFinite(datos.umbralAlerta) || datos.umbralAlerta < 0)
    return { ok: false, error: "El umbral no es válido." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory")
    .insert({
      nombre: nombre.slice(0, 80),
      cantidad: datos.cantidad,
      unidad: normalizar(datos.unidad),
      umbral_alerta: datos.umbralAlerta,
    })
    .select("id, nombre, cantidad, unidad, umbral_alerta")
    .single();

  if (error || !data) {
    console.error("No se pudo crear el item:", error?.message);
    return { ok: false, error: "No se pudo agregar el item." };
  }
  return { ok: true, dato: aItem(data as FilaInventario) };
}

/**
 * Actualiza los campos que vengan. La cantidad y el umbral no bajan de 0.
 *
 * La unidad NO se toca por acá: va por `cambiarUnidadItem`, porque cambiarla
 * tiene que convertir los números y no solo reetiquetarlos.
 */
export async function actualizarItemInventario(
  id: string,
  patch: Partial<{
    nombre: string;
    cantidad: number;
    umbralAlerta: number;
  }>,
): Promise<Resultado> {
  const fila: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (patch.nombre !== undefined) {
    const n = patch.nombre.trim();
    if (!n) return { ok: false, error: "El nombre no puede quedar vacío." };
    fila.nombre = n.slice(0, 80);
  }
  if (patch.cantidad !== undefined) {
    if (!Number.isFinite(patch.cantidad) || patch.cantidad < 0)
      return { ok: false, error: "La cantidad no es válida." };
    fila.cantidad = patch.cantidad;
  }
  if (patch.umbralAlerta !== undefined) {
    if (!Number.isFinite(patch.umbralAlerta) || patch.umbralAlerta < 0)
      return { ok: false, error: "El umbral no es válido." };
    fila.umbral_alerta = patch.umbralAlerta;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("inventory").update(fila).eq("id", id);

  if (error) {
    console.error("No se pudo actualizar el item:", error.message);
    return { ok: false, error: "No se pudo guardar el cambio." };
  }
  return { ok: true };
}

/**
 * Cambiar la unidad no es cambiarle el nombre al número.
 *
 * Va por una función de la base y no por un update común porque tiene que
 * mover tres cosas a la vez —la cantidad, el umbral y todas las recetas que
 * usan el ingrediente— y si se hiciera desde acá en tres pasos, una falla en
 * el medio dejaría el inventario en kilos con las recetas en gramos. Eso no
 * se ve: se descubre contando.
 */
export async function cambiarUnidadItem(
  id: string,
  unidad: Unidad,
): Promise<Resultado> {
  if (!esUnidad(unidad)) return { ok: false, error: "Unidad no válida." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cambiar_unidad_inventario", {
    p_item: id,
    p_nueva: unidad,
  });

  if (error) {
    console.error("No se pudo cambiar la unidad:", error.message);
    return { ok: false, error: "No se pudo cambiar la unidad." };
  }
  return { ok: true };
}

export async function borrarItemInventario(id: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from("inventory").delete().eq("id", id);

  if (error) {
    console.error("No se pudo borrar el item:", error.message);
    return { ok: false, error: "No se pudo borrar el item." };
  }
  return { ok: true };
}
