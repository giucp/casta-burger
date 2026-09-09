"use server";

import { createClient } from "@/lib/supabase/server";
import { PROTEINAS, type Proteina } from "@/lib/menu";
import { esUnidad, type Unidad } from "@/lib/unidades";

/**
 * Las recetas: cuánto de cada ingrediente lleva cada producto.
 *
 * El descuento NO pasa por acá. Lo hace un trigger de la base al marcar un
 * pedido como entregado (migración 0018), por dos motivos: un admin puede
 * mover el estado de un pedido pegándole directo a la API sin abrir el panel,
 * y sobre todo porque así el descuento es atómico con el cambio de estado —o
 * pasan las dos cosas o no pasa ninguna. Acá solo se cargan las recetas.
 */

export type LineaReceta = {
  id: string;
  /** null cuando la línea es la proteína: todavía no se sabe cuál. */
  inventarioId: string | null;
  /**
   * `true` = "la proteína que elija el cliente". No nombra un ingrediente: se
   * resuelve al entregar, contra la tabla `proteina_ingrediente`.
   */
  esProteina: boolean;
  /** La unidad en que está escrito el número. Solo la línea de proteína la usa. */
  unidad: Unidad | null;
  /**
   * Filtro viejo: null = la línea aplica siempre. Se dejó de ofrecer al cargar
   * —la proteína ahora es su propia línea— pero las que existan siguen valiendo.
   */
  proteina: Proteina | null;
  cantidad: number;
};

/** Qué item del inventario sale por cada proteína. */
export type ProteinaIngrediente = {
  proteina: Proteina;
  inventarioId: string;
};

export type RecetaProducto = {
  menuItemId: string;
  nombre: string;
  categoria: string;
  lineas: LineaReceta[];
};

export type Resultado = { ok: true } | { ok: false; error: string };

function esProteina(v: unknown): v is Proteina {
  return typeof v === "string" && (PROTEINAS as readonly string[]).includes(v);
}

const num = (v: string | number) => (typeof v === "number" ? v : Number(v));

/**
 * Todos los productos del menú con su receta, hayan cargado alguna o no.
 *
 * Se devuelven también los que no tienen ninguna línea: la pantalla tiene que
 * poder mostrar "a este producto todavía no le cargaste nada", que es
 * justamente lo que el dueño necesita ver para saber qué le falta.
 */
export async function listarRecetas(): Promise<RecetaProducto[]> {
  const supabase = await createClient();

  const [{ data: productos, error: e1 }, { data: filas, error: e2 }] =
    await Promise.all([
      supabase
        .from("menu_items")
        .select("id, nombre, categoria, orden")
        // Solo lo que se arma en la cocina con ingredientes: las hamburguesas
        // y las papas. Nada más tiene una receta que el dueño pueda escribir.
        //
        // Las bebidas se compran hechas —nadie fabrica una Coca-Cola—. Los
        // extras son un ingrediente suelto, no una preparación. Y las promos
        // son las mismas hamburguesas vendidas de un golpe: su receta sería
        // una copia de la que ya está cargada, y el día que cambie una, las
        // copias quedan viejas en silencio.
        //
        // Que todo eso salga del inventario al venderse es un problema real,
        // pero no se resuelve pidiéndole recetas al dueño.
        .in("categoria", ["Burgers", "Fries"])
        .order("categoria")
        .order("orden"),
      supabase
        .from("recetas")
        .select(
          "id, menu_item_id, inventory_id, proteina, cantidad, es_proteina, unidad",
        ),
    ]);

  if (e1 || e2 || !productos) {
    console.error("No se pudieron leer las recetas:", e1?.message ?? e2?.message);
    return [];
  }

  const porProducto = new Map<string, LineaReceta[]>();
  for (const f of filas ?? []) {
    const lista = porProducto.get(f.menu_item_id) ?? [];
    lista.push({
      id: f.id,
      inventarioId: f.inventory_id,
      esProteina: f.es_proteina === true,
      unidad: f.unidad && esUnidad(f.unidad) ? f.unidad : null,
      proteina: esProteina(f.proteina) ? f.proteina : null,
      cantidad: num(f.cantidad),
    });
    porProducto.set(f.menu_item_id, lista);
  }

  return productos.map((p) => ({
    menuItemId: p.id,
    nombre: p.nombre,
    categoria: p.categoria,
    lineas: porProducto.get(p.id) ?? [],
  }));
}

/**
 * Agrega o pisa una línea. El índice único de la base es
 * (producto, ingrediente, proteína) con `nulls not distinct`, así que cargar
 * dos veces el mismo par actualiza la cantidad en vez de duplicar — que es lo
 * que uno espera al corregir un número, y además evita descontar dos veces.
 */
export async function guardarLinea(datos: {
  menuItemId: string;
  /** null solo cuando la línea es la proteína elegida. */
  inventarioId: string | null;
  esProteina?: boolean;
  /** Obligatoria en la línea de proteína: no hay ingrediente del que heredarla. */
  unidad?: Unidad | null;
  proteina: Proteina | null;
  cantidad: number;
}): Promise<Resultado> {
  if (!(datos.cantidad > 0)) {
    return { ok: false, error: "La cantidad tiene que ser mayor que cero." };
  }

  const esProt = datos.esProteina === true;
  if (esProt && !datos.unidad) {
    return { ok: false, error: "Falta la unidad de la proteína." };
  }
  if (!esProt && !datos.inventarioId) {
    return { ok: false, error: "Falta el ingrediente." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("recetas").upsert(
    {
      menu_item_id: datos.menuItemId,
      inventory_id: esProt ? null : datos.inventarioId,
      es_proteina: esProt,
      unidad: esProt ? datos.unidad : null,
      proteina: esProt ? null : datos.proteina,
      cantidad: datos.cantidad,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "menu_item_id,inventory_id,proteina" },
  );

  if (error) {
    console.error("No se pudo guardar la línea de receta:", error.message);
    return { ok: false, error: "No se pudo guardar. Probá de nuevo." };
  }
  return { ok: true };
}

/**
 * De qué item del inventario sale cada proteína.
 *
 * Sin esto, la línea "la proteína que elija el cliente" no sabe qué restar. La
 * migración 0021 la deja cargada con lo que ya existía en el inventario; esta
 * pantalla es para el día que un nombre cambie o se agregue una proteína.
 */
export async function listarProteinas(): Promise<ProteinaIngrediente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proteina_ingrediente")
    .select("proteina, inventory_id");

  if (error) {
    console.error("No se pudo leer el mapa de proteínas:", error.message);
    return [];
  }
  return (data as { proteina: string; inventory_id: string }[])
    .filter((f) => esProteina(f.proteina))
    .map((f) => ({
      proteina: f.proteina as Proteina,
      inventarioId: f.inventory_id,
    }));
}

export async function guardarProteina(
  proteina: Proteina,
  inventarioId: string,
): Promise<Resultado> {
  if (!esProteina(proteina)) return { ok: false, error: "Proteína no válida." };

  const supabase = await createClient();
  const { error } = await supabase.from("proteina_ingrediente").upsert(
    {
      proteina,
      inventory_id: inventarioId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "proteina" },
  );

  if (error) {
    console.error("No se pudo guardar la proteína:", error.message);
    return { ok: false, error: "No se pudo guardar." };
  }
  return { ok: true };
}

export async function borrarLinea(id: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from("recetas").delete().eq("id", id);
  if (error) {
    console.error("No se pudo borrar la línea de receta:", error.message);
    return { ok: false, error: "No se pudo borrar." };
  }
  return { ok: true };
}
