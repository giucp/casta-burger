/**
 * Tipos y constantes del menú.
 *
 * Los productos ya NO viven acá: son filas de `menu_items` en Supabase y se
 * leen con `obtenerMenu()` de `menu-db.ts`. El dueño los edita desde /admin.
 */

export type Categoria = "Burgers" | "Combo" | "Extras" | "Bebidas";

export const CATEGORIAS: Categoria[] = [
  "Burgers",
  "Combo",
  "Extras",
  "Bebidas",
];

export type MenuItem = {
  id: string;
  slug: string;
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
  tags: string[];
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

/** Items de una categoría, ya ordenados como se muestran en el menú. */
export function porCategoria(
  items: MenuItem[],
  categoria: Categoria,
): MenuItem[] {
  return items
    .filter((item) => item.categoria === categoria)
    .sort((a, b) => a.orden - b.orden);
}
