/**
 * Prepara una foto de producto para la web.
 *
 *     node scripts/fotos.mjs "C:/ruta/Casta burger.png" casta-burger
 *
 * Escribe `public/productos/<slug>.webp`. El slug es el de `menu_items`, y hay
 * que dejarlo escrito en la base con una migración: la web busca la foto por
 * `menu_items.foto_url`, no por el nombre del archivo.
 *
 * Qué hace y por qué:
 *
 * - **Recorta cuadrado.** La tarjeta del menú muestra la foto en un cuadro y
 *   con `object-cover`, así que si el archivo no es cuadrado el navegador
 *   recorta igual, pero a ciegas. Mejor decidirlo acá y ver el resultado.
 *
 * - **Elige el encuadre solo** (`attention` de sharp): busca la zona con más
 *   información y centra ahí. Las fotos del fotógrafo son verticales, con el
 *   producto arriba y el reflejo abajo; un recorte al centro pelado le come la
 *   corona del pan o deja medio cuadro de reflejo.
 *
 * - **Pasa a WebP.** Los originales son PNG de 1,5–2 MB. En WebP quedan en
 *   ~50 KB sin que se note la diferencia a este tamaño. El PNG guarda pixel por
 *   pixel, que sirve para un logo con bordes limpios y es un desperdicio para
 *   una foto.
 *
 * Los originales no van al repo: son el material del fotógrafo y pesan 40 veces
 * más que lo que la web necesita.
 */
import { mkdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import sharp from "sharp";

/**
 * 720 px de lado. La tarjeta la muestra a 96 px, así que sobra incluso en un
 * teléfono de pantalla densa; el margen es para el día que la foto se quiera
 * ver más grande sin volver a pedirle los archivos al fotógrafo.
 */
const LADO = 720;

/** 82 es donde el WebP deja de ganar peso y todavía no pierde nada a la vista. */
const CALIDAD = 82;

const RAIZ = join(import.meta.dirname, "..");
const DESTINO = join(RAIZ, "public", "productos");

const [origen, slug] = process.argv.slice(2);

if (!origen || !slug) {
  console.error(
    'Uso: node scripts/fotos.mjs "<foto de origen>" <slug del producto>\n' +
      'Ej:  node scripts/fotos.mjs "C:/Users/pc/Downloads/Casta burger.png" casta-burger',
  );
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error(
    `Slug inválido: "${slug}". Va en minúsculas, sin acentos y con guiones.`,
  );
  process.exit(1);
}

await mkdir(DESTINO, { recursive: true });

const salida = join(DESTINO, `${slug}.webp`);

const info = await sharp(origen)
  .resize(LADO, LADO, { fit: "cover", position: sharp.strategy.attention })
  .webp({ quality: CALIDAD })
  .toFile(salida);

const kb = (n) => `${Math.round(n / 1024)} KB`;
// El peso del original sale del disco: `sharp().metadata()` no lo trae cuando
// la entrada es un archivo.
const { size: original } = await stat(origen);

console.log(
  `${basename(origen)} → public/productos/${slug}.webp` +
    `  (${kb(original)} → ${kb(info.size)}, ${info.width}×${info.height})`,
);
console.log(
  `Falta que la base lo sepa:  update menu_items set foto_url = '/productos/${slug}.webp' where slug = '${slug}';`,
);
