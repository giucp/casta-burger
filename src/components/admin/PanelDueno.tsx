"use client";

import { useCallback, useEffect, useState } from "react";
import { usd } from "@/lib/format";
import { fechaCorta } from "@/lib/admin/datos";
import {
  antiguedad,
  ESTADO_INFO,
  type Pedido,
} from "@/lib/admin/pedidos";
import { panelHoy, type PanelHoy } from "@/lib/acciones/panel";
import { linkWhatsAppCliente } from "@/lib/whatsapp";
import { createClient } from "@/lib/supabase/client";
import { TextoConEnlaces } from "./TextoConEnlaces";
import { useAhora } from "./useAhora";

/**
 * El negocio visto desde la casa del dueño: si la cocina está tomando los
 * pedidos, qué hay en juego ahora mismo, cuánto se vendió hoy, y el teléfono
 * de cada cliente a un toque para cobrar por WhatsApp.
 *
 * Solo lectura a propósito: los estados los maneja la cocina. Dos personas
 * avanzando el mismo pedido desde pantallas distintas es receta para
 * entregar dos veces.
 */
export function PanelDueno({ inicial }: { inicial: PanelHoy }) {
  const [panel, setPanel] = useState(inicial);
  const [enVivo, setEnVivo] = useState(false);
  const ahora = useAhora();

  const refrescar = useCallback(async () => {
    setPanel(await panelHoy());
  }, []);

  // Mismo patrón que la cocina: Realtime con el token de la sesión, y un
  // respaldo cada 15 s por si la suscripción se cae.
  useEffect(() => {
    const supabase = createClient();
    let canal: ReturnType<typeof supabase.channel> | null = null;
    let vivo = true;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }
      if (!vivo) return;

      canal = supabase
        .channel("panel-pedidos")
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
    })();

    return () => {
      vivo = false;
      if (canal) void supabase.removeChannel(canal);
    };
  }, [refrescar]);

  useEffect(() => {
    const id = setInterval(() => void refrescar(), 15_000);
    return () => clearInterval(id);
  }, [refrescar]);

  const sinTomar = panel.activos.filter((p) => p.estado === "nuevo");
  const preparando = panel.activos.filter((p) => p.estado === "preparando");
  const listos = panel.activos.filter((p) => p.estado === "listo");
  const masViejo = sinTomar[0];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-2 font-display text-4xl uppercase tracking-[0.01em]">
          Panel
        </h1>
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-smoke">
          hoy {fechaCorta(panel.hoy)}
        </span>
        <span className="flex-1" />
        <span
          className={`font-mono text-[11px] uppercase tracking-[0.08em] ${
            enVivo ? "text-emerald-400" : "text-smoke"
          }`}
        >
          {enVivo ? "En vivo" : "Conectando…"}
        </span>
      </div>

      {/* La alerta que importa: la cocina no está tomando pedidos */}
      {sinTomar.length > 0 && (
        <div className="mb-4 rounded-card border-2 border-casta bg-casta/10 px-4 py-3">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-casta">
            La cocina no ha tomado {sinTomar.length}{" "}
            {sinTomar.length === 1 ? "pedido" : "pedidos"}
            {masViejo && ahora !== null && (
              <> · el más viejo espera {antiguedad(masViejo.creadoISO, ahora).replace("hace ", "")}</>
            )}
          </p>
        </div>
      )}

      {/* El pulso del servicio */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Mini
          etiqueta="Sin tomar"
          valor={sinTomar.length}
          tono={sinTomar.length > 0 ? "malo" : "normal"}
        />
        <Mini etiqueta="En preparación" valor={preparando.length} tono="ambar" />
        <Mini
          etiqueta="Listos para entregar"
          valor={listos.length}
          tono={listos.length > 0 ? "bueno" : "normal"}
        />
        <Mini etiqueta="Entregados hoy" valor={panel.resumen.pedidos} />
      </div>

      {/* La plata del día */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Dinero etiqueta="Ventas hoy" valor={panel.resumen.ventas} />
        <Dinero etiqueta="Compras hoy" valor={panel.resumen.compras} tono="malo" />
        <Dinero
          etiqueta="Ganancia hoy"
          valor={panel.resumen.gananciaNeta}
          tono={panel.resumen.gananciaNeta >= 0 ? "bueno" : "malo"}
        />
      </div>

      {panel.bajoStock.length > 0 && (
        <div className="mb-6 rounded-card border border-casta/40 bg-casta/10 px-4 py-3">
          <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-casta">
            {panel.bajoStock.length} en bajo stock
          </p>
          <p className="text-sm text-ash">
            {panel.bajoStock.map((i) => i.nombre).join(" · ")}
          </p>
        </div>
      )}

      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-smoke">
        En juego ahora ({panel.activos.length})
      </h2>
      {panel.activos.length === 0 ? (
        <p className="mb-6 rounded-card border border-white/8 py-8 text-center font-mono text-sm text-smoke">
          Nada en curso. Los pedidos nuevos aparecen solos.
        </p>
      ) : (
        <ul className="mb-6 overflow-hidden rounded-card border border-white/8">
          {panel.activos.map((p) => (
            <FilaPedido key={p.id} pedido={p} ahora={ahora} />
          ))}
        </ul>
      )}

      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-smoke">
        Entregados hoy ({panel.entregadosHoy.length})
      </h2>
      {panel.entregadosHoy.length === 0 ? (
        <p className="mb-6 rounded-card border border-white/8 py-8 text-center font-mono text-sm text-smoke">
          Todavía no se entregó ninguno.
        </p>
      ) : (
        <ul className="mb-6 overflow-hidden rounded-card border border-white/8">
          {panel.entregadosHoy.map((p) => (
            <FilaPedido key={p.id} pedido={p} ahora={ahora} compacta />
          ))}
        </ul>
      )}

      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-smoke">
        Últimos 14 días
      </h2>
      {panel.historico.length === 0 ? (
        <p className="rounded-card border border-white/8 py-8 text-center font-mono text-sm text-smoke">
          Sin movimientos todavía.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-white/8">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="bg-card font-mono text-[10px] uppercase tracking-[0.1em] text-smoke">
                <th className="px-4 py-2.5 font-normal">Día</th>
                <th className="px-4 py-2.5 text-right font-normal">Entregados</th>
                <th className="px-4 py-2.5 text-right font-normal">Ventas</th>
                <th className="px-4 py-2.5 text-right font-normal">Compras</th>
                <th className="px-4 py-2.5 text-right font-normal">Ganancia</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {panel.historico.map((f) => (
                <tr key={f.dia} className="border-t border-white/8">
                  <td className="px-4 py-3 capitalize">{fechaCorta(f.dia)}</td>
                  <td className="px-4 py-3 text-right">{f.pedidos}</td>
                  <td className="px-4 py-3 text-right">{usd(f.ventas)}</td>
                  <td className="px-4 py-3 text-right text-smoke">
                    {f.compras > 0 ? usd(f.compras) : "—"}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${
                      f.gananciaNeta >= 0 ? "text-emerald-400" : "text-casta"
                    }`}
                  >
                    {usd(f.gananciaNeta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Mini({
  etiqueta,
  valor,
  tono = "normal",
}: {
  etiqueta: string;
  valor: number;
  tono?: "normal" | "malo" | "bueno" | "ambar";
}) {
  const color =
    tono === "malo"
      ? "text-casta"
      : tono === "bueno"
        ? "text-emerald-400"
        : tono === "ambar"
          ? "text-amber-400"
          : "text-white";
  return (
    <div className="rounded-card border border-white/8 bg-card px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-smoke">
        {etiqueta}
      </p>
      <p className={`mt-0.5 font-mono text-2xl font-bold ${color}`}>{valor}</p>
    </div>
  );
}

function Dinero({
  etiqueta,
  valor,
  tono = "normal",
}: {
  etiqueta: string;
  valor: number;
  tono?: "normal" | "malo" | "bueno";
}) {
  const color =
    tono === "malo"
      ? "text-casta"
      : tono === "bueno"
        ? "text-emerald-400"
        : "text-white";
  return (
    <div className="rounded-card border border-white/8 bg-card px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-smoke">
        {etiqueta}
      </p>
      <p className={`mt-0.5 font-mono text-xl font-bold ${color}`}>
        {usd(valor)}
      </p>
    </div>
  );
}

function FilaPedido({
  pedido,
  ahora,
  compacta = false,
}: {
  pedido: Pedido;
  ahora: number | null;
  compacta?: boolean;
}) {
  const info = ESTADO_INFO[pedido.estado];
  const waCliente = linkWhatsAppCliente(pedido.clienteTel);
  const items = pedido.lineas
    .map((l) => `${l.cantidad}× ${l.nombre}`)
    .join(", ");

  return (
    <li className="border-b border-white/8 px-4 py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="font-display text-2xl leading-none">
          #{pedido.numero}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-white ${info.fondo}`}
        >
          {info.etiqueta}
        </span>
        <span className="font-mono text-[11px] text-smoke">
          {pedido.tipo === "delivery" ? "Delivery" : "Retiro"}
          {ahora !== null && ` · ${antiguedad(pedido.creadoISO, ahora)}`}
        </span>
        <span className="ml-auto font-mono text-sm font-bold">
          {usd(pedido.total)}
        </span>
      </div>

      {!compacta && (
        <p className="mt-1.5 text-[13px] text-ash">{items}</p>
      )}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-smoke">
        <span>
          {pedido.clienteNombre} · {pedido.clienteTel}
        </span>
        {pedido.direccion && !compacta && (
          <span className="basis-full">
            <TextoConEnlaces texto={pedido.direccion} />
          </span>
        )}
        {waCliente && (
          <a
            href={waCliente}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/20 px-2.5 py-0.5 uppercase tracking-[0.06em] transition-colors hover:border-emerald-500 hover:text-emerald-400"
          >
            Cobrar por WhatsApp
          </a>
        )}
      </div>
    </li>
  );
}
