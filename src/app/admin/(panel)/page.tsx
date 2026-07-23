import { PanelDueno } from "@/components/admin/PanelDueno";
import { panelHoy } from "@/lib/acciones/panel";

export const metadata = { title: "Panel — Casta Admin" };

/** El estado del negocio cambia todo el tiempo: nada de versiones guardadas. */
export const dynamic = "force-dynamic";

export default async function PanelPage() {
  return <PanelDueno inicial={await panelHoy()} />;
}
