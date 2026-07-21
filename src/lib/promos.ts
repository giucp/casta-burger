/**
 * Promos de la semana.
 *
 * PENDIENTE: hoy viven acá porque cambian seguido y todavía se están
 * afinando. Cuando el negocio las estabilice conviene una tabla `promos` para
 * que el dueño las edite desde /admin sin tocar código.
 */

export type Promo = {
  id: string;
  /** El gancho, en dos o tres palabras */
  titulo: string;
  /** Qué se lleva exactamente. Sin letra chica. */
  detalle: string;
  /** Precio final en USD */
  precio: number;
  /** Lo que costaría comprando cada cosa por separado, si hay ahorro real */
  precioSuelto?: number;
  /** Condición corta: "solo jueves", "hasta agotar" */
  condicion?: string;
};

export const PROMOS: Promo[] = [
  {
    id: "2x1-cheese",
    titulo: "2x1 en Cheese Burger",
    detalle: "Llevás dos Cheese Burger por el precio de una.",
    precio: 7,
    precioSuelto: 10,
  },
  {
    id: "2-casta-regalo",
    titulo: "2 Casta Burger + 1 de regalo",
    detalle:
      "Pedís dos Casta Burger y te llevás una Cheese Burger sin costo.",
    precio: 20,
  },
  {
    id: "3-cheese",
    titulo: "3 Cheese Burger",
    detalle: "Tres Cheese Burger para compartir.",
    precio: 17.7,
  },
];
