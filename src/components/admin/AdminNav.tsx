"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { seccionesDe, type Rol } from "@/lib/admin/secciones";

/**
 * La barra de pestañas. Qué ve cada rol sale de `secciones.ts`, la misma
 * lista que usa el proxy: si vivieran en dos lados terminarían diciendo cosas
 * distintas.
 *
 * No es la seguridad —de eso se ocupan el proxy y el RLS— es no ofrecerle a
 * nadie puertas que no abren.
 */
export function AdminNav({ rol }: { rol: Rol }) {
  const ruta = usePathname();
  const visibles = seccionesDe(rol);

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
