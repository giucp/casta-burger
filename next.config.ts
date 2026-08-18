import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        /**
         * Las fotos de producto son archivos estáticos que casi nunca cambian,
         * pero Vercel las sirve con `max-age=0, must-revalidate`: aunque el
         * teléfono ya tenga la foto, cada vez que se abre pregunta al servidor
         * si sigue vigente. Esa ida y vuelta es justo la espera que se ve al
         * abrir una foto.
         *
         * Una hora de caché firme y una semana de `stale-while-revalidate`: el
         * que vuelve el mismo día la ve al instante, y si se cambia una foto,
         * la nueva entra sola —primero se muestra la vieja, y la siguiente vez
         * ya está la nueva— sin tener que renombrar archivos.
         */
        source: "/productos/:archivo*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
