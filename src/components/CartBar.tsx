import type { EstadoNegocio } from "@/lib/horario";

/**
 * Carrito fijo inferior (§3). Barra roja con conteo, total en $ y ≈ Bs.
 *
 * TODO(fase 1, paso 5): hoy es solo el chasis visual. Falta el estado del
 * carrito, el selector de proteína/extras y el flujo a "Ver pedido".
 */
export function CartBar({ estado }: { estado: EstadoNegocio }) {
  if (!estado.abierto) {
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

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-3.5 bg-casta px-5 py-3.5 text-white shadow-[0_-8px_30px_rgba(0,0,0,.4)]">
      <span className="font-mono text-[13px] font-bold">0 items</span>
      <span className="font-mono text-xs opacity-85">$0.00 · ≈ Bs. 0</span>
      <button
        type="button"
        disabled
        className="ml-auto rounded-full bg-ink px-5.5 py-2.75 font-display text-base uppercase tracking-[0.03em] text-white disabled:opacity-45"
      >
        Ver pedido
      </button>
    </div>
  );
}
