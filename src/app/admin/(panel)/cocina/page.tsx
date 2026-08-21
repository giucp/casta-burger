import { Cocina } from "@/components/admin/Cocina";
import { listarPedidos } from "@/lib/acciones/cocina";
import { APP_COCINA, metadataApple } from "@/lib/manifiestos";

/**
 * Instalar desde acá da la app de cocina, no la del admin.
 *
 * La metadata anidada reemplaza la del padre campo por campo, así que este
 * `manifest` pisa el del layout del panel, y ese pisa el de la web pública.
 * Es lo que hace que la misma web ofrezca tres apps distintas según dónde
 * estés parado cuando tocás "instalar".
 */
export const metadata = {
  title: "Cocina — Casta Admin",
  manifest: "/manifest-cocina.webmanifest",
  ...metadataApple(APP_COCINA),
};

/** Los pedidos cambian todo el tiempo: nunca se sirve una versión guardada. */
export const dynamic = "force-dynamic";

export default async function CocinaPage() {
  return <Cocina inicial={await listarPedidos()} />;
}
