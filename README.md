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
| `0002_menu_real.sql` | Columnas `tags` y `slug`, y carga el menú |
| `0003_promos.sql` | Categoría `Promos` y columna `precio_suelto` |
| `0004_menu_actualizado.sql` | Menú de julio: sin White Meal, bebidas con precio |
| `0005_quitar_nevada.sql` | Saca la Nevada de la carta |
| `0006_verificar_realtime.sql` | Asegura Realtime en los pedidos |
| `0007_menu_item_borrable.sql` | Borrar un producto no rompe el histórico |
| `0008_menu_agotado_visible.sql` | El público ve lo agotado, atenuado |
| `0009_quitar_combo.sql` | Fuera la categoría Combo (era la promo 3 Cheese) |

Todas son seguras de correr de nuevo: las que cargan productos usan
`on conflict (slug) do update`, así que recargarlas actualiza en vez de
duplicar.

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
- [x] Menú real en la base, con precios y promos
- [x] Carrito + selector de proteína y extras
- [x] Flujo de pedido: carrito → retiro/delivery → datos → WhatsApp
- [x] Guardar el pedido, con N° y total calculados en el servidor
- [x] Auth del dueño por magic link, `/admin` protegido por middleware
- [x] Cocina en vivo (Realtime): alerta que insiste, sonido, pantalla despierta
- [x] Inventario real: agregar, editar, ajustar y borrar contra la base
- [x] Compras reales: registrar y borrar contra la base
- [x] Números reales: ventas (= pedidos entregados), compras y ganancia por día
- [x] Panel del dueño en vivo: alerta de pedidos sin tomar, pulso del servicio,
      cobro por WhatsApp a un toque y resumen del día, sin entrar a la cocina
- [x] Delivery con ubicación GPS: el cliente comparte su ubicación como en
      WhatsApp y el pedido lleva el enlace de Maps
- [x] El carrito sobrevive al refresco (localStorage)
- [x] Deploy en Vercel
- [x] CRUD del menú desde `/admin`: agotar/prender, editar precio y nombre, agregar y borrar
- [x] Aviso por Telegram al entrar un pedido (activable con el token del bot)
- [x] La web recuerda los datos del cliente en su teléfono (sin cuenta)
- [x] Delivery con ubicación GPS compartida como en WhatsApp
- [x] PWA instalable: ícono y nombre propios, se agrega a la pantalla de inicio

## Pendientes conocidos

- **"3 Cheese Burger" estaba duplicado** como Combo y como Promo, al mismo
  precio. Quedó solo en Promos, que además muestra el ahorro. El Combo está
  oculto, no borrado.
- **Fotos de producto**: hoy son placeholders monolínea.
- **Costo de envío**: no está definido, así que en delivery el mensaje avisa que
  se acuerda por WhatsApp. Cuando haya tarifa va a `settings` y al total.

## Antes de que el negocio dependa de esto

La web ya está publicada, pero **todavía no está lista para operar de verdad**.
Falta lo de arriba sin marcar, y además:

**1. Poner `MODO_DEMO = false`** en [`src/lib/config.ts`](src/lib/config.ts).

Mientras está en `true`, la web deja pedir aunque el local esté cerrado, para
poder mostrar el diseño funcionando a cualquier hora. En `false` vuelve el
comportamiento del §5 del brief: fuera de horario los botones "Agregar" se
deshabilitan y la barra inferior avisa cuándo abrimos. El sello Abierto/Cerrado
dice la verdad siempre, en los dos modos.

**2. Transferir las cuentas al correo de la empresa** (§11): repo de GitHub,
proyecto de Supabase, Vercel y dominio.

## Decisiones tomadas

**Vercel arranca en plan gratis.** El §1 del brief pedía Pro desde el inicio.
Se decidió empezar en el plan gratis y pasar a Pro cuando el volumen del
negocio lo justifique. Punto cerrado, no hace falta volver a plantearlo.

## Entrega

Al cerrar el proyecto, este repo se transfiere a la cuenta de GitHub de la empresa
junto con Supabase, Vercel y el dominio (§11 del brief).
