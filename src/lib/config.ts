/**
 * Datos del negocio. En Fase 2 esto se lee de la tabla `settings` de Supabase
 * y se edita desde /admin; por ahora vive acá para poder ver la web corriendo.
 */
export const BUSINESS = {
  nombre: "Casta Burger",
  zona: "Alto Barinas",
  ciudad: "Barinas, Venezuela",
  instagram: "puracasta_",
  /** Número en formato wa.me (sin +, sin espacios). PENDIENTE: poner el real. */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  /** Interruptor manual del dueño. En Fase 2 → settings.acepta_pedidos */
  aceptaPedidos: true,
} as const;

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

/**
 * Tasa BCV para mostrar el equivalente en bolívares.
 * Los precios se guardan y calculan SIEMPRE en USD (§5 del brief).
 * PENDIENTE: alimentar de settings.tasa_bcv (editable en /admin).
 */
export const TASA_BCV = 40;
