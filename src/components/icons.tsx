/**
 * Ilustración monolínea de hamburguesa — el estilo de los íconos de la marca (§3).
 * Se reusa en el logo, el arte del hero y el placeholder de las fotos del menú.
 */

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="32" fill="#1C1712" />
      <path
        d="M20 42c-3-4-2-9 1-10 2-1 4 0 5 2 0-4 1-8 4-9 2-1 4 1 4 4 1-3 3-5 5-4 2 1 2 4 1 7 2-2 5-3 6-1 2 2 0 6-3 9-4 4-9 7-14 8-4 1-7-1-9-5z"
        stroke="#C02830"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BurgerArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" aria-hidden>
      <path
        d="M28 96c0-26 20-46 72-46s72 20 72 46"
        stroke="#C02830"
        strokeWidth="4"
      />
      <path d="M24 96h152" stroke="#C02830" strokeWidth="4" />
      <path
        d="M30 108c8 6 20 6 28 0 8 6 20 6 28 0 8 6 20 6 28 0 8 6 20 6 28 0 8 6 16 6 24 2"
        stroke="#C02830"
        strokeWidth="4"
      />
      <path
        d="M30 120c8 6 20 6 28 0 8 6 20 6 28 0 8 6 20 6 28 0 8 6 20 6 28 0"
        stroke="#C02830"
        strokeWidth="4"
      />
      <path
        d="M34 132h132c0 8-8 14-24 14H58c-16 0-24-6-24-14z"
        stroke="#C02830"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="66" cy="70" r="4" fill="#C02830" />
      <circle cx="100" cy="66" r="4" fill="#C02830" />
      <circle cx="134" cy="70" r="4" fill="#C02830" />
    </svg>
  );
}

/** Placeholder mientras no hay foto real del producto (§3: sustituir por fotos). */
export function BurgerGlyph({
  className,
  apagado = false,
}: {
  className?: string;
  apagado?: boolean;
}) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" aria-hidden>
      <path
        d="M28 96c0-26 20-46 72-46s72 20 72 46M24 96h152M34 132h132c0 8-8 14-24 14H58c-16 0-24-6-24-14z"
        stroke={apagado ? "#b7ad99" : "#c9a24a"}
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.4 12.4a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
    </svg>
  );
}
