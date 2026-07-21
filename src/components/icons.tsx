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

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.25 8.24a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.26-8.24Zm-2.6 4.3c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.03s.87 2.35.99 2.51c.12.16 1.7 2.6 4.13 3.65.58.25 1.03.4 1.38.51.58.19 1.1.16 1.52.1.46-.07 1.43-.59 1.63-1.15.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.53-1.31-.74-1.79-.19-.46-.39-.4-.53-.41h-.46Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5.2" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
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
