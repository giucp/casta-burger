"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/admin/cocina", label: "Cocina" },
  { href: "/admin", label: "Números" },
  { href: "/admin/inventario", label: "Inventario" },
  { href: "/admin/compras", label: "Compras" },
];

export function AdminNav() {
  const ruta = usePathname();

  return (
    <nav className="mx-auto flex max-w-[1180px] gap-1 overflow-x-auto px-3 pb-2">
      {SECCIONES.map((s) => {
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
