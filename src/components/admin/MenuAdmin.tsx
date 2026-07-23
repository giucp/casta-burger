"use client";

import { useState } from "react";
import { CATEGORIAS, porCategoria, type Categoria, type MenuItem } from "@/lib/menu";
import {
  actualizarMenuItem,
  borrarMenuItem,
  crearMenuItem,
  toggleDisponible,
} from "@/lib/acciones/menu-admin";

/**
 * Gestión del menú. El corazón es el toggle Disponible / Agotado: cuando se
 * acaba el cordero, el dueño lo apaga y en la web deja de poder pedirse al
 * instante (el cambio revalida la home).
 */
export function MenuAdmin({ inicial }: { inicial: MenuItem[] }) {
  const [items, setItems] = useState(inicial);
  const [error, setError] = useState<string | null>(null);

  const parchar = (id: string, patch: Partial<MenuItem>) =>
    setItems((a) => a.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const alternar = async (item: MenuItem) => {
    const nuevo = !item.disponible;
    parchar(item.id, { disponible: nuevo }); // optimista
    const r = await toggleDisponible(item.id, nuevo);
    if (!r.ok) {
      parchar(item.id, { disponible: item.disponible });
      setError(r.error);
    }
  };

  const guardarPrecio = async (item: MenuItem, valor: string) => {
    const limpio = valor.trim();
    const precio = limpio === "" ? null : Number(limpio.replace(",", "."));
    if (precio !== null && (!Number.isFinite(precio) || precio < 0)) return;
    if (precio === item.precio) return;
    parchar(item.id, { precio });
    const r = await actualizarMenuItem(item.id, { precio });
    if (!r.ok) setError(r.error);
  };

  const guardarNombre = async (item: MenuItem, valor: string) => {
    const n = valor.trim();
    if (!n || n === item.nombre) return;
    parchar(item.id, { nombre: n });
    const r = await actualizarMenuItem(item.id, { nombre: n });
    if (!r.ok) setError(r.error);
  };

  const borrar = async (item: MenuItem) => {
    if (
      !confirm(
        `¿Borrar "${item.nombre}" del menú? Si solo se agotó, mejor apagalo.`,
      )
    )
      return;
    const previo = items;
    setItems((a) => a.filter((i) => i.id !== item.id));
    const r = await borrarMenuItem(item.id);
    if (!r.ok) {
      setItems(previo);
      setError(r.error);
    }
  };

  return (
    <>
      <FormAgregar
        onAgregado={(item) =>
          setItems((a) => [...a, item])
        }
        onError={setError}
      />

      {error && <p className="mb-3 font-mono text-[11px] text-casta">{error}</p>}

      {CATEGORIAS.map((cat) => {
        const deCat = porCategoria(items, cat);
        if (deCat.length === 0) return null;
        return (
          <section key={cat} className="mb-6">
            <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-smoke">
              {cat}
            </h2>
            <ul className="overflow-hidden rounded-card border border-white/8">
              {deCat.map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-wrap items-center gap-3 border-b border-white/8 px-4 py-3 last:border-b-0 ${
                    item.disponible ? "" : "bg-white/[.02]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => alternar(item)}
                    aria-pressed={item.disponible}
                    className={`shrink-0 rounded-full px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition-colors ${
                      item.disponible
                        ? "bg-emerald-600 text-white"
                        : "bg-casta text-white"
                    }`}
                  >
                    {item.disponible ? "Disponible" : "Agotado"}
                  </button>

                  <input
                    defaultValue={item.nombre}
                    onBlur={(e) => guardarNombre(item, e.target.value)}
                    aria-label={`Nombre de ${item.nombre}`}
                    className={`min-w-0 flex-1 rounded bg-transparent text-sm outline-none focus:bg-white/5 focus:px-1 ${
                      item.disponible ? "" : "text-smoke line-through"
                    }`}
                  />

                  <div className="flex shrink-0 items-center gap-1 font-mono text-sm">
                    <span className="text-smoke">$</span>
                    <input
                      inputMode="decimal"
                      defaultValue={item.precio ?? ""}
                      placeholder="—"
                      onBlur={(e) => guardarPrecio(item, e.target.value)}
                      aria-label={`Precio de ${item.nombre}`}
                      className="w-16 rounded border border-white/15 bg-ink px-2 py-1 text-right font-bold outline-none placeholder:text-smoke/50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => borrar(item)}
                    className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-smoke transition-colors hover:text-casta"
                  >
                    Borrar
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

function FormAgregar({
  onAgregado,
  onError,
}: {
  onAgregado: (item: MenuItem) => void;
  onError: (m: string | null) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Burgers");
  const [guardando, setGuardando] = useState(false);

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    onError(null);
    if (!nombre.trim()) return onError("Falta el nombre del producto.");

    setGuardando(true);
    const limpio = precio.trim();
    const r = await crearMenuItem({
      nombre,
      precio: limpio === "" ? null : Number(limpio.replace(",", ".")),
      categoria,
    });
    setGuardando(false);

    if (!r.ok) return onError(r.error);
    if (r.dato) onAgregado(r.dato);
    setNombre("");
    setPrecio("");
  };

  return (
    <form
      onSubmit={agregar}
      className="mb-5 rounded-card border border-white/8 bg-card p-4"
    >
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-smoke">
        Agregar producto
      </p>
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke">
            Nombre
          </label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="ej: Malteada de fresa"
            className="w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm placeholder:text-smoke/60"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke">
            Precio ($)
          </label>
          <input
            inputMode="decimal"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-white/15 bg-ink px-3 py-2 font-mono text-sm placeholder:text-smoke/60"
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-smoke">
            Categoría
          </label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria)}
            className="w-full rounded-lg border border-white/15 bg-ink px-3 py-2 text-sm"
          >
            {CATEGORIAS.map((c) => (
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
    </form>
  );
}
