"use client";

import { useState } from "react";
import { enAlerta, type ItemInventario } from "@/lib/admin/datos";

/**
 * Inventario manual: se ajusta a mano, sin descuento automático por venta
 * (§2 del brief lo deja explícitamente fuera).
 *
 * TODO(fase 2): persistir en la tabla `inventory` de Supabase. Hoy los cambios
 * viven en memoria y se pierden al recargar.
 */
export function InventarioTabla({ inicial }: { inicial: ItemInventario[] }) {
  const [items, setItems] = useState(inicial);

  const ajustar = (id: string, delta: number) =>
    setItems((actuales) =>
      actuales.map((i) =>
        i.id === id
          ? { ...i, cantidad: Math.max(0, Number((i.cantidad + delta).toFixed(2))) }
          : i,
      ),
    );

  const fijar = (id: string, valor: string) => {
    const n = Number(valor.replace(",", "."));
    if (Number.isNaN(n) || n < 0) return;
    setItems((actuales) =>
      actuales.map((i) => (i.id === id ? { ...i, cantidad: n } : i)),
    );
  };

  const enAlertaCount = items.filter(enAlerta).length;

  return (
    <>
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-smoke">
        {items.length} items ·{" "}
        {enAlertaCount > 0 ? (
          <span className="text-casta">{enAlertaCount} en bajo stock</span>
        ) : (
          <span className="text-emerald-400">todo por encima del umbral</span>
        )}
      </p>

      <ul className="overflow-hidden rounded-card border border-white/8">
        {items.map((item) => {
          const alerta = enAlerta(item);
          return (
            <li
              key={item.id}
              className={`flex items-center gap-3 border-b border-white/8 px-4 py-3 last:border-b-0 ${
                alerta ? "bg-casta/8" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {item.nombre}
                  {alerta && (
                    <span className="ml-2 rounded-full bg-casta px-2 py-0.5 align-middle font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-white">
                      bajo
                    </span>
                  )}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-smoke">
                  avisar en {item.umbralAlerta} {item.unidad}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => ajustar(item.id, -1)}
                  aria-label={`Bajar ${item.nombre}`}
                  className="size-8 rounded-full border border-white/15 font-mono text-base leading-none text-white hover:border-white/50"
                >
                  −
                </button>

                <label className="sr-only" htmlFor={`cant-${item.id}`}>
                  Cantidad de {item.nombre}
                </label>
                <input
                  id={`cant-${item.id}`}
                  type="text"
                  inputMode="decimal"
                  value={item.cantidad}
                  onChange={(e) => fijar(item.id, e.target.value)}
                  className={`w-14 rounded-lg border bg-ink px-2 py-1.5 text-center font-mono text-sm font-bold ${
                    alerta ? "border-casta text-casta" : "border-white/15"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => ajustar(item.id, 1)}
                  aria-label={`Subir ${item.nombre}`}
                  className="size-8 rounded-full border border-white/15 font-mono text-base leading-none text-white hover:border-white/50"
                >
                  +
                </button>

                <span className="w-8 font-mono text-[11px] text-smoke">
                  {item.unidad}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
