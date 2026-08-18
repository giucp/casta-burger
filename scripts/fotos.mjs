/**
 * Prepara una foto de producto para la web.
 *
 *     node scripts/fotos.mjs "C:/ruta/Casta burger.png" casta-burger
 *     node scripts/fotos.mjs "C:/ruta/combo 3.png" promo-3-cheese ancha
 *
 * Escribe DOS archivos, porque la foto se ve en dos lados y no sirve la misma:
 *
 * - `public/productos/<slug>.webp` — el recorte de la tarjeta.
 * - `public/productos/<slug>-completa.webp` — la foto entera, sin recortar, con
 *   el lado largo en 1280 px. Es la que se abre al tocar la tarjeta. Acá va
 *   completa a propósito: es la toma del fotógrafo, y es justamente lo que el
 *   recorte se come.
 *
 * El recorte tiene dos formas:
 *
 * - `ancha` (por defecto) — 1280×720 (16:9). Todos los banners de la web, tanto
 *   del menú como de las promos.
 *
 * - `cuadrada` — 720×720. La miniatura chica de antes, cuando la foto iba al
 *   costado del texto. Queda por si alguna vez hace falta.
 *
 * Sobre el 16:9 en fotos verticales: sí, a la hamburguesa le corta el pan de
 * abajo. **Es a propósito.** El banner no está para inventariar el producto sino
 * para dar hambre, y un plano cerrado sobre la carne, el queso derretido y la
 * tocineta vende más que el sándwich entero visto de lejos. El que quiera verlo
 * completo toca la tarjeta y se abre la foto sin recortar.
 *
 * Con las papas se ve clarísimo: de la mitad del empaque para abajo no hay nada
 * que mirar, y ese espacio en el banner se lo comía la bolsa en vez de las
 * papas.
 *
 * En las promos el 16:9 se eligió por otro motivo: son composiciones
 * horizontales y lo que comunican es la CANTIDAD, así que recortarlas de los
 * costados les quitaría hamburguesas. Distinta razón, misma proporción, y de
 * paso todas las tarjetas de la web miden igual.
 *
 * El encuadre lo elige sharp (`attention`): busca la zona con más información y
 * centra ahí. Un recorte al centro pelado le come la corona del pan o deja
 * medio cuadro de reflejo.
 *
 * Todo sale en WebP. Los originales son PNG de 1,5–2 MB; el PNG guarda pixel
 * por pixel, que sirve para un logo con bordes limpios y es un desperdicio para
 * una foto. En WebP quedan en ~50 KB la miniatura y ~150 KB la completa.
 *
 * Los slugs son los de `menu_items`, y hay que dejar las dos rutas escritas en
 * la base con una migración: la web las busca por `menu_items.foto_url` y
 * `foto_completa_url`, no por el nombre del archivo.
 *
 * Los originales no van al repo: son el material del fotógrafo y pesan 40 veces
 * más que lo que la web necesita.
 */
import { mkdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import sharp from "sharp";

/**
 * Medidas del recorte. La tarjeta muestra el banner a 512 px como mucho, así
 * que 1280 sobra hasta en un teléfono de pantalla densa.
 */
const FORMAS = {
  ancha: { ancho: 1280, alto: 720 },
  cuadrada: { ancho: 720, alto: 720 },
};

/**
 * 1280 px el lado largo de la completa. Un teléfono la muestra a unos 400 px de
 * alto; por 3 de densidad de pantalla, 1280 le deja margen y no la deja verse
 * blanda en un iPhone.
 */
const LARGO = 1280;

/** 82 es donde el WebP deja de ganar peso y todavía no pierde nada a la vista. */
const CALIDAD = 82;

const RAIZ = join(import.meta.dirname, "..");
const DESTINO = join(RAIZ, "public", "productos");

const [origen, slug, forma = "ancha"] = process.argv.slice(2);

if (!origen || !slug) {
  console.error(
    'Uso: node scripts/fotos.mjs "<foto de origen>" <slug del producto> [cuadrada|ancha]\n' +
      'Ej:  node scripts/fotos.mjs "C:/Users/pc/Downloads/Casta burger.png" casta-burger\n' +
      'Ej:  node scripts/fotos.mjs "C:/Users/pc/Downloads/combo 3.png" promo-3-cheese ancha',
  );
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error(
    `Slug inválido: "${slug}". Va en minúsculas, sin acentos y con guiones.`,
  );
  process.exit(1);
}

if (!(forma in FORMAS)) {
  console.error(
    `Forma inválida: "${forma}". Es "ancha" (por defecto) o "cuadrada".`,
  );
  process.exit(1);
}

await mkdir(DESTINO, { recursive: true });

const { ancho, alto } = FORMAS[forma];

const recorte = await sharp(origen)
  .resize(ancho, alto, { fit: "cover", position: sharp.strategy.attention })
  .webp({ quality: CALIDAD })
  .toFile(join(DESTINO, `${slug}.webp`));

/**
 * `fit: inside` respeta la proporción y no agranda si la foto ya es más chica
 * (`withoutEnlargement`): estirar una foto no le agrega detalle, solo peso.
 */
const completa = await sharp(origen)
  .resize(LARGO, LARGO, { fit: "inside", withoutEnlargement: true })
  .webp({ quality: CALIDAD })
  .toFile(join(DESTINO, `${slug}-completa.webp`));

const kb = (n) => `${Math.round(n / 1024)} KB`;
// El peso del original sale del disco: `sharp().metadata()` no lo trae cuando
// la entrada es un archivo.
const { size: original } = await stat(origen);

console.log(`${basename(origen)}  (${kb(original)})`);
console.log(
  `  → productos/${slug}.webp` +
    `           ${recorte.width}×${recorte.height} (${forma}), ${kb(recorte.size)}`,
);
console.log(
  `  → productos/${slug}-completa.webp` +
    `  ${completa.width}×${completa.height}, ${kb(completa.size)}`,
);
console.log(
  `\nFalta que la base lo sepa:\n` +
    `  update menu_items set foto_url = '/productos/${slug}.webp',\n` +
    `                        foto_completa_url = '/productos/${slug}-completa.webp'\n` +
    `   where slug = '${slug}';`,
);
