import { usd } from "@/lib/format";
import {
  enAlerta,
  fechaCorta,
  inventarioDemo,
  resumenDemo,
  totales,
} from "@/lib/admin/datos";

export const metadata = { title: "Números — Casta Admin" };

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

export default function NumerosPage() {
  const resumen = resumenDemo();
  const t = totales(resumen);
  const bajoStock = inventarioDemo().filter(enAlerta);

  return (
    <>
      <h1 className="mb-1 font-display text-4xl uppercase tracking-[0.01em]">
        Números
      </h1>
      <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.1em] text-smoke">
        Últimos {resumen.length} días de servicio
      </p>

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tarjeta etiqueta="Pedidos" valor={String(t.pedidos)} />
        <Tarjeta etiqueta="Ventas" valor={usd(t.ventas)} />
        <Tarjeta etiqueta="Compras" valor={usd(t.compras)} tono="malo" />
        <Tarjeta
          etiqueta="Ganancia neta"
          valor={usd(t.gananciaNeta)}
          tono={t.gananciaNeta >= 0 ? "bueno" : "malo"}
          nota="ventas − compras"
        />
      </div>

      {bajoStock.length > 0 && (
        <div className="mb-7 rounded-card border border-casta/40 bg-casta/10 px-4 py-3.5">
          <p className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-casta">
            ⚠ {bajoStock.length} en bajo stock
          </p>
          <p className="text-sm text-ash">
            {bajoStock.map((i) => i.nombre).join(" · ")}
          </p>
        </div>
      )}

      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-smoke">
        Día por día
      </h2>

      <div className="overflow-x-auto rounded-card border border-white/8">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="bg-card font-mono text-[10px] uppercase tracking-[0.1em] text-smoke">
              <th className="px-4 py-2.5 font-normal">Día</th>
              <th className="px-4 py-2.5 text-right font-normal">Pedidos</th>
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
    </>
  );
}
