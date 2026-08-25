import { ActividadPanel } from "@/components/admin/ActividadPanel";
import { listarActividad } from "@/lib/acciones/actividad";

export const metadata = { title: "Actividad — Casta Admin" };

/** Un registro que se sirve cacheado es un registro que miente. */
export const dynamic = "force-dynamic";

export default async function ActividadPage() {
  return <ActividadPanel inicial={await listarActividad()} />;
}
