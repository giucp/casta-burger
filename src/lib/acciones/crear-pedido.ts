"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { PAPAS_PRECIO } from "@/lib/cart";
import type { Presentacion, Proteina } from "@/lib/menu";

/**
 * Lo que manda el navegador: QUÉ eligió el cliente, nunca CUÁNTO cuesta.
 *
 * Los precios se buscan en la base del lado del servidor. Si el navegador
 * pudiera mandar el total, cualquiera podría pedir tres hamburguesas por un
 * dólar cambiando un valor con las herramientas de desarrollo.
 */
export type LineaEntrada = {
  menuItemId: string;
  cantidad: number;
  opciones: {
    proteina?: Proteina;
    presentacion?: Presentacion;
    papas?: boolean;
    /** ids de `menu_items` de la categoría Extras */
    extras: string[];
  };
  nota?: string;
};

export type DatosEntrada = {
  nombre: string;
  telefono: string;
  tipo: "retiro" | "delivery";
  direccion?: string;
  nota?: string;
};

export type ResultadoPedido =
  | {
      ok: true;
      numero: number;
      total: number;
      lineas: { nombre: string; cantidad: number; subtotal: number }[];
    }
  | { ok: false; error: string };

const MAX_UNIDADES_POR_LINEA = 20;
const MAX_LINEAS = 30;

export async function crearPedido(
  datos: DatosEntrada,
  lineas: LineaEntrada[],
): Promise<ResultadoPedido> {
  // ---- validación de forma ----
  if (lineas.length === 0) return { ok: false, error: "El pedido está vacío." };
  if (lineas.length > MAX_LINEAS)
    return { ok: false, error: "Demasiados productos en un solo pedido." };
  if (!datos.nombre.trim() || !datos.telefono.trim())
    return { ok: false, error: "Faltan tu nombre o tu teléfono." };
  if (datos.tipo === "delivery" && !datos.direccion?.trim())
    return { ok: false, error: "Para delivery hace falta la dirección." };
  if (
    lineas.some(
      (l) =>
        !Number.isInteger(l.cantidad) ||
        l.cantidad < 1 ||
        l.cantidad > MAX_UNIDADES_POR_LINEA,
    )
  )
    return { ok: false, error: "Alguna cantidad no es válida." };

  const supabase = createAdminClient();

  // ---- precios reales, de la base ----
  const ids = [
    ...new Set(lineas.flatMap((l) => [l.menuItemId, ...l.opciones.extras])),
  ];

  const { data: productos, error: errorMenu } = await supabase
    .from("menu_items")
    .select("id, nombre, precio, precio_white_meal, disponible")
    .in("id", ids);

  if (errorMenu || !productos)
    return { ok: false, error: "No pudimos leer el menú. Probá de nuevo." };

  const porId = new Map(productos.map((p) => [p.id, p]));
  const num = (v: unknown) => (v === null ? null : Number(v));

  const items: {
    menu_item_id: string;
    nombre: string;
    precio: number;
    cantidad: number;
    subtotal: number;
    opciones: LineaEntrada["opciones"];
    nota: string | null;
  }[] = [];

  for (const linea of lineas) {
    const producto = porId.get(linea.menuItemId);
    if (!producto) return { ok: false, error: "Un producto ya no existe." };
    if (!producto.disponible)
      return { ok: false, error: `${producto.nombre} se agotó.` };

    const base = num(producto.precio);
    const whiteMeal = num(producto.precio_white_meal);
    if (base === null)
      return { ok: false, error: `${producto.nombre} no tiene precio.` };

    let unitario =
      linea.opciones.presentacion === "whiteMeal" && whiteMeal !== null
        ? whiteMeal
        : base;

    if (linea.opciones.papas) unitario += PAPAS_PRECIO;

    for (const extraId of linea.opciones.extras) {
      const extra = porId.get(extraId);
      if (!extra) return { ok: false, error: "Un extra ya no existe." };
      const precioExtra = num(extra.precio);
      if (precioExtra !== null) unitario += precioExtra;
    }

    unitario = Math.round(unitario * 100) / 100;

    items.push({
      menu_item_id: producto.id,
      nombre: producto.nombre,
      precio: unitario,
      cantidad: linea.cantidad,
      subtotal: Math.round(unitario * linea.cantidad * 100) / 100,
      opciones: linea.opciones,
      nota: linea.nota?.trim() || null,
    });
  }

  const subtotal =
    Math.round(items.reduce((s, i) => s + i.subtotal, 0) * 100) / 100;

  // ---- guardar ----
  const { data: pedido, error: errorPedido } = await supabase
    .from("orders")
    .insert({
      cliente_nombre: datos.nombre.trim().slice(0, 80),
      cliente_tel: datos.telefono.trim().slice(0, 40),
      tipo: datos.tipo,
      direccion: datos.direccion?.trim().slice(0, 300) || null,
      subtotal,
      total: subtotal, // el envío se acuerda aparte por WhatsApp
      nota: datos.nota?.trim().slice(0, 300) || null,
    })
    .select("id, numero")
    .single();

  if (errorPedido || !pedido)
    return { ok: false, error: "No pudimos guardar el pedido." };

  const { error: errorItems } = await supabase.from("order_items").insert(
    items.map((i) => ({
      order_id: pedido.id,
      menu_item_id: i.menu_item_id,
      nombre: i.nombre,
      precio: i.precio,
      cantidad: i.cantidad,
      subtotal: i.subtotal,
      opciones: i.opciones,
      nota: i.nota,
    })),
  );

  if (errorItems) {
    // Un pedido sin líneas es peor que ninguno: en cocina aparecería vacío.
    await supabase.from("orders").delete().eq("id", pedido.id);
    return { ok: false, error: "No pudimos guardar el detalle del pedido." };
  }

  return {
    ok: true,
    numero: pedido.numero,
    total: subtotal,
    lineas: items.map((i) => ({
      nombre: i.nombre,
      cantidad: i.cantidad,
      subtotal: i.subtotal,
    })),
  };
}
