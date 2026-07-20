import { CartBar } from "@/components/CartBar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Menu } from "@/components/Menu";
import { TopBar } from "@/components/TopBar";
import { estadoNegocio } from "@/lib/horario";

/**
 * El sello abierto/cerrado depende de la hora de Caracas, así que la página
 * se revalida cada minuto en vez de quedar congelada en el build.
 */
export const revalidate = 60;

export default function Home() {
  const estado = estadoNegocio();

  return (
    <>
      <TopBar estado={estado} />
      <main className="flex-1">
        <Hero estado={estado} />
        <Menu />
      </main>
      <Footer />
      <CartBar estado={estado} />
    </>
  );
}
