"use server";

import { waitUntil } from "@vercel/functions";
import { createClient } from "@/lib/supabase/server";
import { avisarClientePush } from "@/lib/push";
import {
  ESTADOS,
  type EstadoPedido,
  type LineaPedido,
  type Pedido,
} from "@/lib/admin/pedidos";

/**
 * Acciones de la pantalla de cocina.
 *
 * Usan el cliente con la sesión del dueño, no la llave secreta: si la sesión
 * venció, la base rechaza la consulta por RLS. Con la llave secreta un fallo
 * de sesión pasaría desapercibido y los pedidos se verían igual.
 */

type FilaLinea = {
  id: string;
  nombre: string;
  cantidad: number;
  subtotal: string | number;
  nota: string | null;
  opciones: {
    proteina?: string;
    extras?: { nombre?: string }[] | string[];
  } | null;
};

type FilaPedido = {
  id: string;
  numero: number;
  cliente_nombre: string;
  cliente_tel: string;
  tipo: "retiro" | "delivery";
  direccion: string | null;
  total: string | number;
  estado: EstadoPedido;
  nota: string | null;
  created_at: string;
  order_items: FilaLinea[];
};

const num = (v: string | number) => (typeof v === "number" ? v : Number(v));

/** Proteína y extras en texto, listos para la tarjeta de cocina. */
function describir(opciones: FilaLinea["opciones"]): string[] {
  if (!opciones) return [];
  const partes: string[] = [];

  if (opciones.proteina) partes.push(opciones.proteina);

  for (const extra of opciones.extras ?? []) {
    // Los pedidos viejos guardaban solo el id del extra. Se ignoran en vez de
    // mostrar un UUID en la pantalla de la cocina.
    if (typeof extra === "object" && extra.nombre) partes.push(extra.nombre);
  }

  return partes;
}

function aPedido(f: FilaPedido): Pedido {
  return {
    id: f.id,
    numero: f.numero,
    clienteNombre: f.cliente_nombre,
    clienteTel: f.cliente_tel,
    tipo: f.tipo,
    direccion: f.direccion ?? undefined,
    total: num(f.total),
    estado: f.estado,
    nota: f.nota ?? undefined,
    creadoISO: f.created_at,
    lineas: (f.order_items ?? []).map(
      (l): LineaPedido => ({
        id: l.id,
        nombre: l.nombre,
        cantidad: l.cantidad,
        opciones: describir(l.opciones),
        nota: l.nota ?? undefined,
        subtotal: num(l.subtotal),
      }),
    ),
  };
}

/**
 * Los pedidos del servicio, más recientes primero.
 *
 * Se limita a los últimos días: una cocina no necesita el histórico completo,
 * y traerlo entero haría más lenta cada actualización en vivo.
 */
export async function listarPedidos(dias = 3): Promise<Pedido[]> {
  const supabase = await createClient();
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, numero, cliente_nombre, cliente_tel, tipo, direccion, total, estado,
       nota, created_at,
       order_items ( id, nombre, cantidad, subtotal, nota, opciones )`,
    )
    .gte("created_at", desde)
    .order("numero", { ascending: false });

  if (error) {
    console.error("No se pudieron leer los pedidos:", error.message);
    return [];
  }

  return (data as unknown as FilaPedido[]).map(aPedido);
}

export async function cambiarEstadoPedido(
  id: string,
  estado: EstadoPedido,
): Promise<{ ok: boolean; error?: string }> {
  if (!ESTADOS.includes(estado)) {
    return { ok: false, error: "Estado inválido." };
  }

  const supabase = await createClient();
  // Devuelve numero y tipo para poder avisarle al cliente con el texto correcto
  const { data, error } = await supabase
    .from("orders")
    .update({ estado })
    .eq("id", id)
    .select("numero, tipo")
    .single();

  if (error || !data) {
    console.error("No se pudo cambiar el estado:", error?.message);
    return { ok: false, error: "No se pudo actualizar el pedido." };
  }

  // Aviso al cliente en segundo plano, solo en los estados que le importan.
  // No bloquea ni puede tumbar el cambio de estado en la cocina.
  waitUntil(
    avisarClientePush(
      id,
      data.numero as number,
      data.tipo as "retiro" | "delivery",
      estado,
    ),
  );

  return { ok: true };
}
