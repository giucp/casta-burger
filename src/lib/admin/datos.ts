/**
 * Tipos y utilidades compartidas del back-office.
 * Los datos viven en Supabase; ver src/lib/acciones/.
 */

/** Tabla `purchases` */
export type Compra = {
  id: string;
  descripcion: string;
  monto: number;
  categoria: string;
  /** ISO yyyy-mm-dd */
  fecha: string;
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
