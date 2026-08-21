"use server";

import { listarPedidos } from "./cocina";
import { listarInventario, type ItemInventario } from "./inventario";
import { hoyCaracas, resumenDiario } from "./numeros";
import type { Pedido } from "@/lib/admin/pedidos";
import { ESTADOS_ACTIVOS } from "@/lib/admin/pedidos";
import type { ResumenDia } from "@/lib/admin/datos";

/**
 * Todo lo que el dueño necesita ver desde su casa, en una sola llamada:
 * qué hay en juego ahora mismo, cuánto se vendió hoy, y qué falta comprar.
 */
export type PanelHoy = {
  hoy: string;
  /** Pedidos en juego (nuevo/preparando/listo), los más viejos primero */
  activos: Pedido[];
  /** Entregados de hoy, los más recientes primero */
  entregadosHoy: Pedido[];
  /**
   * Anulados de hoy. Van aparte y no mezclados con los entregados porque no
   * suman a las ventas: mostrarlos en la misma lista sería mostrar plata que
   * no entró. Están para poder devolverlos si se anuló uno por error.
   */
  anuladosHoy: Pedido[];
  /** La fila financiera de hoy */
  resumen: ResumenDia;
  /** Historial de los últimos 14 días */
  historico: ResumenDia[];
  bajoStock: ItemInventario[];
};

function diaCaracas(fecha: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}

export async function panelHoy(): Promise<PanelHoy> {
  const [pedidos, inventario, historico, hoy] = await Promise.all([
    listarPedidos(2),
    listarInventario(),
    resumenDiario(),
    hoyCaracas(),
  ]);

  const activos = pedidos
    .filter((p) => ESTADOS_ACTIVOS.includes(p.estado))
    // Los más viejos primero: son los que más urgen
    .sort((a, b) => a.numero - b.numero);

  const deHoy = (p: Pedido) => diaCaracas(new Date(p.creadoISO)) === hoy;

  const entregadosHoy = pedidos.filter((p) => p.estado === "entregado" && deHoy(p));
  const anuladosHoy = pedidos.filter((p) => p.estado === "cancelado" && deHoy(p));

  const resumen = historico.find((f) => f.dia === hoy) ?? {
    dia: hoy,
    pedidos: 0,
    ventas: 0,
    compras: 0,
    gananciaNeta: 0,
  };

  return {
    hoy,
    activos,
    entregadosHoy,
    anuladosHoy,
    resumen,
    historico,
    bajoStock: inventario.filter((i) => i.cantidad <= i.umbralAlerta),
  };
}
