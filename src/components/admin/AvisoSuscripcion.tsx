import { SUSCRIPCION } from "@/lib/config";

/**
 * Lo que ve el equipo en el panel cuando venció la cuota mensual.
 *
 * El tono es de aviso, no de reclamo: quien lo lee es el cliente, y lo que
 * tiene que salir sabiendo es qué pasó, que sus datos están bien, y cómo se
 * arregla en un toque. El público de la web no ve nada de esto — solo un
 * "en mantenimiento" neutro.
 */
export function AvisoSuscripcion() {
  const mensaje = `Hola ${SUSCRIPCION.proveedor}, quiero reportar el pago de la cuota mensual de Casta Burger.`;
  const enlace = `https://wa.me/${SUSCRIPCION.whatsapp}?text=${encodeURIComponent(mensaje)}`;

  return (
    <section className="mx-auto max-w-xl py-10 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-casta">
        Cuota mensual pendiente
      </p>

      <h1 className="mt-3 font-display text-4xl uppercase leading-[0.95] tracking-[0.01em]">
        Tu servicio está en pausa
      </h1>

      <p className="mt-5 text-[15px] leading-relaxed text-ash">
        Para seguir disfrutando del panel y mantener tu web en línea, está
        pendiente la cuota mensual de{" "}
        <b className="text-white">${SUSCRIPCION.montoUsd} a tasa BCV</b>, que
        vence cada día {SUSCRIPCION.diaDeCobro}.
      </p>

      <p className="mt-3 text-[15px] leading-relaxed text-ash">
        Tus pedidos, menú, recetas e inventario están guardados y seguros.
        Apenas confirmemos el pago, todo vuelve a quedar como lo dejaste.
      </p>

      <a
        href={enlace}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-casta px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-casta-deep"
      >
        Reportar pago por WhatsApp
      </a>

      <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.14em] text-smoke">
        Gracias por confiar en {SUSCRIPCION.proveedor}
      </p>
    </section>
  );
}
