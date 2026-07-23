"use server";

import { waitUntil } from "@vercel/functions";
import { createAdminClient } from "@/lib/supabase/admin";
import { avisarPedidoTelegram } from "@/lib/telegram";
import type { Proteina } from "@/lib/menu";

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
  /**
   * Ubicación GPS compartida por el cliente. Van las coordenadas crudas y el
   * enlace de Maps lo arma el servidor: si el navegador mandara la URL ya
   * hecha, cualquiera podría inyectar un enlace a otro sitio en el pedido.
   */
  ubicacion?: { lat: number; lng: number };
  nota?: string;
};

export type ResultadoPedido =
  | {
      ok: true;
      /** id del pedido, para ligarle la suscripción push del cliente */
      id: string;
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
  const ubicacionValida =
    datos.ubicacion !== undefined &&
    Number.isFinite(datos.ubicacion.lat) &&
    Number.isFinite(datos.ubicacion.lng) &&
    Math.abs(datos.ubicacion.lat) <= 90 &&
    Math.abs(datos.ubicacion.lng) <= 180;
  if (datos.ubicacion !== undefined && !ubicacionValida)
    return { ok: false, error: "La ubicación no es válida." };
  if (datos.tipo === "delivery" && !datos.direccion?.trim() && !ubicacionValida)
    return {
      ok: false,
      error: "Para delivery hace falta la dirección o tu ubicación.",
    };
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
    .select("id, nombre, precio, disponible")
    .in("id", ids);

  if (errorMenu || !productos)
    return { ok: false, error: "No pudimos leer el menú. Probá de nuevo." };

  const porId = new Map(productos.map((p) => [p.id, p]));
  const num = (v: unknown) => (v === null ? null : Number(v));

  /**
   * Los extras se guardan con su nombre y precio, no con el id: la pantalla
   * de cocina tiene que leer "Tocineta adicional", no un UUID. Y como es una
   * copia, el pedido viejo sigue siendo legible aunque el extra se renombre o
   * se borre del menú — la misma razón por la que se copian nombre y precio.
   */
  type OpcionesGuardadas = {
    proteina?: Proteina;
    extras: { id: string; nombre: string; precio: number }[];
  };

  const items: {
    menu_item_id: string;
    nombre: string;
    precio: number;
    cantidad: number;
    subtotal: number;
    opciones: OpcionesGuardadas;
    nota: string | null;
  }[] = [];

  for (const linea of lineas) {
    const producto = porId.get(linea.menuItemId);
    if (!producto) return { ok: false, error: "Un producto ya no existe." };
    if (!producto.disponible)
      return { ok: false, error: `${producto.nombre} se agotó.` };

    const base = num(producto.precio);
    if (base === null)
      return { ok: false, error: `${producto.nombre} no tiene precio.` };

    let unitario = base;
    const extrasResueltos: OpcionesGuardadas["extras"] = [];

    for (const extraId of linea.opciones.extras) {
      const extra = porId.get(extraId);
      if (!extra) return { ok: false, error: "Un extra ya no existe." };
      const precioExtra = num(extra.precio) ?? 0;
      unitario += precioExtra;
      extrasResueltos.push({
        id: extra.id,
        nombre: extra.nombre,
        precio: precioExtra,
      });
    }

    unitario = Math.round(unitario * 100) / 100;

    items.push({
      menu_item_id: producto.id,
      nombre: producto.nombre,
      precio: unitario,
      cantidad: linea.cantidad,
      subtotal: Math.round(unitario * linea.cantidad * 100) / 100,
      opciones: { proteina: linea.opciones.proteina, extras: extrasResueltos },
      nota: linea.nota?.trim() || null,
    });
  }

  const subtotal =
    Math.round(items.reduce((s, i) => s + i.subtotal, 0) * 100) / 100;

  // ---- dirección final: texto escrito, más el enlace de la ubicación ----
  const partesDireccion: string[] = [];
  if (datos.direccion?.trim())
    partesDireccion.push(datos.direccion.trim().slice(0, 300));
  if (ubicacionValida && datos.ubicacion)
    partesDireccion.push(
      `https://maps.google.com/?q=${datos.ubicacion.lat.toFixed(6)},${datos.ubicacion.lng.toFixed(6)}`,
    );
  const direccionFinal =
    datos.tipo === "delivery" && partesDireccion.length > 0
      ? partesDireccion.join(" · ").slice(0, 400)
      : null;

  // ---- guardar ----
  const { data: pedido, error: errorPedido } = await supabase
    .from("orders")
    .insert({
      cliente_nombre: datos.nombre.trim().slice(0, 80),
      cliente_tel: datos.telefono.trim().slice(0, 40),
      tipo: datos.tipo,
      direccion: direccionFinal,
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

  // Aviso a la cocina por Telegram, en segundo plano: el cliente no espera a
  // que Telegram responda, y si falla el pedido igual quedó guardado.
  waitUntil(
    avisarPedidoTelegram({
      numero: pedido.numero,
      tipo: datos.tipo,
      total: `$${subtotal.toFixed(2)}`,
      cliente: datos.nombre.trim(),
      telefono: datos.telefono.trim(),
      direccion: direccionFinal,
      lineas: items.map((i) => ({
        cantidad: i.cantidad,
        nombre: i.nombre,
        opciones: [
          i.opciones.proteina,
          ...i.opciones.extras.map((e) => e.nombre),
        ].filter((x): x is string => Boolean(x)),
      })),
    }),
  );

  return {
    ok: true,
    id: pedido.id,
    numero: pedido.numero,
    total: subtotal,
    lineas: items.map((i) => ({
      nombre: i.nombre,
      cantidad: i.cantidad,
      subtotal: i.subtotal,
    })),
  };
}
