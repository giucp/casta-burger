import type { Metadata, Viewport } from "next";
import { Anton, Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { BUSINESS } from "@/lib/config";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

/** Dominio propio el día de la entrega: se cambia con esta variable en Vercel. */
// `||` y no `??`: la variable puede estar declarada y vacía, y `new URL("")` truena.
const SITIO =
  process.env.NEXT_PUBLIC_SITE_URL || "https://casta-burger.vercel.app";

const TITULO = `${BUSINESS.nombre} — Hamburguesas smash en ${BUSINESS.ciudad}`;
const DESCRIPCION =
  "Hamburguesas smash de verdad. Pan de batata, queso facilista y salsa de la casa. Pide por acá y recógela — o te la llevamos.";

export const metadata: Metadata = {
  // Sin esto los links de la imagen salen relativos y WhatsApp no los resuelve.
  metadataBase: new URL(SITIO),
  title: TITULO,
  description: DESCRIPCION,
  /**
   * La tarjeta que se ve al pegar el link en WhatsApp, Instagram o Facebook.
   * La imagen es un archivo estático: `public/og.jpg`, generado con
   * `node scripts/og.mjs`. Si se cambia la marca, hay que regenerarla.
   */
  openGraph: {
    type: "website",
    siteName: BUSINESS.nombre,
    locale: "es_VE",
    url: "/",
    title: TITULO,
    description: DESCRIPCION,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: `${BUSINESS.nombre} — ${BUSINESS.formato}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
    images: ["/og.jpg"],
  },
  // iOS no usa el manifest para el ícono de inicio: usa este.
  appleWebApp: {
    capable: true,
    title: BUSINESS.nombre,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C0C0C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${anton.variable} ${inter.variable} ${spaceMono.variable} h-full antialiased`}
    >
      {/* El espacio para la barra fija del carrito lo reserva la página
          pública, no el body: /admin no tiene esa barra. */}
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
