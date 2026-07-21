import { CartBar } from "@/components/CartBar";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartUIProvider } from "@/components/cart/CartUI";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Menu } from "@/components/Menu";
import { TopBar } from "@/components/TopBar";
import { estadoNegocio } from "@/lib/horario";
import { obtenerMenu } from "@/lib/menu-db";
import { porCategoria } from "@/lib/menu";

/**
 * El sello abierto/cerrado depende de la hora de Caracas y el menú lo edita el
 * dueño desde /admin, así que la página se revalida cada minuto en vez de
 * quedar congelada en el build.
 */
export const revalidate = 60;

export default async function Home() {
  const estado = estadoNegocio();
  const menu = await obtenerMenu();
  const extras = porCategoria(menu, "Extras");

  return (
    <CartProvider>
      <CartUIProvider extras={extras}>
        <TopBar estado={estado} />
        <main className="flex-1">
          <Hero estado={estado} />
          <Menu items={menu} puedePedir={estado.puedePedir} />
        </main>
        <Footer />
        {/* Reserva el alto de la barra fija para que no tape el footer */}
        <div aria-hidden className="h-21 shrink-0" />
        <CartBar estado={estado} />
      </CartUIProvider>
    </CartProvider>
  );
}
