import "server-only";

/**
 * Aviso a la cocina/dueño por Telegram cuando entra un pedido (§7 del brief).
 * Es el respaldo del sonido: aunque no estén viendo la tablet, les vibra el
 * teléfono con el tono de Telegram, que funciona con la pantalla apagada.
 *
 * Cómo se configura (una sola vez):
 *   1. En Telegram, hablar con @BotFather -> /newbot -> anotar el TOKEN.
 *   2. Crear un grupo (ej. "Casta Cocina"), meter al dueño y al cocinero, y
 *      agregar el bot al grupo.
 *   3. Sacar el chat_id del grupo (ver TELEGRAM_CHAT_ID en .env.example).
 *   4. Poner TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en las variables de Vercel.
 *
 * Si no están configuradas, esta función no hace nada (no rompe el pedido).
 */

type AvisoPedido = {
  numero: number;
  tipo: "retiro" | "delivery";
  total: string;
  cliente: string;
  telefono: string;
  direccion?: string | null;
  lineas: {
    cantidad: number;
    nombre: string;
    /** Qué trae la promo. Solo viene en las promos. */
    incluye?: string | null;
    /** La eligió el cliente */
    proteina?: string | null;
    /** Se pagan aparte */
    extras: string[];
    nota?: string | null;
    esPromo: boolean;
  }[];
};

/**
 * Cada ítem en bloque, con los datos etiquetados.
 *
 * Mismo criterio que el mensaje de WhatsApp, y por el mismo motivo: aplanar
 * todo en una fila de comas —"Pollo, Tocineta adicional"— esconde qué eligió
 * el cliente y qué agregó, y deja las promos con el nombre pelado.
 */
function componerMensaje(p: AvisoPedido): string {
  const unidades = p.lineas.reduce((s, l) => s + l.cantidad, 0);
  const l: string[] = [];

  l.push(
    `🔔 *Pedido #${p.numero}* — ${p.tipo === "delivery" ? "Delivery" : "Retiro"}`,
  );
  l.push(`${unidades} ${unidades === 1 ? "producto" : "productos"}`);

  for (const linea of p.lineas) {
    l.push("");
    l.push(
      `*${linea.cantidad}×* ${linea.esPromo ? "PROMO · " : ""}${linea.nombre}`,
    );
    if (linea.esPromo && linea.incluye)
      l.push(`      Incluye: ${linea.incluye}`);
    if (linea.proteina) l.push(`      Proteína: ${linea.proteina}`);
    if (linea.extras.length > 0)
      l.push(`      Extras: ${linea.extras.join(" · ")}`);
    if (linea.nota) l.push(`      *Nota: ${linea.nota}*`);
  }

  l.push("");
  l.push(`*TOTAL: ${p.total}*`);
  l.push(`${p.cliente} · ${p.telefono}`);
  if (p.tipo === "delivery" && p.direccion) l.push(p.direccion);
  return l.join("\n");
}

/**
 * Manda el aviso. Nunca lanza: un fallo de Telegram no puede tumbar la
 * creación del pedido. Devuelve si se envió, solo para los logs.
 */
export async function avisarPedidoTelegram(p: AvisoPedido): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  try {
    const resp = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: componerMensaje(p),
          parse_mode: "Markdown",
        }),
        // No dejar el pedido esperando a Telegram si la API tarda
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!resp.ok) {
      console.error("Telegram respondió", resp.status, await resp.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("No se pudo avisar por Telegram:", e);
    return false;
  }
}
