import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoMarca } from "@/components/LogoMarca";
import { AdminNav } from "@/components/admin/AdminNav";
import { BotonSalir } from "@/components/admin/BotonSalir";
import { APP_ADMIN, metadataApple } from "@/lib/manifiestos";
import { createClient } from "@/lib/supabase/server";

/**
 * Todo el panel ofrece instalarse como "Casta Admin", con su propio ícono y
 * arrancando en /admin — no como la web del cliente. La página de cocina
 * vuelve a pisar esto con el suyo.
 */
export const metadata = {
  manifest: "/manifest-admin.webmanifest",
  ...metadataApple(APP_ADMIN),
};

/**
 * Shell del back-office.
 *
 * El proxy ya filtró, y acá se vuelve a comprobar. No es redundancia
 * inútil: son tres cosas distintas.
 *
 * - `getUser()` confirma contra el servidor de Auth que la cuenta siga
 *   existiendo y no haya sido revocada.
 * - `mi_rol()` confirma que además esté en la lista, y con qué rol.
 * - Y por debajo de todo, el RLS de la base vuelve a preguntar lo mismo en
 *   cada consulta. Esa es la frontera que de verdad importa: si alguien se
 *   saltara estas dos, seguiría sin poder leer ni escribir nada.
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

  const { data: rol } = await supabase.rpc("mi_rol");
  if (!user || typeof rol !== "string") redirect("/admin/login?error=sin-permiso");

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
        <AdminNav rol={rol} />
      </header>

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-5 py-6">
        {children}
      </main>

      <p className="border-t border-white/8 px-5 py-3 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-smoke/70">
        Casta Burger · panel del negocio
      </p>
    </div>
  );
}
