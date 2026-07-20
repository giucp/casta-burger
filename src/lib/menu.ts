/**
 * Menú real de Casta Burger.
 *
 * Fuente: el menú impreso del negocio ("Copia de MENU CASTA.pdf"), que manda
 * sobre los precios placeholder del §9 del brief y del mockup.
 *
 * En Fase 1 paso 3 esto se migra a la tabla `menu_items` de Supabase y se edita
 * desde /admin; la forma del objeto ya calca esa tabla.
 */

export type Categoria = "Burgers" | "Combo" | "Extras" | "Bebidas";

export type MenuItem = {
  id: string;
  nombre: string;
  descripcion?: string;
  /** Precio en USD de la versión sola. `null` = todavía sin precio definido. */
  precio: number | null;
  /** Precio en USD de la versión White Meal, si el producto la tiene. */
  precioWhiteMeal?: number;
  categoria: Categoria;
  fotoUrl?: string;
  disponible: boolean;
  orden: number;
  /** Etiquetas cortas de la tarjeta: peso, ingrediente distintivo, etc. */
  tags?: string[];
};

/** Proteína a elegir en todas las burgers. */
export const PROTEINAS = ["Carne", "Cordero", "Pollo"] as const;
export type Proteina = (typeof PROTEINAS)[number];

/**
 * Las burgers vienen en dos presentaciones, tal cual el menú impreso.
 * El cliente elige una al agregar, igual que elige la proteína.
 */
export const PRESENTACIONES = {
  only: { etiqueta: "Sola", detalle: "solo la hamburguesa" },
  whiteMeal: {
    etiqueta: "White Meal",
    detalle: "con papas + Coca-Cola de lata",
  },
} as const;
export type Presentacion = keyof typeof PRESENTACIONES;

/** Adicional de papás, aplica por hamburguesa. */
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
    precio: 5.0,
    precioWhiteMeal: 7.0,
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
    precio: 7.5,
    precioWhiteMeal: 9.99,
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
    precio: 10.0,
    precioWhiteMeal: 12.99,
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
    precio: 17.7,
    categoria: "Combo",
    disponible: true,
    orden: 1,
    tags: ["3 burgers"],
  },

  // ---------- EXTRAS ----------
  {
    id: "extra-proteina",
    nombre: "Proteína adicional",
    precio: 2.0,
    categoria: "Extras",
    disponible: true,
    orden: 1,
  },
  {
    id: "extra-tocineta",
    nombre: "Tocineta adicional",
    precio: 1.0,
    categoria: "Extras",
    disponible: true,
    orden: 2,
  },
  {
    id: "extra-onion",
    nombre: "Onion smash / cebolla planchada",
    precio: 0.5,
    categoria: "Extras",
    disponible: true,
    orden: 3,
  },
  {
    id: "extra-salsa",
    nombre: "Salsa de la casa adicional",
    precio: 0.5,
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
  // PENDIENTE: el menú impreso no trae precios de bebidas. Van sin precio
  // hasta que el negocio los confirme.
  {
    id: "coca-1l",
    nombre: "Coca-Cola 1 L original",
    precio: null,
    categoria: "Bebidas",
    disponible: true,
    orden: 1,
  },
  {
    id: "coca-lata-zero",
    nombre: "Coca-Cola lata zero",
    precio: null,
    categoria: "Bebidas",
    disponible: true,
    orden: 2,
  },
  {
    id: "coca-lata-original",
    nombre: "Coca-Cola lata original",
    precio: null,
    categoria: "Bebidas",
    disponible: true,
    orden: 3,
  },
  {
    id: "nevada-manzana",
    nombre: "Nevada manzana 355 ml",
    precio: null,
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
