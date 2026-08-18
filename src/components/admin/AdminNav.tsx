"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * `soloDueno` marca lo que la cocina no necesita para despachar: la plata del
 * día, los precios y el reparto de accesos. No es la seguridad —de eso se
 * ocupan el middleware y el RLS— es no ofrecerle puertas que no abren.
 */
const SECCIONES = [
  { href: "/admin", label: "Panel", soloDueno: true },
  { href: "/admin/cocina", label: "Cocina", soloDueno: false },
  { href: "/admin/menu", label: "Menú", soloDueno: true },
  { href: "/admin/inventario", label: "Inventario", soloDueno: true },
  { href: "/admin/compras", label: "Compras", soloDueno: true },
  { href: "/admin/equipo", label: "Equipo", soloDueno: true },
];

export function AdminNav({ rol }: { rol: string }) {
  const ruta = usePathname();
  const visibles = SECCIONES.filter((s) => !s.soloDueno || rol === "dueno");

  // Con una sola sección, la barra de pestañas es ruido.
  if (visibles.length < 2) return null;

  return (
    <nav className="mx-auto flex max-w-[1180px] gap-1 overflow-x-auto px-3 pb-2">
      {visibles.map((s) => {
        const activa = ruta === s.href;
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={activa ? "page" : undefined}
            className={[
              "whitespace-nowrap rounded-full px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] transition-colors",
              activa
                ? "bg-casta text-white"
                : "text-smoke hover:bg-white/5 hover:text-white",
            ].join(" ")}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
