# Casta Burger — web + pedidos + back-office

Web pública y sistema de pedidos para **Casta Burger** (Alto Barinas, Barinas, Venezuela).
Una sola app con dos caras: la web del cliente y `/admin` con la pantalla de cocina en vivo.

El documento maestro es [`docs/casta_burger_brief.md`](docs/casta_burger_brief.md).
El diseño aprobado es [`docs/casta_diseno.html`](docs/casta_diseno.html) — es la fuente de verdad visual.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + Auth + Realtime + Storage) · Vercel.

## Correr en local

```bash
npm install
cp .env.example .env.local   # rellenar
npm run dev
```

## Estado

**Fase 1 en curso.** Lo que ya está:

- [x] Scaffold Next.js + Tailwind v4
- [x] Sistema de diseño: tokens de color, Anton / Inter / Space Mono, sello, botones
- [x] Web pública estática: top bar, hero, menú (panel hueso), footer
- [x] Estado abierto/cerrado real, calculado contra `America/Caracas`
- [x] Precios reales del menú impreso, con las dos presentaciones (Sola / White Meal)
- [x] Carrito + selector de proteína, presentación, papás y extras
- [x] Flujo de pedido: carrito → retiro/delivery → datos → WhatsApp prellenado
- [x] Pantalla de cocina: tarjetas por estado, filtros, sonido — **con datos de ejemplo**
- [x] Back-office `/admin`: Números (ganancia neta), Inventario, Compras — **con
      datos de ejemplo**
- [x] Auth del dueño por magic link, `/admin` protegido por middleware
- [x] Migración corrida en Supabase
- [x] Menú leído desde la base (`menu_items`)
- [ ] CRUD del menú desde `/admin`
- [ ] Guardar el pedido al confirmar, y el N° de pedido en el mensaje
- [ ] Conectar la cocina a Realtime (hoy los pedidos son de ejemplo)
- [ ] Aviso por Telegram
- [ ] Deploy en Vercel

## Pendientes conocidos

- **Bebidas sin precio**: el menú impreso no los trae. Se muestran como "Consultar"
  hasta que el negocio los confirme.
- **Fotos de producto**: hoy son placeholders monolínea.
- **Los dos CTA del hero hacen lo mismo** (bajan al menú). "Pedir ahora" debe
  abrir el flujo de pedido cuando exista el carrito.
- **Costo de envío**: no está definido, así que en delivery el mensaje avisa que
  se acuerda por WhatsApp. Cuando haya tarifa va a `settings` y al total.
- **El carrito no sobrevive al refresco** de la página (vive en memoria). Si se
  quiere que aguante, va a `localStorage`.

## Antes de salir a producción

**1. Poner `MODO_DEMO = false`** en [`src/lib/config.ts`](src/lib/config.ts).

Mientras está en `true`, la web deja pedir aunque el local esté cerrado, para
poder mostrar el diseño funcionando a cualquier hora. En `false` vuelve el
comportamiento del §5 del brief: fuera de horario los botones "Agregar" se
deshabilitan y la barra inferior avisa cuándo abrimos. El sello Abierto/Cerrado
dice la verdad siempre, en los dos modos.

**2. Cerrar el alta pública de pedidos.** Hoy `orders` acepta inserts del
público con `check (true)`, así que se podría crear un pedido con un total que
no corresponde a los precios reales. Lo correcto es mover la creación del
pedido a una Edge Function que calcule el total del lado del servidor.

**3. Agregar el dominio de producción** a Authentication → URL Configuration en
Supabase, o el magic link va a seguir apuntando a localhost.

## Entrega

Al cerrar el proyecto, este repo se transfiere a la cuenta de GitHub de la empresa
junto con Supabase, Vercel y el dominio (§11 del brief).
