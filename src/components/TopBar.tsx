"use client";

import { BUSINESS, HORARIO } from "@/lib/config";
import type { EstadoNegocio } from "@/lib/horario";
import { useCart } from "./cart/CartProvider";
import { useCartUI } from "./cart/CartUI";
import { Stamp } from "./Stamp";
import { CartIcon } from "./icons";
import { LogoMarca } from "./LogoMarca";

export function TopBar({ estado }: { estado: EstadoNegocio }) {
  const { cantidad } = useCart();
  const { abrirCarrito } = useCartUI();

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ink/86 backdrop-blur-[10px]">
      <div className="mx-auto flex h-15 max-w-[1080px] items-center gap-3.5 px-5">
        <LogoMarca className="size-10 shrink-0" />
        <span className="font-display text-xl uppercase tracking-[0.02em]">
          Casta <b className="font-normal text-casta">Burger</b>
        </span>

        <span className="flex-1" />

        <Stamp
          tono={estado.abierto ? "rojo" : "apagado"}
          punto
          title={`Horario: ${HORARIO.etiqueta}`}
        >
          {estado.etiqueta}
        </Stamp>

        {/* Solo aparece cuando hay algo: un carrito en 0 es ruido */}
        {cantidad > 0 && (
          <button
            type="button"
            onClick={abrirCarrito}
            aria-label={`Ver pedido, ${cantidad} items`}
            className="inline-flex items-center gap-2 rounded-full bg-casta px-3.5 py-2 font-mono text-[13px] font-bold text-white transition-colors hover:bg-casta-deep"
          >
            <CartIcon className="size-4" />
            {cantidad}
          </button>
        )}
      </div>
      <span className="sr-only">
        {BUSINESS.nombre} — {HORARIO.etiqueta}
      </span>
    </header>
  );
}
