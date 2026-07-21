import { Cocina } from "@/components/admin/Cocina";
import { lineasDemo, pedidosDemo } from "@/lib/admin/pedidos";

export const metadata = { title: "Cocina — Casta Admin" };

/** Los pedidos de ejemplo son relativos a ahora, así que no se puede prerenderizar. */
export const dynamic = "force-dynamic";

export default function CocinaPage() {
  const ahoraISO = new Date().toISOString();

  return (
    <Cocina inicial={pedidosDemo(ahoraISO)} lineas={lineasDemo()} />
  );
}
