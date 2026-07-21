"use client";

import { useSyncExternalStore } from "react";

const INTERVALO_MS = 30_000;

function suscribir(alCambiar: () => void) {
  const id = setInterval(alCambiar, INTERVALO_MS);
  return () => clearInterval(id);
}

/**
 * El instante actual, redondeado a bloques de 30 s.
 *
 * El redondeo no es cosmético: `getSnapshot` tiene que devolver el mismo valor
 * mientras nada cambie, y un `Date.now()` crudo cambia en cada llamada y manda
 * a React a un bucle de renders.
 */
function instantar(): number {
  return Math.floor(Date.now() / INTERVALO_MS) * INTERVALO_MS;
}

/** En el servidor no hay "ahora": devuelve null y el cliente lo completa. */
function enElServidor(): null {
  return null;
}

/**
 * Reloj para los "hace 4 min" de la pantalla de cocina.
 *
 * Va por `useSyncExternalStore` y no por `useEffect` + `setState`: el reloj es
 * un sistema externo a React, y así no hay ni desajuste de hidratación ni
 * renders en cascada.
 */
export function useAhora(): number | null {
  return useSyncExternalStore(suscribir, instantar, enElServidor);
}
