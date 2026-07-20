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

export const metadata: Metadata = {
  title: `${BUSINESS.nombre} — Hamburguesas smash en ${BUSINESS.zona}`,
  description:
    "Hamburguesas smash de verdad. Pan de batata, queso facilista y salsa de la casa. Pide por acá y recógela — o te la llevamos.",
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
      <body className="min-h-full flex flex-col pb-21">{children}</body>
    </html>
  );
}
