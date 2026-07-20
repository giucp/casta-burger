/**
 * Menú real del §9 del brief.
 *
 * ⚠️ PRECIOS PLACEHOLDER — los del mockup. Hay que reemplazarlos por los reales
 * antes de publicar. En Fase 1 paso 3 esto se migra a la tabla `menu_items` de
 * Supabase y se edita desde /admin; la forma del objeto ya calca esa tabla.
 */

export type Categoria = "Burgers" | "Combo" | "Extras" | "Bebidas";

export type MenuItem = {
  id: string;
  nombre: string;
  descripcion?: string;
  /** Siempre en USD */
  precio: number;
  categoria: Categoria;
  fotoUrl?: string;
  disponible: boolean;
  orden: number;
  /** Etiquetas cortas de la tarjeta: peso, ingrediente distintivo, etc. */
  tags?: string[];
};

/** Proteína a elegir en todas las burgers (§9). */
export const PROTEINAS = ["Carne", "Cordero", "Pollo"] as const;
export type Proteina = (typeof PROTEINAS)[number];

/** Adicional de papás, aplica por hamburguesa (§9). */
export const PAPAS_ADICIONAL = {
  etiqueta: "150 g de papás full sal y paprika",
  precio: 2.5,
};

export const MENU: MenuItem[] = [
  // ---------- BURGERS ----------
  {
    id: "cheese-burger",
    nombre: "Cheese Burger",
    descripcion:
      "120 g de proteína, queso facilista, salsa de la casa, tocineta y pan de batata.",
    precio: 6.0,
    categoria: "Burgers",
    disponible: true,
    orden: 1,
    tags: ["120 g", "tocineta", "pan de batata"],
  },
  {
    id: "casta-burger",
    nombre: "Casta Burger",
    descripcion:
      "240 g de proteína, onion smash, queso facilista, salsa de la casa, tocineta y pan de batata.",
    precio: 8.5,
    categoria: "Burgers",
    disponible: true,
    orden: 2,
    tags: ["240 g", "onion smash", "doble"],
  },
  {
    id: "casta-smash",
    nombre: "Casta Smash",
    descripcion:
      "360 g de proteína, onion smash, queso facilista, salsa de la casa, tocineta y pan de batata.",
    precio: 11.0,
    categoria: "Burgers",
    disponible: true,
    orden: 3,
    tags: ["360 g", "triple"],
  },

  // ---------- COMBO ----------
  {
    id: "combo-3-cheese",
    nombre: "Combo 3 Cheese Burger",
    descripcion: "Tres Cheese Burger para compartir.",
    precio: 16.5,
    categoria: "Combo",
    disponible: true,
    orden: 1,
    tags: ["3 burgers"],
  },

  // ---------- EXTRAS ----------
  {
    id: "extra-proteina",
    nombre: "Proteína adicional",
    precio: 2.5,
    categoria: "Extras",
    disponible: true,
    orden: 1,
  },
  {
    id: "extra-tocineta",
    nombre: "Tocineta adicional",
    precio: 1.5,
    categoria: "Extras",
    disponible: true,
    orden: 2,
  },
  {
    id: "extra-onion",
    nombre: "Onion smash / cebolla planchada",
    precio: 1.0,
    categoria: "Extras",
    disponible: true,
    orden: 3,
  },
  {
    id: "extra-salsa",
    nombre: "Salsa de la casa adicional",
    precio: 0.8,
    categoria: "Extras",
    disponible: true,
    orden: 4,
  },
  {
    id: "extra-queso",
    nombre: "Queso facilista adicional",
    precio: 1.0,
    categoria: "Extras",
    disponible: true,
    orden: 5,
  },

  // ---------- BEBIDAS ----------
  {
    id: "coca-1l",
    nombre: "Coca-Cola 1 L original",
    precio: 2.5,
    categoria: "Bebidas",
    disponible: true,
    orden: 1,
  },
  {
    id: "coca-lata-zero",
    nombre: "Coca-Cola lata zero",
    precio: 1.2,
    categoria: "Bebidas",
    disponible: true,
    orden: 2,
  },
  {
    id: "coca-lata-original",
    nombre: "Coca-Cola lata original",
    precio: 1.2,
    categoria: "Bebidas",
    disponible: true,
    orden: 3,
  },
  {
    id: "nevada-manzana",
    nombre: "Nevada manzana 355 ml",
    precio: 1.0,
    categoria: "Bebidas",
    disponible: true,
    orden: 4,
  },
];

/** Items de una categoría, ya ordenados como se muestran en el menú. */
export function porCategoria(categoria: Categoria): MenuItem[] {
  return MENU.filter((item) => item.categoria === categoria).sort(
    (a, b) => a.orden - b.orden,
  );
}
