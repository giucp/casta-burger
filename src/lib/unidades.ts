/**
 * Las unidades del inventario, y cómo se convierten entre sí.
 *
 * Hasta acá la unidad se escribía a mano y era una etiqueta: el descuento
 * restaba número contra número sin mirarla. "gr", "g", "gramos" y "Gr" eran
 * cuatro unidades distintas para el sistema y la misma para una persona, y
 * cargar 60 en una receta contra un inventario en kilos sacaba 60 kg sin que
 * nadie se enterara.
 *
 * Con una lista cerrada la unidad pasa a significar algo y se puede convertir.
 */

export const UNIDADES = ["und", "g", "kg", "ml", "L"] as const;
export type Unidad = (typeof UNIDADES)[number];

/**
 * A qué se reduce cada unidad, y cuánto de esa base vale.
 *
 * Dos unidades solo se pueden convertir si comparten base. `und` es su propia
 * base y no convierte con nada: no hay forma de saber cuántos gramos pesa un
 * pan, y adivinarlo sería peor que no dejar.
 */
const BASE: Record<Unidad, { base: string; factor: number }> = {
  und: { base: "und", factor: 1 },
  g: { base: "g", factor: 1 },
  kg: { base: "g", factor: 1000 },
  ml: { base: "ml", factor: 1 },
  L: { base: "ml", factor: 1000 },
};

/** Cómo se lee cada una en la pantalla, cuando hace falta el nombre largo. */
export const NOMBRE: Record<Unidad, string> = {
  und: "unidades",
  g: "gramos",
  kg: "kilos",
  ml: "mililitros",
  L: "litros",
};

export function esUnidad(v: string): v is Unidad {
  return (UNIDADES as readonly string[]).includes(v);
}

/**
 * Lo que ya estaba escrito a mano, llevado a la lista cerrada.
 *
 * Se aplica al leer y al guardar, no solo en la migración: un item viejo que
 * quedó con "gr" tiene que poder mostrarse y editarse sin romper la pantalla.
 */
export function normalizar(v: string | null | undefined): Unidad {
  const t = (v ?? "").trim().toLowerCase();
  if (t === "g" || t === "gr" || t === "grs" || t === "gramo" || t === "gramos")
    return "g";
  if (t === "kg" || t === "kgs" || t === "kilo" || t === "kilos" || t === "k")
    return "kg";
  if (t === "ml" || t === "mililitro" || t === "mililitros") return "ml";
  if (t === "l" || t === "lt" || t === "lts" || t === "litro" || t === "litros")
    return "L";
  return "und";
}

/** Las unidades a las que se puede pasar sin inventar nada. */
export function compatibles(u: Unidad): Unidad[] {
  return UNIDADES.filter((x) => BASE[x].base === BASE[u].base);
}

export function sonCompatibles(a: Unidad, b: Unidad): boolean {
  return BASE[a].base === BASE[b].base;
}

/**
 * Convierte una cantidad entre unidades compatibles. `null` si no lo son —
 * quien llama decide qué hacer, pero nunca recibe un número inventado.
 */
export function convertir(
  valor: number,
  de: Unidad,
  a: Unidad,
): number | null {
  if (!sonCompatibles(de, a)) return null;
  if (de === a) return valor;
  const r = (valor * BASE[de].factor) / BASE[a].factor;
  // 3 decimales es lo que guarda la base: un gramo cuando se mide en kilos.
  return Math.round(r * 1000) / 1000;
}
