"use client";

import { useRef, useState } from "react";
import {
  actualizarItemInventario,
  borrarItemInventario,
  crearItemInventario,
  type ItemInventario,
} from "@/lib/acciones/inventario";

/**
 * Inventario manual: se ajusta a mano, sin descuento automático por venta
 * (§2 del brief lo deja fuera del alcance). Persiste en la tabla `inventory`.
 *
 * Los cambios se pintan de una vez (optimista) y se guardan detrás: en un
 * negocio se ajusta el stock tocando +/- varias veces seguidas, y esperar a
 * la red en cada toque haría la pantalla pesada. La cantidad se guarda con un
 * respiro de 700 ms para agrupar esos toques en una sola escritura.
 */

const estaBajo = (i: ItemInventario) => i.cantidad <= i.umbralAlerta;

const numero = (v: string) => {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export function InventarioTabla({ inicial }: { inicial: ItemInventario[] }) {
  const [items, setItems] = useState(inicial);
  const [error, setError] = useState<string | null>(null);

  // Un timer de guardado por item, para el debounce de la cantidad.
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const parchar = (id: string, patch: Partial<ItemInventario>) =>
    setItems((actuales) =>
      actuales.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    );

  const guardarCantidadDebounced = (id: string, cantidad: number) => {
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(async () => {
      const r = await actualizarItemInventario(id, { cantidad });
      if (!r.ok) setError(r.error);
    }, 700);
  };

  const ajustar = (item: ItemInventario, delta: number) => {
    const cantidad = Math.max(0, Number((item.cantidad + delta).toFixed(2)));
    parchar(item.id, { cantidad });
    guardarCantidadDebounced(item.id, cantidad);
  };

  const fijarCantidad = (item: ItemInventario, valor: string) => {
    const n = numero(valor);
    if (n === null) return;
    parchar(item.id, { cantidad: n });
    guardarCantidadDebounced(item.id, n);
  };

  /** Guarda un campo de texto/umbral al terminar de editar (on blur). */
  const guardarCampo = async (
    id: string,
    patch: Partial<{ nombre: string; unidad: string; umbralAlerta: number }>,
  ) => {
    const r = await actualizarItemInventario(id, patch);
    if (!r.ok) setError(r.error);
  };

  const borrar = async (item: ItemInventario) => {
    if (!confirm(`¿Borrar "${item.nombre}" del inventario?`)) return;
    const previo = items;
    setItems((actuales) => actuales.filter((i) => i.id !== item.id));
    const r = await borrarItemInventario(item.id);
    if (!r.ok) {
      setItems(previo); // volver atrás si falló
      setError(r.error);
    }
  };

  const bajos = items.filter(estaBajo).length;

  return (
    <>
      <FormAgregar
        onAgregado={(item) =>
          setItems((actuales) =>
            [...actuales, item].sort((a, b) => a.nombre.localeCompare(b.nombre)),
          )
        }
        onError={setError}
      />

      {error && (
        <p className="mb-3 font-mono text-[11px] text-casta">{error}</p>
      )}

      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.1em] text-smoke">
        {items.length} items
        {items.length > 0 &&
          (bajos > 0 ? (
            <>
              {" · "}
              <span className="text-casta">{bajos} en bajo stock</span>
            </>
          ) : (
            <>
              {" · "}
              <span className="text-emerald-400">
                todo por encima del umbral
              </span>
            </>
          ))}
      </p>

      {items.length === 0 ? (
        <p className="rounded-card border border-white/8 py-10 text-center font-mono text-sm text-smoke">
          Todavía no cargaste nada. Agregá tu primer item arriba.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-card border border-white/8">
          {items.map((item) => {
            const bajo = estaBajo(item);
            return (
              <li
                key={item.id}
                className={`border-b border-white/8 px-4 py-3 last:border-b-0 ${
                  bajo ? "bg-casta/8" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        defaultValue={item.nombre}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== item.nombre)
                            guardarCampo(item.id, { nombre: v });
                        }}
                        aria-label={`Nombre de ${item.nombre}`}
                        className="min-w-0 flex-1 truncate rounded bg-transparent text-sm font-medium outline-none focus:bg-white/5 focus:px-1"
                      />
                      {bajo && (
                        <span className="shrink-0 rounded-full bg-casta px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-white">
                          bajo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => ajustar(item, -1)}
                      aria-label={`Bajar ${item.nombre}`}
                      className="size-8 rounded-full border border-white/15 font-mono text-base leading-none text-white hover:border-white/50"
                    >
                      −
                    </button>

                    <input
                      inputMode="decimal"
                      value={item.cantidad}
                      onChange={(e) => fijarCantidad(item, e.target.value)}
                      aria-label={`Cantidad de ${item.nombre}`}
                      className={`w-14 rounded-lg border bg-ink px-2 py-1.5 text-center font-mono text-sm font-bold ${
                        bajo ? "border-casta text-casta" : "border-white/15"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => ajustar(item, 1)}
                      aria-label={`Subir ${item.nombre}`}
                      className="size-8 rounded-full border border-white/15 font-mono text-base leading-none text-white hover:border-white/50"
                    >
                      +
                    </button>

                    <input
                      defaultValue={item.unidad}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== item.unidad)
                          guardarCampo(item.id, { unidad: v });
                      }}
                      aria-label={`Unidad de ${item.nombre}`}
                      className="w-12 rounded bg-transparent px-1 py-1 font-mono text-[11px] text-smoke outline-none focus:bg-white/5"
                    />
                  </div>
                </div>

                <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-smoke">
                  <span>avisar en</span>
                  <input
                    inputMode="decimal"
                    defaultValue={item.umbralAlerta}
                    onBlur={(e) => {
                      const n = numero(e.target.value);
                      if (n !== null && n !== item.umbralAlerta) {
                        parchar(item.id, { umbralAlerta: n });
                        guardarCampo(item.id, { umbralAlerta: n });
                      }
                    }}
                    aria-label={`Umbral de alerta de ${item.nombre}`}
                    className="w-12 rounded border border-white/15 bg-ink px-1.5 py-0.5 text-center text-white outline-none"
                  />
                  <span>{item.unidad}</span>

                  <button
                    type="button"
                    onClick={() => borrar(item)}
                    className="ml-auto uppercase tracking-[0.08em] text-smoke transition-colors hover:text-casta"
                  >
                    Borrar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function FormAgregar({
  onAgregado,
  onError,
}: {
  onAgregado: (item: ItemInventario) => void;
  onError: (msg: string | null) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [unidad, setUnidad] = useState("und");
  const [umbral, setUmbral] = useState("");
  const [guardando, setGuardando] = useState(false);

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    onError(null);
    if (!nombre.trim()) return onError("Falta el nombre del item.");

    setGuardando(true);
    const r = await crearItemInventario({
      nombre,
      cantidad: numero(cantidad) ?? 0,
      unidad,
      umbralAlerta: numero(umbral) ?? 0,
    });
    setGuardando(false);

    if (!r.ok) return onError(r.error);
    if (r.dato) onAgregado(r.dato);
    setNombre("");
    setCantidad("");
    setUmbral("");
    setUnidad("und");
  };

  return (
    <form
      onSubmit={agregar}
      className="mb-5 rounded-card border border-white/8 bg-card p-4"
    >
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-smoke">
        Agregar item
      </p>
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end">
        <Campo etiqueta="Item" valor={nombre} onChange={setNombre} placeholder="ej: Carne molida" />
        <Campo etiqueta="Cantidad" valor={cantidad} onChange={setCantidad} placeholder="0" mono />
        <Campo etiqueta="Unidad" valor={unidad} onChange={setUnidad} placeholder="kg" mono />
        <Campo etiqueta="Avisar en" valor={umbral} onChange={setUmbral} placeholder="0" mono />
        <button
          type="submit"
          disabled={guardando}
          className="rounded-full bg-casta px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-casta-deep disabled:opacity-60"
        >
          {guardando ? "…" : "Agregar"}
        </button>
      </div>
    </form>
  );
}

function Campo({
  etiqueta,
  valor,
  onChange,
  placeholder,
  mono,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke">
        {etiqueta}
      </label>
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={mono ? "decimal" : undefined}
        className={`w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm placeholder:text-smoke/60 ${
          mono ? "font-mono" : ""
        }`}
      />
    </div>
  );
}
