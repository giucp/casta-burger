"use client";

import Image from "next/image";
import type { MenuItem } from "@/lib/menu";
import { useCartUI } from "./cart/CartUI";
import { useEstadoNegocio } from "./EstadoNegocio";
import { BurgerGlyph, FriesGlyph } from "./icons";
import { Precio } from "./Precio";

/**
 * Tarjeta de producto del panel "hueso".
 * Agotado = tarjeta atenuada y botón deshabilitado (§3).
 */
export function MenuCard({ item }: { item: MenuItem }) {
  const { abrirProducto } = useCartUI();
  const { puedePedir } = useEstadoNegocio();

  const agotado = !item.disponible;
  // Sin precio definido no se puede pedir (hoy: las bebidas)
  const deshabilitado = agotado || !puedePedir || item.precio === null;

  /**
   * Las fotos van en `public/productos/`, así que `foto_url` es una ruta del
   * sitio ("/productos/papas.jpg"). Una URL de otro dominio se ignora a
   * propósito: next/image la rechazaría en runtime y tumbaría la página.
   */
  const foto = item.fotoUrl?.startsWith("/") ? item.fotoUrl : undefined;
  const Glyph = item.categoria === "Fries" ? FriesGlyph : BurgerGlyph;

  return (
    <article
      className={`flex gap-4 border-b border-bone-line py-4.5 ${agotado ? "opacity-50" : ""}`}
    >
      <div className="relative flex size-[78px] shrink-0 items-center justify-center overflow-hidden rounded-card bg-[repeating-linear-gradient(45deg,#e7dfce_0_8px,#ece5d6_8px_16px)] sm:size-24">
        {foto ? (
          <Image
            src={foto}
            alt={item.nombre}
            fill
            sizes="(min-width: 640px) 96px, 78px"
            className="object-cover"
          />
        ) : (
          <Glyph className="size-14" apagado={agotado} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2.5">
          <h3 className="font-display text-[22px] uppercase tracking-[0.01em]">
            {item.nombre}
          </h3>
          <Precio monto={item.precio} />
        </div>

        {item.descripcion && (
          <p className="my-1.5 max-w-[52ch] text-[13.5px] text-bone-soft">
            {item.descripcion}
          </p>
        )}

        {item.tags && item.tags.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-bone-line px-2.5 py-[3px] font-mono text-[10px] uppercase tracking-[0.06em] text-[#6b6152]"
              >
                {tag}
              </li>
            ))}
            {agotado && (
              <li className="rounded-full border border-bone-line px-2.5 py-[3px] font-mono text-[10px] uppercase tracking-[0.06em] text-[#6b6152]">
                agotado hoy
              </li>
            )}
          </ul>
        )}

        <button
          type="button"
          disabled={deshabilitado}
          onClick={() => abrirProducto(item)}
          className={[
            "rounded-full px-4.5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white",
            "transition-transform duration-75 active:scale-94",
            deshabilitado
              ? "cursor-not-allowed bg-[#b7ad99]"
              : "bg-casta hover:bg-casta-deep",
          ].join(" ")}
        >
          {agotado ? "Agotado" : "Agregar +"}
        </button>
      </div>
    </article>
  );
}
