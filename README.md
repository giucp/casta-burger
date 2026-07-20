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
- [ ] Carrito + selector de proteína y extras
- [ ] Supabase: schema, menú en base de datos
- [ ] Flujo de pedido → WhatsApp
- [ ] Auth del dueño (magic link) + `/admin`
- [ ] Pantalla de cocina en vivo (Realtime) + sonido
- [ ] Aviso por Telegram
- [ ] Deploy en Vercel

## Pendientes conocidos

- **Precios placeholder** en `src/lib/menu.ts` — hay que poner los reales.
- **Fotos de producto**: hoy son placeholders monolínea.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` sin definir.
- `TASA_BCV` está fija en `src/lib/config.ts`; va a `settings.tasa_bcv`.

## Entrega

Al cerrar el proyecto, este repo se transfiere a la cuenta de GitHub de la empresa
junto con Supabase, Vercel y el dominio (§11 del brief).
