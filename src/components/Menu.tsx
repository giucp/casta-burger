import { porCategoria, PROTEINAS, type MenuItem } from "@/lib/menu";
import { ListaPedible } from "./ListaPedible";
import { MenuCard } from "./MenuCard";
import { Promos } from "./Promos";

/**
 * Encabezado de sección: título Anton + regla gruesa (§3).
 *
 * La nota va SIEMPRE al lado del título, en todos los teléfonos. Antes se caía
 * abajo o no según el ancho: "Burgers · carne · cordero · pollo" medía 324 px
 * y un Android de 360 deja 320, así que el mismo diseño se veía distinto en
 * cada modelo. Ahora las dos tipografías encogen con la pantalla (`clamp`) y
 * el par entra siempre; a partir de un iPhone normal ya van a tamaño completo.
 */
function SecHead({ titulo, nota }: { titulo: string; nota?: string }) {
  return (
    <>
      <div className="flex flex-nowrap items-baseline gap-x-3.5">
        <h2 className="font-display text-[clamp(30px,9vw,60px)] uppercase leading-none tracking-[0.01em]">
          {titulo}
        </h2>
        {/* Sin `whitespace-nowrap` a propósito: con las medidas de arriba la
            nota entra en una línea en cualquier teléfono, y si alguna vez no
            entrara, prefiero que se parta antes de que la página se vaya de
            ancho. */}
        {nota && (
          <span className="font-mono text-[clamp(11px,3.6vw,14px)] text-bone-mute">
            {nota}
          </span>
        )}
      </div>
      <div className="mt-3.5 mb-6.5 h-[3px] bg-bone-ink" />
    </>
  );
}

export function Menu({ items }: { items: MenuItem[] }) {
  const burgers = porCategoria(items, "Burgers");
  const fries = porCategoria(items, "Fries");
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
              <MenuCard key={item.id} item={item} />
            ))}
          </>
        )}

        {/* Las papas no son un agregado de la hamburguesa: se piden solas y
            se ven como las burgers, con tarjeta y foto. */}
        {fries.length > 0 && (
          <>
            <div className="mt-9.5" id="fries">
              <SecHead titulo="Fries" nota="para acompañar" />
            </div>
            {fries.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </>
        )}

        {extras.length > 0 && (
          <>
            <div className="mt-9.5">
              <SecHead titulo="Extras" />
            </div>
            <ListaPedible items={extras} />
          </>
        )}

        {promos.length > 0 && (
          <>
            <div className="mt-9.5" id="promos">
              <SecHead titulo="Promos" />
            </div>
            <Promos items={promos} />
          </>
        )}

        {bebidas.length > 0 && (
          <>
            <div className="mt-9.5">
              <SecHead titulo="Bebidas" />
            </div>
            <ListaPedible items={bebidas} />
          </>
        )}
      </div>
    </section>
  );
}
