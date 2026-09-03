import { InventarioTabla } from "@/components/admin/InventarioTabla";
import { listarInventario } from "@/lib/acciones/inventario";

export const metadata = { title: "Inventario — Casta Admin" };

/** El inventario cambia a mano todo el tiempo: nunca una versión guardada. */
export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  return (
    <>
      <h1 className="mb-1 font-display text-4xl uppercase tracking-[0.01em]">
        Inventario
      </h1>
      <p className="mb-5 max-w-prose text-sm text-smoke">
        Se ajusta a mano, como el cuaderno. Los productos que tienen receta
        además se descuentan solos al entregar el pedido, y se devuelven si se
        anula la venta.
      </p>

      <InventarioTabla inicial={await listarInventario()} />
    </>
  );
}
