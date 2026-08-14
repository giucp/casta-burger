"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { estadoNegocio, type EstadoNegocio } from "@/lib/horario";

/**
 * Cada cuánto se vuelve a mirar el reloj. Con 15 s, el cambio de las 6:00 PM y
 * el de las 11:00 PM se ven casi al toque y no cuesta nada: es una resta, no
 * una llamada al servidor.
 */
const INTERVALO_MS = 15_000;

function suscribir(alCambiar: () => void) {
  const id = setInterval(alCambiar, INTERVALO_MS);

  /**
   * Un teléfono con la pestaña de fondo congela los temporizadores, y cuando el
   * cliente vuelve pueden haber pasado horas. Sin esto, quien dejó la web
   * abierta a las 5 PM la encontraría todavía "Cerrado" a las 8.
   */
  document.addEventListener("visibilitychange", alCambiar);
  window.addEventListener("focus", alCambiar);

  return () => {
    clearInterval(id);
    document.removeEventListener("visibilitychange", alCambiar);
    window.removeEventListener("focus", alCambiar);
  };
}

/**
 * El instante actual, redondeado a bloques de 15 s.
 *
 * El redondeo no es cosmético: `getSnapshot` tiene que devolver el mismo valor
 * mientras nada cambie, y un `Date.now()` crudo cambia en cada llamada y manda
 * a React a un bucle de renders.
 */
function instante(): number {
  return Math.floor(Date.now() / INTERVALO_MS) * INTERVALO_MS;
}

/** En el servidor no hay reloj propio: vale el estado que vino calculado. */
function enElServidor(): null {
  return null;
}

const Contexto = createContext<EstadoNegocio | null>(null);

/**
 * Mantiene vivo el estado abierto/cerrado en el navegador.
 *
 * El servidor lo calcula bien al cargar la página, pero ahí queda congelado.
 * Sin esto, el cliente que abrió la web a las 5:58 sigue viendo "Cerrado" a
 * las 6:05, y —peor— el que la tenía abierta a las 10:59 puede seguir pidiendo
 * pasadas las 11.
 *
 * El reloj es el del visitante, no el del servidor: la zona horaria no importa
 * (siempre se evalúa contra America/Caracas), pero un teléfono con la hora
 * corrida vería el sello equivocado. Por eso esto es solo la cara visible: el
 * que decide de verdad si un pedido entra es el servidor, en `crearPedido`.
 */
export function EstadoProvider({
  inicial,
  children,
}: {
  /** Estado calculado en el servidor, para el primer pintado y el no-JS */
  inicial: EstadoNegocio;
  children: React.ReactNode;
}) {
  const ahora = useSyncExternalStore(suscribir, instante, enElServidor);

  const estado = useMemo(
    () => (ahora === null ? inicial : estadoNegocio(new Date(ahora))),
    [ahora, inicial],
  );

  return <Contexto value={estado}>{children}</Contexto>;
}

export function useEstadoNegocio(): EstadoNegocio {
  const estado = useContext(Contexto);
  if (!estado) {
    throw new Error("useEstadoNegocio debe usarse dentro de <EstadoProvider>");
  }
  return estado;
}
