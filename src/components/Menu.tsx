import {
  PAPAS_ADICIONAL,
  porCategoria,
  PRESENTACIONES,
  PROTEINAS,
  type MenuItem,
} from "@/lib/menu";
import { usd } from "@/lib/format";
import { MenuCard } from "./MenuCard";
import { Precio } from "./Precio";

/** Encabezado de sección: título Anton + regla gruesa (§3). */
function SecHead({ titulo, nota }: { titulo: string; nota?: string }) {
  return (
    <>
      <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <h2 className="font-display text-[clamp(34px,9vw,60px)] uppercase leading-none tracking-[0.01em]">
          {titulo}
        </h2>
        {nota && <span className="font-mono text-xs text-bone-mute">{nota}</span>}
      </div>
      <div className="mt-3.5 mb-6.5 h-[3px] bg-bone-ink" />
    </>
  );
}

/** Lista simple a dos columnas — para Extras y Bebidas. */
function ListaSimple({ items }: { items: MenuItem[] }) {
  return (
    <ul className="mt-2 grid gap-x-5 gap-y-2.5 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-baseline justify-between gap-3 border-b border-dotted border-bone-line py-2.5 text-sm"
        >
          <span>{item.nombre}</span>
          <Precio monto={item.precio} />
        </li>
      ))}
    </ul>
  );
}

export function Menu({
  items,
  puedePedir,
}: {
  items: MenuItem[];
  puedePedir: boolean;
}) {
  const burgers = porCategoria(items, "Burgers");
  const combos = porCategoria(items, "Combo");
  const extras = porCategoria(items, "Extras");
  const bebidas = porCategoria(items, "Bebidas");

  if (items.length === 0) {
    return (
      <section id="menu" className="bg-bone text-bone-ink">
        <div className="mx-auto max-w-[1080px] px-5 py-16 text-center">
          <p className="font-display text-3xl uppercase">Menú no disponible</p>
          <p className="mt-2 text-sm text-bone-soft">
            Escribinos por WhatsApp y te decimos qué hay hoy.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="bg-bone text-bone-ink">
      <div className="mx-auto max-w-[1080px] px-5 pt-12 pb-13">
        {burgers.length > 0 && (
          <>
            <SecHead
              titulo="Burgers"
              nota={PROTEINAS.map((p) => p.toLowerCase()).join(" · ")}
            />
            <p className="-mt-3 mb-4 font-mono text-[11px] uppercase tracking-[0.08em] text-bone-mute">
              {PRESENTACIONES.whiteMeal.etiqueta} ={" "}
              {PRESENTACIONES.whiteMeal.detalle}
            </p>
            {burgers.map((item) => (
              <MenuCard key={item.id} item={item} puedePedir={puedePedir} />
            ))}
            <p className="mt-4 font-mono text-[11px] text-bone-mute">
              Nota: por {usd(PAPAS_ADICIONAL.precio)} adicional por hamburguesa,{" "}
              {PAPAS_ADICIONAL.etiqueta}.
            </p>
          </>
        )}

        {combos.length > 0 && (
          <>
            <div className="mt-9.5">
              <SecHead titulo="Combo" />
            </div>
            {combos.map((item) => (
              <MenuCard key={item.id} item={item} puedePedir={puedePedir} />
            ))}
          </>
        )}

        {extras.length > 0 && (
          <>
            <div className="mt-9.5">
              <SecHead titulo="Extras" />
            </div>
            <ListaSimple items={extras} />
          </>
        )}

        {bebidas.length > 0 && (
          <>
            <div className="mt-9.5">
              <SecHead titulo="Bebidas" />
            </div>
            <ListaSimple items={bebidas} />
          </>
        )}
      </div>
    </section>
  );
}
