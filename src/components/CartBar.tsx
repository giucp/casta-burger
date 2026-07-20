"use client";

import { usd } from "@/lib/format";
import type { EstadoNegocio } from "@/lib/horario";
import { useCart } from "./cart/CartProvider";
import { useCartUI } from "./cart/CartUI";

/**
 * Carrito fijo inferior (§3). Barra roja con conteo y total en USD.
 */
export function CartBar({ estado }: { estado: EstadoNegocio }) {
  const { cantidad, subtotal } = useCart();
  const { abrirCarrito } = useCartUI();

  if (!estado.puedePedir) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-3.5 border-t border-white/8 bg-char px-5 py-3.5 shadow-[0_-8px_30px_rgba(0,0,0,.4)]">
        <span className="font-mono text-[13px] font-bold text-smoke">
          Cerrado
        </span>
        <span className="font-mono text-xs text-smoke/85">
          {estado.proximaApertura}
        </span>
      </div>
    );
  }

  const vacio = cantidad === 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-3.5 bg-casta px-5 py-3.5 text-white shadow-[0_-8px_30px_rgba(0,0,0,.4)]">
      {vacio ? (
        <span className="font-mono text-xs opacity-85">
          Elegí algo del menú
        </span>
      ) : (
        <>
          <span className="font-mono text-[13px] font-bold">
            {cantidad} {cantidad === 1 ? "item" : "items"}
          </span>
          <span className="font-mono text-xs opacity-85">{usd(subtotal)}</span>
        </>
      )}
      <button
        type="button"
        disabled={vacio}
        onClick={abrirCarrito}
        className="ml-auto shrink-0 whitespace-nowrap rounded-full bg-ink px-5.5 py-2.75 font-display text-base uppercase tracking-[0.03em] text-white transition-opacity disabled:opacity-45"
      >
        Ver pedido
      </button>
    </div>
  );
}
