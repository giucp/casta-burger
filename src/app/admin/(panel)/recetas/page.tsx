import { RecetasPanel } from "@/components/admin/RecetasPanel";
import { listarInventario } from "@/lib/acciones/inventario";
import { listarCostos } from "@/lib/acciones/compras";
import { listarProteinas, listarRecetas } from "@/lib/acciones/recetas";

export const metadata = { title: "Recetas — Casta Admin" };

export const dynamic = "force-dynamic";

export default async function RecetasPage() {
  const [recetas, inventario, proteinas, costos] = await Promise.all([
    listarRecetas(),
    listarInventario(),
    listarProteinas(),
    listarCostos(),
  ]);
  return (
    <RecetasPanel
      inicial={recetas}
      inventario={inventario}
      proteinas={proteinas}
      costos={costos}
    />
  );
}
