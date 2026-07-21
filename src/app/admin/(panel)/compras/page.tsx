import { ComprasPanel } from "@/components/admin/ComprasPanel";
import { comprasDemo } from "@/lib/admin/datos";
import { HORARIO } from "@/lib/config";

export const metadata = { title: "Compras — Casta Admin" };

/** La fecha por defecto del formulario es hoy en Caracas, no en el servidor. */
function hoyEnCaracas(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: HORARIO.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function ComprasPage() {
  return (
    <>
      <h1 className="mb-1 font-display text-4xl uppercase tracking-[0.01em]">
        Compras
      </h1>
      <p className="mb-5 max-w-prose text-sm text-smoke">
        Todo lo que se gasta en insumos. Es la mitad que le falta a las ventas
        para saber la ganancia neta.
      </p>

      <ComprasPanel inicial={comprasDemo()} hoy={hoyEnCaracas()} />
    </>
  );
}
