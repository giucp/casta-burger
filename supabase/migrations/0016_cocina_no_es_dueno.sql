-- ============================================================
--  CASTA BURGER — la cocina entra a la cocina, no a la caja
--
--  Hasta acá había un solo nivel: estar en `admins` daba todo. Sumar al
--  cocinero significaba darle las ventas del día, la ganancia neta, las
--  compras, el poder de cambiar precios y los datos de contacto de cada
--  cliente. Y algo peor: podía entrar a Equipo y sacarle el acceso al dueño,
--  porque el único freno era no quedarse sin ningún admin.
--
--  Nada de eso lo necesita para cocinar. La pantalla de cocina solo lee
--  pedidos y les cambia el estado.
--
--  Ahora hay dos roles:
--    dueno  — todo, como hasta ahora.
--    cocina — ve los pedidos y los mueve de estado. Nada más.
--
--  Segura de correr de nuevo.
-- ============================================================

-- ------------------------------------------------------------
--  1) El rol
--
--  Las filas que ya existen pasan a 'dueno': hasta hoy tenían ese poder, y una
--  migración no es lugar para quitarle acceso a alguien por sorpresa. El
--  default es 'cocina' para que sumar gente sin pensarlo peque de prudente y
--  no al revés.
-- ------------------------------------------------------------
alter table admins add column if not exists rol text not null default 'cocina';

-- Ojo con la condición: promueve SOLO si todavía no hay ningún dueño. Sin eso,
-- volver a correr esta migración ascendería a dueño a cada cocinero que se
-- hubiera sumado después.
update admins set rol = 'dueno'
 where not exists (select 1 from admins where rol = 'dueno');

alter table admins drop constraint if exists admins_rol_check;
alter table admins add constraint admins_rol_check check (rol in ('dueno','cocina'));

comment on column admins.rol is
  'dueno = todo el back-office. cocina = solo ver pedidos y cambiarles el estado.';

-- ------------------------------------------------------------
--  2) Preguntas nuevas
-- ------------------------------------------------------------
create or replace function mi_rol()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from admins
   where email = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function es_dueno()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(mi_rol() = 'dueno', false);
$$;

comment on function mi_rol() is 'Rol del usuario de la petición, o null si no tiene acceso.';
comment on function es_dueno() is 'true solo para el rol dueno. es_admin() sigue siendo "tiene alguna clase de acceso".';

grant execute on function mi_rol(), es_dueno() to anon, authenticated;

-- ------------------------------------------------------------
--  3) No quedarse sin dueño
--
--  El trigger viejo solo miraba que quedara alguien. Con dos roles eso no
--  alcanza: quedarse solo con cocineros deja el negocio sin quien vea los
--  números ni pueda repartir accesos.
-- ------------------------------------------------------------
create or replace function admins_no_dejar_vacio()
returns trigger
language plpgsql
as $$
begin
  if old.rol = 'dueno'
     and (select count(*) from admins where rol = 'dueno') <= 1 then
    raise exception 'No se puede quitar al último dueño: nadie podría volver a repartir accesos.';
  end if;
  return old;
end;
$$;

-- Un dueño no puede degradarse a sí mismo si es el único que queda.
create or replace function admins_no_degradar_ultimo()
returns trigger
language plpgsql
as $$
begin
  if old.rol = 'dueno' and new.rol <> 'dueno'
     and (select count(*) from admins where rol = 'dueno') <= 1 then
    raise exception 'No se puede degradar al último dueño: nadie podría volver a repartir accesos.';
  end if;
  return new;
end;
$$;

drop trigger if exists admins_ultimo_degradar on admins;
create trigger admins_ultimo_degradar
  before update on admins
  for each row execute function admins_no_degradar_ultimo();

-- ------------------------------------------------------------
--  4) Las políticas, ahora por rol
--
--  Lo que la cocina necesita, y nada más: leer los pedidos con sus líneas, y
--  moverles el estado. Borrar un pedido ya es del dueño — es plata.
-- ------------------------------------------------------------
drop policy if exists orders_admin_all on orders;
create policy orders_ver on orders
  for select to authenticated using (es_admin());
create policy orders_mover on orders
  for update to authenticated using (es_admin()) with check (es_admin());
create policy orders_borrar on orders
  for delete to authenticated using (es_dueno());

drop policy if exists order_items_admin_all on order_items;
create policy order_items_ver on order_items
  for select to authenticated using (es_admin());
create policy order_items_dueno on order_items
  for all to authenticated using (es_dueno()) with check (es_dueno());

-- El menú se lee (por si alguna pantalla lo necesita) pero solo el dueño toca
-- precios.
drop policy if exists menu_admin_all on menu_items;
create policy menu_ver_admin on menu_items
  for select to authenticated using (es_admin());
create policy menu_editar on menu_items
  for all to authenticated using (es_dueno()) with check (es_dueno());

-- Plata y configuración: solo el dueño.
drop policy if exists inventory_admin_all on inventory;
create policy inventory_dueno on inventory
  for all to authenticated using (es_dueno()) with check (es_dueno());

drop policy if exists purchases_admin_all on purchases;
create policy purchases_dueno on purchases
  for all to authenticated using (es_dueno()) with check (es_dueno());

drop policy if exists settings_admin_all on settings;
create policy settings_dueno on settings
  for all to authenticated using (es_dueno()) with check (es_dueno());

drop policy if exists push_admin_all on push_subscriptions;
create policy push_dueno on push_subscriptions
  for all to authenticated using (es_dueno()) with check (es_dueno());

-- La lista de accesos: la reparte el dueño. Esto es lo que impide que un
-- cocinero le saque el acceso al dueño.
drop policy if exists admins_admin_all on admins;
create policy admins_dueno on admins
  for all to authenticated using (es_dueno()) with check (es_dueno());

notify pgrst, 'reload schema';

-- ------------------------------------------------------------
--  SI ALGUIEN QUEDA AFUERA
--
--  El SQL Editor corre con la llave secreta y se salta el RLS:
--
--    insert into admins (email, rol) values ('elcorreo@ejemplo.com', 'dueno')
--    on conflict (email) do update set rol = 'dueno';
--
--  Y para ver quién tiene qué:  select email, rol from admins;
-- ------------------------------------------------------------
