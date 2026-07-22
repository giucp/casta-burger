import { porCategoria, PROTEINAS, type MenuItem } from "@/lib/menu";
import { ListaPedible } from "./ListaPedible";
import { MenuCard } from "./MenuCard";
import { Promos } from "./Promos";

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
  const promos = porCategoria(items, "Promos");
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
            {burgers.map((item) => (
              <MenuCard key={item.id} item={item} puedePedir={puedePedir} />
            ))}
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
            <ListaPedible items={extras} puedePedir={puedePedir} />
          </>
        )}

        {promos.length > 0 && (
          <>
            <div className="mt-9.5" id="promos">
              <SecHead titulo="Promos" />
            </div>
            <Promos items={promos} puedePedir={puedePedir} />
          </>
        )}

        {bebidas.length > 0 && (
          <>
            <div className="mt-9.5">
              <SecHead titulo="Bebidas" />
            </div>
            <ListaPedible items={bebidas} puedePedir={puedePedir} />
          </>
        )}
      </div>
    </section>
  );
}
