import { usd } from "@/lib/format";
import { PROMOS } from "@/lib/promos";

/**
 * Promos, dentro del panel hueso del menú.
 *
 * Van en tarjetas con borde rojo para que salten sobre las listas de Extras y
 * Bebidas, que son filas planas. El ahorro se muestra solo cuando existe de
 * verdad: tachar un precio que no es más alto es publicidad engañosa.
 */
export function Promos() {
  if (PROMOS.length === 0) return null;

  return (
    <ul className="mt-2 grid gap-3 sm:grid-cols-2">
      {PROMOS.map((promo) => {
        const ahorro =
          promo.precioSuelto !== undefined && promo.precioSuelto > promo.precio
            ? promo.precioSuelto - promo.precio
            : null;

        return (
          <li
            key={promo.id}
            className="flex flex-col rounded-card border-2 border-casta bg-casta/5 px-4 py-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-xl uppercase leading-tight tracking-[0.01em]">
                {promo.titulo}
              </h3>
              <span className="shrink-0 whitespace-nowrap text-right font-mono text-lg font-bold text-casta">
                {usd(promo.precio)}
              </span>
            </div>

            <p className="mt-1.5 text-[13.5px] text-bone-soft">
              {promo.detalle}
            </p>

            {(ahorro || promo.condicion) && (
              <p className="mt-2 flex flex-wrap gap-x-3 font-mono text-[10px] uppercase tracking-[0.08em] text-bone-mute">
                {ahorro && (
                  <span>
                    Suelto {usd(promo.precioSuelto!)} · ahorrás {usd(ahorro)}
                  </span>
                )}
                {promo.condicion && <span>{promo.condicion}</span>}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
