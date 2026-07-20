# Casta Burger — Web + Sistema de pedidos y back-office
### Brief de proyecto para Claude Code

> Documento maestro del proyecto. Se acompaña de dos archivos:
> - `schema_hamburguesas.sql` — esquema de la base de datos (correr en Supabase).
> - `casta_diseno.html` — **fuente de verdad del diseño** (abrir para ver el look exacto).

---

## 0. Contexto

- **Negocio:** Casta Burger — hamburguesería pequeña. Alto Barinas, Barinas, Venezuela. Redes: `@puracasta_` (IG/TikTok).
- **Equipo:** 2 personas (el dueño + el cocinero). No hay más empleados.
- **Problema a resolver:** hoy llevan el inventario a mano y no tienen web ni forma de recibir pedidos online. No necesitan un ERP: necesitan **digitalizar el cuaderno + recibir pedidos que lleguen directo a cocina**.
- **Horario de atención:** jueves a domingo, 6:00–11:00 PM.
- **Pago:** se cierra por **WhatsApp**, fuera de la app. Precios en **USD**, se cobran en **bolívares a tasa BCV**.

El producto es **una sola app** con dos caras:
1. **Web pública** (móvil primero): muestra la marca y el menú, y permite pedir.
2. **`/admin`** (panel del dueño con login): cocina en vivo + gestión de menú, inventario, compras y números.

---

## 1. Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**.
- **Supabase**: Postgres + Auth + Realtime + Storage.
- **Vercel** para el deploy.
- PWA-first (instalable en móvil).

**Nota de entrega:** todas las cuentas (GitHub, Supabase, Vercel, dominio) van bajo el **correo de la empresa**, no el del desarrollador. Como es una web comercial con pedidos, el plan de Vercel debe ser **Pro** (el gratis prohíbe uso comercial). El tráfico de pedidos evita que Supabase se pause por inactividad.

---

## 2. Alcance (cerrado)

### Incluye
- Web pública con marca + menú + carrito + pedido (retiro / delivery), **sin que el cliente cree cuenta**.
- Al confirmar el pedido: se guarda en Supabase **y** se abre WhatsApp con el resumen para cerrar el pago.
- Panel `/admin` con login del dueño (magic link).
- **Pantalla de cocina en vivo** (el corazón del sistema): la orden entra en tiempo real, el cocinero la marca "Listo".
- Aviso de respaldo por **Telegram** cuando entra un pedido nuevo.
- **Menú editable** (agregar/editar, precio, toggle "agotado").
- **Inventario manual** (lista de stock con alerta de bajo stock). **Sin descuento automático por pedido.**
- **Compras** (registrar gastos de insumos).
- **Números**: qué hay en inventario, cuánto se vendió, cuánto se gastó en compras y **ganancia neta**.

### No incluye
- Pasarela de pago online (el pago es por WhatsApp).
- Descuento automático de inventario por venta.
- Recetas / rendimientos / costeo por ingrediente.
- App nativa desde cero (es PWA; si se quiere store, se envuelve después).

### Fases de entrega
| Fase | Qué entra |
|---|---|
| **1 (primero)** | Web + menú + carrito + pedido → **pantalla de cocina en vivo** con sonido + aviso Telegram. Con esto ya opera. |
| **2** | Inventario con alertas + compras + resumen de ventas / ganancia neta. |
| **3 (opcional)** | Historial, reportes por rango, y solo si lo piden: descuento de inventario por venta. |

---

## 3. Sistema de diseño (FIJO)

> El look ya está aprobado. `casta_diseno.html` es la referencia visual exacta; respetar tokens y componentes.

### Concepto
Identidad urbana/callejera de la marca: **rojo ladrillo del logo sobre negro plano** (sin brillos ni degradados de fondo). El menú **voltea la paleta a un panel color "hueso"** (tipografía oscura sobre crema), guiño a su menú impreso. Precios en tipografía **monoespaciada estilo ticket**. Firma recurrente: el **sello ovalado rojo** (estado abierto/cerrado, horario, encabezados de sección).

### Tokens de color
```css
:root{
  --ink:      #0C0C0C; /* fondo base, negro plano (SIN glow) */
  --char:     #17120E; /* superficies oscuras / footer */
  --card:     #1C1712; /* tarjetas sobre oscuro */
  --red:      #C02830; /* ROJO CASTA — sacado del logo, no chillón */
  --red-deep: #97202A; /* rojo pressed / hover */
  --bone:     #F2ECDE; /* panel "papel" del menú */
  --bone-ink: #1A140F; /* texto sobre hueso */
  --bone-line:#D8CFBB; /* divisores sobre hueso */
  --white:    #FFFFFF;
  --smoke:    #948B82; /* texto secundario */
  --line:     rgba(255,255,255,.08);
}
```

### Tipografía (Google Fonts)
- **Anton** → títulos e impactos, mayúsculas (hero, nombres de producto, secciones).
- **Inter** (400–700) → cuerpo, descripciones, UI.
- **Space Mono** (400/700) → **datos**: precios, "≈ Bs.", estados, N° de pedido, etiquetas.

