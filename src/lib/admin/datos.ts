/**
 * Datos del back-office.
 *
 * PENDIENTE(fase 2): hoy son datos de ejemplo en memoria para poder construir y
 * mostrar las pantallas sin Supabase. Los tipos calcan tablas y vistas de
 * `docs/schema_hamburguesas.sql`, así que enchufar la base es reemplazar el
 * cuerpo de las funciones de abajo por queries — sin tocar las pantallas.
 */

/** Tabla `inventory` */
export type ItemInventario = {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  umbralAlerta: number;
};

/** Tabla `purchases` */
export type Compra = {
  id: string;
  descripcion: string;
  monto: number;
  categoria: string;
  /** ISO yyyy-mm-dd */
  fecha: string;
};

/** Vista `resumen_diario` */
export type ResumenDia = {
  dia: string;
  pedidos: number;
  ventas: number;
  compras: number;
  gananciaNeta: number;
};

export const CATEGORIAS_COMPRA = [
  "Insumos",
  "Carnes",
  "Panadería",
  "Bebidas",
  "Empaques",
  "Gas",
  "Otros",
] as const;

/** Está en alerta cuando la cantidad tocó o bajó del umbral (§6). */
export function enAlerta(item: ItemInventario): boolean {
  return item.cantidad <= item.umbralAlerta;
}

export function inventarioDemo(): ItemInventario[] {
  return [
    { id: "1", nombre: "Carne molida", cantidad: 8, unidad: "kg", umbralAlerta: 5 },
    { id: "2", nombre: "Cordero", cantidad: 3, unidad: "kg", umbralAlerta: 3 },
    { id: "3", nombre: "Pollo", cantidad: 6, unidad: "kg", umbralAlerta: 4 },
    { id: "4", nombre: "Pan de batata", cantidad: 40, unidad: "und", umbralAlerta: 20 },
    { id: "5", nombre: "Queso facilista", cantidad: 2, unidad: "kg", umbralAlerta: 2 },
    { id: "6", nombre: "Tocineta", cantidad: 4, unidad: "kg", umbralAlerta: 2 },
    { id: "7", nombre: "Cebolla", cantidad: 7, unidad: "kg", umbralAlerta: 3 },
    { id: "8", nombre: "Papás", cantidad: 12, unidad: "kg", umbralAlerta: 6 },
    { id: "9", nombre: "Coca-Cola lata", cantidad: 18, unidad: "und", umbralAlerta: 24 },
    { id: "10", nombre: "Salsa de la casa", cantidad: 5, unidad: "L", umbralAlerta: 2 },
  ];
}

export function comprasDemo(): Compra[] {
  return [
    { id: "c1", descripcion: "Carne molida 10 kg", monto: 62, categoria: "Carnes", fecha: "2026-07-19" },
    { id: "c2", descripcion: "Pan de batata x60", monto: 24, categoria: "Panadería", fecha: "2026-07-19" },
    { id: "c3", descripcion: "Cajas de Coca-Cola", monto: 38, categoria: "Bebidas", fecha: "2026-07-18" },
    { id: "c4", descripcion: "Queso facilista 4 kg", monto: 31, categoria: "Insumos", fecha: "2026-07-18" },
    { id: "c5", descripcion: "Bombona de gas", monto: 18, categoria: "Gas", fecha: "2026-07-16" },
    { id: "c6", descripcion: "Empaques y servilletas", monto: 15.5, categoria: "Empaques", fecha: "2026-07-16" },
  ];
}

export function resumenDemo(): ResumenDia[] {
  const filas = [
    { dia: "2026-07-19", pedidos: 34, ventas: 268.5, compras: 86 },
    { dia: "2026-07-18", pedidos: 41, ventas: 331.0, compras: 69 },
    { dia: "2026-07-17", pedidos: 22, ventas: 174.5, compras: 0 },
    { dia: "2026-07-16", pedidos: 28, ventas: 219.0, compras: 33.5 },
    { dia: "2026-07-12", pedidos: 37, ventas: 291.5, compras: 74 },
  ];

  return filas.map((f) => ({ ...f, gananciaNeta: f.ventas - f.compras }));
}

/** Totales de un rango, para las tarjetas de arriba de "Números". */
export function totales(filas: ResumenDia[]) {
  return filas.reduce(
    (acc, f) => ({
      pedidos: acc.pedidos + f.pedidos,
      ventas: acc.ventas + f.ventas,
      compras: acc.compras + f.compras,
      gananciaNeta: acc.gananciaNeta + f.gananciaNeta,
    }),
    { pedidos: 0, ventas: 0, compras: 0, gananciaNeta: 0 },
  );
}

/** "2026-07-19" -> "sáb 19 jul" */
export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("es-VE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
