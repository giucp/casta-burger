/**
 * Sello — el elemento firma de la marca (§3).
 * Píldora con borde, texto en Space Mono y una ligera rotación de -3°.
 * Se usa para el estado del negocio, el horario y como eyebrow de secciones.
 */

type Props = {
  children: React.ReactNode;
  /** `rojo` = activo/abierto · `apagado` = inactivo/cerrado */
  tono?: "rojo" | "apagado";
  /** Muestra el punto a la izquierda (estado del negocio) */
  punto?: boolean;
  title?: string;
};

export function Stamp({
  children,
  tono = "rojo",
  punto = false,
  title,
}: Props) {
  const esRojo = tono === "rojo";

  return (
    <span
      title={title}
      className={[
        "inline-flex items-center gap-1.5 -rotate-3",
        "rounded-full border-2 px-3 py-[5px]",
        "font-mono text-[11px] font-bold uppercase tracking-[0.14em]",
        esRojo
          ? "border-casta text-casta shadow-[inset_0_0_0_1px_rgba(192,40,48,.25)]"
          : "border-smoke text-smoke",
      ].join(" ")}
    >
      {punto && (
        <span
          aria-hidden
          className={`size-[7px] rounded-full ${esRojo ? "bg-casta" : "bg-smoke"}`}
        />
      )}
      {children}
    </span>
  );
}
