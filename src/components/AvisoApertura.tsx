"use client";

import { useEstadoNegocio } from "./EstadoNegocio";

/**
 * "Abrimos mañana a las 6:00 PM", debajo del texto del hero.
 *
 * Va aparte del `Hero` —que se renderiza en el servidor— solo para que la línea
 * se actualice sola cuando el reloj cruza la hora de apertura o la de cierre.
 */
export function AvisoApertura() {
  const estado = useEstadoNegocio();

  if (estado.abierto || !estado.proximaApertura) return null;

  return (
    <p className="mb-5.5 font-mono text-[13px] text-smoke">
      {estado.proximaApertura}.
    </p>
  );
}
