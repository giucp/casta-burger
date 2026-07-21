"use client";

import { usd } from "@/lib/format";
import type { MenuItem } from "@/lib/menu";
import { useCartUI } from "./cart/CartUI";

/**
 * Promos, dentro del panel hueso del menú.
 *
 * Son filas de `menu_items` como cualquier otro producto, así que se agregan
 * al carrito por el mismo camino y el servidor les pone el precio. Lo único
 * distinto es cómo se ven: tarjetas con borde rojo, para que salten sobre las
 * listas planas de Extras y Bebidas.
 */
export function Promos({
  items,
  puedePedir,
}: {
  items: MenuItem[];
  puedePedir: boolean;
}) {
  const { abrirProducto } = useCartUI();

  if (items.length === 0) return null;

  return (
    <ul className="mt-2 grid gap-3 sm:grid-cols-2">
      {items.map((promo) => {
        const agotada = !promo.disponible;
        const deshabilitada = agotada || !puedePedir || promo.precio === null;

        // El ahorro se muestra solo si existe de verdad: tachar un precio que
        // no es más alto que el de la promo es publicidad engañosa.
        const ahorro =
          promo.precioSuelto !== undefined &&
          promo.precio !== null &&
          promo.precioSuelto > promo.precio
            ? promo.precioSuelto - promo.precio
            : null;

        return (
          <li
            key={promo.id}
            className={`flex flex-col rounded-card border-2 border-casta bg-casta/5 px-4 py-3.5 ${
              agotada ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-xl uppercase leading-tight tracking-[0.01em]">
                {promo.nombre}
              </h3>
              <span className="shrink-0 whitespace-nowrap text-right font-mono text-lg font-bold text-casta">
                {promo.precio !== null ? usd(promo.precio) : "Consultar"}
              </span>
            </div>

            {promo.descripcion && (
              <p className="mt-1.5 text-[13.5px] text-bone-soft">
                {promo.descripcion}
              </p>
            )}

            {ahorro && (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-bone-mute">
                Suelto {usd(promo.precioSuelto!)} · ahorrás {usd(ahorro)}
              </p>
            )}

            <button
              type="button"
              disabled={deshabilitada}
              onClick={() => abrirProducto(promo)}
              className={[
                "mt-3 self-start rounded-full px-4.5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white",
                "transition-transform duration-75 active:scale-94",
                deshabilitada
                  ? "cursor-not-allowed bg-[#b7ad99]"
                  : "bg-casta hover:bg-casta-deep",
              ].join(" ")}
            >
              {agotada ? "Agotada" : "Agregar +"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
