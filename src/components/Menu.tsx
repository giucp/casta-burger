import {
  PAPAS_ADICIONAL,
  porCategoria,
  PRESENTACIONES,
  PROTEINAS,
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
function ListaSimple({ categoria }: { categoria: "Extras" | "Bebidas" }) {
  return (
    <ul className="mt-2 grid gap-x-5 gap-y-2.5 sm:grid-cols-2">
      {porCategoria(categoria).map((item) => (
        <li
          key={item.id}
          className="flex items-baseline justify-between gap-3 border-b border-dotted border-bone-line py-2.5 text-sm"
        >
          <span>{item.nombre}</span>
          <Precio monto={item.precio} conBs={false} />
        </li>
      ))}
    </ul>
  );
}

export function Menu({ puedePedir }: { puedePedir: boolean }) {
  return (
    <section id="menu" className="bg-bone text-bone-ink">
      <div className="mx-auto max-w-[1080px] px-5 pt-12 pb-13">
        <SecHead
          titulo="Burgers"
          nota={PROTEINAS.map((p) => p.toLowerCase()).join(" · ")}
        />
        <p className="-mt-3 mb-4 font-mono text-[11px] uppercase tracking-[0.08em] text-bone-mute">
          {PRESENTACIONES.whiteMeal.etiqueta} ={" "}
          {PRESENTACIONES.whiteMeal.detalle}
        </p>
        {porCategoria("Burgers").map((item) => (
          <MenuCard key={item.id} item={item} puedePedir={puedePedir} />
        ))}
        <p className="mt-4 font-mono text-[11px] text-bone-mute">
          Nota: por {usd(PAPAS_ADICIONAL.precio)} adicional por hamburguesa,{" "}
          {PAPAS_ADICIONAL.etiqueta}.
        </p>

        <div className="mt-9.5">
          <SecHead titulo="Combo" />
        </div>
        {porCategoria("Combo").map((item) => (
          <MenuCard key={item.id} item={item} puedePedir={puedePedir} />
        ))}

        <div className="mt-9.5">
          <SecHead titulo="Extras" />
        </div>
        <ListaSimple categoria="Extras" />

        <div className="mt-9.5">
          <SecHead titulo="Bebidas" />
        </div>
        <ListaSimple categoria="Bebidas" />
      </div>
    </section>
  );
}
