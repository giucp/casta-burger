import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { AdminNav } from "@/components/admin/AdminNav";

/**
 * Shell del back-office.
 *
 * ⚠️ SIN AUTENTICACIÓN TODAVÍA. El §6 del brief pide magic link de Supabase
 * Auth y `/admin/*` protegido. Hasta que eso exista, esto NO puede salir a
 * producción: cualquiera con el link ve y edita los números del negocio.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-ink">
      <header className="border-b border-white/8 bg-char">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-5 py-3">
          <LogoMark className="size-7 shrink-0" />
          <span className="font-display text-lg uppercase tracking-[0.02em]">
            Casta <b className="font-normal text-casta">Admin</b>
          </span>
          <span className="flex-1" />
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-smoke transition-colors hover:text-white"
          >
            Ver la web
          </Link>
        </div>
        <AdminNav />
      </header>

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-5 py-6">
        {children}
      </main>

      <p className="border-t border-white/8 px-5 py-3 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-smoke/70">
        Datos de ejemplo — sin conectar a Supabase · sin login
      </p>
    </div>
  );
}
