/**
 * Cinta de "C" repetidas que enmarca la página por arriba y por abajo.
 *
 * La C sale del pliego del diseñador (`ELEMENTOS CASTA.eps`): son las dos
 * figuras negras del logotipo suelto —la letra y la corona— pasadas a un
 * viewBox propio de 74.95 × 100. Acá van en un solo color plano, como el
 * patrón de un papel de envolver: a este tamaño el contorno amarillo del
 * original se empasta y no se lee.
 *
 * El motivo se repite con `<pattern>`, no con una imagen: pesa un par de KB,
 * queda nítido en cualquier pantalla y se adapta solo al ancho.
 *
 * El `id` es obligatorio y tiene que ser distinto en cada cinta de la página:
 * dos elementos con el mismo id es HTML inválido.
 */
const C_LETRA =
  "M1.14 57.28C5.85 36.37 21.54 27.54 45.8 33C64.36 37.18 71.89 47.25 71.09 59.24L50.33 56.38C50.71 50.47 48.54 47.03 43.47 45.89C36.77 44.38 30.13 48.5 27.01 62.35C23.94 76.02 28.28 82.9 35.44 84.51C41.41 85.85 45.34 83.6 49.04 77.3L66.83 87.01C61.25 96.6 49.92 102.99 30.36 98.58C6.73 93.26 -3.65 78.56 1.14 57.28Z";

const C_CORONA =
  "M28.95 33.7C28.87 33.68 28.78 33.65 28.71 33.62C27.91 33.3 27.53 32.4 27.85 31.61C27.92 31.43 32.66 19.03 24.87 4.41C24.14 3.17 23.72 2.39 23.66 2.28C23.26 1.54 23.52 0.62 24.25 0.2C24.98 -0.21 25.91 0.03 26.34 0.74C26.76 1.44 27.16 2.12 27.53 2.81C29.35 5.87 33.21 11.97 38.12 17.41C39.64 14.1 42.53 7.91 43.78 6C44.15 5.43 44.86 5.17 45.52 5.37C46.17 5.57 46.62 6.17 46.62 6.86C46.62 6.97 46.67 17.35 51.81 22.01C55.64 18.64 68.17 7.91 73.26 7.42C73.94 7.35 74.59 7.74 74.84 8.38C75.1 9.02 74.9 9.76 74.36 10.18C74.32 10.21 70.39 13.27 66.28 17.97C62.55 22.24 57.88 28.76 56.83 35.64C56.71 36.49 55.92 37.07 55.07 36.94C54.23 36.81 53.64 36.02 53.77 35.18C54.68 29.2 57.97 22.89 63.55 16.4C59.78 19.24 55.8 22.59 52.91 25.18C52.37 25.66 51.58 25.71 51 25.31C46.55 22.25 44.75 16.44 44.02 12.15C42.51 15.24 40.8 18.98 39.98 20.79C39.77 21.26 39.35 21.6 38.84 21.68C38.34 21.77 37.82 21.61 37.46 21.24C35.4 19.11 33.49 16.85 31.8 14.66C33.78 24.94 30.89 32.33 30.72 32.76C30.43 33.48 29.67 33.86 28.95 33.7Z";

/**
 * Medidas de la celda, en px. Más chico que esto la corona —que es un trazo
 * fino— se empasta y la C parece una mancha; más junto, la cinta se cierra y
 * pesa demasiado arriba del logo.
 */
const ALTO = 44;
const PASO = 42;
/** La C original mide 100 de alto; acá va a 30. */
const ESCALA = 0.3;

const ANCHO_C = 74.95 * ESCALA;
const ALTO_C = 100 * ESCALA;

export function CintaMarca({ id, className }: { id: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={className}
      style={{ height: ALTO, overflow: "hidden" }}
    >
      <svg className="block h-full w-full">
        <defs>
          <pattern
            id={id}
            width={PASO}
            height={ALTO}
            patternUnits="userSpaceOnUse"
          >
            <g
              fill="var(--color-casta)"
              // Misma idea que la mano de la plancha del hero: más tenue que
              // el rojo sólido, para que quede como textura de fondo y no
              // compita con el contenido.
              opacity={0.35}
              transform={`translate(${(PASO - ANCHO_C) / 2} ${(ALTO - ALTO_C) / 2}) scale(${ESCALA})`}
            >
              <path d={C_LETRA} />
              <path d={C_CORONA} />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}
