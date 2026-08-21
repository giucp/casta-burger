import type { MetadataRoute } from "next";
import { BUSINESS } from "./config";

/**
 * Los manifests de las dos apps del back-office.
 *
 * El del cliente vive en `src/app/manifest.ts`, que es la convención de Next:
 * un `manifest.ts` solo vale en la RAÍZ de `app/`. Como acá hacen falta tres,
 * los otros dos se sirven como route handlers y se enganchan sobreescribiendo
 * `metadata.manifest` en el layout del panel y en la página de cocina.
 *
 * Van colgados de la raíz (`/manifest-admin.webmanifest`) y no de `/admin`
 * a propósito: el middleware rebota al login todo lo que cuelgue de `/admin`
 * sin sesión, y además manda al rol `cocina` a su pantalla desde cualquier
 * otra ruta. Un manifest que responde un redirect no instala nada. La
 * ubicación del archivo no tiene por qué estar dentro del `scope` — eso lo
 * decide el propio manifest, no dónde esté guardado.
 */

/**
 * Ambas apps declaran el mismo `scope`, y es deliberado.
 *
 * Lo natural sería acotar la cocina a `/admin/cocina`, pero entonces el login
 * quedaría afuera: al abrir la app sin sesión, el middleware redirige a
 * `/admin/login` y el navegador, viendo una URL fuera de scope, la abriría en
 * una pestaña normal en vez de dentro de la app. El cocinero terminaría
 * entrando por el navegador y volviendo al ícono a mano.
 *
 * Lo que separa las dos apps no es el scope: es el `id`. Es el campo que el
 * navegador usa como identidad de una app instalada, así que dos manifests con
 * `id` distinto se instalan como dos apps distintas aunque compartan scope.
 */
const SCOPE = "/admin";

/** Negro plano y rojo casta, los mismos de globals.css. */
const INK = "#0C0C0C";

type App = {
  id: string;
  nombre: string;
  corto: string;
  descripcion: string;
  inicio: string;
  iconos: string;
};

export function manifiesto(app: App): MetadataRoute.Manifest {
  return {
    id: app.id,
    name: app.nombre,
    short_name: app.corto,
    description: app.descripcion,
    start_url: app.inicio,
    scope: SCOPE,
    display: "standalone",
    background_color: INK,
    theme_color: INK,
    lang: "es",
    orientation: "portrait",
    icons: [
      {
        src: `${app.iconos}/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${app.iconos}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${app.iconos}/maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

export const APP_ADMIN: App = {
  id: "/admin",
  nombre: `${BUSINESS.nombre} Admin`,
  corto: "Casta Admin",
  descripcion:
    "El panel del negocio: pedidos, ventas del día, menú, inventario y compras.",
  inicio: "/admin",
  iconos: "/icons/admin",
};

export const APP_COCINA: App = {
  id: "/admin/cocina",
  nombre: `${BUSINESS.nombre} Cocina`,
  corto: "Casta Cocina",
  descripcion: "La pantalla de pedidos en vivo. Nada más.",
  inicio: "/admin/cocina",
  iconos: "/icons/cocina",
};

/**
 * Lo que iOS necesita, porque no lee el manifest: ni `id`, ni `scope`, ni
 * `start_url`. "Agregar a inicio" usa la URL que esté abierta y el
 * `apple-touch-icon` que declare esa página, así que hay que repetirlo por
 * app. El nombre sale del `apple-mobile-web-app-title`, no del manifest.
 */
export function metadataApple(app: App) {
  return {
    appleWebApp: {
      capable: true,
      title: app.corto,
      statusBarStyle: "black-translucent",
    },
    icons: {
      icon: `${app.iconos}/icon-192.png`,
      apple: `${app.iconos}/apple-touch-icon.png`,
    },
  } as const;
}
