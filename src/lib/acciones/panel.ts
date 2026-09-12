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

/**
 * Lo que se mueve durante el servicio: los pedidos y el stock.
 *
 * Va aparte del resumen financiero porque cambia a otro ritmo. Un pedido que
 * pasa de "nuevo" a "preparando" mueve esto y no mueve la plata, y hasta acá
 * cada uno de esos toques recalculaba también los catorce días —tres consultas
 * más, una de ellas sobre `consumos`— para llegar al mismo número.
 */
export type PulsoHoy = {
  hoy: string;
  activos: Pedido[];
  entregadosHoy: Pedido[];
  anuladosHoy: Pedido[];
  bajoStock: ItemInventario[];
};

export async function pulsoHoy(): Promise<PulsoHoy> {
  const [pedidos, inventario, hoy] = await Promise.all([
    listarPedidos(2),
    listarInventario(),
    hoyCaracas(),
  ]);

  const activos = pedidos
    .filter((p) => ESTADOS_ACTIVOS.includes(p.estado))
    // Los más viejos primero: son los que más urgen
    .sort((a, b) => a.numero - b.numero);

  const deHoy = (p: Pedido) => diaCaracas(new Date(p.creadoISO)) === hoy;

  return {
    hoy,
    activos,
    entregadosHoy: pedidos.filter((p) => p.estado === "entregado" && deHoy(p)),
    anuladosHoy: pedidos.filter((p) => p.estado === "cancelado" && deHoy(p)),
    bajoStock: inventario.filter((i) => i.cantidad <= i.umbralAlerta),
  };
}

export async function panelHoy(): Promise<PanelHoy> {
  const [pulso, historico] = await Promise.all([pulsoHoy(), resumenDiario()]);

  const resumen = historico.find((f) => f.dia === pulso.hoy) ?? {
    dia: pulso.hoy,
    pedidos: 0,
    ventas: 0,
    costoVendido: 0,
    sinCosto: 0,
    ganancia: 0,
    gastos: 0,
  };

  return { ...pulso, resumen, historico };
}
