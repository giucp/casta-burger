"use client";

import { useEffect } from "react";

/**
 * Se baja las fotos grandes en segundo plano, para que al tocar una tarjeta la
 * foto ya esté ahí.
 *
 * La regla es que esto NO puede costarle nada a la apertura de la web. Por eso
 * no arranca hasta que pasan dos cosas: que la página haya terminado de cargar
 * (`load`, o sea con el menú y las miniaturas ya servidos) y que el navegador
 * esté ocioso. Y va de a una foto por vez: cuatro descargas juntas compiten por
 * el mismo ancho de banda que el resto de la web.
 *
 * No se baja nada si el visitante pidió ahorrar datos o está en una conexión
 * lenta. Son ~270 KB de fotos que quizás no mire: en un plan de datos de acá
 * eso se nota, y la web funciona igual sin la precarga (la foto simplemente
 * tarda lo que tardaba antes).
 */
export function PrecargarFotos({ urls }: { urls: string[] }) {
  // Una cadena y no el arreglo: un arreglo nuevo en cada render volvería a
  // disparar el efecto aunque las fotos sean las mismas.
  const clave = urls.join("|");

  useEffect(() => {
    const lista = clave ? clave.split("|") : [];
    if (lista.length === 0) return;

    const conexion = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;

    if (conexion?.saveData) return;
    // Sin dato de conexión (Safari) se asume buena: es lo que hace el navegador
    // con todo lo demás.
    if (conexion?.effectiveType && conexion.effectiveType !== "4g") return;

    let cancelado = false;

    const bajarUnaPorUna = async () => {
      for (const url of lista) {
        if (cancelado) return;
        await new Promise<void>((listo) => {
          const img = new Image();
          // `listo` también en error: si una foto falla, las otras siguen.
          img.onload = img.onerror = () => listo();
          img.src = url;
        });
      }
    };

    const cuandoEsteOcioso = () => {
      if (cancelado) return;
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => bajarUnaPorUna(), { timeout: 5000 });
      } else {
        // Safari todavía no lo tiene: un respiro fijo y a la misma cola.
        setTimeout(bajarUnaPorUna, 2000);
      }
    };

    if (document.readyState === "complete") {
      cuandoEsteOcioso();
      return () => {
        cancelado = true;
      };
    }

    window.addEventListener("load", cuandoEsteOcioso, { once: true });
    return () => {
      cancelado = true;
      window.removeEventListener("load", cuandoEsteOcioso);
    };
  }, [clave]);

  return null;
}
