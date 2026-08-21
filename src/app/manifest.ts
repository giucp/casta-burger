import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/config";

/**
 * Manifest de la PWA: lo que hace la web instalable en el celular con ícono y
 * nombre propios. Funciona desde cualquier dominio HTTPS, incluido el de
 * Vercel — el dominio no importa, esto define lo que el cliente ve.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BUSINESS.nombre} — Hamburguesas smash`,
    short_name: BUSINESS.nombre,
    description:
      "Hamburguesas smash de verdad en Barinas. Pide por acá y recógela, o te la llevamos.",
    id: "/",
    start_url: "/",
    /**
     * `id` y `scope` no estaban y ahora sí, porque ya no es el único manifest:
     * `/manifest-admin.webmanifest` y `/manifest-cocina.webmanifest` declaran
     * las dos apps del back-office. El `id` es lo que el navegador usa como
     * identidad de una app instalada — con tres manifests conviene que cada uno
     * diga el suyo en vez de dejar que se deduzca.
     *
     * Vale la pena decir que esto NO le cambia la identidad a quien ya tenga la
     * app instalada: sin `id`, el navegador usa el `start_url`, que acá es el
     * mismo "/". Escribirlo solo hace explícito lo que ya valía.
     */
    scope: "/",
    display: "standalone",
    background_color: "#0C0C0C",
    theme_color: "#0C0C0C",
    lang: "es",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
