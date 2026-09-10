"use server";

import { createClient } from "@/lib/supabase/server";
import type { Compra, CostoIngrediente } from "@/lib/admin/datos";
import { esUnidad, type Unidad } from "@/lib/unidades";

/**
 * Compras de insumos, contra la tabla `purchases`.
 *
 * Con la sesión del dueño, no la llave secreta: el RLS solo deja escribir a
 * un autenticado, así que una sesión vencida se rechaza en vez de pasar.
 */

type FilaCompra = {
  id: string;
  descripcion: string;
  monto: string | number;
  categoria: string;
  fecha: string;
  inventory_id: string | null;
  cantidad: string | number | null;
  unidad: string | null;
};

const COLUMNAS =
  "id, descripcion, monto, categoria, fecha, inventory_id, cantidad, unidad";

const num = (v: string | number) => (typeof v === "number" ? v : Number(v));

function aCompra(f: FilaCompra): Compra {
  return {
    id: f.id,
    descripcion: f.descripcion,
    monto: num(f.monto),
    categoria: f.categoria,
    fecha: f.fecha,
    inventarioId: f.inventory_id,
    cantidad: f.cantidad === null ? null : num(f.cantidad),
    unidad: f.unidad && esUnidad(f.unidad) ? f.unidad : null,
  };
}

export type Resultado<T = undefined> =
  | { ok: true; dato?: T }
  | { ok: false; error: string };

export async function listarCompras(dias = 30): Promise<Compra[]> {
  const supabase = await createClient();
  const desde = new Date(Date.now() - dias * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from("purchases")
    .select(COLUMNAS)
    .gte("fecha", desde)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("No se pudieron leer las compras:", error.message);
    return [];
  }
  return (data as FilaCompra[]).map(aCompra);
}

export async function crearCompra(datos: {
  descripcion: string;
  monto: number;
  categoria: string;
  fecha: string;
  /** El ingrediente, si el gasto es de uno. */
  inventarioId?: string | null;
  cantidad?: number | null;
  unidad?: Unidad | null;
}): Promise<Resultado<Compra>> {
  const descripcion = datos.descripcion.trim();
  if (!descripcion) return { ok: false, error: "Falta la descripción." };
  if (!Number.isFinite(datos.monto) || datos.monto <= 0)
    return { ok: false, error: "El monto no es válido." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha))
    return { ok: false, error: "La fecha no es válida." };

  // Con ingrediente, sin cantidad no hay costo por unidad — que es todo el
  // punto de anotarlo. Se rechaza acá y también con un check en la base.
  const inventarioId = datos.inventarioId || null;
  if (inventarioId) {
    if (!Number.isFinite(datos.cantidad ?? NaN) || (datos.cantidad ?? 0) <= 0)
      return { ok: false, error: "Poné cuánto compraste." };
    if (!datos.unidad || !esUnidad(datos.unidad))
      return { ok: false, error: "Falta la unidad." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .insert({
      descripcion: descripcion.slice(0, 160),
      monto: Math.round(datos.monto * 100) / 100,
      categoria: datos.categoria.trim().slice(0, 40) || "Insumos",
      fecha: datos.fecha,
      inventory_id: inventarioId,
      cantidad: inventarioId ? datos.cantidad : null,
      unidad: inventarioId ? datos.unidad : null,
    })
    .select(COLUMNAS)
    .single();

  if (error || !data) {
    console.error("No se pudo crear la compra:", error?.message);
    return { ok: false, error: "No se pudo registrar la compra." };
  }
  return { ok: true, dato: aCompra(data as FilaCompra) };
}

/**
 * Cuánto cuesta hoy cada ingrediente, por unidad de inventario.
 *
 * Sale de la última compra, no de un promedio: es el precio que va a pagar
 * para reponer, y ese es el que decide si el precio de venta todavía sirve.
 * Un promedio arrastra lo que costaba hace tres meses y hace parecer sano un
 * margen que ya no existe.
 */
export async function listarCostos(): Promise<CostoIngrediente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("costo_ingrediente")
    .select("inventory_id, unidad, costo_unitario, desde");

  if (error) {
    console.error("No se pudieron leer los costos:", error.message);
    return [];
  }

  return (data as {
    inventory_id: string;
    unidad: string;
    costo_unitario: string | number;
    desde: string;
  }[])
    .filter((f) => esUnidad(f.unidad))
    .map((f) => ({
      inventarioId: f.inventory_id,
      unidad: f.unidad as Unidad,
      costoUnitario: num(f.costo_unitario),
      desde: f.desde,
    }));
}

export async function borrarCompra(id: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from("purchases").delete().eq("id", id);

  if (error) {
    console.error("No se pudo borrar la compra:", error.message);
    return { ok: false, error: "No se pudo borrar la compra." };
  }
  return { ok: true };
}
