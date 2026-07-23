-- ============================================================
--  CASTA BURGER — suscripciones a notificaciones push del cliente
--
--  Cuando un cliente acepta recibir avisos, su navegador genera una
--  suscripción (un endpoint único + claves). La guardamos ligada a su pedido:
--  así, cuando el pedido pasa a "listo" o "en camino", el servidor le manda
--  la notificación a ese endpoint.
-- ============================================================

create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid references orders(id) on delete cascade,
  -- La suscripción del navegador, tal cual la entrega la Push API
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),

  -- Un mismo navegador puede resuscribirse al mismo pedido: no duplicar
  unique (order_id, endpoint)
);

create index idx_push_order on push_subscriptions(order_id);

alter table push_subscriptions enable row level security;

-- El público CREA su suscripción (al confirmar el pedido), pero no puede leer
-- las de nadie. El envío lo hace el servidor con la llave secreta, que se
-- salta el RLS, así que no hace falta policy de lectura para el público.
create policy push_public_insert on push_subscriptions
  for insert to anon with check (true);
create policy push_admin_all on push_subscriptions
  for all to authenticated using (true) with check (true);
