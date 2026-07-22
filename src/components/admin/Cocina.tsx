"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usd } from "@/lib/format";
import {
  accionDe,
  ESTADO_INFO,
  ESTADOS_ACTIVOS,
  siguienteEstado,
  type EstadoPedido,
  type Pedido,
} from "@/lib/admin/pedidos";
import { cambiarEstadoPedido, listarPedidos } from "@/lib/acciones/cocina";
import { createClient } from "@/lib/supabase/client";
import { useAhora } from "./useAhora";
import { useCampana } from "./useCampana";

const FILTROS = [
  { valor: "activos", label: "Activos" },
  { valor: "nuevo", label: "Nuevos" },
  { valor: "preparando", label: "Preparando" },
  { valor: "listo", label: "Listos" },
  { valor: "todos", label: "Todos" },
] as const;

type Filtro = (typeof FILTROS)[number]["valor"];

/** "hace 4 min". Solo se calcula en el cliente para no romper la hidratación. */
function antiguedad(creadoISO: string, ahora: number): string {
  const min = Math.max(
    0,
    Math.floor((ahora - new Date(creadoISO).getTime()) / 60000),
  );
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  return `hace ${Math.floor(min / 60)} h`;
}

function TarjetaPedido({
  pedido,
  ahora,
  ocupado,
  onAvanzar,
  onCancelar,
}: {
  pedido: Pedido;
  ahora: number | null;
  ocupado: boolean;
  onAvanzar: () => void;
  onCancelar: () => void;
}) {
  const info = ESTADO_INFO[pedido.estado];
  const accion = accionDe(pedido.estado);
  const esUrgente = pedido.estado === "nuevo";

  return (
    <article
      className={`rounded-card border-2 bg-card ${info.borde} ${
        esUrgente ? "shadow-[0_0_0_4px_rgba(192,40,48,.12)]" : ""
      } ${ocupado ? "opacity-60" : ""}`}
    >
      <header className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
        <span className="font-display text-4xl leading-none">
          #{pedido.numero}
        </span>

        <div className="min-w-0 flex-1">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white ${info.fondo}`}
          >
            {info.etiqueta}
          </span>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-smoke">
            {pedido.tipo === "delivery" ? "Delivery" : "Retiro"}
            {ahora !== null && ` · ${antiguedad(pedido.creadoISO, ahora)}`}
          </p>
        </div>

        <span className="shrink-0 font-mono text-lg font-bold">
          {usd(pedido.total)}
        </span>
      </header>

      <ul className="px-4 py-3">
        {pedido.lineas.map((linea) => (
          <li key={linea.id} className="mb-2.5 last:mb-0">
            <p className="text-[15px] font-semibold leading-tight">
              <span className="font-mono text-casta">{linea.cantidad}×</span>{" "}
              {linea.nombre}
            </p>
            {linea.opciones.length > 0 && (
              <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-ash">
                {linea.opciones.join(" · ")}
              </p>
            )}
            {linea.nota && (
              <p className="mt-0.5 rounded bg-amber-500/15 px-2 py-0.5 text-[12px] font-medium text-amber-300">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] opacity-80">
                  Nota{" "}
                </span>
                {linea.nota}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="border-t border-white/8 px-4 py-2.5 font-mono text-[11px] text-smoke">
        <p className="text-ash">
          {pedido.clienteNombre} · {pedido.clienteTel}
        </p>
        {pedido.direccion && <p className="mt-0.5">{pedido.direccion}</p>}
        {pedido.nota && <p className="mt-0.5 text-amber-300">{pedido.nota}</p>}
      </div>

      {accion && (
        <div className="flex gap-2 border-t border-white/8 p-3">
          <button
            type="button"
            onClick={onAvanzar}
            disabled={ocupado}
            className={[
              "flex-1 rounded-full py-3 font-display uppercase tracking-[0.03em] text-white transition-opacity hover:opacity-90 disabled:opacity-50",
              // "Listo" es el botón que más se usa: va grande (§6)
              pedido.estado === "preparando"
                ? "bg-emerald-600 text-2xl"
                : "bg-casta text-lg",
            ].join(" ")}
          >
            {accion}
          </button>

          {pedido.estado === "nuevo" && (
            <button
              type="button"
              onClick={onCancelar}
              disabled={ocupado}
              className="rounded-full border border-white/15 px-4 font-mono text-[11px] uppercase tracking-[0.08em] text-smoke transition-colors hover:border-casta hover:text-casta disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export function Cocina({ inicial }: { inicial: Pedido[] }) {
  const [pedidos, setPedidos] = useState(inicial);
  const [filtro, setFiltro] = useState<Filtro>("activos");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [enVivo, setEnVivo] = useState(false);
  const ahora = useAhora();
  const { activa, activar, sonar } = useCampana();

  /**
   * El número más alto visto. Sirve para distinguir un pedido nuevo de un
   * cambio de estado: la campana solo debe sonar cuando entra uno.
   */
  const ultimoNumero = useRef(
    inicial.length > 0 ? Math.max(...inicial.map((p) => p.numero)) : 0,
  );

  const refrescar = useCallback(async () => {
    const frescos = await listarPedidos();
    setPedidos(frescos);

    const maximo =
      frescos.length > 0 ? Math.max(...frescos.map((p) => p.numero)) : 0;
    if (maximo > ultimoNumero.current) {
      ultimoNumero.current = maximo;
      sonar();
    }
  }, [sonar]);

  /**
   * Ante cualquier cambio en `orders` se recarga la lista completa en vez de
   * ir aplicando cada evento por separado. Un evento de Realtime trae la fila
   * de `orders` pero no sus líneas, así que igual habría que ir a buscarlas;
   * y con un puñado de pedidos activos, recargar es más simple y no se puede
   * desincronizar.
   */
  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel("cocina-pedidos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          void refrescar();
        },
      )
      .subscribe((estado) => {
        setEnVivo(estado === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [refrescar]);

  const visibles = useMemo(
    () =>
      pedidos.filter((p) => {
        if (filtro === "todos") return true;
        if (filtro === "activos") return ESTADOS_ACTIVOS.includes(p.estado);
        return p.estado === filtro;
      }),
    [pedidos, filtro],
  );

  const nuevos = pedidos.filter((p) => p.estado === "nuevo").length;

  const cambiar = async (id: string, estado: EstadoPedido) => {
    setOcupado(id);
    // Se pinta el cambio de una vez: en una cocina, esperar a la red para ver
    // que el toque funcionó hace que le den dos veces al botón.
    setPedidos((actuales) =>
      actuales.map((p) => (p.id === id ? { ...p, estado } : p)),
    );

    const resultado = await cambiarEstadoPedido(id, estado);
    if (!resultado.ok) await refrescar();
    setOcupado(null);
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-2 font-display text-4xl uppercase tracking-[0.01em]">
          Cocina
        </h1>
        {nuevos > 0 && (
          <span className="rounded-full bg-casta px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white">
            {nuevos} sin empezar
          </span>
        )}

        <span className="flex-1" />

        <span
          className={`font-mono text-[11px] uppercase tracking-[0.08em] ${
            enVivo ? "text-emerald-400" : "text-smoke"
          }`}
        >
          {enVivo ? "En vivo" : "Conectando…"}
        </span>

        <button
          type="button"
          onClick={activar}
          disabled={activa}
          className={`rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
            activa
              ? "border-emerald-500/40 text-emerald-400"
              : "border-white/20 text-smoke hover:border-white/50 hover:text-white"
          }`}
        >
          {activa ? "Sonido activo" : "Activar sonido"}
        </button>
      </div>

      {!activa && (
        <p className="mb-4 rounded-card border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 font-mono text-[11px] text-amber-300">
          El navegador no deja sonar nada hasta que toques la pantalla. Activá
          el sonido al empezar el turno.
        </p>
      )}

      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => setFiltro(f.valor)}
            aria-pressed={filtro === f.valor}
            className={[
              "whitespace-nowrap rounded-full px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] transition-colors",
              filtro === f.valor
                ? "bg-white text-ink"
                : "border border-white/15 text-smoke hover:text-white",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-card border border-white/8 py-12 text-center font-mono text-sm text-smoke">
          {filtro === "activos"
            ? "Ningún pedido en curso. Los nuevos entran solos."
            : "Nada por acá."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((pedido) => (
            <TarjetaPedido
              key={pedido.id}
              pedido={pedido}
              ahora={ahora}
              ocupado={ocupado === pedido.id}
              onAvanzar={() => {
                const s = siguienteEstado(pedido.estado);
                if (s) void cambiar(pedido.id, s);
              }}
              onCancelar={() => void cambiar(pedido.id, "cancelado")}
            />
          ))}
        </div>
      )}
    </>
  );
}
