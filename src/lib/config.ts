/**
 * Datos del negocio. En Fase 2 esto se lee de la tabla `settings` de Supabase
 * y se edita desde /admin; por ahora vive acá para poder ver la web corriendo.
 */
export const BUSINESS = {
  nombre: "Casta Burger",
  /**
   * Cómo se presenta el negocio. No es un local con salón: es una cocina, se
   * pide y se busca o se lleva. Va en el hero, en el pie y en la imagen que se
   * ve al compartir el link (esa se regenera con `node scripts/og.mjs`).
   */
  formato: "Dark Kitchen en Barinas",
  ciudad: "Barinas",
  /**
   * Enlace de Google Maps que guía hasta la cocina. Mientras esté vacío, el pie
   * no muestra el "Cómo llegar" — mejor eso que un botón que no lleva a ningún
   * lado.
   */
  mapa: "",
  instagram: "puracasta_",
  /** Número en formato wa.me (sin +, sin espacios). */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "584227105981",
  /** Interruptor manual del dueño. En Fase 2 → settings.acepta_pedidos */
  aceptaPedidos: true,
} as const;

/**
 * Modo mantenimiento: la web pública no muestra NADA salvo el aviso. Ni menú,
 * ni carrito, ni forma de pedir.
 *
 * Se prende y apaga desde las variables de entorno de Vercel, sin tocar el
 * código: `MANTENIMIENTO=1` para apagar la web, borrar la variable (o ponerla
 * en 0) para devolverla. Después de cambiarla hay que redesplegar, que en
 * Vercel es un botón.
 *
 * `/admin` sigue funcionando normal: esto solo tapa la cara pública.
 */
export const MANTENIMIENTO = process.env.MANTENIMIENTO === "1";

/**
 * Modo demo: la web se ve y se usa completa aunque el local esté cerrado.
 *
 * En `false` (producción) manda el §5 del brief: fuera de horario los botones
 * "Agregar" quedan deshabilitados, la barra inferior avisa cuándo abrimos y el
 * servidor rechaza cualquier pedido que igual llegue. El sello Abierto/Cerrado
 * dice la verdad en los dos modos.
 *
 * Se puso en `false` el 14 de agosto de 2026, al empezar a operar de verdad.
 * Solo tiene sentido volver a `true` para mostrar el flujo completo un martes a
 * las 3 PM, y hay que acordarse de devolverlo.
 *
 * TEMPORAL: en `true` desde el 21 de agosto de 2026 para poder probar la
 * pantalla de cocina en vivo fuera del horario. Devolver a `false` al terminar
 * la prueba — mientras esté así, cualquiera que entre a la web puede pedir a
 * cualquier hora y el pedido va a caer en la cocina de verdad.
 */
export const MODO_DEMO = true;

/**
 * Horario de atención: jueves a domingo, 6:00–11:00 PM (hora de Caracas).
 * Días en formato de Date.getDay(): 0 = domingo … 6 = sábado.
 */
export const HORARIO = {
  dias: [4, 5, 6, 0], // jue, vie, sáb, dom
  desde: 18, // 6:00 PM
  hasta: 23, // 11:00 PM
  timeZone: "America/Caracas",
  etiqueta: "Solo Jue–Dom · 6–11 PM",
} as const;
