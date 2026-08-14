"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * La foto del producto a pantalla completa.
 *
 * Es solo para mirar: no se pide desde acá. Por eso cierra con cualquier toque
 * —en la foto, al lado, con Escape— en vez de obligar a buscar una X. El botón
 * "Cerrar" queda igual, para el que lo busca y para el lector de pantalla.
 *
 * Va sobre negro y sin marco: las fotos ya vienen sobre fondo negro con
 * reflejo, así que cualquier panel de color les rompería el fondo por la mitad.
 */
export function VisorFoto({
  src,
  nombre,
  onClose,
}: {
  src: string;
  nombre: string;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panel.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onClose]);

  return (
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto de ${nombre}`}
      tabIndex={-1}
      onClick={onClose}
      className="fixed inset-0 z-70 flex flex-col items-center justify-center gap-4 bg-black/95 px-5 py-6 outline-none"
    >
      {/* Alto acotado por la pantalla, no por la foto: en un teléfono apaisado
          una vertical de 1280 px se saldría por abajo. */}
      <Image
        src={src}
        alt={nombre}
        width={1280}
        height={1280}
        sizes="(min-width: 640px) 480px, 92vw"
        priority
        className="max-h-[72vh] w-auto max-w-full rounded-2xl object-contain"
      />

      <p className="font-display text-2xl uppercase tracking-[0.01em] text-white">
        {nombre}
      </p>

      <button
        type="button"
        onClick={onClose}
        className="rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-smoke transition-colors hover:text-white"
      >
        Cerrar
      </button>
    </div>
  );
}
