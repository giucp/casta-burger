/**
 * Pedidos para la pantalla de cocina.
 *
 * PENDIENTE(fase 1, paso 7): hoy son datos de ejemplo. Los tipos calcan las
 * tablas `orders` y `order_items` de `docs/schema_hamburguesas.sql`, así que
 * conectar Supabase Realtime es reemplazar la fuente sin tocar la pantalla.
 */

export const ESTADOS = [
  "nuevo",
  "preparando",
  "listo",
  "entregado",
  "cancelado",
] as const;

export type EstadoPedido = (typeof ESTADOS)[number];

/** Cómo se ve cada estado. Color fuerte = requiere acción (§6: legible de lejos). */
export const ESTADO_INFO: Record<
  EstadoPedido,
  { etiqueta: string; borde: string; fondo: string; texto: string }
> = {
  nuevo: {
    etiqueta: "Nuevo",
    borde: "border-casta",
    fondo: "bg-casta",
    texto: "text-casta",
  },
  preparando: {
    etiqueta: "Preparando",
    borde: "border-amber-500",
    fondo: "bg-amber-500",
    texto: "text-amber-400",
  },
  listo: {
    etiqueta: "Listo",
    borde: "border-emerald-500",
    fondo: "bg-emerald-500",
    texto: "text-emerald-400",
  },
  entregado: {
    etiqueta: "Entregado",
    borde: "border-white/15",
    fondo: "bg-smoke",
    texto: "text-smoke",
  },
  cancelado: {
    etiqueta: "Cancelado",
    borde: "border-white/15",
    fondo: "bg-smoke",
    texto: "text-smoke",
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

/** Tabla `order_items` */
export type LineaPedido = {
  nombre: string;
  cantidad: number;
  /** Texto ya armado desde `order_items.opciones` */
  opciones: string[];
  nota?: string;
  subtotal: number;
};

/** Tabla `orders` */
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
  /** ISO. En la base es `created_at` */
  creadoISO: string;
};

/**
 * Pedidos de ejemplo, construidos relativos a un instante que manda el
 * servidor. Así el HTML del servidor y el del cliente coinciden.
 */
export function pedidosDemo(baseISO: string): Pedido[] {
  const base = new Date(baseISO).getTime();
  const haceMin = (m: number) => new Date(base - m * 60_000).toISOString();

  return [
    {
      id: "p1",
      numero: 47,
      clienteNombre: "Marielys",
      clienteTel: "0412 8891023",
      tipo: "delivery",
      direccion: "Av. Cuatricentenaria, edificio Aramo, apto 3-B",
      total: 24.98,
      estado: "nuevo",
      creadoISO: haceMin(2),
      nota: "Tocar el timbre 2 veces",
    },
    {
      id: "p2",
      numero: 46,
      clienteNombre: "Jhonatan",
      clienteTel: "0426 5540912",
      tipo: "retiro",
      total: 12.0,
      estado: "nuevo",
      creadoISO: haceMin(6),
    },
    {
      id: "p3",
      numero: 45,
      clienteNombre: "Andrea",
      clienteTel: "0414 3320188",
      tipo: "retiro",
      total: 19.99,
      estado: "preparando",
      creadoISO: haceMin(11),
    },
    {
      id: "p4",
      numero: 44,
      clienteNombre: "Luis Fernando",
      clienteTel: "0412 7761450",
      tipo: "delivery",
      direccion: "Urb. Alto Barinas Sur, calle 5, casa 12",
      total: 32.48,
      estado: "listo",
      creadoISO: haceMin(18),
    },
    {
      id: "p5",
      numero: 43,
      clienteNombre: "Génesis",
      clienteTel: "0424 9012877",
      tipo: "retiro",
      total: 7.0,
      estado: "entregado",
      creadoISO: haceMin(31),
    },
  ];
}

/** Las líneas de cada pedido, por `order_id`. */
export function lineasDemo(): Record<string, LineaPedido[]> {
  return {
    p1: [
      {
        nombre: "Casta Burger",
        cantidad: 2,
        opciones: ["Cordero", "White Meal", "con papás"],
        nota: "sin cebolla",
        subtotal: 24.98,
      },
    ],
    p2: [
      { nombre: "Cheese Burger", cantidad: 1, opciones: ["Carne"], subtotal: 5 },
      {
        nombre: "Casta Burger",
        cantidad: 1,
        opciones: ["Pollo"],
        subtotal: 7,
      },
    ],
    p3: [
      {
        nombre: "Casta Smash",
        cantidad: 1,
        opciones: ["Carne", "White Meal"],
        nota: "bien cocida",
        subtotal: 12.99,
      },
      {
        nombre: "Cheese Burger",
        cantidad: 1,
        opciones: ["Pollo", "Tocineta adicional"],
        subtotal: 6,
      },
    ],
    p4: [
      {
        nombre: "Combo 3 Cheese Burger",
        cantidad: 1,
        opciones: ["Carne"],
        subtotal: 17.7,
      },
      {
        nombre: "Casta Burger",
        cantidad: 1,
        opciones: ["Cordero", "White Meal"],
        subtotal: 9.99,
      },
      {
        nombre: "Salsa de la casa adicional",
        cantidad: 1,
        opciones: [],
        subtotal: 0.5,
      },
    ],
    p5: [
      {
        nombre: "Cheese Burger",
        cantidad: 1,
        opciones: ["Carne", "White Meal"],
        subtotal: 7,
      },
    ],
  };
}
