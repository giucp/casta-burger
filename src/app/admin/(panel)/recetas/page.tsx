import { RecetasPanel } from "@/components/admin/RecetasPanel";
import { listarInventario } from "@/lib/acciones/inventario";
import { listarRecetas } from "@/lib/acciones/recetas";

export const metadata = { title: "Recetas — Casta Admin" };

export const dynamic = "force-dynamic";

export default async function RecetasPage() {
  const [recetas, inventario] = await Promise.all([
    listarRecetas(),
    listarInventario(),
  ]);
  return <RecetasPanel inicial={recetas} inventario={inventario} />;
}