```
https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap
```

### Componentes clave
- **Sello (stamp):** píldora con borde rojo, texto en Space Mono, ligera rotación (-3°). Variante `abierto` (rojo) / `cerrado` (gris). Se usa para el estado del negocio, el horario y como eyebrow de secciones.
- **Hero:** negro plano, título Anton gigante ("SOMOS CASTA."), subtítulo, botones. Ilustración de línea roja (hamburguesa monolínea, estilo de sus íconos).
- **Panel de menú "hueso":** fondo `--bone`, tarjetas de producto con foto, nombre (Anton), descripción (Inter), etiquetas (peso, ingredientes), precio en mono con "≈ Bs." debajo, botón **Agregar +** rojo. Estado **agotado** = tarjeta atenuada, botón deshabilitado.
- **Carrito fijo inferior (móvil):** barra roja con N° items, total en `$` y `≈ Bs.`, botón "Ver pedido".
- **Botón primario (CTA):** píldora roja, texto Anton en mayúsculas.

### Reglas
- Radio de tarjetas ~14–16px; botones tipo píldora.
- Fotos de producto como protagonistas (en el mockup son placeholders; sustituir por fotos reales).
- Movimiento discreto: micro "scale" al agregar al carrito; respetar `prefers-reduced-motion`.
- Piso de calidad: responsive a móvil, foco de teclado visible, contraste alto.

---

## 4. Modelo de datos (Supabase)

Correr `schema_hamburguesas.sql`. Resumen:

| Tabla | Para qué |
|---|---|
| `menu_items` | productos: nombre, descripción, precio (USD), categoría, foto, `disponible` (agotado), orden |
| `orders` | pedidos: cliente, teléfono, tipo (retiro/delivery), dirección, totales, `estado`, nota |
| `order_items` | líneas del pedido (guardan copia de nombre y precio) |
| `inventory` | stock manual: ítem, cantidad, unidad, umbral de alerta |
| `purchases` | compras/gastos de insumos: descripción, monto, fecha |
| `settings` | fila única: nombre, `acepta_pedidos`, datos de pago, whatsapp, (agregar `tasa_bcv`) |

**Vistas incluidas:** `ventas_por_dia`, `compras_por_dia`, `resumen_diario` (da pedidos, ventas, compras y **ganancia neta** por día en una sola consulta).

**RLS (ya en el SQL):** el público solo **lee** el menú/ajustes y **crea** pedidos; todo lo demás es solo para el dueño autenticado. **Realtime** activado en `orders` y `order_items` para la pantalla de cocina.

### Ajustes al esquema para este proyecto
1. Agregar a `settings`: `tasa_bcv numeric(12,2)` (para convertir USD→Bs). Editable en `/admin`.
2. Agregar a `order_items`: `opciones jsonb` para guardar la **proteína elegida** (carne/cordero/pollo) y **extras** por línea. Ej: `{"proteina":"carne","extras":["tocineta adicional"]}`.

---

## 5. Web pública

### Estructura (una sola página, secciones)
1. **Top bar** fija: logo, sello **Abierto/Cerrado** (según horario), botón carrito.
2. **Hero**: marca + horario (sello "solo jue–dom · 6–11 PM") + CTAs.
3. **Menú** (panel hueso): secciones **Burgers · Combo · Extras · Bebidas** con las tarjetas.
4. **Carrito fijo** inferior.
5. **Footer**: horario, ubicación, WhatsApp, redes.

### Flujo de pedido
1. El cliente arma su orden: elige burger → **proteína (carne/cordero/pollo)** → extras opcionales → cantidad → agregar.
2. Carrito muestra items, subtotal, y (si delivery) costo de envío. Total en `$` y `≈ Bs.`
3. **"Ver pedido"** → elige **retiro o delivery**, escribe **nombre + teléfono** (y dirección si es delivery).
4. **Confirmar** →
   - se crea el pedido en Supabase (`estado = 'nuevo'`),
   - se dispara el aviso a Telegram,
   - se abre **WhatsApp** (`https://wa.me/<num>?text=...`) con el resumen prellenado (N° de pedido, items, proteínas, extras, tipo, total en $ y Bs.) para cerrar el pago por ahí.
5. Pantalla de confirmación: "Pedido #NN recibido. Termina el pago por WhatsApp."

### Estado abierto/cerrado
- Calcular con el horario (jue–dom 6–11 PM) **y** el flag `settings.acepta_pedidos`.
- Fuera de horario o con `acepta_pedidos = false`: el sello dice "Cerrado", los botones "Agregar/Pedir" se deshabilitan y se muestra "Abrimos jueves 6:00 PM".

### Precios y BCV
- Guardar y calcular en **USD**. Mostrar `$` como principal y `≈ Bs.` como secundario, usando `settings.tasa_bcv`.
- *(Nota para Giuseppe: la tasa BCV se puede alimentar de la misma fuente que ya usas en Tu Repo, o editarla a mano en Ajustes.)*

