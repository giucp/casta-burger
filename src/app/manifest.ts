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
      "Hamburguesas smash de verdad en Alto Barinas. Pedí por acá y recogé, o te la llevamos.",
    start_url: "/",
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
