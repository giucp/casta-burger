import Link from "next/link";
import { LogoMarca } from "@/components/LogoMarca";
import { AdminNav } from "@/components/admin/AdminNav";
import { BotonSalir } from "@/components/admin/BotonSalir";
import { createClient } from "@/lib/supabase/server";

/**
 * Shell del back-office.
 *
 * El middleware ya bloquea /admin sin sesión; acá se vuelve a comprobar contra
 * el servidor de Auth. No es redundancia inútil: el middleware valida la firma
 * del token, y `getUser()` confirma además que la cuenta siga existiendo y no
 * haya sido revocada.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-ink">
      <header className="border-b border-white/8 bg-char">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-5 py-3">
          <LogoMarca className="size-8 shrink-0" />
          <span className="font-display text-lg uppercase tracking-[0.02em]">
            Casta <b className="font-normal text-casta">Admin</b>
          </span>

          <span className="flex-1" />

          {user?.email && (
            <span className="hidden font-mono text-[11px] text-smoke sm:inline">
              {user.email}
            </span>
          )}
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-smoke transition-colors hover:text-white"
          >
            Ver la web
          </Link>
          <BotonSalir />
        </div>
        <AdminNav />
      </header>

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-5 py-6">
        {children}
      </main>

      {/* TODO: quitar cuando las pantallas lean de Supabase */}
      <p className="border-t border-white/8 px-5 py-3 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-smoke/70">
        Números, inventario y compras todavía muestran datos de ejemplo
      </p>
    </div>
  );
}
