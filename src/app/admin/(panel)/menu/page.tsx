import { MenuAdmin } from "@/components/admin/MenuAdmin";
import { listarMenuAdmin } from "@/lib/acciones/menu-admin";

export const metadata = { title: "Menú — Casta Admin" };

/** El menú se edita a mano: nunca una versión guardada. */
export const dynamic = "force-dynamic";

export default async function MenuPage() {
  return (
    <>
      <h1 className="mb-1 font-display text-4xl uppercase tracking-[0.01em]">
        Menú
      </h1>
      <p className="mb-5 max-w-prose text-sm text-smoke">
        Apagá lo que se agotó y prendelo cuando vuelva. Editá precios y nombres
        tocándolos. Los cambios se ven en la web al instante.
      </p>

      <MenuAdmin inicial={await listarMenuAdmin()} />
    </>
  );
}
