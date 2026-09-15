# Casta Burger — web + pedidos + back-office

Web pública y sistema de pedidos para **Casta Burger** (Alto Barinas, Barinas,
Venezuela). Una sola app con tres caras: la web del cliente, el panel del dueño
y la pantalla de cocina en vivo, instalables como tres apps por separado.

**En vivo:** https://casta-burger.vercel.app

El sistema lo desarrolla y opera **TaquionLabs**; el negocio paga una cuota
mensual por el servicio (ver [La suscripción del servicio](#la-suscripción-del-servicio)).

El documento maestro es [`docs/casta_burger_brief.md`](docs/casta_burger_brief.md).
El diseño aprobado es [`docs/casta_diseno.html`](docs/casta_diseno.html) — es la
fuente de verdad visual.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + Auth
+ Realtime + Storage) · Vercel.

## Correr en local

```bash
npm install
cp .env.example .env.local   # rellenar con las llaves de Supabase
npm run dev
```

Las tres llaves de Supabase (`NEXT_PUBLIC_SUPABASE_URL`, la `anon` y la
`service_role`) salen del panel de Supabase → Project Settings → API. **No se
pueden bajar con `vercel env pull`**: están marcadas como secretas y ese comando
devuelve `[SENSITIVE]` en su lugar. Hay que copiarlas a mano.

## Base de datos

Las migraciones están en [`supabase/migrations/`](supabase/migrations) y se
corren pegándolas en el SQL Editor de Supabase, **en orden**. Todas son seguras
de correr de nuevo (usan `if not exists`, `create or replace` y
`on conflict`), así que reejecutarlas actualiza en vez de duplicar.

Las primeras arman el esquema, el menú y las fotos (`0001`–`0017`). De ahí en
adelante:

| Migración | Qué hace |
|---|---|
| `0018_recetas_y_consumo.sql` | Recetas por producto; al entregar un pedido el inventario baja solo |
| `0019_promos_descuentan.sql` | Las promos declaran qué contienen y descuentan con la receta de la hamburguesa |
| `0020_unidades_de_verdad.sql` | La unidad deja de ser texto libre: lista cerrada (`und·g·kg·ml·L`) y conversión |
| `0021_proteina_elegida.sql` | La receta dice "240 g de proteína" y se descuenta la que pidió el cliente |
| `0022_costos.sql` | Los costos por ingrediente, y de ahí el costo de cada hamburguesa |
| `0023_costo_de_lo_vendido.sql` | El panel muestra la ganancia real de lo vendido, no la caja del día |
| `0024_suscripcion.sql` | La cuota mensual del servicio y su corte automático |

## Desplegar

Import normal de Vercel desde GitHub. Un push a `main` despliega solo. Lo único
que hay que configurar son las variables de entorno de
[`.env.example`](.env.example).

## Las tres apps instalables

El mismo dominio ofrece **tres** apps distintas, y cuál se instala depende de en
qué página estés parado al tocar "instalar":

| Desde | App | Arranca en | Ícono |
|---|---|---|---|
| la web pública | Casta Burger | `/` | logo rojo sobre negro |
| cualquier pantalla de `/admin` | Casta Admin | `/admin` | logo hueso sobre rojo casta |
| `/admin/cocina` | Casta Cocina | `/admin/cocina` | logo hueso sobre grafito |

El dueño y el cocinero terminan con iconos separados en la pantalla de inicio,
cada uno abriendo donde tiene que abrir. La convención `manifest.ts` de Next
solo vale en la raíz de `app/`, así que ahí vive el del cliente y los otros dos
se sirven como route handlers, con el contenido en
[`src/lib/manifiestos.ts`](src/lib/manifiestos.ts).

## El back-office

`/admin`, protegido en tres capas: el proxy ([`src/proxy.ts`](src/proxy.ts))
rebota al login lo que cuelgue de `/admin` sin sesión y sin el rol adecuado; el
layout del panel lo vuelve a comprobar; y por debajo, el RLS de la base pregunta
el rol en cada consulta —esa es la frontera que de verdad importa.

**Tres roles** ([`src/lib/admin/secciones.ts`](src/lib/admin/secciones.ts)):

- **Dueño**: todo, incluido anular ventas, ver la actividad y repartir accesos.
- **Encargado**: el día a día — cocina, menú, inventario, recetas y costos.
- **Cocina**: solo la pantalla de pedidos.

**Se entra con correo y contraseña**, no con magic link: entrar a la cocina no
puede depender de que llegue un mail. Quien olvidó la suya se la cambia otra
persona del equipo desde **Equipo**.

### Panel del dueño

En vivo (Realtime): pedidos sin tomar, pulso del servicio, y la plata del día
—**Ventas**, **Costo de lo vendido** y **Ganó hoy**—. Desde acá se cobra por
WhatsApp a un toque y se anula/devuelve una venta, sin entrar a la cocina.

"Costo de lo vendido" es lo que costaron los ingredientes que salieron por la
puerta, no lo que se gastó ese día: sale de `consumos`, que guarda el detalle
de cada pedido entregado. Comprar carne para la semana es un gasto de la semana
y vive en **Costos**, no en el panel.

### Cocina en vivo

Realtime con alerta que insiste, sonido y pantalla que no se duerme. Cada pedido
avanza nuevo → preparando → listo → **entregado**. Marcar "Entregado" es lo que
descuenta el inventario y cuenta la venta.

### Inventario

Se ajusta a mano, como el cuaderno, y además baja solo al entregar un pedido de
un producto con receta. La unidad es un selector (`und·g·kg·ml·L`); cambiarla
**convierte** la cantidad, el umbral y las recetas que usan el ingrediente, todo
en una transacción. Entre unidades que no comparten base (kg → und) solo cambia
la etiqueta, sin inventar números.

### Recetas

Solo lo que se arma en la cocina: las tres hamburguesas y las papas. Cada receta
tiene una línea especial, **"la proteína que elija el cliente"**, que se
descuenta de carne, cordero o pollo según el pedido —de qué item sale cada una
se configura una vez, arriba de la pantalla. Las promos no se cargan acá:
descuentan con la receta de la hamburguesa que contienen.

Cada producto muestra **cuánto cuesta y cuánto se gana** (`cuesta $X · gana $Y`),
cruzando la receta con los costos. Si algún ingrediente no tiene costo cargado,
lo avisa.

### Costos

Cada gasto elige un ingrediente, cuánto y en qué unidad, y de ahí sale el costo
por unidad (última compra, no promedio: es el precio de reponer). Los gastos que
no son ingrediente —gas, bolsas, delivery— entran como "Otro gasto": suman a la
caja pero no al costo de ningún producto. **No toca el inventario**: el stock se
ajusta a mano.

### Actividad

Registro de solo-lectura de quién cambió el inventario, el menú y las recetas,
con el antes → después de cada campo. Lo escribe un trigger de la base, así que
la fila queda entre por donde entre —panel, API o SQL Editor. Solo lo ve el
dueño.

## El horario

Jue–dom, 6:00–11:00 PM, siempre contra `America/Caracas`. Tres capas: el
servidor calcula el estado al pintar, el navegador lo recalcula cada 15 s, y
`crearPedido` lo verifica de nuevo antes de tocar la base —la única que de
verdad cierra la puerta.

`MODO_DEMO` en [`src/lib/config.ts`](src/lib/config.ts) apaga las tres a la vez,
para mostrar el flujo un martes a las 3 PM. Está en `false` en producción.

## La suscripción del servicio

El sistema lo opera TaquionLabs y el negocio paga una cuota mensual de **$20 a
tasa BCV**, que vence cada **día 15**. Es un SaaS: si pasa la fecha sin pago
registrado, el corte es **automático**, calculado contra la fecha en la base en
hora de Caracas —nadie apaga ningún interruptor ni redespliega:

- La **web pública** cae en mantenimiento (el mismo aviso neutro de siempre: el
  cliente final no se entera del motivo).
- El **panel** muestra un aviso de cobro con un botón que abre WhatsApp de
  TaquionLabs para reportar el pago.
- `crearPedido` rechaza cualquier pedido que llegue igual.

Nada de datos se toca: pedidos, menú, recetas, inventario y costos quedan
intactos. Solo se tapa el acceso.

**La app del cliente no carga ninguna palanca.** Solo LEE la fecha
`pagado_hasta` de la tabla `suscripcion`; moverla es cosa de TaquionLabs desde
afuera, con la llave secreta. Hoy se hace con
[`scripts/suscripcion.mjs`](scripts/suscripcion.mjs) (`estado` · `activar` ·
`suspender`); más adelante, desde una consola independiente de TaquionLabs
—anotada como pendiente— que maneje todos los productos desde un solo lugar,
sin tocar el código de cada cliente. Que el control viva afuera es a propósito:
un problema en la app de un cliente no debe alcanzar la palanca de todos.

Piezas: tabla `suscripcion` (migración `0024`),
[`src/lib/suscripcion.ts`](src/lib/suscripcion.ts) que consulta el corte, el
aviso del panel y el `Mantenimiento` de la web. Para probar la pantalla de corte
en local sin tocar la fecha real: `FORZAR_SUSCRIPCION_VENCIDA=1` en `.env.local`
(no tiene efecto en producción).

## Las fotos de los productos

Cada producto con foto tiene **dos archivos** (el recorte de la tarjeta y la
foto entera para verla en grande), en [`public/productos/`](public/productos),
con rutas **del sitio** —una URL externa la rechaza `next/image` en runtime.
Para preparar una foto, que escribe las dos:

```bash
node scripts/fotos.mjs "C:/ruta/Casta burger.png" casta-burger
node scripts/fotos.mjs "C:/ruta/combo 3.png" promo-3-cheese ancha
```

`cuadrada` (por defecto) es para las tarjetas del menú; `ancha` (16:9) para el
banner de las promos, cuyas composiciones horizontales comunican la cantidad.
Después hay que dejar las rutas en la base con un `update`, como en
[`0014_fotos_promos.sql`](supabase/migrations/0014_fotos_promos.sql).

## Variables de entorno

Todas en [`.env.example`](.env.example). Las tres de Supabase son obligatorias.
El resto es opcional o por caso:

- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`: aviso a la cocina por Telegram.
- `MANTENIMIENTO=1`: baja la web pública a mano (aparte del corte por cuota).
- `NEXT_PUBLIC_SITE_URL`: solo con dominio propio, para la imagen de compartir.
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: número del negocio para los links `wa.me`.
- `VAPID_*`: claves del push al cliente ("listo para buscar" / "va en camino").

## Antes de que el negocio dependa de esto

**Transferir las cuentas** (§11 del brief): el proyecto de Supabase, Vercel y el
dominio. `VAPID_SUBJECT` en Vercel va al correo del negocio (hoy tiene el del
desarrollador; es solo el contacto técnico que exige el estándar de push). Si se
estrena dominio propio, agregar `NEXT_PUBLIC_SITE_URL`, o la imagen de compartir
sigue apuntando a `.vercel.app`.

El repo, en cambio, **es de TaquionLabs**: es el sistema que se opera como
servicio, no se transfiere con las cuentas del negocio.

## Pendientes

- **Consola de TaquionLabs (independiente).** Un panel propio —repo, dominio y
  login aparte de todo— para manejar la suscripción de *todos* los productos
  (Casta Burger, comanda, y los que vengan) desde un solo lugar. Reemplaza a
  `scripts/suscripcion.mjs` y no vive dentro de la app de ningún cliente, por
  seguridad: un problema en un cliente no debe alcanzar la palanca de los demás.
  Podría incluir además de renovar, un botón de suspender manual.
- **Bebidas y extras no descuentan inventario.** Las bebidas se revenden (no
  tienen receta); "Proteína adicional" como extra todavía no sabe de qué
  proteína es. Pendiente cuando se decida cómo.
- **Costo de envío** sin definir: en delivery el mensaje avisa que se acuerda
  por WhatsApp.

## Decisiones tomadas

**Vercel arranca en plan gratis.** El §1 del brief pedía Pro desde el inicio. Se
empieza en gratis y se pasa a Pro cuando el volumen lo justifique. Punto cerrado.
