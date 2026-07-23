import { usd } from "@/lib/format";
import { fechaCorta } from "@/lib/admin/datos";
import { listarInventario } from "@/lib/acciones/inventario";
import { hoyCaracas, resumenDiario } from "@/lib/acciones/numeros";

export const metadata = { title: "Números — Casta Admin" };

/** Ventas, compras y stock cambian todo el tiempo: nada de versiones guardadas. */
export const dynamic = "force-dynamic";

function Tarjeta({
  etiqueta,
  valor,
  tono = "normal",
  nota,
}: {
  etiqueta: string;
  valor: string;
  tono?: "normal" | "bueno" | "malo";
  nota?: string;
}) {
  const color =
    tono === "bueno"
      ? "text-emerald-400"
      : tono === "malo"
        ? "text-casta"
        : "text-white";

  return (
    <div className="rounded-card border border-white/8 bg-card px-4 py-3.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-smoke">
        {etiqueta}
      </p>
      <p className={`mt-1 font-mono text-2xl font-bold ${color}`}>{valor}</p>
      {nota && (
        <p className="mt-0.5 font-mono text-[10px] text-smoke">{nota}</p>
      )}
    </div>
  );
}

export default async function NumerosPage() {
  const [resumen, inventario, hoy] = await Promise.all([
    resumenDiario(),
    listarInventario(),
    hoyCaracas(),
  ]);

  const bajoStock = inventario.filter((i) => i.cantidad <= i.umbralAlerta);
  const deHoy = resumen.find((f) => f.dia === hoy) ?? {
    dia: hoy,
    pedidos: 0,
    ventas: 0,
    compras: 0,
    gananciaNeta: 0,
  };

  return (
    <>
      <h1 className="mb-1 font-display text-4xl uppercase tracking-[0.01em]">
        Números
      </h1>
      <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.1em] text-smoke">
        Hoy {fechaCorta(hoy)} · una venta cuenta cuando el pedido se marca
        entregado
      </p>

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tarjeta etiqueta="Entregados hoy" valor={String(deHoy.pedidos)} />
        <Tarjeta etiqueta="Ventas hoy" valor={usd(deHoy.ventas)} />
        <Tarjeta
          etiqueta="Compras hoy"
          valor={usd(deHoy.compras)}
          tono="malo"
        />
        <Tarjeta
          etiqueta="Ganancia hoy"
          valor={usd(deHoy.gananciaNeta)}
          tono={deHoy.gananciaNeta >= 0 ? "bueno" : "malo"}
          nota="ventas − compras"
        />
      </div>

      {bajoStock.length > 0 && (
        <div className="mb-7 rounded-card border border-casta/40 bg-casta/10 px-4 py-3.5">
          <p className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-casta">
            {bajoStock.length} en bajo stock
          </p>
          <p className="text-sm text-ash">
            {bajoStock.map((i) => i.nombre).join(" · ")}
          </p>
        </div>
      )}

      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-smoke">
        Últimos 14 días
      </h2>

      {resumen.length === 0 ? (
        <p className="rounded-card border border-white/8 py-10 text-center font-mono text-sm text-smoke">
          Sin movimientos todavía. Acá van a aparecer las ventas y las compras
          de cada día.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-white/8">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="bg-card font-mono text-[10px] uppercase tracking-[0.1em] text-smoke">
                <th className="px-4 py-2.5 font-normal">Día</th>
                <th className="px-4 py-2.5 text-right font-normal">
                  Entregados
                </th>
                <th className="px-4 py-2.5 text-right font-normal">Ventas</th>
                <th className="px-4 py-2.5 text-right font-normal">Compras</th>
                <th className="px-4 py-2.5 text-right font-normal">Ganancia</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {resumen.map((f) => (
                <tr key={f.dia} className="border-t border-white/8">
                  <td className="px-4 py-3 capitalize">{fechaCorta(f.dia)}</td>
                  <td className="px-4 py-3 text-right">{f.pedidos}</td>
                  <td className="px-4 py-3 text-right">{usd(f.ventas)}</td>
                  <td className="px-4 py-3 text-right text-smoke">
                    {f.compras > 0 ? usd(f.compras) : "—"}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${
                      f.gananciaNeta >= 0 ? "text-emerald-400" : "text-casta"
                    }`}
                  >
                    {usd(f.gananciaNeta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
