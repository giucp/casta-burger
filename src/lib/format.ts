import { TASA_BCV } from "./config";

/** Precio en USD: siempre con 2 decimales, es la moneda de verdad. */
export function usd(monto: number): string {
  return `$${monto.toFixed(2)}`;
}

/** Equivalente en bolívares a tasa BCV. Secundario, siempre aproximado. */
export function bs(monto: number, tasa: number = TASA_BCV): string {
  const valor = monto * tasa;
  return `≈ Bs. ${valor.toLocaleString("es-VE", {
    maximumFractionDigits: 0,
  })}`;
}
