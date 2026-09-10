import { CostosPanel } from "@/components/admin/CostosPanel";
import { listarCompras, listarCostos } from "@/lib/acciones/compras";
import { listarInventario } from "@/lib/acciones/inventario";
import { hoyCaracas } from "@/lib/acciones/numeros";

export const metadata = { title: "Costos — Casta Admin" };

/** Los costos se registran a diario: nunca una versión guardada. */
export const dynamic = "force-dynamic";

export default async function CostosPage() {
  const [inicial, hoy, inventario, costos] = await Promise.all([
    listarCompras(),
    hoyCaracas(),
    listarInventario(),
    listarCostos(),
  ]);

  return (
    <>
      <h1 className="mb-1 font-display text-4xl uppercase tracking-[0.01em]">
        Costos
      </h1>
      <p className="mb-5 max-w-prose text-sm text-smoke">
        Lo que se paga por cada cosa. Anotá cuánto compraste y cuánto costó, y
        de ahí sale lo que cuesta hacer cada hamburguesa.
      </p>

      <CostosPanel
        inicial={inicial}
        hoy={hoy}
        inventario={inventario}
        costos={costos}
      />
    </>
  );
}
