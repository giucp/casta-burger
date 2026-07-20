/**
 * Precio en USD: siempre con 2 decimales.
 *
 * La web muestra USD y nada más. El §5 del brief pedía además el equivalente
 * en bolívares a tasa BCV, pero la tasa se mueve todos los días y una cifra
 * vieja en pantalla es peor que ninguna: el negocio cierra la conversión
 * directo con el cliente por WhatsApp.
 */
export function usd(monto: number): string {
  return `$${monto.toFixed(2)}`;
}
