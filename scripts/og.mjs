/**
 * Genera `public/og.jpg`: la imagen que se ve cuando alguien comparte el link
 * por WhatsApp, Instagram o cualquier otro lado.
 *
 *     node scripts/og.mjs
 *
 * Se corre a mano, no en el build: el resultado queda commiteado en `public/`
 * para que el crawler de WhatsApp lo agarre como archivo estático (más rápido
 * y sin sorpresas). Volver a correrlo solo si cambia la marca o el mensaje.
 *
 * Usa el mismo motor que Next para las imágenes OG (satori + resvg) con las
 * piezas reales de la marca: el logo de `public/icons` y la plancha del hero.
 * Las fuentes se bajan una vez a `scripts/.fuentes/` (ignorada por git).
 *
 * NOTA: el paso final PNG → JPG usa PowerShell (System.Drawing), así que este
 * script es de Windows. La web no depende de él, solo la regeneración.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
// `next/og.js` con extensión: node pelado no aplica los alias del bundler.
import { ImageResponse } from "next/og.js";

const RAIZ = join(import.meta.dirname, "..");
const CACHE_FUENTES = join(import.meta.dirname, ".fuentes");

/** Paleta del sistema de diseño (§3 del brief), igual que globals.css. */
const INK = "#0C0C0C";
const CASTA = "#C02830";
const ASH = "#D6CFC7";
const SMOKE = "#948B82";

/**
 * Las mismas tres fuentes que carga la web. Ojo: tienen que ser estáticas —
 * el Inter variable de Google Fonts rompe el parser de satori, por eso sale
 * de fontsource.
 */
const FUENTES = {
  Anton: {
    url: "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf",
    ext: "ttf",
  },
  Inter: {
    url: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.2.8/files/inter-latin-400-normal.woff",
    ext: "woff",
  },
  "Space Mono": {
    url: "https://github.com/google/fonts/raw/main/ofl/spacemono/SpaceMono-Regular.ttf",
    ext: "ttf",
  },
};

/** Nodo estilo React sin JSX: este archivo lo corre node pelado. */
const el = (type, props = {}, ...hijos) => ({
  type,
  props: { ...props, children: hijos.length > 1 ? hijos : hijos[0] },
  key: null,
});

async function fuente(nombre) {
  const { url, ext } = FUENTES[nombre];
  const archivo = join(CACHE_FUENTES, `${nombre}.${ext}`);
  if (!existsSync(archivo)) {
    await mkdir(CACHE_FUENTES, { recursive: true });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`No bajó la fuente ${nombre}: ${res.status}`);
    await writeFile(archivo, Buffer.from(await res.arrayBuffer()));
  }
  return readFile(archivo);
}

async function comoDataUri(rutaRelativa) {
  const bin = await readFile(join(RAIZ, rutaRelativa));
  return `data:image/png;base64,${bin.toString("base64")}`;
}

const [anton, inter, mono, logo, plancha] = await Promise.all([
  fuente("Anton"),
  fuente("Inter"),
  fuente("Space Mono"),
  comoDataUri("public/icons/icon-192.png"),
  comoDataUri("public/marca/plancha.png"),
]);

const tarjeta = el(
  "div",
  {
    style: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      width: "1200px",
      height: "630px",
      background: INK,
      padding: "56px 72px 60px",
      fontFamily: "Inter",
    },
  },

  // Filo rojo arriba: lo mismo que hace el borde de la marca en la web.
  el("div", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "1200px",
      height: "10px",
      background: CASTA,
    },
  }),

  // La plancha del hero, apoyada en el borde de abajo (no cortada por él).
  el("img", {
    src: plancha,
    style: {
      position: "absolute",
      right: "34px",
      bottom: "34px",
      width: "560px",
      height: "412px",
    },
  }),

  // Marca: el logo real + el nombre como en el top bar.
  el(
    "div",
    { style: { display: "flex", alignItems: "center", gap: "18px" } },
    el("img", { src: logo, style: { width: "62px", height: "62px" } }),
    el(
      "div",
      {
        // El espacio suelto entre las dos palabras se lo come satori: va como
        // gap del flex.
        style: {
          display: "flex",
          gap: "10px",
          fontFamily: "Anton",
          fontSize: "36px",
          letterSpacing: "0.02em",
          color: "#FFFFFF",
        },
      },
      el("span", {}, "CASTA"),
      el("span", { style: { color: CASTA } }, "BURGER"),
    ),
  ),

  el(
    "div",
    { style: { display: "flex", flexDirection: "column" } },

    // Sello del horario, en mono como los datos de la web.
    el(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
          fontFamily: "Space Mono",
          fontSize: "18px",
          letterSpacing: "0.2em",
          color: SMOKE,
        },
      },
      el("div", {
        style: {
          width: "9px",
          height: "9px",
          borderRadius: "9px",
          background: CASTA,
        },
      }),
      "JUE–DOM · 6–11 PM",
    ),

    el(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          fontFamily: "Anton",
          fontSize: "128px",
          lineHeight: "0.86",
          letterSpacing: "0.005em",
          color: "#FFFFFF",
        },
      },
      el("div", { style: { display: "flex" } }, "SOMOS"),
      el("div", { style: { display: "flex", color: CASTA } }, "CASTA."),
    ),

    el(
      "div",
      {
        style: {
          display: "flex",
          marginTop: "26px",
          maxWidth: "520px",
          fontSize: "25px",
          lineHeight: "1.35",
          color: ASH,
        },
      },
      "Hamburguesas smash de verdad. Pan de batata, queso facilista y salsa de la casa.",
    ),
  ),

  el(
    "div",
    {
      style: {
        display: "flex",
        fontFamily: "Space Mono",
        fontSize: "16px",
        letterSpacing: "0.12em",
        color: SMOKE,
      },
    },
    // No se agranda: más largo que esto se mete debajo de la plancha.
    "DARK KITCHEN EN BARINAS · RETIRO O DELIVERY",
  ),
);

const png = join(RAIZ, "public", "og.png");
const jpg = join(RAIZ, "public", "og.jpg");

const imagen = new ImageResponse(tarjeta, {
  width: 1200,
  height: 630,
  fonts: [
    { name: "Anton", data: anton, weight: 400, style: "normal" },
    { name: "Inter", data: inter, weight: 400, style: "normal" },
    { name: "Space Mono", data: mono, weight: 400, style: "normal" },
  ],
});

await writeFile(png, Buffer.from(await imagen.arrayBuffer()));

// WhatsApp prefiere JPG y archivos livianos; el PNG queda como intermedio.
execFileSync("powershell.exe", [
  "-NoProfile",
  "-Command",
  `Add-Type -AssemblyName System.Drawing; ` +
    `$img = [System.Drawing.Image]::FromFile('${png}'); ` +
    `$plano = New-Object System.Drawing.Bitmap($img.Width, $img.Height); ` +
    `$g = [System.Drawing.Graphics]::FromImage($plano); ` +
    `$g.Clear([System.Drawing.Color]::FromArgb(12,12,12)); ` +
    `$g.DrawImage($img, 0, 0, $img.Width, $img.Height); ` +
    `$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }; ` +
    `$par = New-Object System.Drawing.Imaging.EncoderParameters(1); ` +
    `$par.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 92); ` +
    `$plano.Save('${jpg}', $codec, $par); ` +
    `$g.Dispose(); $plano.Dispose(); $img.Dispose()`,
]);

await rm(png);

console.log("Listo: public/og.jpg");
