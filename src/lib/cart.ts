import {
  porCategoria,
  type MenuItem,
  type Presentacion,
  type Proteina,
} from "./menu";

/**
 * Opciones elegidas para una línea del pedido.
 *
 * Calca el `opciones jsonb` del §4 del brief: es lo que se va a guardar tal
 * cual en `order_items.opciones` cuando entre Supabase.
 */
export type OpcionesLinea = {
  proteina?: Proteina;
  presentacion?: Presentacion;
  /** Adicional de 150 g de papás */
  papas?: boolean;
  /** ids de items de la categoría Extras */
  extras: string[];
};

export type LineaCarrito = {
  /** Identidad de la línea: mismo producto con distintas opciones = líneas distintas */
  key: string;
  menuItemId: string;
  nombre: string;
  /** Precio de UNA unidad ya con presentación, papás y extras incluidos */
  precioUnitario: number;
  cantidad: number;
  opciones: OpcionesLinea;
  nota?: string;
};

export const PAPAS_PRECIO = 2.5;

/** Los extras que se pueden sumar a una línea, con su precio. */
export function extrasDisponibles(): MenuItem[] {
  return porCategoria("Extras");
}

/**
 * Precio de una unidad: base según presentación, más papás, más extras.
 * Todo en USD.
 */
export function precioUnitario(
  item: MenuItem,
  opciones: OpcionesLinea,
): number {
  const base =
    opciones.presentacion === "whiteMeal" && item.precioWhiteMeal !== undefined
      ? item.precioWhiteMeal
      : (item.precio ?? 0);

  const papas = opciones.papas ? PAPAS_PRECIO : 0;

  const extras = extrasDisponibles()
    .filter((e) => opciones.extras.includes(e.id))
    .reduce((suma, e) => suma + (e.precio ?? 0), 0);

  return base + papas + extras;
}

/**
 * Clave de la línea. Dos "Casta Burger" con la misma proteína, presentación,
 * papás, extras y nota se apilan en una sola línea con cantidad 2; si cambia
 * cualquier opción, van separadas.
 */
export function claveLinea(
  menuItemId: string,
  opciones: OpcionesLinea,
  nota?: string,
): string {
  return [
    menuItemId,
    opciones.proteina ?? "-",
    opciones.presentacion ?? "-",
    opciones.papas ? "papas" : "-",
    [...opciones.extras].sort().join("+") || "-",
    nota?.trim() || "-",
  ].join("|");
}

export function subtotalLinea(linea: LineaCarrito): number {
  return linea.precioUnitario * linea.cantidad;
}

export function subtotalCarrito(lineas: LineaCarrito[]): number {
  return lineas.reduce((suma, l) => suma + subtotalLinea(l), 0);
}

export function cantidadTotal(lineas: LineaCarrito[]): number {
  return lineas.reduce((suma, l) => suma + l.cantidad, 0);
}

/** Texto legible de las opciones, para la tarjeta del carrito y el WhatsApp. */
export function describirOpciones(opciones: OpcionesLinea): string[] {
  const partes: string[] = [];

  if (opciones.proteina) partes.push(opciones.proteina);
  if (opciones.presentacion === "whiteMeal") partes.push("White Meal");
  if (opciones.papas) partes.push("con papás");

  const extras = extrasDisponibles().filter((e) =>
    opciones.extras.includes(e.id),
  );
  for (const extra of extras) partes.push(extra.nombre);

  return partes;
}
