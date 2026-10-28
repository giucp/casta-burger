"use client";

import { useEffect, useState } from "react";
import { SUSCRIPCION } from "@/lib/config";

/**
 * Ventana de recordatorio que aparece al entrar al panel cuando la cuota está
 * por vencer (ver `cuotaPorVencer`).
 *
 * Aparece una vez por sesión del navegador y por fecha de cobro: quien la
 * cierra no la vuelve a ver al pasar de Cocina a Inventario, pero sí la próxima
 * vez que abra el panel. Si el navegador no deja guardar eso, se muestra igual
 * —peor sería que un recordatorio de cobro no llegue.
 */
export function RecordatorioCuota({
  pagadoHasta,
  dias,
}: {
  pagadoHasta: string;
  dias: number;
}) {
  const clave = `casta-recordatorio-cuota-${pagadoHasta}`;
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    let visto = false;
    try {
      visto = sessionStorage.getItem(clave) === "1";
    } catch {}
    // Se decide en el navegador: el servidor no sabe qué hay en sessionStorage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!visto) setAbierto(true);
  }, [clave]);

  const cerrar = () => {
    setAbierto(false);
    try {
      sessionStorage.setItem(clave, "1");
    } catch {}
  };

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  if (!abierto) return null;

  const fecha = new Intl.DateTimeFormat("es-VE", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(pagadoHasta));

  const cuando =
    dias === 0 ? "vence hoy" : dias === 1 ? "vence mañana" : `vence en ${dias} días`;

  const mensaje = `Hola ${SUSCRIPCION.proveedor}, quiero reportar el pago de la cuota mensual de Casta Burger.`;
  const enlace = `https://wa.me/${SUSCRIPCION.whatsapp}?text=${encodeURIComponent(mensaje)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={cerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recordatorio-cuota-titulo"
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-char p-6 pt-7 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-xl leading-none text-smoke transition-colors hover:bg-white/10 hover:text-white"
        >
          ×
        </button>

        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-casta">
          Recordatorio de pago
        </p>

        <h2
          id="recordatorio-cuota-titulo"
          className="mt-3 font-display text-3xl uppercase leading-[0.95] tracking-[0.01em]"
        >
          Tu cuota {cuando}
        </h2>

        <p className="mt-4 text-[15px] leading-relaxed text-ash">
          La cuota mensual de{" "}
          <b className="text-white">${SUSCRIPCION.montoUsd} a tasa BCV</b> vence
          el <b className="text-white">{fecha}</b>. Reporta tu pago a tiempo
          para que tu web y tu panel sigan funcionando sin interrupciones.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <a
            href={enlace}
            target="_blank"
            rel="noopener noreferrer"
            onClick={cerrar}
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/50"
          >
            Reportar pago
          </a>
          <button
            type="button"
            onClick={cerrar}
            autoFocus
            className="inline-flex items-center justify-center rounded-full bg-casta px-7 py-3 font-mono text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-casta-deep"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
