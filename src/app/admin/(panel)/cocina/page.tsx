import { Cocina } from "@/components/admin/Cocina";
import { listarPedidos } from "@/lib/acciones/cocina";

export const metadata = { title: "Cocina — Casta Admin" };

/** Los pedidos cambian todo el tiempo: nunca se sirve una versión guardada. */
export const dynamic = "force-dynamic";

export default async function CocinaPage() {
  return <Cocina inicial={await listarPedidos()} />;
}
