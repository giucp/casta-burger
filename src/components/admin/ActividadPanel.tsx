"use client";

import { useMemo, useState } from "react";
import type { Movimiento } from "@/lib/acciones/actividad";

/**
 * Quién cambió qué, y cuándo.
 *
 * Se lee de arriba hacia abajo como un diario: lo más nuevo primero, agrupado
 * por día. Cada fila dice las cuatro cosas en el mismo orden —qué pasó, sobre
 * qué, quién y hace cuánto— porque el dueño va a venir acá con una pregunta ya
 * formada ("¿quién bajó la carne?") y tiene que poder barrer con la vista.
 */

const OP_INFO: Record<
  Movimiento["operacion"],
  { etiqueta: string; fondo: string }
> = {
  alta: { etiqueta: "Agregó", fondo: "bg-emerald-600" },
  edicion: { etiqueta: "Cambió", fondo: "bg-amber-500" },
  baja: { etiqueta: "Borró", fondo: "bg-casta" },
};

const TABLAS: Record<string, string> = {
  inventory: "Inventario",
  menu_items: "Menú",
  recetas: "Recetas",
};

function dia(iso: string): string {
  return new Date(iso).toLocaleDateString("es-VE", {
    timeZone: "America/Caracas",
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-VE", {
    timeZone: "America/Caracas",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** El correo entero no entra en un teléfono y lo que distingue va antes de la @. */
function quienCorto(email: string): string {
  return email.includes("@") ? email.split("@")[0] : email;
}

export function ActividadPanel({ inicial }: { inicial: Movimiento[] }) {
  const [quien, setQuien] = useState<string>("");
  const [tabla, setTabla] = useState<string>("");

  const personas = useMemo(
    () => [...new Set(inicial.map((m) => m.quien))].sort(),
    [inicial],
  );
  const tablas = useMemo(
    () => [...new Set(inicial.map((m) => m.tabla))].sort(),
    [inicial],
  );

  const visibles = inicial.filter(
    (m) => (!quien || m.quien === quien) && (!tabla || m.tabla === tabla),
  );

  // Agrupado por día, manteniendo el orden que ya traen (más nuevo primero).
  const porDia = visibles.reduce<[string, Movimiento[]][]>((acc, m) => {
    const d = dia(m.cuandoISO);
    const ultimo = acc[acc.length - 1];
    if (ultimo && ultimo[0] === d) ultimo[1].push(m);
    else acc.push([d, [m]]);
    return acc;
  }, []);

  return (
    <>
      <p className="mb-4 max-w-prose text-[13px] text-smoke">
        Cada cambio en el inventario, el menú y las recetas queda anotado acá,
        entre por el panel o por donde sea. No se puede editar ni borrar,
        tampoco por vos.
      </p>

      {personas.length > 1 || tablas.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Filtro
            valor={quien}
            onChange={setQuien}
            vacio="Todos"
            opciones={personas.map((p) => ({ valor: p, label: quienCorto(p) }))}
          />
          <Filtro
            valor={tabla}
            onChange={setTabla}
            vacio="Todo"
            opciones={tablas.map((t) => ({ valor: t, label: TABLAS[t] ?? t }))}
          />
        </div>
      ) : null}

      {visibles.length === 0 ? (
        <p className="rounded-card border border-white/8 py-10 text-center font-mono text-sm text-smoke">
          {inicial.length === 0
            ? "Todavía no hay movimientos registrados."
            : "Nada con esos filtros."}
        </p>
      ) : (
        porDia.map(([etiquetaDia, movimientos]) => (
          <section key={etiquetaDia} className="mb-6">
            <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-smoke">
              {etiquetaDia}
            </h2>
            <ul className="overflow-hidden rounded-card border border-white/8">
              {movimientos.map((m) => (
                <Fila key={m.id} m={m} />
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}

function Fila({ m }: { m: Movimiento }) {
  const op = OP_INFO[m.operacion];

  return (
    <li className="border-b border-white/8 px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-white ${op.fondo}`}
        >
          {op.etiqueta}
        </span>
        <span className="text-sm font-medium">{m.etiqueta ?? "—"}</span>
        <span className="font-mono text-[11px] text-smoke">
          en {TABLAS[m.tabla] ?? m.tabla}
        </span>
        <span className="ml-auto font-mono text-[11px] text-smoke">
          {quienCorto(m.quien)} · {hora(m.cuandoISO)}
        </span>
      </div>

      {m.cambios.length > 0 && (
        <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px]">
          {m.cambios.map((c) => (
            <li key={c.campo} className="text-smoke">
              {c.campo}{" "}
              {m.operacion === "edicion" ? (
                <>
                  <span className="text-smoke/70 line-through">
                    {c.antes ?? "—"}
                  </span>{" "}
                  <span className="text-ash">→ {c.despues ?? "—"}</span>
                </>
              ) : (
                <span className="text-ash">
                  {(m.operacion === "alta" ? c.despues : c.antes) ?? "—"}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Filtro({
  valor,
  onChange,
  vacio,
  opciones,
}: {
  valor: string;
  onChange: (v: string) => void;
  vacio: string;
  opciones: { valor: string; label: string }[];
}) {
  if (opciones.length < 2) return null;
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-white/15 bg-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-white"
    >
      <option value="">{vacio}</option>
      {opciones.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
