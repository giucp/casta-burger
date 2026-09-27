"use client";

import { useState } from "react";
import { PROTEINAS, type Proteina } from "@/lib/menu";
import type { ItemInventario } from "@/lib/acciones/inventario";
import type { CostoIngrediente } from "@/lib/admin/datos";
import { costoDeReceta } from "@/lib/costeo";
import { usd } from "@/lib/format";
import {
  borrarLinea,
  guardarLinea,
  guardarProteina,
  type ProteinaIngrediente,
  type RecetaProducto,
} from "@/lib/acciones/recetas";
import {
  UNIDADES,
  compatibles,
  convertir,
  sonCompatibles,
  type Unidad,
} from "@/lib/unidades";

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

/** El valor del selector cuando la línea es "la proteína que elija el cliente". */
export const OPCION_PROTEINA = "__proteina__";

export function RecetasPanel({
  inicial,
  inventario,
  proteinas,
  costos,
}: {
  inicial: RecetaProducto[];
  inventario: ItemInventario[];
  proteinas: ProteinaIngrediente[];
  costos: CostoIngrediente[];
}) {
  const [recetas, setRecetas] = useState(inicial);
  const [mapa, setMapa] = useState(proteinas);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const porNombre = new Map(inventario.map((i) => [i.id, i]));
  const costoDe = new Map(costos.map((c) => [c.inventarioId, c]));
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
        descuenta solo del inventario. Si se anula la venta, se devuelve. Acá
        van las hamburguesas y las papas, que es lo que se arma en la cocina:
        las promos descuentan solas, con la receta de la hamburguesa que
        llevan.
      </p>
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-smoke">
        {conReceta} de {recetas.length} productos con receta
      </p>

      {error && <p className="mb-3 font-mono text-[11px] text-casta">{error}</p>}

      <MapaProteinas
        mapa={mapa}
        inventario={inventario}
        unidadesPedidas={[
          ...new Set(
            recetas.flatMap((r) =>
              r.lineas.filter((l) => l.esProteina && l.unidad).map((l) => l.unidad!),
            ),
          ),
        ]}
        onCambio={setMapa}
        onError={setError}
      />

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
                costoDe={costoDe}
                proteinas={mapa}
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

/**
 * De qué sale cada proteína.
 *
 * Es lo que le da sentido a la línea "la proteína que elija el cliente": sin
 * esto, un pedido de cordero no tiene de dónde restar. Va arriba y a la vista
 * porque cuando falta una, esa proteína no descuenta nada y no hay ningún otro
 * lugar donde eso se note.
 */
function MapaProteinas({
  mapa,
  inventario,
  unidadesPedidas,
  onCambio,
  onError,
}: {
  mapa: ProteinaIngrediente[];
  inventario: ItemInventario[];
  /** Las unidades en que las recetas piden la proteína (en la práctica, "g"). */
  unidadesPedidas: Unidad[];
  onCambio: (m: ProteinaIngrediente[]) => void;
  onError: (m: string | null) => void;
}) {
  const elegido = (p: Proteina) =>
    mapa.find((m) => m.proteina === p)?.inventarioId ?? "";

  const cambiar = async (p: Proteina, inventarioId: string) => {
    onError(null);
    if (!inventarioId) return;
    const r = await guardarProteina(p, inventarioId);
    if (!r.ok) return onError(r.error);
    onCambio([
      ...mapa.filter((m) => m.proteina !== p),
      { proteina: p, inventarioId },
    ]);
  };

  const faltan = PROTEINAS.filter((p) => !elegido(p));

  /**
   * Las proteínas cuyo item está en una unidad que las recetas no pueden
   * restar: la receta pide "240 g" y el item está en und. No hay conversión
   * posible, así que esa proteína no se descuenta — y hasta acá no lo decía
   * nadie. Pasó con la carne, el pollo y el cordero durante tres noches.
   */
  const incompatibles = PROTEINAS.flatMap((p) => {
    const item = inventario.find((i) => i.id === elegido(p));
    if (!item) return [];
    const malas = unidadesPedidas.filter((u) => !sonCompatibles(u, item.unidad));
    return malas.length ? [{ item, pide: malas[0] }] : [];
  });

  return (
    <div className="mb-5 rounded-card border border-white/8 bg-card p-4">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-smoke">
        La proteína sale de
      </p>
      <p className="mb-3 max-w-prose font-mono text-[10px] leading-snug text-smoke">
        Se configura una vez. Es lo que permite escribir &quot;240 g de
        proteína&quot; en la receta en vez de tres líneas casi iguales.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {PROTEINAS.map((p) => (
          <label key={p} className="min-w-0">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke">
              {p}
            </span>
            <select
              value={elegido(p)}
              onChange={(e) => void cambiar(p, e.target.value)}
              className={`w-full rounded-lg border bg-ink px-2 py-1.5 text-[13px] ${
                elegido(p) ? "border-white/15" : "border-casta text-casta"
              }`}
            >
              <option value="">— sin definir —</option>
              {inventario.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {faltan.length > 0 && (
        <p className="mt-2 font-mono text-[11px] text-casta">
          Sin definir {faltan.join(" y ")}: si alguien pide una de{" "}
          {faltan[0].toLowerCase()}, no se descuenta nada.
        </p>
      )}

      {incompatibles.map(({ item, pide }) => (
        <p key={item.id} className="mt-2 font-mono text-[11px] font-bold text-casta">
          ⚠ {item.nombre} está en {item.unidad} y las recetas piden {pide}: no se
          está descontando. Cambiá su unidad a {pide} en Inventario.
        </p>
      ))}
    </div>
  );
}

/**
 * Cuánto cuesta hacerlo y cuánto queda.
 *
 * Va pegado al producto en la lista, no escondido adentro: la pregunta "¿este
 * precio me sirve?" se hace mirando la carta entera, no producto por producto.
 *
 * Cuando la proteína cambia el costo se muestra un rango, porque es la verdad:
 * una de cordero deja menos que una de pollo, y promediarlo esconde justo el
 * caso que conviene mirar.
 */
function Margen({
  receta,
  costoDe,
  porNombre,
  proteinas,
}: {
  receta: RecetaProducto;
  costoDe: Map<string, CostoIngrediente>;
  porNombre: Map<string, ItemInventario>;
  proteinas: ProteinaIngrediente[];
}) {
  const costo = costoDeReceta(receta, costoDe, porNombre, proteinas);
  if (!costo || receta.precio === null) return null;

  const varia = Math.abs(costo.max - costo.min) >= 0.005;
  const ganaMin = receta.precio - costo.max;
  const ganaMax = receta.precio - costo.min;
  const pct = receta.precio > 0 ? (ganaMin / receta.precio) * 100 : 0;

  return (
    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pb-2.5 font-mono text-[11px] text-smoke">
      <span>
        cuesta{" "}
        <b className="text-ash">
          {varia ? `${usd(costo.min)}–${usd(costo.max)}` : usd(costo.min)}
        </b>
      </span>
      <span>
        gana{" "}
        <b className={ganaMin > 0 ? "text-emerald-400" : "text-casta"}>
          {varia ? `${usd(ganaMin)}–${usd(ganaMax)}` : usd(ganaMin)}
        </b>{" "}
        ({Math.round(pct)}%)
      </span>
      {!costo.completo && (
        <span className="text-casta">
          falta el costo de {costo.faltan}{" "}
          {costo.faltan === 1 ? "ingrediente" : "ingredientes"}
        </span>
      )}
    </p>
  );
}

function Producto({
  receta,
  inventario,
  porNombre,
  costoDe,
  proteinas,
  abierto,
  onAbrir,
  onCambio,
  onError,
}: {
  receta: RecetaProducto;
  inventario: ItemInventario[];
  porNombre: Map<string, ItemInventario>;
  costoDe: Map<string, CostoIngrediente>;
  proteinas: ProteinaIngrediente[];
  abierto: boolean;
  onAbrir: () => void;
  onCambio: (lineas: RecetaProducto["lineas"]) => void;
  onError: (m: string | null) => void;
}) {
  const [ingrediente, setIngrediente] = useState(OPCION_PROTEINA);
  const [cantidad, setCantidad] = useState("");
  const [ocupado, setOcupado] = useState(false);

  /**
   * En qué unidad se está escribiendo, que no tiene por qué ser la del
   * inventario. Una hamburguesa lleva 120 g y la carne se compra en kilos:
   * obligar a escribir 0.12 es pedirle a alguien que haga la cuenta de cabeza
   * cinco veces seguidas, y ahí es donde se pierde un decimal. Un decimal
   * perdido son diez veces la carne, y no avisa.
   *
   * `null` = la del ingrediente. Se vuelve a null al cambiar de ingrediente,
   * porque "g" no significa nada si pasaste de la carne a los panes.
   */
  const [unidadEntrada, setUnidadEntrada] = useState<Unidad | null>(null);

  const esLineaProteina = ingrediente === OPCION_PROTEINA;
  const item = porNombre.get(ingrediente);
  // La línea de proteína no hereda unidad de nadie: se escribe y se guarda tal
  // cual, y el descuento la convierte a la del ingrediente que toque.
  const unidadItem: Unidad = esLineaProteina ? "g" : (item?.unidad ?? "und");
  const unidadUsada: Unidad = unidadEntrada ?? unidadItem;
  const opcionesUnidad = esLineaProteina ? [...UNIDADES] : compatibles(unidadItem);

  const agregar = async () => {
    onError(null);
    const escrito = Number(cantidad.replace(",", "."));
    if (!Number.isFinite(escrito) || escrito <= 0) {
      return onError("Poné una cantidad mayor que cero.");
    }

    // Se guarda siempre en la unidad del ingrediente: la resta del inventario
    // es número contra número y no sabe de unidades.
    const n = esLineaProteina
      ? escrito
      : convertir(escrito, unidadUsada, unidadItem);
    if (n === null || n <= 0) {
      return onError(`No se puede pasar de ${unidadUsada} a ${unidadItem}.`);
    }

    setOcupado(true);
    const r = await guardarLinea({
      menuItemId: receta.menuItemId,
      inventarioId: esLineaProteina ? null : ingrediente,
      esProteina: esLineaProteina,
      unidad: esLineaProteina ? unidadUsada : null,
      proteina: null,
      cantidad: n,
    });
    setOcupado(false);
    if (!r.ok) return onError(r.error);

    // Pisa la línea equivalente si ya existía, igual que hace la base.
    const sinLaVieja = receta.lineas.filter((l) =>
      esLineaProteina
        ? !l.esProteina
        : !(l.inventarioId === ingrediente && l.proteina === null),
    );
    onCambio([
      ...sinLaVieja,
      {
        id: `nueva-${ingrediente}`,
        inventarioId: esLineaProteina ? null : ingrediente,
        esProteina: esLineaProteina,
        unidad: esLineaProteina ? unidadUsada : null,
        proteina: null,
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

      <Margen receta={receta} costoDe={costoDe} porNombre={porNombre} proteinas={proteinas} />

      {abierto && (
        <div className="border-t border-white/8 bg-white/[0.02] px-4 py-3">
          {receta.lineas.length > 0 && (
            <ul className="mb-3">
              {receta.lineas.map((l) => {
                const ing = l.inventarioId
                  ? porNombre.get(l.inventarioId)
                  : undefined;
                return (
                  <li
                    key={l.id}
                    className="flex items-center gap-2 border-b border-white/5 py-1.5 last:border-b-0"
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px]">
                      {l.esProteina
                        ? "Proteína"
                        : (ing?.nombre ?? "ingrediente borrado")}
                    </span>
                    {l.esProteina && (
                      <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em]">
                        la que elija
                      </span>
                    )}
                    {l.proteina && (
                      <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em]">
                        solo {l.proteina}
                      </span>
                    )}
                    <span className="shrink-0 font-mono text-[13px] font-bold">
                      {l.cantidad} {l.esProteina ? l.unidad : (ing?.unidad ?? "")}
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
                onChange={(e) => {
                  setIngrediente(e.target.value);
                  setUnidadEntrada(null);
                }}
                className="w-full rounded-lg border border-white/15 bg-ink px-2 py-1.5 text-[13px]"
              >
                {/*
                  Primera de la lista porque es la que más se usa: toda
                  hamburguesa lleva proteína, y es la única línea que no se
                  puede nombrar de antemano.
                */}
                <option value={OPCION_PROTEINA}>
                  Proteína — la que elija el cliente
                </option>
                {inventario.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nombre}
                  </option>
                ))}
              </select>
            </label>

            {/*
              La unidad va al lado del número y no de placeholder: un
              placeholder desaparece apenas escribís, o sea justo cuando
              necesitás saber en qué estás midiendo.
            */}
            <label className="w-20">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke">
                Cuánto
              </span>
              <input
                inputMode="decimal"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-white/15 bg-ink px-2 py-1.5 text-center font-mono text-[13px]"
              />
            </label>

            <label className="w-16">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke">
                Unidad
              </span>
              <select
                value={unidadUsada}
                onChange={(e) => setUnidadEntrada(e.target.value as Unidad)}
                disabled={opcionesUnidad.length < 2}
                aria-label="Unidad de la cantidad"
                className="w-full rounded-lg border border-white/15 bg-ink px-1 py-1.5 text-center font-mono text-[13px] disabled:opacity-60"
              >
                {opcionesUnidad.map((u) => (
                  <option key={u} value={u}>
                    {u}
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

          {/* Que se vea la cuenta antes de guardarla, no después de contar. */}
          {!esLineaProteina &&
            unidadUsada !== unidadItem &&
            cantidad.trim() !== "" && (
              <p className="mt-2 font-mono text-[11px] text-ash">
                ={" "}
                {convertir(
                  Number(cantidad.replace(",", ".")),
                  unidadUsada,
                  unidadItem,
                ) ?? "?"}{" "}
                {unidadItem} de {item?.nombre}
              </p>
            )}

          <p className="mt-2 font-mono text-[10px] leading-snug text-smoke">
            {esLineaProteina
              ? "Sale de carne, cordero o pollo según lo que pidió el cliente. Una sola línea: entre dos hamburguesas del mismo tipo no cambia nada más."
              : "Todo lo que cargues acá se descuenta en cada venta del producto."}
          </p>
        </div>
      )}
    </li>
  );
}
