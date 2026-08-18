import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * El identificador del despliegue, para colgárselo a las fotos. Vercel lo
   * pone en cada build; en local queda "dev".
   */
  env: {
    NEXT_PUBLIC_VERSION_FOTOS: (
      process.env.VERCEL_GIT_COMMIT_SHA ?? "dev"
    ).slice(0, 8),
  },

  async headers() {
    return [
      {
        /**
         * Vercel sirve `public/` con `max-age=0, must-revalidate`: aunque el
         * teléfono ya tenga la foto, pregunta al servidor antes de mostrarla.
         * Esa ida y vuelta era la espera que se veía al abrir una foto.
         *
         * Acá se cachea una semana, y se puede porque la URL lleva versión
         * (ver `conVersion` en menu-db). Antes esto era una hora sin versionar,
         * y tenía un defecto feo: cambiar una foto no se veía hasta que
         * venciera el plazo, porque el archivo se sigue llamando igual. Una
         * corrección de encuadre parecía no haberse aplicado.
         */
        source: "/productos/:archivo*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
