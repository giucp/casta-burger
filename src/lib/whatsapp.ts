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
  /** Enlace de Maps con la ubicación GPS que compartió el cliente */
  ubicacionUrl?: string;
  /** Nota general del pedido */
  nota?: string;
};

/**
 * Resumen del pedido para mandar por WhatsApp, donde se cierra el pago (§5).
 *
 * El N° y el total son los que devolvió el servidor al guardar el pedido, no
 * los que calculó el navegador: así el mensaje dice exactamente lo mismo que
 * ve el dueño en la pantalla de cocina.
 */
export function mensajePedido(
  lineas: LineaCarrito[],
  datos: DatosCliente,
  subtotal: number,
  numero: number,
): string {
  const l: string[] = [];

  l.push(`*Pedido #${numero} — ${BUSINESS.nombre}*`);
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
  if (datos.tipo === "delivery" && datos.ubicacionUrl) {
    l.push(`Ubicación: ${datos.ubicacionUrl}`);
  }
  if (datos.nota) {
    l.push(`Nota: ${datos.nota}`);
  }

  if (datos.tipo === "delivery") {
    l.push("");
    l.push("_(Falta acordar el costo de envío)_");
  }

  l.push("");
  l.push("_Pedido ya registrado en el sistema._");

  return l.join("\n");
}

/** Link wa.me con el resumen prellenado. */
export function linkWhatsApp(mensaje: string): string {
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Enlace para escribirle al CLIENTE de un pedido (el dueño cobra por ahí).
 * Convierte el teléfono local venezolano a formato internacional:
 * "0414 1234567" -> wa.me/584141234567.
 */
export function linkWhatsAppCliente(telefono: string): string | null {
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const intl = digitos.startsWith("58")
    ? digitos
    : digitos.startsWith("0")
      ? "58" + digitos.slice(1)
      : "58" + digitos;
  return `https://wa.me/${intl}`;
}
