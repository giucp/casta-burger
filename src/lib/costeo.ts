import type { ItemInventario } from "@/lib/acciones/inventario";
import type {
  ProteinaIngrediente,
  RecetaProducto,
} from "@/lib/acciones/recetas";
import type { CostoIngrediente } from "@/lib/admin/datos";
import { convertir } from "@/lib/unidades";

/**
 * Cuánto cuesta hacer un producto, según su receta y la última compra de cada
 * ingrediente.
 *
 * Se calcula acá y no en la base a propósito: la pantalla ya tiene las
 * recetas, el inventario y los costos cargados, y el número tiene que poder
 * mostrarse incompleto —"le falta el costo del pan"— en vez de desaparecer.
 * Una vista de SQL devuelve un número o nada; acá se puede decir por qué.
 */

export type CostoProducto = {
  /** El más barato y el más caro según la proteína. Iguales si no varía. */
  min: number;
  max: number;
  /** Falso si algún ingrediente de la receta todavía no tiene costo. */
  completo: boolean;
  /** Cuántos ingredientes quedaron sin costo. */
  faltan: number;
};

export function costoDeReceta(
  receta: RecetaProducto,
  costoDe: Map<string, CostoIngrediente>,
  inventarioDe: Map<string, ItemInventario>,
  proteinas: ProteinaIngrediente[],
): CostoProducto | null {
  if (receta.lineas.length === 0) return null;

  let fijo = 0;
  let faltan = 0;

  // Lo que va siempre: se suma una sola vez y no depende de la proteína.
  for (const l of receta.lineas) {
    if (l.esProteina || l.proteina !== null || !l.inventarioId) continue;
    const c = costoDe.get(l.inventarioId);
    if (!c) {
      faltan += 1;
      continue;
    }
    fijo += l.cantidad * c.costoUnitario;
  }

  // Lo que cambia según la proteína: la línea "la que elija el cliente" y las
  // líneas viejas atadas a una proteína puntual. De todas sale un rango.
  const porProteina: number[] = [];

  const lineaProteina = receta.lineas.find((l) => l.esProteina);
  if (lineaProteina) {
    for (const { proteina, inventarioId } of proteinas) {
      const inv = inventarioDe.get(inventarioId);
      const c = costoDe.get(inventarioId);
      if (!inv || !c) continue;
      const enUnidad = convertir(
        lineaProteina.cantidad,
        lineaProteina.unidad ?? inv.unidad,
        inv.unidad,
      );
      if (enUnidad === null) continue;
      porProteina.push(enUnidad * c.costoUnitario);
      void proteina;
    }
    // Sin ninguna proteína costeada, la cuenta queda coja y hay que decirlo.
    if (porProteina.length === 0) faltan += 1;
  }

  for (const l of receta.lineas) {
    if (l.proteina === null || !l.inventarioId) continue;
    const c = costoDe.get(l.inventarioId);
    if (!c) {
      faltan += 1;
      continue;
    }
    porProteina.push(l.cantidad * c.costoUnitario);
  }

  const min = fijo + (porProteina.length ? Math.min(...porProteina) : 0);
  const max = fijo + (porProteina.length ? Math.max(...porProteina) : 0);

  return { min, max, completo: faltan === 0, faltan };
}
