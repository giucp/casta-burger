"use client";

import { useMemo, useState } from "react";
import { usd } from "@/lib/format";
import {
  CATEGORIAS_COMPRA,
  fechaCorta,
  type Compra,
} from "@/lib/admin/datos";
import { borrarCompra, crearCompra } from "@/lib/acciones/compras";

/**
 * Registro de compras de insumos (§6), contra la tabla `purchases`.
 */
export function ComprasPanel({
  inicial,
  hoy,
}: {
  inicial: Compra[];
  /** Fecha de hoy en Caracas, calculada en el servidor */
  hoy: string;
}) {
  const [compras, setCompras] = useState(inicial);

  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_COMPRA[0]);
  const [fecha, setFecha] = useState(hoy);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(
    () => compras.reduce((s, c) => s + c.monto, 0),
    [compras],
  );

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const valor = Number(monto.replace(",", "."));
    if (!descripcion.trim()) return setError("Falta la descripción");
    if (Number.isNaN(valor) || valor <= 0) return setError("Monto inválido");

    setGuardando(true);
    const r = await crearCompra({
      descripcion,
      monto: valor,
      categoria,
      fecha,
    });
    setGuardando(false);

    if (!r.ok) return setError(r.error);
    if (r.dato) setCompras((actuales) => [r.dato!, ...actuales]);

    setDescripcion("");
    setMonto("");
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
    }
  };

  return (
    <>
      <form
        onSubmit={agregar}
        className="mb-6 rounded-card border border-white/8 bg-card p-4"
      >
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-smoke">
          Registrar compra
        </p>

        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
          <div>
            <label
              htmlFor="compra-desc"
              className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke"
            >
              Descripción
            </label>
            <input
              id="compra-desc"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="ej: Carne molida 10 kg"
              className="w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm placeholder:text-smoke/60"
            />
          </div>

          <div>
            <label
              htmlFor="compra-monto"
              className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke"
            >
              Monto ($)
            </label>
            <input
              id="compra-monto"
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-white/15 bg-ink px-3 py-2 font-mono text-sm placeholder:text-smoke/60"
            />
          </div>

          <div>
            <label
              htmlFor="compra-cat"
              className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke"
            >
              Categoría
            </label>
            <select
              id="compra-cat"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm"
            >
              {CATEGORIAS_COMPRA.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="rounded-full bg-casta px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-casta-deep disabled:opacity-60"
          >
            {guardando ? "…" : "Agregar"}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label
            htmlFor="compra-fecha"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-smoke"
          >
            Fecha
          </label>
          <input
            id="compra-fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-lg border border-white/15 bg-ink px-3 py-1.5 font-mono text-xs"
          />
          {error && (
            <span className="font-mono text-[11px] text-casta">{error}</span>
          )}
        </div>
      </form>

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
          Sin compras registradas. Anotá la primera arriba.
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
