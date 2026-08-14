import { EquipoPanel } from "@/components/admin/EquipoPanel";
import { listarAdmins } from "@/lib/acciones/equipo";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Equipo — Casta Admin" };

/** Quién tiene acceso cambia poco, pero cuando cambia importa verlo al toque. */
export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  const supabase = await createClient();
  const [admins, { data }] = await Promise.all([
    listarAdmins(),
    supabase.auth.getUser(),
  ]);

  return (
    <>
      <h1 className="mb-1 font-display text-4xl uppercase tracking-[0.01em]">
        Equipo
      </h1>
      <p className="mb-5 max-w-prose text-sm text-smoke">
        Quién puede entrar acá. No es solo esta pantalla: quien está en esta
        lista puede ver los pedidos con los datos de cada cliente, cambiar
        precios y tocar el inventario. Quien no está, no puede leer nada de la
        base aunque tenga cuenta.
      </p>

      <EquipoPanel
        inicial={admins}
        yo={(data.user?.email ?? "").toLowerCase()}
      />
    </>
  );
}
