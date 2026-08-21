/**
 * Genera los iconos de las tres apps instalables.
 *
 *     node scripts/iconos.mjs
 *
 * Se corre a mano y el resultado queda commiteado en `public/icons/`, igual
 * que `og.mjs`. Solo hay que volver a correrlo si cambia el logo o algún color.
 *
 * Por qué existen tres juegos: el dueño y el cocinero instalan la misma marca
 * tres veces —la web del cliente, el admin y la cocina— y en la pantalla de
 * inicio quedan tres cuadros pegados. Con el mismo ícono habría que abrirlos
 * para saber cuál es cuál, que es justo lo que la app instalada venía a
 * evitar. El logo es el mismo en los tres: lo que cambia es el fondo.
 *
 * El trazo NO se copia acá: se lee de `LogoMarca.tsx`, que es donde vive. Si
 * el diseñador manda el SVG bueno y se reemplaza allá, este script sigue
 * sacando los iconos correctos sin tocarlo.
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const RAIZ = join(import.meta.dirname, "..");
const DESTINO = join(RAIZ, "public", "icons");

/** Paleta del sistema de diseño, igual que globals.css. */
const CASTA = "#c02830";
const BONE = "#f2ecde";

/**
 * Un juego por app nueva. La web del cliente NO está acá a propósito: sus
 * iconos ya existen sueltos en `public/icons/`, ya están instalados en
 * teléfonos de clientes y no hay motivo para regenerarlos. Cambiarle el ícono
 * a una app instalada es cambiarle la cara a algo que la gente ya reconoce.
 */
const APPS = [
  {
    carpeta: "admin",
    fondo: CASTA,
    trazo: BONE,
    nombre: "admin del dueño",
  },
  {
    // Grafito y no el `char` del diseño (#17120e): al lado del ícono de la web
    // no se distinguiría, que es todo el punto de generarlo aparte.
    carpeta: "cocina",
    fondo: "#3d3733",
    trazo: BONE,
    nombre: "cocina",
  },
];

/**
 * Qué archivos lleva cada juego.
 *
 * `escala` es cuánto del cuadro ocupa el logo. El maskable va más chico a
 * propósito: Android lo recorta en círculo (u otra forma, según el launcher) y
 * solo garantiza el 80% central, así que lo que se salga de ahí se puede
 * perder. El resto va holgado porque nadie los recorta.
 */
const PIEZAS = [
  { archivo: "icon-192.png", lado: 192, escala: 0.86, alfa: true },
  { archivo: "icon-512.png", lado: 512, escala: 0.86, alfa: true },
  { archivo: "maskable-512.png", lado: 512, escala: 0.6, alfa: false },
  // iOS no lee el manifest: usa este, y encima le pone las esquinas él solo.
  // Sin alfa porque el fondo transparente le sale negro.
  { archivo: "apple-touch-icon.png", lado: 180, escala: 0.82, alfa: false },
];

/**
 * El trazo del logo sale de LogoMarca.tsx en vez de estar copiado acá: una
 * marca, un archivo. Si el path cambia allá, los iconos lo siguen.
 */
async function trazoDelLogo() {
  const fuente = await readFile(
    join(RAIZ, "src", "components", "LogoMarca.tsx"),
    "utf8",
  );
  const m = fuente.match(/d="(M[^"]+)"/);
  if (!m) {
    throw new Error(
      "No encontré el path en LogoMarca.tsx. ¿Le cambiaron la forma al componente?",
    );
  }
  return m[1];
}

/**
 * El logo centrado sobre un fondo lleno. El `refuerzo` del trazo es el mismo
 * truco que usa el componente: a 192 px la línea es finita y sin engrosarla
 * un poco se corta.
 */
function svg({ lado, escala, fondo, trazo, path }) {
  // El componente encierra el path en este transform; sin él, el dibujo no
  // queda centrado en el viewBox de 1000.
  const encuadre = 0.76 * escala;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 1000 1000">
  <rect width="1000" height="1000" fill="${fondo}"/>
  <g transform="translate(500,500) scale(${encuadre}) translate(-500,-500)">
    <path d="${path}" fill="${trazo}" fill-rule="evenodd" stroke="${trazo}" stroke-width="6" stroke-linejoin="round"/>
  </g>
</svg>`;
}

const path = await trazoDelLogo();

for (const app of APPS) {
  const carpeta = app.carpeta ? join(DESTINO, app.carpeta) : DESTINO;
  await mkdir(carpeta, { recursive: true });

  for (const pieza of PIEZAS) {
    const fuente = Buffer.from(
      svg({ ...pieza, fondo: app.fondo, trazo: app.trazo, path }),
    );

    let img = sharp(fuente, { density: 384 }).resize(pieza.lado, pieza.lado);
    if (!pieza.alfa) img = img.flatten({ background: app.fondo });

    await writeFile(join(carpeta, pieza.archivo), await img.png().toBuffer());
  }

  const donde = app.carpeta ? `public/icons/${app.carpeta}/` : "public/icons/";
  console.log(`${donde.padEnd(26)} ${app.nombre}`);
}
