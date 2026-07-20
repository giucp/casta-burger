import { BUSINESS } from "./config";
import { describirOpciones, subtotalLinea, type LineaCarrito } from "./cart";
import { usd } from "./format";

export type TipoPedido = "retiro" | "delivery";

export type DatosCliente = {
  nombre: string;
  telefono: string;
  tipo: TipoPedido;
  /** Solo si tipo = delivery */
  direccion?: string;
  /** Nota general del pedido */
  nota?: string;
};

/**
 * Resumen del pedido para mandar por WhatsApp, donde se cierra el pago (§5).
 *
 * TODO(fase 1, paso 6): anteponer el N° de pedido que devuelva Supabase.
 * Hoy el mensaje sale sin número porque todavía no se guarda en la base.
 */
export function mensajePedido(
  lineas: LineaCarrito[],
  datos: DatosCliente,
  subtotal: number,
): string {
  const l: string[] = [];

  l.push(`*Nuevo pedido — ${BUSINESS.nombre}*`);
  l.push("");

  for (const linea of lineas) {
    l.push(`• ${linea.cantidad}x ${linea.nombre} — ${usd(subtotalLinea(linea))}`);

    const opciones = describirOpciones(linea.opciones);
    if (opciones.length > 0) l.push(`   ${opciones.join(", ")}`);
    if (linea.nota) l.push(`   Nota: ${linea.nota}`);
  }

  l.push("");
  l.push(`*Total: ${usd(subtotal)}*`);
  l.push("");
  l.push(`Entrega: ${datos.tipo === "delivery" ? "Delivery" : "Retiro en local"}`);
  l.push(`Nombre: ${datos.nombre}`);
  l.push(`Teléfono: ${datos.telefono}`);

  if (datos.tipo === "delivery" && datos.direccion) {
    l.push(`Dirección: ${datos.direccion}`);
  }
  if (datos.nota) {
    l.push(`Nota: ${datos.nota}`);
  }

  if (datos.tipo === "delivery") {
    l.push("");
    l.push("_(Falta acordar el costo de envío)_");
  }

  return l.join("\n");
}

/** Link wa.me con el resumen prellenado. */
export function linkWhatsApp(mensaje: string): string {
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}
