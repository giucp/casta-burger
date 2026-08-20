import { BUSINESS } from "./config";
import { subtotalLinea, type LineaCarrito } from "./cart";
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
 * Un ítem del pedido, en varias líneas.
 *
 * Este formato existe porque el dueño despachó mal dos pedidos leyendo el
 * mensaje viejo, que ponía todo en una fila aplanada:
 *
 *     • 1x Casta Burger — $12.49
 *        Pollo, Tocineta adicional, Salsa de la casa
 *
 * Ahí no se distingue qué eligió el cliente de qué agregó, y las promos salían
 * con el nombre pelado: "1x 2x1 en Cheese Burger" obliga a acordarse de cuántas
 * hamburguesas son. Leído rápido, en una cocina, eso es un pedido mal armado.
 *
 * Ahora cada dato va etiquetado y en su renglón, y entre ítem e ítem hay una
 * línea en blanco para que se lean como bloques y no como una lista corrida.
 */
function bloqueDeLinea(linea: LineaCarrito): string[] {
  const filas: string[] = [];
  const esPromo = linea.categoria === "Promos";

  /**
   * La cantidad va en negrita y primero. Es el dato que más caro sale
   * confundir, y "1x 2x1 en Cheese Burger" es justamente el caso donde el ojo
   * se pierde entre dos números pegados.
   */
  const precio =
    linea.cantidad > 1
      ? `${usd(linea.precioUnitario)} c/u · ${usd(subtotalLinea(linea))}`
      : usd(subtotalLinea(linea));

  filas.push(
    `*${linea.cantidad}×* ${esPromo ? "PROMO · " : ""}${linea.nombre} — ${precio}`,
  );

  // Qué trae la promo. Sin esto hay que saberse el menú de memoria.
  if (esPromo && linea.descripcion) {
    filas.push(`      Incluye: ${linea.descripcion}`);
  }

  // La proteína es una ELECCIÓN del cliente; los extras son agregados que
  // cuestan aparte. Antes iban mezclados en la misma lista de comas.
  if (linea.opciones.proteina) {
    filas.push(`      Proteína: ${linea.opciones.proteina}`);
  }

  if (linea.opciones.extras.length > 0) {
    const extras = linea.opciones.extras
      .map((e) => `${e.nombre} (+${usd(e.precio)})`)
      .join(" · ");
    filas.push(`      Extras: ${extras}`);
  }

  // La nota es lo que más se pasa por alto y lo que más molesta al cliente si
  // se ignora, así que va en negrita.
  if (linea.nota) {
    filas.push(`      *Nota: ${linea.nota}*`);
  }

  return filas;
}

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

  const unidades = lineas.reduce((s, x) => s + x.cantidad, 0);

  l.push(`*Pedido #${numero} — ${BUSINESS.nombre}*`);
  l.push(
    `${datos.tipo === "delivery" ? "Delivery" : "Retiro en local"} · ${unidades} ${unidades === 1 ? "producto" : "productos"}`,
  );

  for (const linea of lineas) {
    // Renglón en blanco ANTES de cada ítem: así cada uno es un bloque y no una
    // lista corrida donde se saltan renglones sin querer.
    l.push("");
    l.push(...bloqueDeLinea(linea));
  }

  l.push("");
  l.push(`*TOTAL: ${usd(subtotal)}*`);
  l.push("");
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
