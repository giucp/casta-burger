import { ComprasPanel } from "@/components/admin/ComprasPanel";
import { listarCompras } from "@/lib/acciones/compras";
import { hoyCaracas } from "@/lib/acciones/numeros";

export const metadata = { title: "Compras — Casta Admin" };

/** Las compras se registran a diario: nunca una versión guardada. */
export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const [inicial, hoy] = await Promise.all([listarCompras(), hoyCaracas()]);

  return (
    <>
      <h1 className="mb-1 font-display text-4xl uppercase tracking-[0.01em]">
        Compras
      </h1>
      <p className="mb-5 max-w-prose text-sm text-smoke">
        Todo lo que se gasta en insumos. Es la mitad que le falta a las ventas
        para saber la ganancia neta.
      </p>

      <ComprasPanel inicial={inicial} hoy={hoy} />
    </>
  );
}
