"use client";

import { useEffect, useRef } from "react";

/**
 * Panel que sube desde abajo (móvil primero). Se usa para el configurador de
 * producto y para el carrito.
 */
export function Sheet({
  titulo,
  onClose,
  children,
  pie,
}: {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
  pie?: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // Bloquea el scroll del fondo mientras el panel está abierto
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panel.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        // Sin backdrop-filter a propósito: sobre un negro al 70% no se nota,
        // y en móviles de gama baja el desenfoque a pantalla completa cuesta caro.
        className="absolute inset-0 bg-black/75"
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className="relative flex max-h-[88vh] w-full max-w-[520px] flex-col rounded-t-3xl bg-bone text-bone-ink shadow-2xl outline-none sm:rounded-3xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-bone-line px-5 py-4">
          <h2 className="font-display text-2xl uppercase tracking-[0.01em]">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full px-2 py-1 font-mono text-xs uppercase tracking-[0.08em] text-bone-mute hover:text-bone-ink"
          >
            Cerrar
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {pie && (
          <footer className="border-t border-bone-line px-5 py-4">{pie}</footer>
        )}
      </div>
    </div>
  );
}
