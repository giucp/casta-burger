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
| `0015_admins_de_verdad.sql` | Lista de admins: el RLS pregunta *quién* entra, no solo si entró |
| `0016_cocina_no_es_dueno.sql` | Dos roles: la cocina ve pedidos, el dueño ve todo |

Todas son seguras de correr de nuevo: las que cargan productos usan
`on conflict (slug) do update`, así que recargarlas actualiza en vez de
duplicar.

## Desplegar

Import normal de Vercel desde GitHub. Lo único que hay que configurar son las
variables de entorno de [`.env.example`](.env.example).

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
- [x] Auth con contraseña, `/admin` protegido por middleware y por RLS
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
- [x] Tres PWA instalables por separado: la web del cliente, el admin y la cocina
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

## Las tres apps instalables

El mismo dominio ofrece **tres** apps distintas, y cuál se instala depende de
en qué página estés parado cuando tocás "instalar":

| Desde | App | Arranca en | Ícono |
|---|---|---|---|
| la web pública | Casta Burger | `/` | logo rojo sobre negro |
| cualquier pantalla de `/admin` | Casta Admin | `/admin` | logo hueso sobre rojo casta |
| `/admin/cocina` | Casta Cocina | `/admin/cocina` | logo hueso sobre grafito |

El dueño y el cocinero terminan con iconos separados en la pantalla de inicio,
cada uno abriendo donde tiene que abrir. El cocinero no tiene que pasar por el
menú del cliente ni por el panel para llegar a los pedidos.

**Cómo está armado.** La convención `manifest.ts` de Next solo vale en la raíz
de `app/`, así que ahí vive el del cliente
([`src/app/manifest.ts`](src/app/manifest.ts)) y los otros dos se sirven como
route handlers, con el contenido en
[`src/lib/manifiestos.ts`](src/lib/manifiestos.ts). Se enganchan
sobreescribiendo `metadata.manifest`: el layout del panel pone el del admin y
la página de cocina lo vuelve a pisar con el suyo. La metadata anidada
reemplaza la del padre campo por campo — es la regla de Next la que hace todo
esto posible sin duplicar nada.

Tres decisiones que parecen detalles y no lo son:

- **Los manifests cuelgan de la raíz**, no de `/admin`. El middleware rebota al
  login todo lo que cuelgue de `/admin` sin sesión, y además manda al rol
  `cocina` a su pantalla desde cualquier otra ruta. Un manifest que responde un
  redirect no instala nada. Dónde esté guardado el archivo no tiene que ver con
  su `scope`.
- **Las dos apps del back-office comparten `scope: "/admin"`.** Acotar la
  cocina a `/admin/cocina` sería lo natural, pero dejaría el login afuera: al
  abrir la app sin sesión el middleware redirige a `/admin/login` y el navegador,
  viendo una URL fuera de scope, la abriría en una pestaña normal. Lo que separa
  las dos apps es el `id`, no el scope.
- **iOS no lee el manifest.** Ni `id`, ni `scope`, ni `start_url`: "Agregar a
  inicio" usa la URL abierta y el `apple-touch-icon` que declare esa página, y
  el nombre sale del `apple-mobile-web-app-title`. Por eso `metadataApple()` se
  repite por app. Se instalan igual como apps separadas, pero cada una arranca
  con su propia sesión — hay que entrar una vez dentro de cada app instalada.

Los iconos se generan con:

```bash
node scripts/iconos.mjs
```

El trazo no está copiado en el script: lo lee de
[`LogoMarca.tsx`](src/components/LogoMarca.tsx), así que el día que el
diseñador mande el SVG bueno y se reemplace allá, los iconos lo siguen solos.
Los del cliente **no** los toca a propósito: ya están instalados en teléfonos
de clientes y cambiarle el ícono a una app instalada es cambiarle la cara a
algo que la gente ya reconoce.

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

## Quién entra al back-office

**Se entra con correo y contraseña, no con magic link.** El §6 del brief pedía
enlace por correo y una sola cuenta; las dos cosas se cambiaron a propósito, por
decisión del dueño y con buen motivo:

> El enlace mete al servicio de correo en el camino crítico. El plan gratis de
> Supabase manda **2 correos por hora**, así que perder la sesión un viernes a
> las 8 PM significaba no poder entrar a la cocina hasta dentro de una hora. La
> pantalla de cocina es el corazón del sistema: no puede depender de que llegue
> un mail.

Y la pieza que lo cierra: **la recuperación tampoco usa correo**. Si alguien
olvida su contraseña, el otro admin se la cambia desde Equipo. Son dos personas
que se ven todos los días. Con eso el cupo de Supabase queda fuera de la
operación por completo.

La lista vive en la tabla `admins` y se edita desde
[`/admin/equipo`](https://casta-burger.vercel.app/admin/equipo). Agregar a
alguien lo suma a la lista **y** le crea la cuenta con la contraseña que le
pongas, que se la decís de palabra.

### Dos roles

| | `cocina` | `dueno` |
|---|---|---|
| Ver pedidos y cambiarles el estado | sí | sí |
| Ventas del día, ganancia, compras | no | sí |
| Inventario | no | sí |
| Cambiar precios del menú | no | sí |
| Datos de contacto de los clientes | solo del pedido que despacha | sí |
| Repartir accesos y contraseñas | no | sí |

El cocinero necesita leer pedidos y moverlos de estado. Nada más. Darle el
resto sería darle las ventas del día y el poder de cambiar precios — y, antes
de esto, también el de sacarle el acceso al dueño desde Equipo.

El rol por defecto al sumar a alguien es `cocina`, el de menos poder:
equivocarse hacia abajo se arregla con un clic, hacia arriba significa haber
repartido los números del negocio sin querer.

Dos triggers cuidan que siempre quede al menos un `dueno`: no se puede borrar
al último ni degradarlo. Sin eso, el negocio quedaría sin nadie que pueda ver
los números ni repartir accesos.

Son tres cierres, y el que importa es el último:

1. El middleware pregunta `es_admin()` antes de dejar ver `/admin`.
2. El layout del panel lo vuelve a preguntar.
3. **El RLS de la base lo pregunta en cada consulta.** Esta es la frontera de
   verdad: sin estar en `admins` no se lee ni se escribe nada, ni entrando al
   panel ni pegándole directo a la API de Supabase.

Antes de esto, todas las políticas decían `to authenticated using (true)` y el
formulario de acceso le creaba cuenta a cualquier correo. Sumadas, las dos
cosas significaban que cualquiera podía darse de alta y quedarse con lectura y
escritura completa sobre los pedidos —con nombre, teléfono y dirección de cada
cliente—, el menú, el inventario y las compras.

**Si alguien queda afuera**, el SQL Editor de Supabase corre con la llave
secreta y se salta el RLS, así que desde ahí siempre se puede reabrir:

```sql
insert into admins (email) values ('elcorreo@ejemplo.com') on conflict (email) do nothing;
```

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
