# Casta Burger — web + pedidos + back-office

Web pública y sistema de pedidos para **Casta Burger** (Alto Barinas, Barinas, Venezuela).
Una sola app con dos caras: la web del cliente y `/admin` con la pantalla de cocina en vivo.

**En vivo:** https://casta-burger.vercel.app

El documento maestro es [`docs/casta_burger_brief.md`](docs/casta_burger_brief.md).
El diseño aprobado es [`docs/casta_diseno.html`](docs/casta_diseno.html) — es la fuente de verdad visual.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + Auth + Realtime + Storage) · Vercel.

## Correr en local

```bash
npm install
cp .env.example .env.local   # rellenar con las llaves de Supabase
npm run dev
```

## Base de datos

El proyecto de Supabase vive en una cuenta aparte de la personal del
desarrollador. Las migraciones están en [`supabase/migrations/`](supabase/migrations)
y se corren pegándolas en el SQL Editor, en orden:

| Migración | Qué hace |
|---|---|
| `0001_esquema_inicial.sql` | Tablas, vistas de finanzas, RLS y Realtime |
| `0002_menu_real.sql` | Columnas `tags` y `slug`, y carga los 13 productos |

Ambas son seguras de correr de nuevo: la 0002 usa `on conflict (slug) do update`,
así que recargarla actualiza los productos en vez de duplicarlos.

## Desplegar

Import normal de Vercel desde GitHub. Lo único que hay que configurar son las
variables de entorno de [`.env.example`](.env.example). Después del primer
deploy hay que agregar la URL de Vercel en Supabase → Authentication → URL
Configuration → Redirect URLs, o el magic link sigue apuntando a localhost.

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
- [x] Deploy en Vercel

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

## Antes de que el negocio dependa de esto

La web ya está publicada, pero **todavía no está lista para operar de verdad**.
Falta lo de arriba sin marcar, y además:

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

**3. Transferir las cuentas al correo de la empresa** (§11): repo de GitHub,
proyecto de Supabase, Vercel y dominio.

## Decisiones tomadas

**Vercel arranca en plan gratis.** El §1 del brief pedía Pro desde el inicio.
Se decidió empezar en el plan gratis y pasar a Pro cuando el volumen del
negocio lo justifique. Punto cerrado, no hace falta volver a plantearlo.

## Entrega

Al cerrar el proyecto, este repo se transfiere a la cuenta de GitHub de la empresa
junto con Supabase, Vercel y el dominio (§11 del brief).
