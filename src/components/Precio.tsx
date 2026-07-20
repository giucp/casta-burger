import { bs, usd } from "@/lib/format";

/**
 * Precio en tipografía monoespaciada estilo ticket (§3).
 * El USD manda; los bolívares van debajo, secundarios y aproximados.
 */
export function Precio({
  monto,
  conBs = true,
}: {
  monto: number | null;
  conBs?: boolean;
}) {
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
      {conBs && (
        <span className="block text-[11px] font-normal text-bone-mute">
          {bs(monto)}
        </span>
      )}
    </span>
  );
}
