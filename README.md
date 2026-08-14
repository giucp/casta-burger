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
| `0010_push_suscripciones.sql` | Tabla de suscripciones a avisos push del cliente |
| `0011_papas_seccion_propia.sql` | Las papas salen de Extras a su propia sección, Fries |
| `0012_fotos_reales.sql` | Las cuatro tarjetas con foto propia apuntan a la foto real |
| `0013_foto_completa.sql` | Columna `foto_completa_url`: la foto entera, para verla en grande |
| `0014_fotos_promos.sql` | Las tres promos con su foto, en recorte ancho |

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
- [x] Aviso al cliente por push: "listo para buscar" (retiro) / "va en camino" (delivery)
- [x] Tarjeta de compartir: al pegar el link en WhatsApp sale la marca, no un cuadro vacío
- [x] Horario de verdad: fuera de jue–dom 6–11 PM no se puede pedir, la web se
      abre y se cierra sola a la hora y el servidor rechaza lo que igual llegue

## Las piezas de la marca

El pliego del diseñador es un EPS de Illustrator (`ELEMENTOS CASTA.eps`, fuera
del repo). Para sacar cualquier pieza en SVG sin abrir Illustrator:

```bash
node scripts/marca-a-svg.mjs "ruta/ELEMENTOS CASTA.eps" marca-svg/
```

Escribe una pieza por archivo: el logotipo con manos, el rótulo CASTA, la
plancha, la C sola y el CASTA con corona. De ahí salieron los dos trazos de la
C que repite [`CintaMarca`](src/components/CintaMarca.tsx).

## Las fotos de los productos

Cada producto con foto tiene **dos archivos**, porque la foto se ve en dos
lados y no sirve la misma:

| Archivo | Dónde se ve | Columna |
|---|---|---|
| `<slug>.webp` | el recorte de la tarjeta | `foto_url` |
| `<slug>-completa.webp` | al tocar la tarjeta, entera y sin recortar | `foto_completa_url` |

Van en [`public/productos/`](public/productos) y las rutas son **del sitio**,
nunca de otro dominio: una URL externa la rechaza `next/image` en runtime y
tumba la página.

Para preparar una foto nueva, que escribe las dos:

```bash
node scripts/fotos.mjs "C:/ruta/Casta burger.png" casta-burger
node scripts/fotos.mjs "C:/ruta/combo 3.png" promo-3-cheese ancha
```

**Elegir la forma importa.** `cuadrada` (por defecto) es para las tarjetas del
menú, que muestran la foto en un cuadro de 96 px: sirve para un producto solo y
centrado. `ancha` es 16:9, para el banner de las promos: esas fotos son
composiciones horizontales —dos hamburguesas lado a lado, tres en fila— y lo
que comunican **es la cantidad**. Un recorte cuadrado les cortaría las de los
extremos y la promo mostraría menos de lo que vende.

El encuadre lo elige el script solo. Los originales del fotógrafo quedan en
~50 KB el recorte y ~50–90 KB la completa, y **no van al repo**. Después hay
que dejar las dos rutas escritas en la base con un `update`, como en
[`0014_fotos_promos.sql`](supabase/migrations/0014_fotos_promos.sql).

Si un producto tiene miniatura pero no foto completa, la tarjeta simplemente no
se ofrece como tocable. Es mejor eso que prometer una foto que no abre.

Las fotos completas se van bajando solas en segundo plano
([`PrecargarFotos`](src/components/PrecargarFotos.tsx)), pero recién cuando la
web terminó de cargar y el navegador está ocioso, de a una por vez y **nunca**
si el visitante pidió ahorrar datos o está en una conexión lenta. Por eso el
visor las muestra `unoptimized`: así pide el archivo tal cual, que es la misma
URL que quedó en el caché. Si pasara por el optimizador de Next, la precarga
estaría calentando una URL que el visor nunca pide.

## La imagen de compartir

Es [`public/og.jpg`](public/og.jpg), un archivo estático de 1200×630 que se
genera con las piezas reales de la marca:

```bash
node scripts/og.mjs
```

Solo hay que volver a correrlo si cambia el logo, el mensaje o el horario. El
script se baja las fuentes la primera vez y el JPG resultante queda commiteado.

Ojo con las pruebas: **WhatsApp cachea la vista previa** de cada link por
bastante tiempo. Si el link ya se compartió antes, para ver la tarjeta nueva hay
que mandarlo con algo distinto al final (`https://casta-burger.vercel.app/?1`).

## Pendientes conocidos

- **"3 Cheese Burger" estaba duplicado** como Combo y como Promo, al mismo
  precio. Quedó solo en Promos, que además muestra el ahorro. El Combo está
  oculto, no borrado.
- **Fotos de producto**: ya están las cuatro con foto propia (Cheese Burger,
  Casta Burger, Casta Smash y Servicio de papas). Las bebidas y los extras van
  en listas planas, sin foto, así que no les hace falta.
- **Costo de envío**: no está definido, así que en delivery el mensaje avisa que
  se acuerda por WhatsApp. Cuando haya tarifa va a `settings` y al total.

## El horario

Jue–dom, 6:00–11:00 PM, siempre contra `America/Caracas`: ni la zona del
servidor ni la del visitante lo mueven. Fuera de ese rango los botones
"Agregar" quedan deshabilitados y la barra inferior dice cuándo abrimos.

Son tres capas, y las tres hacen falta:

1. **El servidor** calcula el estado al pintar la página.
2. **El navegador** lo recalcula cada 15 s, y también al volver a la pestaña.
   Sin esto, quien dejara la web abierta cruzando las 6:00 o las 11:00 PM
   seguiría viendo el estado viejo — y podría pedir con la cocina apagada.
3. **`crearPedido` lo verifica de nuevo** antes de tocar la base. Es la única
   capa que de verdad cierra la puerta: la interfaz se puede tener cacheada,
   congelada en una pestaña vieja o directamente saltar.

`MODO_DEMO` en [`src/lib/config.ts`](src/lib/config.ts) es el interruptor que
apaga las tres a la vez, para poder mostrar el flujo completo un martes a las
3 PM. Está en `false` desde que el negocio opera de verdad.

## Antes de que el negocio dependa de esto

La web ya está publicada. Falta lo de arriba sin marcar, y además:

**1. Transferir las cuentas al correo de la empresa** (§11): repo de GitHub,
proyecto de Supabase, Vercel y dominio. Incluye cambiar `VAPID_SUBJECT` en las
variables de Vercel al correo del negocio (hoy tiene el del desarrollador; es
solo el contacto técnico que exige el estándar de push, no lo ve el cliente).
Si además se estrena dominio propio, hay que agregar `NEXT_PUBLIC_SITE_URL` con
la dirección nueva, o la imagen de compartir sigue apuntando a `.vercel.app`.

**2. Configurar el aviso a la cocina por Telegram** (pendiente): crear el bot
con @BotFather y cargar `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en Vercel.

## Decisiones tomadas

**Vercel arranca en plan gratis.** El §1 del brief pedía Pro desde el inicio.
Se decidió empezar en el plan gratis y pasar a Pro cuando el volumen del
negocio lo justifique. Punto cerrado, no hace falta volver a plantearlo.

## Entrega

Al cerrar el proyecto, este repo se transfiere a la cuenta de GitHub de la empresa
junto con Supabase, Vercel y el dominio (§11 del brief).
