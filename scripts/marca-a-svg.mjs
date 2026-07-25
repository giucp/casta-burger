/**
 * Saca las piezas de la marca del pliego del diseñador y las deja en SVG.
 *
 *     node scripts/marca-a-svg.mjs "C:/ruta/ELEMENTOS CASTA.eps" salida/
 *
 * El pliego es un EPS de Illustrator. No hace falta Illustrator ni Inkscape:
 * el arte usa el juego de operadores de AGM, que es chico y directo —
 *
 *     x y mo                 moveto
 *     x y li                 lineto
 *     x1 y1 x2 y2 x3 y3 cv   curveto
 *     cp                     closepath
 *     f                      rellena con el color actual
 *     c m y k cmyk           color de relleno
 *
 * y la cabecera trae "1 -1 scale 0 -H translate", que deja las coordenadas ya
 * en el sistema de SVG (origen arriba a la izquierda). O sea: se lee, se
 * traduce y listo.
 *
 * Después de convertir, agrupa las figuras que se tocan: cada grupo es una
 * pieza de la marca (la C sola, el logotipo con manos, la plancha, etc.) y se
 * escribe recortada a su propio viewBox.
 *
 * De acá salieron los dos trazos de la C que usa `CintaMarca`.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const [rutaEps, rutaSalida = "marca-svg"] = process.argv.slice(2);
if (!rutaEps) {
  console.error('Uso: node scripts/marca-a-svg.mjs "<archivo.eps>" [carpeta]');
  process.exit(1);
}

const ps = (await readFile(rutaEps)).toString("latin1");
const arte = ps.slice(ps.indexOf("%%EndSetup"), ps.indexOf("%%PageTrailer"));
if (!arte) {
  console.error("No encontré el arte: ¿es un EPS de Illustrator?");
  process.exit(1);
}

const n = (v) => Math.round(v * 1000) / 1000;

const cmykAHex = (c, m, y, k) =>
  "#" +
  [c, m, y]
    .map((x) =>
      Math.max(0, Math.min(255, Math.round(255 * (1 - x) * (1 - k))))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

const figuras = [];
let pila = [];
let d = [];
let caja = null;
let color = "#000000";

const tocar = (x, y) => {
  caja ??= { x0: x, y0: y, x1: x, y1: y };
  caja.x0 = Math.min(caja.x0, x);
  caja.y0 = Math.min(caja.y0, y);
  caja.x1 = Math.max(caja.x1, x);
  caja.y1 = Math.max(caja.y1, y);
};

for (const bruto of arte.split(/\s+/)) {
  const t = bruto.trim();
  if (!t) continue;
  if (/^-?[\d.]+$/.test(t)) {
    pila.push(Number(t));
    continue;
  }

  if (t === "mo" || t === "li") {
    const [x, y] = pila.slice(-2);
    d.push(`${t === "mo" ? "M" : "L"}${n(x)} ${n(y)}`);
    tocar(x, y);
  } else if (t === "cv") {
    const p = pila.slice(-6);
    d.push(`C${n(p[0])} ${n(p[1])} ${n(p[2])} ${n(p[3])} ${n(p[4])} ${n(p[5])}`);
    tocar(p[0], p[1]);
    tocar(p[2], p[3]);
    tocar(p[4], p[5]);
  } else if (t === "cp") {
    d.push("Z");
  } else if (t === "cmyk") {
    color = cmykAHex(...pila.slice(-4));
  } else if (t === "clp" || t === "np") {
    // recorte de página: no es arte
    d = [];
    caja = null;
  } else if (t === "f") {
    if (d.length) figuras.push({ d: d.join(""), color, caja });
    d = [];
    caja = null;
  }
  pila = [];
}

/** Dos figuras son de la misma pieza si sus cajas se tocan. */
const seTocan = (a, b, margen = 12) =>
  a.x0 - margen < b.x1 &&
  b.x0 - margen < a.x1 &&
  a.y0 - margen < b.y1 &&
  b.y0 - margen < a.y1;

const grupos = [];
for (const fig of figuras) {
  const tocados = grupos.filter((g) => seTocan(g.caja, fig.caja));
  if (tocados.length === 0) {
    grupos.push({ figuras: [fig], caja: { ...fig.caja } });
    continue;
  }
  const [base, ...resto] = tocados;
  base.figuras.push(fig);
  for (const otro of resto) {
    base.figuras.push(...otro.figuras);
    grupos.splice(grupos.indexOf(otro), 1);
  }
  for (const f of base.figuras) {
    base.caja.x0 = Math.min(base.caja.x0, f.caja.x0);
    base.caja.y0 = Math.min(base.caja.y0, f.caja.y0);
    base.caja.x1 = Math.max(base.caja.x1, f.caja.x1);
    base.caja.y1 = Math.max(base.caja.y1, f.caja.y1);
  }
}

await mkdir(rutaSalida, { recursive: true });

for (const [i, g] of grupos.entries()) {
  const pad = 6;
  const { x0, y0, x1, y1 } = g.caja;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(x0 - pad)} ${n(y0 - pad)} ` +
    `${n(x1 - x0 + pad * 2)} ${n(y1 - y0 + pad * 2)}">` +
    g.figuras.map((f) => `<path fill="${f.color}" d="${f.d}"/>`).join("") +
    "</svg>";
  await writeFile(join(rutaSalida, `pieza-${i}.svg`), svg);
  console.log(
    `pieza-${i}.svg  ${Math.round(x1 - x0)}x${Math.round(y1 - y0)}  ` +
      `${g.figuras.length} figuras  ${[...new Set(g.figuras.map((f) => f.color))].join(" ")}`,
  );
}
