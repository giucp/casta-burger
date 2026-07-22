"use client";

import { usd } from "@/lib/format";
import type { MenuItem } from "@/lib/menu";
import { useCart } from "./cart/CartProvider";

/**
 * Lista a dos columnas para Extras y Bebidas.
 *
 * Son productos sin nada que elegir, así que se agregan de un toque en vez de
 * abrir el selector: para una Coca-Cola, un panel con "cantidad" es una vuelta
 * de más. Si el cliente quiere dos, toca dos veces o lo ajusta en el carrito.
 */
export function ListaPedible({
  items,
  puedePedir,
}: {
  items: MenuItem[];
  puedePedir: boolean;
}) {
  const { agregar } = useCart();

  return (
    <ul className="mt-2 grid gap-x-5 gap-y-1 sm:grid-cols-2">
      {items.map((item) => {
        const sinPrecio = item.precio === null;
        const deshabilitado = sinPrecio || !puedePedir;

        return (
          <li
            key={item.id}
            className="flex items-center gap-3 border-b border-dotted border-bone-line py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm">{item.nombre}</p>
              {item.descripcion && (
                <p className="text-[12px] text-bone-soft">
                  {item.descripcion}
                </p>
              )}
            </div>

            <span className="shrink-0 whitespace-nowrap font-mono text-sm font-bold">
              {sinPrecio ? (
                <span className="text-[11px] uppercase tracking-[0.08em] text-bone-mute">
                  Consultar
                </span>
              ) : (
                usd(item.precio!)
              )}
            </span>

            <button
              type="button"
              disabled={deshabilitado}
              onClick={() => agregar(item, { extras: [] }, 1)}
              aria-label={`Agregar ${item.nombre}`}
              className={[
                "size-8 shrink-0 rounded-full font-mono text-base leading-none text-white",
                "transition-transform duration-75 active:scale-90",
                deshabilitado
                  ? "cursor-not-allowed bg-[#b7ad99]"
                  : "bg-casta hover:bg-casta-deep",
              ].join(" ")}
            >
              +
            </button>
          </li>
        );
      })}
    </ul>
  );
}
