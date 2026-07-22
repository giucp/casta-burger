/**
 * Tipos y presentación de los pedidos en la pantalla de cocina.
 * Los datos salen de `orders` y `order_items` — ver `pedidos-db.ts`.
 */

export const ESTADOS = [
  "nuevo",
  "preparando",
  "listo",
  "entregado",
  "cancelado",
] as const;

export type EstadoPedido = (typeof ESTADOS)[number];

/** Los que siguen en juego durante el servicio. */
export const ESTADOS_ACTIVOS: EstadoPedido[] = ["nuevo", "preparando", "listo"];

/** Cómo se ve cada estado. Color fuerte = requiere acción (§6: legible de lejos). */
export const ESTADO_INFO: Record<
  EstadoPedido,
  { etiqueta: string; borde: string; fondo: string }
> = {
  nuevo: { etiqueta: "Nuevo", borde: "border-casta", fondo: "bg-casta" },
  preparando: {
    etiqueta: "Preparando",
    borde: "border-amber-500",
    fondo: "bg-amber-500",
  },
  listo: {
    etiqueta: "Listo",
    borde: "border-emerald-500",
    fondo: "bg-emerald-500",
  },
  entregado: {
    etiqueta: "Entregado",
    borde: "border-white/15",
    fondo: "bg-smoke",
  },
  cancelado: {
    etiqueta: "Cancelado",
    borde: "border-white/15",
    fondo: "bg-smoke",
  },
};

/** El siguiente estado al avanzar. `null` = no avanza más. */
export function siguienteEstado(estado: EstadoPedido): EstadoPedido | null {
  switch (estado) {
    case "nuevo":
      return "preparando";
    case "preparando":
      return "listo";
    case "listo":
      return "entregado";
    default:
      return null;
  }
}

/** Etiqueta del botón que avanza el pedido. */
export function accionDe(estado: EstadoPedido): string | null {
  switch (estado) {
    case "nuevo":
      return "Empezar";
    case "preparando":
      return "Listo";
    case "listo":
      return "Entregado";
    default:
      return null;
  }
}

/** Una línea del pedido, como la ve la cocina. */
export type LineaPedido = {
  id: string;
  nombre: string;
  cantidad: number;
  /** Proteína y extras, ya en texto legible */
  opciones: string[];
  nota?: string;
  subtotal: number;
};

/** Un pedido con su detalle. */
export type Pedido = {
  id: string;
  numero: number;
  clienteNombre: string;
  clienteTel: string;
  tipo: "retiro" | "delivery";
  direccion?: string;
  total: number;
  estado: EstadoPedido;
  nota?: string;
  creadoISO: string;
  lineas: LineaPedido[];
};
