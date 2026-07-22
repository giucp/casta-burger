/**
 * Tipos y constantes del menú.
 *
 * Los productos ya NO viven acá: son filas de `menu_items` en Supabase y se
 * leen con `obtenerMenu()` de `menu-db.ts`. El dueño los edita desde /admin.
 */

export type Categoria =
  | "Burgers"
  | "Combo"
  | "Extras"
  | "Promos"
  | "Bebidas";

/** Orden en que se muestran las secciones del menú. */
export const CATEGORIAS: Categoria[] = [
  "Burgers",
  "Combo",
  "Extras",
  "Promos",
  "Bebidas",
];

export type MenuItem = {
  id: string;
  slug: string;
  nombre: string;
  descripcion?: string;
  /** Precio en USD. `null` = todavía sin precio definido. */
  precio: number | null;
  /** Solo en promos: lo que costaría comprando cada cosa suelta. */
  precioSuelto?: number;
  categoria: Categoria;
  fotoUrl?: string;
  disponible: boolean;
  orden: number;
  tags: string[];
};

/** Proteína a elegir en las burgers. Las promos vienen siempre con carne. */
export const PROTEINAS = ["Carne", "Cordero", "Pollo"] as const;
export type Proteina = (typeof PROTEINAS)[number];

/**
 * Qué se puede elegir al pedir cada categoría.
 *
 * Las promos van cerradas a propósito: precio fijo, carne, y sin agregados.
 * Si se les pudiera cambiar algo habría que recalcular el descuento.
 */
export function opcionesDe(categoria: Categoria) {
  const esBurger = categoria === "Burgers" || categoria === "Combo";
  return { proteina: esBurger, extras: esBurger };
}

/** Items de una categoría, ya ordenados como se muestran en el menú. */
export function porCategoria(
  items: MenuItem[],
  categoria: Categoria,
): MenuItem[] {
  return items
    .filter((item) => item.categoria === categoria)
    .sort((a, b) => a.orden - b.orden);
}
