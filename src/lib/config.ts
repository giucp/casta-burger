/**
 * Datos del negocio. En Fase 2 esto se lee de la tabla `settings` de Supabase
 * y se edita desde /admin; por ahora vive acá para poder ver la web corriendo.
 */
export const BUSINESS = {
  nombre: "Casta Burger",
  zona: "Alto Barinas",
  ciudad: "Barinas, Venezuela",
  instagram: "puracasta_",
  /** Número en formato wa.me (sin +, sin espacios). */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "584227105981",
  /** Interruptor manual del dueño. En Fase 2 → settings.acepta_pedidos */
  aceptaPedidos: true,
} as const;

/**
 * Modo demo: la web se ve y se usa completa aunque el local esté cerrado.
 *
 * El §5 del brief pide deshabilitar los botones "Agregar" fuera de horario, y
 * es lo correcto en producción. Pero mientras se muestra el diseño hace falta
 * poder recorrer el flujo entero un martes a las 3 PM.
 *
 * IMPORTANTE: PONER EN `false` ANTES DE SALIR A PRODUCCIÓN. Con eso solo, vuelve el
 * comportamiento del brief: fuera de horario no se puede pedir.
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
