"use server";

import { createClient } from "@/lib/supabase/server";
import type { ResumenDia } from "@/lib/admin/datos";

/**
 * Resumen financiero por día, en hora de Caracas.
 *
 * VENTA = PEDIDO ENTREGADO. No alcanza con que el pedido exista: uno que
 * quedó en "nuevo" y nunca se preparó (o uno de broma que nadie canceló) no
 * es plata que entró. Es lo mismo que hacen los POS de restaurante serios:
 * la venta se registra cuando el pedido se cierra, no cuando se anota.
 *
 * El corolario operativo: el cocinero tiene que marcar "Entregado" para que
 * la venta cuente. La pantalla de cocina lo hace con un toque.
 */

function diaCaracas(fecha: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export async function resumenDiario(dias = 14): Promise<ResumenDia[]> {
  const supabase = await createClient();
  const desde = new Date(Date.now() - dias * 86_400_000);

  const [ordenes, compras] = await Promise.all([
    supabase
      .from("orders")
      .select("created_at, total")
      .eq("estado", "entregado")
      .gte("created_at", desde.toISOString()),
    supabase
      .from("purchases")
      .select("fecha, monto")
      .gte("fecha", diaCaracas(desde)),
  ]);

  if (ordenes.error)
    console.error("No se pudieron leer las ventas:", ordenes.error.message);
  if (compras.error)
    console.error("No se pudieron leer las compras:", compras.error.message);

  const porDia = new Map<string, ResumenDia>();
  const fila = (dia: string): ResumenDia => {
    let f = porDia.get(dia);
    if (!f) {
      f = { dia, pedidos: 0, ventas: 0, compras: 0, gananciaNeta: 0 };
      porDia.set(dia, f);
    }
    return f;
  };

  for (const o of ordenes.data ?? []) {
    const f = fila(diaCaracas(new Date(o.created_at as string)));
    f.pedidos += 1;
    f.ventas += Number(o.total);
  }
  for (const c of compras.data ?? []) {
    const f = fila(c.fecha as string);
    f.compras += Number(c.monto);
  }

  return [...porDia.values()]
    .map((f) => ({
      ...f,
      ventas: r2(f.ventas),
      compras: r2(f.compras),
      gananciaNeta: r2(f.ventas - f.compras),
    }))
    .sort((a, b) => b.dia.localeCompare(a.dia));
}

/** La fecha de "hoy" para el negocio, en hora de Caracas. */
export async function hoyCaracas(): Promise<string> {
  return diaCaracas(new Date());
}
