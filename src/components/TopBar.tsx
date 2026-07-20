import { BUSINESS, HORARIO } from "@/lib/config";
import type { EstadoNegocio } from "@/lib/horario";
import { Stamp } from "./Stamp";
import { CartIcon, LogoMark } from "./icons";

export function TopBar({ estado }: { estado: EstadoNegocio }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ink/86 backdrop-blur-[10px]">
      <div className="mx-auto flex h-15 max-w-[1080px] items-center gap-3.5 px-5">
        <LogoMark className="size-[34px] shrink-0" />
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

        {/* TODO(fase 1, paso 5): conectar al carrito real */}
        <button
          type="button"
          disabled
          aria-label="Ver carrito (aún no disponible)"
          className="hidden items-center gap-2 rounded-full bg-casta px-3.5 py-2 font-mono text-[13px] font-bold text-white disabled:opacity-45 sm:inline-flex"
        >
          <CartIcon className="size-4" />0
        </button>
      </div>
      <span className="sr-only">
        {BUSINESS.nombre} — {HORARIO.etiqueta}
      </span>
    </header>
  );
}
