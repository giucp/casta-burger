import type { MenuItem, Presentacion, Proteina } from "./menu";

/** Un extra ya elegido: viaja con su nombre y precio. */
export type ExtraElegido = {
  /** id de la fila en `menu_items` */
  id: string;
  nombre: string;
  precio: number;
};

/**
 * Opciones elegidas para una línea del pedido.
 *
 * Calca el `opciones jsonb` del §4 del brief: es lo que se va a guardar en
 * `order_items.opciones`.
 *
 * Los extras guardan nombre y precio, no solo el id. Así el carrito no
 * necesita consultar el menú para mostrar ni para sumar — y de paso la línea
 * queda con el precio que se le cobró al cliente, aunque el menú cambie
 * después, que es la misma razón por la que `order_items` guarda copia del
 * nombre y el precio.
 */
export type OpcionesLinea = {
  proteina?: Proteina;
  presentacion?: Presentacion;
  /** Adicional de 150 g de papás */
  papas?: boolean;
  extras: ExtraElegido[];
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

/** Precio de una unidad: base según presentación, más papás, más extras. */
export function precioUnitario(
  item: MenuItem,
  opciones: OpcionesLinea,
): number {
  const base =
    opciones.presentacion === "whiteMeal" && item.precioWhiteMeal !== undefined
      ? item.precioWhiteMeal
      : (item.precio ?? 0);

  const papas = opciones.papas ? PAPAS_PRECIO : 0;
  const extras = opciones.extras.reduce((suma, e) => suma + e.precio, 0);

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
    opciones.extras
      .map((e) => e.id)
      .sort()
      .join("+") || "-",
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
  for (const extra of opciones.extras) partes.push(extra.nombre);

  return partes;
}
