"use client";

import { useState } from "react";
import { PROTEINAS, type Proteina } from "@/lib/menu";
import type { ItemInventario } from "@/lib/acciones/inventario";
import {
  borrarLinea,
  guardarLinea,
  type RecetaProducto,
} from "@/lib/acciones/recetas";

/**
 * Cuánto lleva cada producto.
 *
 * Va plegado por producto y no como una tabla gigante: son ~15 productos con
 * 4 o 5 ingredientes cada uno, y lo que el dueño hace acá es cargar uno y
 * pasar al siguiente. Abierto todo de una vez, en un teléfono, no se
 * encuentra nada.
 *
 * Lo primero que se ve de cada producto es si tiene receta o no. Esa es la
 * pregunta real cuando se está cargando: qué falta.
 */

export function RecetasPanel({
  inicial,
  inventario,
}: {
  inicial: RecetaProducto[];
  inventario: ItemInventario[];
}) {
  const [recetas, setRecetas] = useState(inicial);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const porNombre = new Map(inventario.map((i) => [i.id, i]));
  const conReceta = recetas.filter((r) => r.lineas.length > 0).length;

  const refrescarLineas = (menuItemId: string, lineas: RecetaProducto["lineas"]) =>
    setRecetas((actuales) =>
      actuales.map((r) => (r.menuItemId === menuItemId ? { ...r, lineas } : r)),
    );

  if (inventario.length === 0) {
    return (
      <p className="rounded-card border border-white/8 py-10 text-center font-mono text-sm text-smoke">
        Primero cargá ingredientes en Inventario. Una receta se arma con lo que
        haya ahí.
      </p>
    );
  }

  // Agrupado por categoría, respetando el orden que ya trae la consulta.
  const porCategoria = recetas.reduce<[string, RecetaProducto[]][]>((acc, r) => {
    const ultimo = acc[acc.length - 1];
    if (ultimo && ultimo[0] === r.categoria) ultimo[1].push(r);
    else acc.push([r.categoria, [r]]);
    return acc;
  }, []);

  return (
    <>
      <p className="mb-2 max-w-prose text-[13px] text-smoke">
        Al marcar un pedido como <b className="text-ash">entregado</b>, esto se
        descuenta solo del inventario. Si se anula la venta, se devuelve.
      </p>
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-smoke">
        {conReceta} de {recetas.length} productos con receta
      </p>

      {error && <p className="mb-3 font-mono text-[11px] text-casta">{error}</p>}

      {porCategoria.map(([categoria, productos]) => (
        <section key={categoria} className="mb-5">
          <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-smoke">
            {categoria}
          </h2>
          <ul className="overflow-hidden rounded-card border border-white/8">
            {productos.map((r) => (
              <Producto
                key={r.menuItemId}
                receta={r}
                inventario={inventario}
                porNombre={porNombre}
                abierto={abierto === r.menuItemId}
                onAbrir={() =>
                  setAbierto(abierto === r.menuItemId ? null : r.menuItemId)
                }
                onCambio={(lineas) => refrescarLineas(r.menuItemId, lineas)}
                onError={setError}
              />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function Producto({
  receta,
  inventario,
  porNombre,
  abierto,
  onAbrir,
  onCambio,
  onError,
}: {
  receta: RecetaProducto;
  inventario: ItemInventario[];
  porNombre: Map<string, ItemInventario>;
  abierto: boolean;
  onAbrir: () => void;
  onCambio: (lineas: RecetaProducto["lineas"]) => void;
  onError: (m: string | null) => void;
}) {
  const [ingrediente, setIngrediente] = useState(inventario[0]?.id ?? "");
  const [cantidad, setCantidad] = useState("");
  const [proteina, setProteina] = useState<string>("");
  const [ocupado, setOcupado] = useState(false);

  const agregar = async () => {
    onError(null);
    const n = Number(cantidad.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      return onError("Poné una cantidad mayor que cero.");
    }

    setOcupado(true);
    const r = await guardarLinea({
      menuItemId: receta.menuItemId,
      inventarioId: ingrediente,
      proteina: (proteina || null) as Proteina | null,
      cantidad: n,
    });
    setOcupado(false);
    if (!r.ok) return onError(r.error);

    // Pisa la línea del mismo par si ya existía, igual que hace la base.
    const sinLaVieja = receta.lineas.filter(
      (l) =>
        !(
          l.inventarioId === ingrediente &&
          (l.proteina ?? "") === proteina
        ),
    );
    onCambio([
      ...sinLaVieja,
      {
        id: `nueva-${ingrediente}-${proteina}`,
        inventarioId: ingrediente,
        proteina: (proteina || null) as Proteina | null,
        cantidad: n,
      },
    ]);
    setCantidad("");
  };

  const quitar = async (id: string) => {
    onError(null);
    const r = await borrarLinea(id);
    if (!r.ok) return onError(r.error);
    onCambio(receta.lineas.filter((l) => l.id !== id));
  };

  return (
    <li className="border-b border-white/8 last:border-b-0">
      <button
        type="button"
        onClick={onAbrir}
        aria-expanded={abierto}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {receta.nombre}
        </span>
        <span
          className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] ${
            receta.lineas.length ? "text-smoke" : "text-casta"
          }`}
        >
          {receta.lineas.length
            ? `${receta.lineas.length} ingrediente${receta.lineas.length > 1 ? "s" : ""}`
            : "sin receta"}
        </span>
        <span className="shrink-0 font-mono text-smoke">{abierto ? "−" : "+"}</span>
      </button>

      {abierto && (
        <div className="border-t border-white/8 bg-white/[0.02] px-4 py-3">
          {receta.lineas.length > 0 && (
            <ul className="mb-3">
              {receta.lineas.map((l) => {
                const ing = porNombre.get(l.inventarioId);
                return (
                  <li
                    key={l.id}
                    className="flex items-center gap-2 border-b border-white/5 py-1.5 last:border-b-0"
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px]">
                      {ing?.nombre ?? "ingrediente borrado"}
                    </span>
                    {l.proteina && (
                      <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em]">
                        solo {l.proteina}
                      </span>
                    )}
                    <span className="shrink-0 font-mono text-[13px] font-bold">
                      {l.cantidad} {ing?.unidad ?? ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => void quitar(l.id)}
                      aria-label={`Quitar ${ing?.nombre ?? "ingrediente"}`}
                      className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-smoke transition-colors hover:text-casta"
                    >
                      Quitar
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-0 flex-1">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke">
                Ingrediente
              </span>
              <select
                value={ingrediente}
                onChange={(e) => setIngrediente(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-ink px-2 py-1.5 text-[13px]"
              >
                {inventario.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="w-20">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke">
                Cuánto
              </span>
              <input
                inputMode="decimal"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder={porNombre.get(ingrediente)?.unidad ?? "0"}
                className="w-full rounded-lg border border-white/15 bg-ink px-2 py-1.5 text-center font-mono text-[13px]"
              />
            </label>

            <label className="w-28">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke">
                Proteína
              </span>
              <select
                value={proteina}
                onChange={(e) => setProteina(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-ink px-2 py-1.5 text-[13px]"
              >
                <option value="">Siempre</option>
                {PROTEINAS.map((p) => (
                  <option key={p} value={p}>
                    Solo {p}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => void agregar()}
              disabled={ocupado}
              className="rounded-full bg-casta px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-casta-deep disabled:opacity-60"
            >
              {ocupado ? "…" : "Sumar"}
            </button>
          </div>

          <p className="mt-2 font-mono text-[10px] leading-snug text-smoke">
            &quot;Siempre&quot; descuenta en toda venta del producto. Elegí una
            proteína solo para lo que cambia según lo que pidió el cliente —la
            carne, el pollo—, o descontarías carne en una de pollo.
          </p>
        </div>
      )}
    </li>
  );
}
