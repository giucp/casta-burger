"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usd } from "@/lib/format";
import {
  CATEGORIAS_COMPRA,
  fechaCorta,
  type Compra,
  type CostoIngrediente,
} from "@/lib/admin/datos";
import type { ItemInventario } from "@/lib/acciones/inventario";
import { borrarCompra, crearCompra } from "@/lib/acciones/compras";
import { compatibles, convertir, type Unidad } from "@/lib/unidades";

/**
 * Lo que cuesta cada cosa, contra la tabla `purchases`.
 *
 * Antes era descripción libre y un monto: servía para la caja del día y para
 * nada más. Ahora un gasto puede decir de qué ingrediente es y cuánto se
 * compró, y de ahí sale el costo por unidad — que es lo que, cruzado con la
 * receta, dice cuánto cuesta hacer una hamburguesa.
 *
 * No toca el inventario. El stock se ajusta a mano; si además sumara acá,
 * lo que hoy se hace después de comprar quedaría contado dos veces.
 */

const OTRO = "__otro__";

export function CostosPanel({
  inicial,
  hoy,
  inventario,
  costos,
}: {
  inicial: Compra[];
  /** Fecha de hoy en Caracas, calculada en el servidor */
  hoy: string;
  inventario: ItemInventario[];
  costos: CostoIngrediente[];
}) {
  const router = useRouter();
  const [compras, setCompras] = useState(inicial);

  const [que, setQue] = useState<string>(inventario[0]?.id ?? OTRO);
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [unidadEntrada, setUnidadEntrada] = useState<Unidad | null>(null);
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_COMPRA[0]);
  const [fecha, setFecha] = useState(hoy);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const porId = useMemo(
    () => new Map(inventario.map((i) => [i.id, i])),
    [inventario],
  );
  const costoDe = useMemo(
    () => new Map(costos.map((c) => [c.inventarioId, c])),
    [costos],
  );

  const esOtro = que === OTRO;
  const item = esOtro ? undefined : porId.get(que);
  const unidadItem: Unidad = item?.unidad ?? "und";
  const unidadUsada: Unidad = unidadEntrada ?? unidadItem;

  const total = useMemo(
    () => compras.reduce((s, c) => s + c.monto, 0),
    [compras],
  );

  /** El costo por unidad que va a quedar, para verlo antes de guardar. */
  const previo = useMemo(() => {
    if (esOtro) return null;
    const n = Number(cantidad.replace(",", "."));
    const m = Number(monto.replace(",", "."));
    if (!(n > 0) || !(m > 0)) return null;
    const enUnidadItem = convertir(n, unidadUsada, unidadItem);
    if (!enUnidadItem || enUnidadItem <= 0) return null;
    return m / enUnidadItem;
  }, [esOtro, cantidad, monto, unidadUsada, unidadItem]);

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const valor = Number(monto.replace(",", "."));
    if (Number.isNaN(valor) || valor <= 0) return setError("Monto inválido");

    let texto = descripcion.trim();
    let cant: number | null = null;

    if (!esOtro) {
      const n = Number(cantidad.replace(",", "."));
      if (!(n > 0)) return setError("Poné cuánto compraste");
      cant = n;
      // La descripción se arma sola: "Carne molida · 1 kg". Escribirla a mano
      // era la parte que nadie hacía igual dos veces.
      texto = `${item?.nombre ?? "Ingrediente"} · ${n} ${unidadUsada}`;
    } else if (!texto) {
      return setError("Falta la descripción");
    }

    setGuardando(true);
    const r = await crearCompra({
      descripcion: texto,
      monto: valor,
      categoria: esOtro ? categoria : "Insumos",
      fecha,
      inventarioId: esOtro ? null : que,
      cantidad: cant,
      unidad: esOtro ? null : unidadUsada,
    });
    setGuardando(false);

    if (!r.ok) return setError(r.error);
    if (r.dato) setCompras((actuales) => [r.dato!, ...actuales]);

    setDescripcion("");
    setMonto("");
    setCantidad("");

    // La tabla de costos por ingrediente y los márgenes de Recetas se calculan
    // en el servidor: sin esto, acabás de anotar un costo y la pantalla sigue
    // diciendo "sin costo" hasta que alguien recargue a mano.
    router.refresh();
  };

  const quitar = async (compra: Compra) => {
    if (!confirm(`¿Borrar "${compra.descripcion}" (${usd(compra.monto)})?`))
      return;
    const previas = compras;
    setCompras((actuales) => actuales.filter((c) => c.id !== compra.id));
    const r = await borrarCompra(compra.id);
    if (!r.ok) {
      setCompras(previas);
      setError(r.error);
      return;
    }
    // Borrar la última compra de un ingrediente cambia su costo: puede volver
    // al de la compra anterior, o quedarse sin ninguno.
    router.refresh();
  };

  return (
    <>
      <form
        onSubmit={agregar}
        className="mb-6 rounded-card border border-white/8 bg-card p-4"
      >
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-smoke">
          Anotar un costo
        </p>

        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto_1fr_auto] sm:items-end">
          <div className="min-w-0">
            <label
              htmlFor="costo-que"
              className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke"
            >
              Qué
            </label>
            <select
              id="costo-que"
              value={que}
              onChange={(e) => {
                setQue(e.target.value);
                setUnidadEntrada(null);
              }}
              className="w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm"
            >
              {inventario.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre}
                </option>
              ))}
              <option value={OTRO}>Otro gasto — no es un ingrediente</option>
            </select>
          </div>

          {esOtro ? (
            <div className="min-w-0 sm:col-span-3">
              <label
                htmlFor="costo-desc"
                className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke"
              >
                Qué fue
              </label>
              <input
                id="costo-desc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="ej: bombona de gas"
                className="w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm placeholder:text-smoke/60"
              />
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="costo-cant"
                  className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke"
                >
                  Cuánto
                </label>
                <input
                  id="costo-cant"
                  inputMode="decimal"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-center font-mono text-sm placeholder:text-smoke/60"
                />
              </div>

              <div>
                <label
                  htmlFor="costo-unidad"
                  className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke"
                >
                  Unidad
                </label>
                <select
                  id="costo-unidad"
                  value={unidadUsada}
                  onChange={(e) => setUnidadEntrada(e.target.value as Unidad)}
                  disabled={compatibles(unidadItem).length < 2}
                  className="w-16 rounded-lg border border-white/15 bg-ink px-1 py-2 text-center font-mono text-sm disabled:opacity-60"
                >
                  {compatibles(unidadItem).map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="costo-monto"
              className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke"
            >
              Costó ($)
            </label>
            <input
              id="costo-monto"
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-white/15 bg-ink px-3 py-2 font-mono text-sm placeholder:text-smoke/60"
            />
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="rounded-full bg-casta px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-casta-deep disabled:opacity-60"
          >
            {guardando ? "…" : "Agregar"}
          </button>
        </div>

        {/* La cuenta a la vista antes de guardarla: es el número que después
            multiplica la receta, y equivocarlo se paga en cada venta. */}
        {previo !== null && (
          <p className="mt-2 font-mono text-[11px] text-ash">
            = ${previo.toFixed(4)} por {unidadItem} de {item?.nombre}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label
            htmlFor="costo-fecha"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-smoke"
          >
            Fecha
          </label>
          <input
            id="costo-fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-lg border border-white/15 bg-ink px-3 py-1.5 font-mono text-xs"
          />

          {esOtro && (
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              aria-label="Categoría del gasto"
              className="rounded-lg border border-white/15 bg-ink px-3 py-1.5 font-mono text-xs"
            >
              {CATEGORIAS_COMPRA.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {error && (
            <span className="font-mono text-[11px] text-casta">{error}</span>
          )}
        </div>
      </form>

      <TablaCostos inventario={inventario} costoDe={costoDe} />

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-smoke">
          Últimos 30 días
        </h2>
        <span className="font-mono text-sm font-bold text-casta">
          {usd(total)}
        </span>
      </div>

      {compras.length === 0 ? (
        <p className="rounded-card border border-white/8 py-10 text-center font-mono text-sm text-smoke">
          Sin costos registrados. Anotá el primero arriba.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-card border border-white/8">
          {compras.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 border-b border-white/8 px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{c.descripcion}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-smoke">
                  {fechaCorta(c.fecha)} · {c.categoria}
                </p>
              </div>
              <span className="shrink-0 font-mono text-sm font-bold">
                {usd(c.monto)}
              </span>
              <button
                type="button"
                onClick={() => quitar(c)}
                aria-label={`Borrar ${c.descripcion}`}
                className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-smoke transition-colors hover:text-casta"
              >
                Borrar
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * Cuánto cuesta hoy cada ingrediente.
 *
 * Los que no tienen costo se muestran igual, marcados. Un ingrediente sin
 * costo no rompe nada, pero deja la cuenta de la hamburguesa incompleta —y
 * una cuenta incompleta que no se anuncia es peor que no tenerla.
 */
function TablaCostos({
  inventario,
  costoDe,
}: {
  inventario: ItemInventario[];
  costoDe: Map<string, CostoIngrediente>;
}) {
  const sinCosto = inventario.filter((i) => !costoDe.has(i.id));

  return (
    <section className="mb-6">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-smoke">
          Cuánto cuesta cada ingrediente
        </h2>
        {sinCosto.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-casta">
            {sinCosto.length} sin costo
          </span>
        )}
      </div>

      <ul className="overflow-hidden rounded-card border border-white/8">
        {inventario.map((i) => {
          const c = costoDe.get(i.id);
          return (
            <li
              key={i.id}
              className="flex items-center gap-3 border-b border-white/8 px-4 py-2 last:border-b-0"
            >
              <span className="min-w-0 flex-1 truncate text-[13px]">
                {i.nombre}
              </span>
              {c ? (
                <>
                  <span className="shrink-0 font-mono text-[13px] font-bold">
                    ${c.costoUnitario.toFixed(4)}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-smoke">
                    por {i.unidad} · {fechaCorta(c.desde)}
                  </span>
                </>
              ) : (
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-casta">
                  sin costo
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
