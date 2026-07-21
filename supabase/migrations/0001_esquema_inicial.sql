-- ============================================================
--  CASTA BURGER — esquema inicial
--
--  Base: docs/schema_hamburguesas.sql
--  Más los ajustes del §4 del brief y tres que salieron de construir la web:
--
--   1. menu_items.precio_white_meal — el menú impreso tiene DOS precios por
--      burger (sola / con papas y refresco). No estaba contemplado en el brief.
--   2. menu_items.precio pasa a ser NULL-able — las bebidas todavía no tienen
--      precio definido y se muestran como "Consultar".
--   3. order_items.opciones jsonb — proteína, presentación, papás y extras
--      elegidos por línea (§4, ajuste 2).
--
--  NO se agrega settings.tasa_bcv: se decidió mostrar solo USD, porque la tasa
--  se mueve a diario y una cifra vieja en pantalla es peor que ninguna.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
--  1) MENÚ
-- ============================================================
create table menu_items (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  descripcion        text,
  precio             numeric(10,2),                 -- NULL = "Consultar"
  precio_white_meal  numeric(10,2),                 -- NULL = no tiene esa versión
  categoria          text not null default 'Burgers'
                       check (categoria in ('Burgers','Combo','Extras','Bebidas')),
  foto_url           text,
  disponible         boolean not null default true, -- toggle "agotado"
  orden              int not null default 0,
  created_at         timestamptz not null default now()
);

create index idx_menu_categoria on menu_items(categoria, orden);

-- ============================================================
--  2) PEDIDOS
-- ============================================================
create table orders (
  id             uuid primary key default gen_random_uuid(),
  numero         bigserial,                       -- número corto para cocina
  cliente_nombre text not null,
  cliente_tel    text not null,
  tipo           text not null default 'retiro'
                   check (tipo in ('retiro','delivery')),
  direccion      text,
  delivery_fee   numeric(10,2) not null default 0,
  subtotal       numeric(10,2) not null default 0,
  total          numeric(10,2) not null default 0,
  estado         text not null default 'nuevo'
                   check (estado in ('nuevo','preparando','listo','entregado','cancelado')),
  nota           text,
  created_at     timestamptz not null default now(),

  -- Si es delivery, la dirección no es opcional
  constraint delivery_con_direccion
    check (tipo <> 'delivery' or direccion is not null)
);

create index idx_orders_estado  on orders(estado);
create index idx_orders_created on orders(created_at desc);

create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  menu_item_id  uuid references menu_items(id),
  nombre        text not null,                     -- snapshot
  precio        numeric(10,2) not null,            -- snapshot
  cantidad      int not null default 1 check (cantidad > 0),
  subtotal      numeric(10,2) not null default 0,
  opciones      jsonb not null default '{}'::jsonb,
  nota          text
);

create index idx_order_items_order on order_items(order_id);

comment on column order_items.opciones is
  'Ej: {"proteina":"Cordero","presentacion":"whiteMeal","papas":true,"extras":["extra-tocineta"]}';

-- ============================================================
--  3) INVENTARIO (manual, sin descuento automático por venta)
-- ============================================================
create table inventory (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null,
  cantidad       numeric(10,2) not null default 0,
  unidad         text not null default 'und',
  umbral_alerta  numeric(10,2) not null default 0,
  updated_at     timestamptz not null default now()
);

-- ============================================================
--  4) COMPRAS
-- ============================================================
create table purchases (
  id          uuid primary key default gen_random_uuid(),
  descripcion text not null,
  monto       numeric(10,2) not null default 0 check (monto >= 0),
  categoria   text not null default 'Insumos',
  fecha       date not null default current_date,
  created_at  timestamptz not null default now()
);

create index idx_purchases_fecha on purchases(fecha desc);

-- ============================================================
--  5) AJUSTES (fila única)
-- ============================================================
create table settings (
  id             int primary key default 1 check (id = 1),
  nombre_negocio text not null default 'Casta Burger',
  acepta_pedidos boolean not null default true,
  pago_info      text,
  whatsapp       text,
  updated_at     timestamptz not null default now()
);

insert into settings (id, whatsapp) values (1, '584227105981')
  on conflict do nothing;

-- ============================================================
--  6) VISTAS DE FINANZAS
--
--  ⚠️ `security_invoker = true` NO es opcional.
--  Una vista de Postgres corre con los permisos de quien la creó (postgres),
--  así que por defecto SE SALTA el RLS de las tablas que consulta. Sin esta
--  opción, cualquiera con la llave pública podría leer resumen_diario y ver
--  las ventas y la ganancia neta del negocio. Con ella, la vista respeta las
--  políticas de orders y purchases: el público no ve nada, el dueño ve todo.
-- ============================================================
create or replace view ventas_por_dia
with (security_invoker = true) as
select
  (created_at at time zone 'America/Caracas')::date as dia,
  count(*)               as pedidos,
  coalesce(sum(total),0) as ventas
from orders
where estado <> 'cancelado'
group by 1;

create or replace view compras_por_dia
with (security_invoker = true) as
select fecha as dia,
       count(*)               as compras_cant,
       coalesce(sum(monto),0) as compras_monto
from purchases
group by 1;

create or replace view resumen_diario
with (security_invoker = true) as
select
  coalesce(v.dia, c.dia)      as dia,
  coalesce(v.pedidos,0)       as pedidos,
  coalesce(v.ventas,0)        as ventas,
  coalesce(c.compras_monto,0) as compras,
  coalesce(v.ventas,0) - coalesce(c.compras_monto,0) as ganancia_neta
from ventas_por_dia v
full outer join compras_por_dia c on v.dia = c.dia
order by dia desc;

-- ============================================================
--  7) SEGURIDAD (RLS)
--  El público solo LEE el menú y los ajustes, y CREA pedidos.
--  Todo lo demás es solo para el dueño autenticado.
-- ============================================================
alter table menu_items  enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;
alter table inventory   enable row level security;
alter table purchases   enable row level security;
alter table settings    enable row level security;

-- MENÚ
create policy menu_public_read on menu_items
  for select to anon using (disponible = true);
create policy menu_admin_all on menu_items
  for all to authenticated using (true) with check (true);

-- AJUSTES
create policy settings_public_read on settings
  for select to anon using (true);
create policy settings_admin_all on settings
  for all to authenticated using (true) with check (true);

-- PEDIDOS: el público crea sin cuenta, pero no puede leer los de nadie
create policy orders_public_insert on orders
  for insert to anon with check (true);
create policy orders_admin_all on orders
  for all to authenticated using (true) with check (true);

create policy order_items_public_insert on order_items
  for insert to anon with check (true);
create policy order_items_admin_all on order_items
  for all to authenticated using (true) with check (true);

-- INVENTARIO y COMPRAS: solo el dueño
create policy inventory_admin_all on inventory
  for all to authenticated using (true) with check (true);
create policy purchases_admin_all on purchases
  for all to authenticated using (true) with check (true);

-- ============================================================
--  8) REALTIME (pantalla de cocina)
-- ============================================================
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;

-- ------------------------------------------------------------
--  NOTA DE SEGURIDAD, a resolver antes de producción:
--  el insert público de pedidos está abierto (check true), así que alguien
--  podría crear pedidos falsos o mandar un total que no corresponde a los
--  precios reales. Para un negocio chico alcanza al principio, pero lo
--  correcto es mover la creación del pedido a una Edge Function que calcule
--  el total del lado del servidor y cerrar el insert directo.
-- ------------------------------------------------------------
