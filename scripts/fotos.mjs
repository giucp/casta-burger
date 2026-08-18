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
 * El recorte tiene DOS formas, y elegir mal arruina la foto:
 *
 * - `cuadrada` — 720×720. La miniatura chica de antes, cuando la foto iba al
 *   costado del texto.
 *
 * - `producto` (por defecto) — 4:3, para el banner de las tarjetas del menú.
 *   Es el recorte más ancho que estas fotos aguantan: son verticales, y en
 *   16:9 la hamburguesa pierde el pan de arriba y el de abajo y queda un primer
 *   plano de textura en vez de un producto. En 4:3 entra entera y con aire.
 *
 * - `ancha` — 1280×720 (16:9), para el banner de las promos. Estas fotos son
 *   composiciones horizontales —dos hamburguesas lado a lado, tres en fila— y
 *   lo que comunican ES la cantidad. Un recorte cuadrado les cortaría las de
 *   los extremos y la promo mostraría menos de lo que vende. En 16:9 solo se
 *   recorta arriba y abajo, que es donde está el negro de sobra, y no se pierde
 *   ninguna hamburguesa.
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
 * Medidas del recorte de la tarjeta. La cuadrada se muestra a 96 px y la ancha
 * a lo ancho de la tarjeta de promo: en las dos sobra hasta en un teléfono de
 * pantalla densa.
 */
const FORMAS = {
  cuadrada: { ancho: 720, alto: 720 },
  producto: { ancho: 960, alto: 720 },
  ancha: { ancho: 1280, alto: 720 },
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

const [origen, slug, forma = "producto", desdeArriba] = process.argv.slice(2);

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
    `Forma inválida: "${forma}". Es "producto" (menú), "ancha" (promos) o "cuadrada".`,
  );
  process.exit(1);
}

await mkdir(DESTINO, { recursive: true });

const { ancho, alto } = FORMAS[forma];

/**
 * Normalmente el encuadre lo elige sharp. Pero `attention` mira dónde hay más
 * información, no dónde queda bonito, y con un producto que llena casi todo el
 * cuadro puede pegarlo a un borde: la Casta Burger salía con el pan cortado al
 * ras de arriba, mientras las otras tenían 40 px de aire.
 *
 * El cuarto argumento fuerza a qué altura del original empieza el recorte,
 * medida en píxeles desde arriba. Se usa solo cuando hay que corregir a mano:
 *
 *   node scripts/fotos.mjs "<foto>" casta-burger producto 359
 */
let recortada;
if (desdeArriba === undefined) {
  recortada = sharp(origen).resize(ancho, alto, {
    fit: "cover",
    position: sharp.strategy.attention,
  });
} else {
  const { width: anchoFuente = 0, height: altoFuente = 0 } =
    await sharp(origen).metadata();

  // La ventana usa todo el ancho del original y el alto que le toca según la
  // proporción pedida, así el recorte solo decide la altura.
  const altoVentana = Math.round((anchoFuente * alto) / ancho);
  const tope = Math.max(
    0,
    Math.min(Math.round(Number(desdeArriba)), altoFuente - altoVentana),
  );

  recortada = sharp(origen)
    .extract({ left: 0, top: tope, width: anchoFuente, height: altoVentana })
    .resize(ancho, alto);
}

const recorte = await recortada
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
