"use client";

import Image from "next/image";
import { useState } from "react";
import type { MenuItem } from "@/lib/menu";
import { useCartUI } from "./cart/CartUI";
import { useEstadoNegocio } from "./EstadoNegocio";
import { AmpliarIcon, BurgerGlyph, FriesGlyph } from "./icons";
import { Precio } from "./Precio";
import { VisorFoto } from "./VisorFoto";

/**
 * Tarjeta de producto del panel "hueso".
 *
 * La foto va de banner arriba, cruzando la tarjeta, y no de miniatura al
 * costado. Es la misma decisión que en Promos y por el mismo motivo: a 78 px la
 * foto era un sello, no un producto.
 *
 * Va en 16:9, igual que las promos, aunque estas fotos sean verticales y eso
 * signifique cortarle a la hamburguesa el pan de abajo. Es a propósito: el
 * banner no está para inventariar el producto sino para dar hambre, y un plano
 * cerrado sobre la carne, el queso derretido y la tocineta vende más que el
 * sándwich entero visto de lejos. El que lo quiera completo toca la tarjeta y
 * se abre la foto sin recortar — para eso está la lupa.
 *
 * Con las papas se ve mejor que con ninguna: de la mitad del empaque para abajo
 * no hay nada que mirar, y ese espacio se lo comía la bolsa en vez de las papas.
 *
 * Agotado = tarjeta atenuada y botón deshabilitado (§3).
 */
export function MenuCard({ item }: { item: MenuItem }) {
  const { abrirProducto } = useCartUI();
  const { puedePedir } = useEstadoNegocio();
  const [viendoFoto, setViendoFoto] = useState(false);

  const agotado = !item.disponible;
  // Sin precio definido no se puede pedir (hoy: las bebidas)
  const deshabilitado = agotado || !puedePedir || item.precio === null;

  /**
   * Las fotos van en `public/productos/`, así que `foto_url` es una ruta del
   * sitio ("/productos/papas.webp"). Una URL de otro dominio se ignora a
   * propósito: next/image la rechazaría en runtime y tumbaría la página.
   */
  const foto = item.fotoUrl?.startsWith("/") ? item.fotoUrl : undefined;
  const fotoCompleta = item.fotoCompletaUrl?.startsWith("/")
    ? item.fotoCompletaUrl
    : undefined;
  const Glyph = item.categoria === "Fries" ? FriesGlyph : BurgerGlyph;

  return (
    <>
      <article
        // Se toca en cualquier parte para ver la foto entera. Los botones de
        // adentro cortan la propagación para seguir haciendo lo suyo.
        onClick={fotoCompleta ? () => setViendoFoto(true) : undefined}
        className={[
          "flex flex-col overflow-hidden rounded-card border border-bone-line bg-white/25",
          agotado ? "opacity-50" : "",
          fotoCompleta ? "cursor-zoom-in" : "",
        ].join(" ")}
      >
        {/* Fondo negro y no hueso: la foto ya viene sobre negro, así que
            mientras carga no se ve un rectángulo claro que después se apaga. */}
        <div
          className={`relative aspect-video w-full ${
            foto
              ? "bg-black"
              : "flex items-center justify-center bg-[repeating-linear-gradient(45deg,#e7dfce_0_8px,#ece5d6_8px_16px)]"
          }`}
        >
          {foto ? (
            <Image
              src={foto}
              alt={item.nombre}
              fill
              // El menú está topado en 1080 con 20 de aire a cada lado, y la
              // grilla se parte en dos con 16 de separación: de ahí para
              // arriba la tarjeta mide 512 y no crece más.
              sizes="(min-width: 1080px) 512px, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <Glyph className="size-20" apagado={agotado} />
          )}

          {fotoCompleta && (
            <button
              type="button"
              aria-label={`Ver la foto de ${item.nombre}`}
              onClick={(e) => {
                e.stopPropagation();
                setViendoFoto(true);
              }}
              className="absolute right-2 bottom-2 grid size-7 place-items-center rounded-full bg-bone/92 text-bone-ink shadow-sm transition-colors hover:bg-bone"
            >
              <AmpliarIcon className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col px-4 py-3.5">
          <div className="flex items-baseline justify-between gap-2.5">
            <h3 className="font-display text-[22px] uppercase leading-tight tracking-[0.01em]">
              {item.nombre}
            </h3>
            <Precio monto={item.precio} />
          </div>

          {item.descripcion && (
            <p className="my-1.5 text-[13.5px] text-bone-soft">
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
            onClick={(e) => {
              e.stopPropagation();
              abrirProducto(item);
            }}
            className={[
              "mt-auto self-start rounded-full px-4.5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-white",
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

      {/* Hermano del article, NO hijo: React propaga los eventos por el árbol
          de componentes, así que adentro el toque para cerrar subiría hasta el
          onClick de la tarjeta y volvería a abrir la foto en el mismo toque. */}
      {viendoFoto && fotoCompleta && (
        <VisorFoto
          src={fotoCompleta}
          nombre={item.nombre}
          onClose={() => setViendoFoto(false)}
        />
      )}
    </>
  );
}
