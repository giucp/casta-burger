/**
 * Tipos y utilidades compartidas del back-office.
 * Los datos viven en Supabase; ver src/lib/acciones/.
 */

import type { Unidad } from "@/lib/unidades";

/** Tabla `purchases` */
export type Compra = {
  id: string;
  descripcion: string;
  monto: number;
  categoria: string;
  /** ISO yyyy-mm-dd */
  fecha: string;
  /**
   * El ingrediente que se compró, cuando el gasto es de uno. En null van los
   * gastos que no son ingrediente de nada —el gas, las bolsas, el delivery—,
   * que cuentan en la caja pero no en el costo de un producto.
   */
  inventarioId: string | null;
  /** Cuánto se compró, en `unidad`. Solo cuando hay ingrediente. */
  cantidad: number | null;
  unidad: Unidad | null;
};

/** El costo por unidad de inventario de un ingrediente, según su última compra. */
export type CostoIngrediente = {
  inventarioId: string;
  unidad: Unidad;
  costoUnitario: number;
  /** Fecha de la compra de la que salió este costo. */
  desde: string;
};

/** Una fila del resumen financiero por día */
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