---

## 6. Back-office `/admin`

### Login
- **Supabase Auth con magic link** (correo sin contraseña), una sola cuenta: la del dueño.
- `/admin/*` protegido: sin sesión → redirige al login.

### Pantalla de cocina (lo más importante)
- Lista de pedidos **en tiempo real** (Supabase Realtime).
- Columnas o filtros por estado: **nuevo → preparando → listo → entregado** (+ cancelado).
- Cada tarjeta de orden: N° grande, hora, tipo (retiro/delivery), items con proteína/extras/notas, total.
- Botones para avanzar estado; **"Listo"** bien visible (grande).
- **Sonido/alerta** al entrar un pedido nuevo.
- Estética oscura y densa en datos, legible de lejos (alto contraste, tarjetas grandes, estados por color).

### Menú
- CRUD de `menu_items`: nombre, descripción, precio, categoría, foto (Supabase Storage), orden.
- Toggle **disponible / agotado**.

### Inventario
- Lista de `inventory` editable a mano: ítem, cantidad, unidad, umbral.
- **Alerta de bajo stock** cuando `cantidad <= umbral_alerta`.

### Compras
- Registrar compras (`purchases`): descripción, monto, categoría, fecha.

### Números (finanzas básicas)
- Vista "Hoy" y por rango de fechas usando `resumen_diario`:
  **pedidos, ventas ($), compras ($), ganancia neta ($ = ventas − compras)**.
- Mostrar también en Bs. usando la tasa.

### Ajustes
- Nombre del negocio, `acepta_pedidos`, horario, datos de pago (a mostrar en el resumen), número de WhatsApp, `tasa_bcv`, token/chat de Telegram.

---

## 7. Notificaciones (Telegram)

- Al crear un pedido nuevo, enviar un mensaje al dueño vía **bot de Telegram** (una simple llamada HTTP a la API de Telegram).
- Es el **respaldo** a la pantalla de cocina: aunque no estén viendo la tablet, les vibra el teléfono.
- `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en variables de entorno.
- *(Se elige Telegram y no WhatsApp API a propósito: gratis y sin revisión/verificación de Meta.)*

---

## 8. Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # solo server-side
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
NEXT_PUBLIC_WHATSAPP_NUMBER=      # número del negocio para wa.me
```

---

## 9. Contenido real del menú

> Proteína a elegir en todas las burgers: **carne, cordero o pollo**. Precios: **placeholder**, poner los reales.

**BURGERS**
| Producto | Detalle | Precio |
|---|---|---|
| Cheese Burger | 120 g proteína, queso facilista, salsa de la casa, tocineta, pan de batata | $__ |
| Casta Burger | 240 g proteína, onion smash, queso facilista, salsa de la casa, tocineta, pan de batata | $__ |
| Casta Smash | 360 g proteína, onion smash, queso facilista, salsa de la casa, tocineta, pan de batata | $__ |

*Nota: por **+$2.50** por hamburguesa, 150 g de papás full sal y paprika.*

**COMBO** — Combo 3 Cheese Burger · $__

**EXTRAS** — Proteína adicional · Tocineta adicional · Onion smash / cebolla planchada adicional · Salsa de la casa adicional · Queso facilista adicional · (c/u $__)

**BEBIDAS** — Coca-Cola 1 L original · Coca-Cola lata zero · Coca-Cola lata original · Nevada manzana 355 ml · (c/u $__)

**PROMOS** (opcional) — Promo 2×1 Cheese, $7 a BCV (jueves).

---

## 10. Orden de construcción sugerido (Fase 1)

1. Proyecto Next.js + Tailwind + cliente de Supabase + tokens de diseño (del §3).
2. Correr `schema_hamburguesas.sql` + los 2 ajustes del §4.
3. Cargar el menú real en `menu_items` (o seed).
4. **Web pública**: hero + menú (panel hueso) + tarjetas + carrito, con precios USD/Bs y estado abierto/cerrado.
5. **Flujo de pedido**: carrito → datos → confirmar → crear pedido + abrir WhatsApp.
6. **Auth** del dueño (magic link) + protección de `/admin`.
7. **Pantalla de cocina en vivo** (Realtime) + sonido + botón "Listo".
8. **Aviso Telegram** al crear pedido.
9. Deploy en Vercel.

### Definición de "listo" (Fase 1)
Un cliente puede, en el móvil, ver el menú, armar un pedido y confirmarlo; el pedido aparece **al instante** en la pantalla de cocina del dueño con sonido, le llega el aviso por Telegram, y el pago se cierra por WhatsApp con el resumen prellenado.

---

## 11. Entrega (al finalizar)

- Todas las cuentas bajo el **correo de la empresa** (llave maestra).
- Vercel en plan **Pro** (uso comercial); dominio a nombre del cliente.
- Rellenar el **documento de entrega** con accesos, dominio, costos recurrentes y el "cómo actualizar el menú".
