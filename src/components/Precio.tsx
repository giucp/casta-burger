import { usd } from "@/lib/format";

/**
 * Precio en tipografía monoespaciada estilo ticket (§3). Solo USD.
 */
export function Precio({ monto }: { monto: number | null }) {
  if (monto === null) {
    return (
      <span className="whitespace-nowrap text-right font-mono text-[11px] uppercase tracking-[0.08em] text-bone-mute">
        Consultar
      </span>
    );
  }

  return (
    <span className="whitespace-nowrap text-right font-mono text-base font-bold">
      {usd(monto)}
    </span>
  );
}
