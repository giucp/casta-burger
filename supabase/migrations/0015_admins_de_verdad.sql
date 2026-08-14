-- ============================================================
--  CASTA BURGER — la puerta del back-office se cierra de verdad
--
--  Hasta acá, TODA política de admin decía `to authenticated using (true)`:
--  bastaba con tener sesión, sin importar de quién. Y el formulario de login
--  daba de alta a cualquier correo que se escribiera. Sumadas, las dos cosas
--  significaban que cualquier persona podía crearse una cuenta y quedarse con
--  lectura y escritura completa sobre pedidos (con nombre, teléfono, dirección
--  y GPS de cada cliente), menú, inventario, compras y settings. Y ni siquiera
--  hacía falta entrar al panel: alcanzaba con pegarle a la API.
--
--  Ahora hay una lista de admins y las políticas preguntan QUIÉN es el usuario,
--  no solo si entró. La lista se edita desde /admin.
--
--  Segura de correr de nuevo.
-- ============================================================

-- ------------------------------------------------------------
--  1) Quiénes mandan
-- ------------------------------------------------------------
create table if not exists admins (
  email       text primary key,
  agregado_por text,
  created_at  timestamptz not null default now()
);

comment on table admins is
  'Correos con acceso al back-office. El RLS de todas las tablas del negocio pregunta contra esta lista.';

alter table admins enable row level security;

-- El dueño. Sin esta fila, la migración deja a todo el mundo afuera —incluido
-- él— porque las políticas de abajo empiezan a exigir estar en la lista.
insert into admins (email, agregado_por)
values ('giuseppebambini@gmail.com', 'migración 0015')
on conflict (email) do nothing;

-- ------------------------------------------------------------
--  2) ¿El que consulta está en la lista?
--
--  `security definer` no es un detalle: corre como dueña de la tabla, así que
--  puede leer `admins` sin pasar por el RLS de `admins`. Sin eso, la política
--  de `admins` llamaría a esta función, que leería `admins`, que dispararía la
--  política otra vez: recursión infinita y ninguna consulta funcionando.
--
--  `search_path` fijo para que nadie pueda colar una tabla `admins` propia en
--  otro esquema y hacerse pasar por dueño.
-- ------------------------------------------------------------
create or replace function es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admins
     where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

comment on function es_admin() is
  'true si el usuario de la petición está en la lista de admins. Se usa en todas las políticas del back-office.';

-- La app la llama por RPC desde el middleware y el panel. Por defecto PUBLIC ya
-- tiene permiso, pero se deja explícito: si esta función no se pudiera
-- ejecutar, el panel daría "sin permiso" hasta al dueño.
grant execute on function es_admin() to anon, authenticated;

-- ------------------------------------------------------------
--  3) No quedarse sin admins
--
--  Borrar el último admin dejaría el panel cerrado para siempre, y sin nadie
--  que pueda volver a abrirlo: las políticas exigen ser admin para tocar la
--  lista de admins. Solo se sale de ahí con la llave secreta.
-- ------------------------------------------------------------
create or replace function admins_no_dejar_vacio()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from admins) <= 1 then
    raise exception 'No se puede quitar el último admin: nadie podría volver a entrar.';
  end if;
  return old;
end;
$$;

drop trigger if exists admins_ultimo on admins;
create trigger admins_ultimo
  before delete on admins
  for each row execute function admins_no_dejar_vacio();

-- ------------------------------------------------------------
--  4) Las políticas ahora preguntan quién
-- ------------------------------------------------------------

-- La lista se administra a sí misma: un admin puede sumar o sacar a otro.
drop policy if exists admins_admin_all on admins;
create policy admins_admin_all on admins
  for all to authenticated using (es_admin()) with check (es_admin());

drop policy if exists menu_admin_all on menu_items;
create policy menu_admin_all on menu_items
  for all to authenticated using (es_admin()) with check (es_admin());

drop policy if exists settings_admin_all on settings;
create policy settings_admin_all on settings
  for all to authenticated using (es_admin()) with check (es_admin());

drop policy if exists orders_admin_all on orders;
create policy orders_admin_all on orders
  for all to authenticated using (es_admin()) with check (es_admin());

drop policy if exists order_items_admin_all on order_items;
create policy order_items_admin_all on order_items
  for all to authenticated using (es_admin()) with check (es_admin());

drop policy if exists inventory_admin_all on inventory;
create policy inventory_admin_all on inventory
  for all to authenticated using (es_admin()) with check (es_admin());

drop policy if exists purchases_admin_all on purchases;
create policy purchases_admin_all on purchases
  for all to authenticated using (es_admin()) with check (es_admin());

drop policy if exists push_admin_all on push_subscriptions;
create policy push_admin_all on push_subscriptions
  for all to authenticated using (es_admin()) with check (es_admin());

-- ------------------------------------------------------------
--  5) Fuera los permisos de escritura del público
--
--  `orders_public_insert` dejaba meter un pedido directo por la API, salteando
--  `crearPedido` — o sea salteando el precio que calcula el servidor Y el
--  control de horario. Se podía pedir tres hamburguesas por un dólar, a las
--  4 de la mañana.
--
--  No hace falta ninguna de estas: crear el pedido y guardar la suscripción
--  push pasan por la llave secreta, que se salta el RLS entero.
-- ------------------------------------------------------------
drop policy if exists orders_public_insert on orders;
drop policy if exists order_items_public_insert on order_items;
drop policy if exists push_public_insert on push_subscriptions;

-- Lo que el público SÍ necesita sigue igual: leer el menú y los settings.
-- (menu_public_read y settings_public_read no se tocan.)

-- ------------------------------------------------------------
--  6) Que la API vea la función nueva enseguida
--
--  PostgREST cachea el esquema. Sin este aviso puede tardar en publicar
--  `es_admin()`, y mientras tanto el panel respondería "sin permiso" hasta al
--  dueño.
-- ------------------------------------------------------------
notify pgrst, 'reload schema';

-- ------------------------------------------------------------
--  SI ALGUIEN QUEDA AFUERA
--
--  El SQL Editor de Supabase corre con la llave secreta, que se salta el RLS.
--  O sea que desde ahí siempre se puede volver a abrir la puerta:
--
--    insert into admins (email) values ('elcorreo@ejemplo.com')
--    on conflict (email) do nothing;
--
--  Y para ver quién tiene acceso hoy:  select * from admins;
-- ------------------------------------------------------------
