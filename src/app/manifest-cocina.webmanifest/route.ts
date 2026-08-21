import { APP_COCINA, manifiesto } from "@/lib/manifiestos";

/** El manifest de la app del cocinero. Ver `manifest-admin.webmanifest`. */
/** No depende del request: se sirve como archivo, no como función. */
export const dynamic = "force-static";

export function GET() {
  return Response.json(manifiesto(APP_COCINA), {
    headers: { "content-type": "application/manifest+json" },
  });
}
