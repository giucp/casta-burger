-- ============================================================
--  ESQUEMA SUPABASE — Web + pedidos + back-office (negocio pequeño)
--  MVP: menú, pedidos, cocina en vivo, inventario manual, finanzas básicas
--  Pago: fuera de la app (WhatsApp). Sin descuento automático de inventario.
-- ============================================================

-- ----------  EXTENSIONES  ----------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ============================================================
--  1) MENÚ
-- ============================================================
create table menu_items (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  descripcion  text,
  precio       numeric(10,2) not null default 0,
  categoria    text default 'Hamburguesas',
  foto_url     text,
  disponible   boolean not null default true,   -- toggle "agotado"
  orden        int default 0,                   -- para ordenar el menú
  created_at   timestamptz default now()
);

-- ============================================================
--  2) PEDIDOS
-- ============================================================
create table orders (
  id             uuid primary key default gen_random_uuid(),
  numero         bigserial,                      -- número corto legible para cocina
  cliente_nombre text not null,
  cliente_tel    text not null,
  tipo           text not null default 'retiro'
                   check (tipo in ('retiro','delivery')),
  direccion      text,                           -- solo si tipo = delivery
  delivery_fee   numeric(10,2) default 0,
  subtotal       numeric(10,2) not null default 0,
  total          numeric(10,2) not null default 0,
  estado         text not null default 'nuevo'
                   check (estado in ('nuevo','preparando','listo','entregado','cancelado')),
  pago_comprobante_url text,                     -- opcional, si suben captura
  nota           text,                           -- nota general del cliente
  created_at     timestamptz default now()
);

create index idx_orders_estado on orders(estado);
create index idx_orders_created on orders(created_at);

-- ítems de cada pedido (guardan copia de nombre y precio: si cambia el menú,
-- los pedidos viejos NO se alteran)
create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  menu_item_id  uuid references menu_items(id),
  nombre        text not null,                   -- snapshot
  precio        numeric(10,2) not null,          -- snapshot
  cantidad      int not null default 1,
  subtotal      numeric(10,2) not null default 0,
  nota          text                             -- ej: "sin cebolla"
);

create index idx_order_items_order on order_items(order_id);

-- ============================================================
--  3) INVENTARIO (lista manual, se ajusta a mano)
-- ============================================================
create table inventory (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null,
  cantidad       numeric(10,2) not null default 0,
  unidad         text default 'und',             -- kg, und, cajas, etc.
  umbral_alerta  numeric(10,2) default 0,        -- avisa cuando cantidad <= umbral
  updated_at     timestamptz default now()
);

-- ============================================================
--  4) COMPRAS (para "cuánto gastó en compras" y ganancia neta)
-- ============================================================
create table purchases (
  id          uuid primary key default gen_random_uuid(),
  descripcion text not null,
  monto       numeric(10,2) not null default 0,
  categoria   text default 'Insumos',
  fecha       date not null default current_date,
  created_at  timestamptz default now()
);

create index idx_purchases_fecha on purchases(fecha);

-- ============================================================
--  5) AJUSTES (fila única: datos del negocio, horario, etc.)
-- ============================================================
create table settings (
  id            int primary key default 1 check (id = 1),
  nombre_negocio text default 'Mi Hamburguesería',
  acepta_pedidos boolean default true,           -- apaga el botón "pedir" fuera de hora
  pago_info      text,                            -- datos de pago móvil / WhatsApp a mostrar
  whatsapp       text,
  created_at     timestamptz default now()
);
insert into settings (id) values (1) on conflict do nothing;

-- ============================================================
--  6) VISTAS PARA LAS FINANZAS BÁSICAS
-- ============================================================
-- Ventas por día (cuenta solo pedidos no cancelados)
create or replace view ventas_por_dia as
select
  (created_at at time zone 'America/Caracas')::date as dia,
  count(*)        as pedidos,
  coalesce(sum(total),0) as ventas
from orders
where estado <> 'cancelado'
group by 1
order by 1 desc;

-- Compras por día
create or replace view compras_por_dia as
select fecha as dia,
       count(*)        as compras_cant,
       coalesce(sum(monto),0) as compras_monto
from purchases
group by 1
order by 1 desc;

-- Resumen diario con ganancia neta (ventas - compras)
create or replace view resumen_diario as
select
  coalesce(v.dia, c.dia)                as dia,
  coalesce(v.pedidos,0)                 as pedidos,
  coalesce(v.ventas,0)                  as ventas,
  coalesce(c.compras_monto,0)           as compras,
  coalesce(v.ventas,0) - coalesce(c.compras_monto,0) as ganancia_neta
from ventas_por_dia v
full outer join compras_por_dia c on v.dia = c.dia
order by dia desc;

-- ============================================================
--  7) SEGURIDAD (Row Level Security)
--  Regla: el público solo LEE el menú/ajustes y CREA pedidos.
--         Todo lo demás es solo para el dueño logueado.
-- ============================================================
alter table menu_items  enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;
alter table inventory   enable row level security;
alter table purchases   enable row level security;
alter table settings    enable row level security;

-- MENÚ: público lee lo disponible; admin hace todo
create policy menu_public_read on menu_items
  for select using (disponible = true);
create policy menu_admin_all on menu_items
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- AJUSTES: público lee (nombre, horario, datos de pago); admin edita
create policy settings_public_read on settings
  for select using (true);
create policy settings_admin_write on settings
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- PEDIDOS: el público puede CREAR (para pedir sin cuenta), pero no leer;
--          el dueño logueado ve y gestiona todo.
create policy orders_public_insert on orders
  for insert with check (true);
create policy orders_admin_read on orders
  for select using (auth.role() = 'authenticated');
create policy orders_admin_update on orders
  for update using (auth.role() = 'authenticated');

create policy order_items_public_insert on order_items
  for insert with check (true);
create policy order_items_admin_read on order_items
  for select using (auth.role() = 'authenticated');

-- INVENTARIO y COMPRAS: solo el dueño
create policy inventory_admin_all on inventory
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
create policy purchases_admin_all on purchases
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
--  8) REALTIME (para la pantalla de cocina en vivo)
-- ============================================================
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;

-- ------------------------------------------------------------
--  NOTA MVP: el insert público de pedidos es abierto (check true).
--  Suficiente para un negocio chico. Si más adelante quieres blindarlo
--  (validar precios/stock del lado servidor), se mueve la creación del
--  pedido a una Edge Function o RPC y se cierra el insert directo.
-- ------------------------------------------------------------
