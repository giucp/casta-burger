"use client";

import Image from "next/image";
import { useState } from "react";
import { usd } from "@/lib/format";
import type { MenuItem } from "@/lib/menu";
import { useCartUI } from "./cart/CartUI";
import { useEstadoNegocio } from "./EstadoNegocio";
import { AmpliarIcon } from "./icons";
import { VisorFoto } from "./VisorFoto";

/**
 * Promos, dentro del panel hueso del menú.
 *
 * Son filas de `menu_items` como cualquier otro producto, así que se agregan
 * al carrito por el mismo camino y el servidor les pone el precio. Lo único
 * distinto es cómo se ven: tarjetas con borde rojo, para que salten sobre las
 * listas planas de Extras y Bebidas.
 *
 * La foto va de banner ancho arriba y no de miniatura al costado como en el
 * resto del menú. No es capricho: estas fotos son composiciones horizontales
 * —dos hamburguesas lado a lado, tres en fila— y lo que comunican ES la
 * cantidad. Un recorte cuadrado les cortaría las de los extremos y la promo
 * mostraría menos de lo que vende.
 */
export function Promos({ items }: { items: MenuItem[] }) {
  const { abrirProducto } = useCartUI();
  const { puedePedir } = useEstadoNegocio();
  /**
   * Qué promo se está mirando en grande. Vive acá y no dentro de cada tarjeta
   * a propósito: React propaga los eventos por el árbol de componentes, así que
   * un visor dentro del <li> haría que el toque para cerrarlo subiera hasta el
   * onClick del <li> y la foto se volviera a abrir en el mismo toque.
   */
  const [enGrande, setEnGrande] = useState<MenuItem | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <ul className="mt-2 grid gap-3 sm:grid-cols-2">
        {items.map((promo) => {
          const agotada = !promo.disponible;
          const deshabilitada = agotada || !puedePedir || promo.precio === null;

          const foto = promo.fotoUrl?.startsWith("/") ? promo.fotoUrl : undefined;
          const fotoCompleta = promo.fotoCompletaUrl?.startsWith("/")
            ? promo.fotoCompletaUrl
            : undefined;

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
              onClick={fotoCompleta ? () => setEnGrande(promo) : undefined}
              className={[
                "flex flex-col overflow-hidden rounded-card border-2 border-casta bg-casta/5",
                agotada ? "opacity-50" : "",
                fotoCompleta ? "cursor-zoom-in" : "",
              ].join(" ")}
            >
              {foto && (
                // Fondo negro y no hueso: la foto ya viene sobre negro, así que
                // mientras carga no se ve un rectángulo claro que después se
                // apaga de golpe.
                <div className="relative aspect-video w-full bg-black">
                  <Image
                    src={foto}
                    alt={promo.nombre}
                    fill
                    /**
                     * Las tres medidas salen del layout real: el panel del menú
                     * está topado en 1080 px con 20 de aire a cada lado, y la
                     * grilla se parte en dos columnas con 12 de separación, así
                     * que de 1080 para arriba la tarjeta mide 510 y no crece
                     * más.
                     *
                     * Decir solo "50vw" era mentirle al navegador en pantalla
                     * grande: en un monitor ancho calculaba media pantalla, la
                     * duplicaba por la densidad y terminaba pidiendo la foto en
                     * 3840 px para mostrarla a 510. Bajaba de más y quemaba una
                     * transformación de imagen de Vercel por cada medida.
                     */
                    sizes="(min-width: 1080px) 510px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />

                  {fotoCompleta && (
                    <button
                      type="button"
                      aria-label={`Ver la foto de ${promo.nombre}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEnGrande(promo);
                      }}
                      className="absolute right-2 bottom-2 grid size-7 place-items-center rounded-full bg-bone/92 text-bone-ink shadow-sm transition-colors hover:bg-bone"
                    >
                      <AmpliarIcon className="size-3.5" />
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-1 flex-col px-4 py-3.5">
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
                  onClick={(e) => {
                    e.stopPropagation();
                    abrirProducto(promo);
                  }}
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
              </div>
            </li>
          );
        })}
      </ul>

      {enGrande?.fotoCompletaUrl && (
        <VisorFoto
          src={enGrande.fotoCompletaUrl}
          nombre={enGrande.nombre}
          onClose={() => setEnGrande(null)}
        />
      )}
    </>
  );
}
