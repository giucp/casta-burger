import Image from "next/image";
import { BUSINESS, HORARIO } from "@/lib/config";
import type { EstadoNegocio } from "@/lib/horario";
import { Stamp } from "./Stamp";

export function Hero({ estado }: { estado: EstadoNegocio }) {
  return (
    <section className="relative overflow-hidden border-b border-white/8">
      {/* Pieza real de la identidad de la marca, del pliego del diseñador.
          Reemplaza la ilustración de línea que era un placeholder mío. */}
      <Image
        src="/marca/plancha.png"
        alt=""
        aria-hidden
        width={599}
        height={441}
        priority
        // Apoyada en el borde inferior, no cortada por él: hundida no se
        // entiende que es una mano aplastando la carne en la plancha.
        // En móvil va más chica y tenue porque se cruza con los botones.
        className="pointer-events-none absolute right-0 bottom-0 z-1 w-[38%] opacity-35 sm:-right-4 sm:w-[min(46%,380px)] sm:opacity-100"
      />

      <div className="relative z-2 mx-auto max-w-[1080px] px-5 pt-10 pb-11">
        <div className="mb-4.5 flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-smoke">
          {/* Informativo, no de estado: va siempre en rojo. El sello que
              cambia a gris es el del top bar. */}
          <Stamp punto>{HORARIO.etiqueta}</Stamp>
          <span>{BUSINESS.formato}</span>
        </div>

        <h1 className="font-display text-[clamp(52px,15vw,116px)] uppercase leading-[0.86] tracking-[0.005em]">
          Somos
          <br />
          <span className="text-casta">Casta.</span>
        </h1>

        <p className="my-5.5 max-w-110 text-base text-ash">
          Hamburguesas smash de verdad. Pan de batata, queso facilista y salsa de
          la casa. Pide por acá y recógela — o te la llevamos.
        </p>

        {!estado.abierto && estado.proximaApertura && (
          <p className="mb-5.5 font-mono text-[13px] text-smoke">
            {estado.proximaApertura}.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <a
            href="#menu"
            className="rounded-full bg-casta px-6.5 py-3.5 font-display text-[17px] uppercase tracking-[0.03em] text-white transition-colors hover:bg-casta-deep"
          >
            Ver el menú
          </a>
          <a
            href="#promos"
            className="rounded-full px-6.5 py-3.5 font-display text-[17px] uppercase tracking-[0.03em] text-white shadow-[inset_0_0_0_2px_rgba(255,255,255,.22)] transition-shadow hover:shadow-[inset_0_0_0_2px_#fff]"
          >
            Promos
          </a>
        </div>
      </div>
    </section>
  );
}
