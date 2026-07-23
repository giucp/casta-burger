"use server";

import { createClient } from "@/lib/supabase/server";
import type { Compra } from "@/lib/admin/datos";

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
};

const num = (v: string | number) => (typeof v === "number" ? v : Number(v));

function aCompra(f: FilaCompra): Compra {
  return {
    id: f.id,
    descripcion: f.descripcion,
    monto: num(f.monto),
    categoria: f.categoria,
    fecha: f.fecha,
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
    .select("id, descripcion, monto, categoria, fecha")
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
}): Promise<Resultado<Compra>> {
  const descripcion = datos.descripcion.trim();
  if (!descripcion) return { ok: false, error: "Falta la descripción." };
  if (!Number.isFinite(datos.monto) || datos.monto <= 0)
    return { ok: false, error: "El monto no es válido." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha))
    return { ok: false, error: "La fecha no es válida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchases")
    .insert({
      descripcion: descripcion.slice(0, 160),
      monto: Math.round(datos.monto * 100) / 100,
      categoria: datos.categoria.trim().slice(0, 40) || "Insumos",
      fecha: datos.fecha,
    })
    .select("id, descripcion, monto, categoria, fecha")
    .single();

  if (error || !data) {
    console.error("No se pudo crear la compra:", error?.message);
    return { ok: false, error: "No se pudo registrar la compra." };
  }
  return { ok: true, dato: aCompra(data as FilaCompra) };
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
