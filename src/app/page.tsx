import { CartBar } from "@/components/CartBar";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartUIProvider } from "@/components/cart/CartUI";
import { CintaMarca } from "@/components/CintaMarca";
import { EstadoProvider } from "@/components/EstadoNegocio";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Mantenimiento } from "@/components/Mantenimiento";
import { Menu } from "@/components/Menu";
import { PrecargarFotos } from "@/components/PrecargarFotos";
import { TopBar } from "@/components/TopBar";
import { MANTENIMIENTO } from "@/lib/config";
import { estadoNegocio } from "@/lib/horario";
import { obtenerMenu } from "@/lib/menu-db";
import { porCategoria } from "@/lib/menu";

/**
 * El menú lo edita el dueño desde /admin, así que la página se revalida cada
 * minuto en vez de quedar congelada en el build.
 *
 * El sello abierto/cerrado no depende de esto: el estado que calcula el
 * servidor es solo el del primer pintado, y de ahí en adelante lo mantiene al
 * día `EstadoProvider` con el reloj del navegador. Si no, quien dejara la web
 * abierta cruzando las 6:00 o las 11:00 PM no vería el cambio.
 */
export const revalidate = 60;

export default async function Home() {
  // Antes de cualquier otra cosa: con la web en mantenimiento no se lee la
  // base ni se arma nada del sitio, solo se muestra el aviso.
  if (MANTENIMIENTO) return <Mantenimiento />;

  const estado = estadoNegocio();
  const menu = await obtenerMenu();
  const extras = porCategoria(menu, "Extras");

  // Las fotos grandes que existen hoy, para irlas bajando en segundo plano una
  // vez que la web ya cargó.
  const fotosGrandes = menu
    .map((item) => item.fotoCompletaUrl)
    .filter((url): url is string => Boolean(url?.startsWith("/")));

  return (
    <EstadoProvider inicial={estado}>
      <CartProvider>
        <CartUIProvider extras={extras}>
          <TopBar />
          {/* Las dos cintas de C enmarcan el contenido: la barra de arriba y el
              pie quedan afuera del marco. Abajo va acá y no después del pie
              porque al final de la página está la barra roja fija del carrito, y
              rojo contra rojo se empasta. */}
          <main className="flex-1">
            <CintaMarca id="cinta-arriba" />
            <Hero />
            <Menu items={menu} />
            <CintaMarca id="cinta-abajo" />
          </main>
          <Footer />
          {/* Reserva el alto de la barra fija para que no tape el footer */}
          <div aria-hidden className="h-21 shrink-0" />
          <CartBar />
          <PrecargarFotos urls={fotosGrandes} />
        </CartUIProvider>
      </CartProvider>
    </EstadoProvider>
  );
}
