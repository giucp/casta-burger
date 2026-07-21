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
- [x] Back-office `/admin`: Números (ganancia neta), Inventario, Compras — **con
      datos de ejemplo**, sin base de datos y sin login
- [ ] Supabase: schema, menú en base de datos, guardar el pedido
- [ ] N° de pedido (sale de Supabase; hoy el mensaje va sin número)
- [ ] Auth del dueño (magic link) + `/admin`
- [ ] Pantalla de cocina en vivo (Realtime) + sonido
- [ ] Aviso por Telegram
- [ ] Deploy en Vercel

## Pendientes conocidos

- **Bebidas sin precio**: el menú impreso no los trae. Se muestran como "Consultar"
  hasta que el negocio los confirme.
- **Fotos de producto**: hoy son placeholders monolínea.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` sin definir.
- `TASA_BCV` está fija en `src/lib/config.ts`; va a `settings.tasa_bcv`.
- **Los dos CTA del hero hacen lo mismo** (bajan al menú). "Pedir ahora" debe
  abrir el flujo de pedido cuando exista el carrito.
- **Costo de envío**: no está definido, así que en delivery el mensaje avisa que
  se acuerda por WhatsApp. Cuando haya tarifa va a `settings` y al total.
- **El carrito no sobrevive al refresco** de la página (vive en memoria). Si se
  quiere que aguante, va a `localStorage`.

## ⚠️ Antes de salir a producción

**1. `/admin` no tiene login.** Hoy cualquiera con el link ve y edita los
números del negocio. Falta el magic link de Supabase Auth y proteger `/admin/*`
(§6 del brief). Esto es bloqueante para el deploy.

**2. Poner `MODO_DEMO = false`** en [`src/lib/config.ts`](src/lib/config.ts).

Mientras está en `true`, la web deja pedir aunque el local esté cerrado, para
poder mostrar el diseño funcionando a cualquier hora. En `false` vuelve el
comportamiento del §5 del brief: fuera de horario los botones "Agregar" se
deshabilitan y la barra inferior avisa cuándo abrimos. El sello Abierto/Cerrado
dice la verdad siempre, en los dos modos.

## Entrega

Al cerrar el proyecto, este repo se transfiere a la cuenta de GitHub de la empresa
junto con Supabase, Vercel y el dominio (§11 del brief).
