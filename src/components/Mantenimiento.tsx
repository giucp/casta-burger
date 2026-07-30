import { BUSINESS } from "@/lib/config";
import { LogoMarca } from "./LogoMarca";

/**
 * Pantalla única cuando la web está en mantenimiento.
 *
 * No muestra menú, ni precios, ni forma de pedir, ni contacto: es una puerta
 * cerrada con un cartel, no una versión reducida del sitio. El tono es neutro
 * a propósito — el cliente final no tiene por qué enterarse de por qué está
 * abajo.
 */
export function Mantenimiento() {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center px-6 text-center">
      <LogoMarca className="size-20" />

      <h1 className="mt-7 font-display text-[clamp(34px,10vw,58px)] uppercase leading-[0.9] tracking-[0.01em]">
        En
        <br />
        <span className="text-casta">mantenimiento</span>
      </h1>

      <p className="mt-5 max-w-80 text-[15px] text-ash">
        Estamos trabajando en la página. Vuelve a intentarlo en un rato.
      </p>

      <p className="mt-9 font-mono text-[11px] uppercase tracking-[0.2em] text-smoke">
        {BUSINESS.nombre}
      </p>
    </main>
  );
}
