-- ============================================================
--  CASTA BURGER — quién tocó qué, y un rol que no reparte accesos
--
--  El dueño va a darle el panel a un empleado. De ahí salen dos cosas
--  distintas, y conviene no confundirlas:
--
--    1) Poder ver después quién cambió el inventario o un precio.
--    2) Que el empleado no pueda repartir accesos ni anular ventas.
--
--  La primera es un registro; la segunda es un permiso. Un registro no impide
--  nada: cuenta lo que ya pasó. Por eso van las dos.
--
--  Segura de correr de nuevo.
-- ============================================================

-- ------------------------------------------------------------
--  1) EL ROL `encargado`
--
--  Entre `dueno` y `cocina`. Maneja el día a día —inventario, precios,
--  compras, pedidos— y no toca dos cosas:
--
--    Equipo, porque desde ahí podría cambiarle la contraseña al dueño o
--    sacarlo del panel. Un empleado que puede quitarle el acceso al patrón no
--    es un empleado con permisos: es el patrón.
--
--    Anular ventas, porque es reescribir lo que ya se registró. Justo lo que
--    el registro de actividad viene a evitar.
-- ------------------------------------------------------------
alter table admins drop constraint if exists admins_rol_check;
alter table admins add constraint admins_rol_check
  check (rol in ('dueno','encargado','cocina'));

comment on column admins.rol is
  'dueno = todo. encargado = día a día sin Equipo ni anular ventas. cocina = solo pedidos.';

create or replace function puede_gestionar()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(mi_rol() in ('dueno','encargado'), false);
$$;

comment on function puede_gestionar() is
  'true para dueno y encargado: los que manejan inventario, menú y compras.';

grant execute on function puede_gestionar() to anon, authenticated;

-- ------------------------------------------------------------
--  2) LAS POLÍTICAS QUE SE ABREN AL ENCARGADO
--
--  Solo estas tres. `admins`, `settings` y `push_subscriptions` siguen siendo
--  del dueño y no se tocan acá a propósito.
-- ------------------------------------------------------------
drop policy if exists inventory_dueno on inventory;
drop policy if exists inventory_gestion on inventory;
create policy inventory_gestion on inventory
  for all to authenticated using (puede_gestionar()) with check (puede_gestionar());

drop policy if exists purchases_dueno on purchases;
drop policy if exists purchases_gestion on purchases;
create policy purchases_gestion on purchases
  for all to authenticated using (puede_gestionar()) with check (puede_gestionar());

drop policy if exists menu_editar on menu_items;
drop policy if exists menu_gestion on menu_items;
create policy menu_gestion on menu_items
  for all to authenticated using (puede_gestionar()) with check (puede_gestionar());

-- ------------------------------------------------------------
--  3) EL REGISTRO
--
--  `actor_email` está copiado, no referenciado, y es deliberado: el día que
--  saques al empleado de `admins`, el registro tiene que seguir diciendo quién
--  fue. Un registro que se queda mudo cuando echás a alguien no sirve para
--  nada.
--
--  `actor_id` guarda además el uuid de auth, que sobrevive a un cambio de
--  correo. Se guardan los dos porque responden preguntas distintas: el correo
--  es para leerlo, el uuid es para estar seguro.
-- ------------------------------------------------------------
create table if not exists actividad (
  id          bigint generated always as identity primary key,
  ocurrio_en  timestamptz not null default now(),
  actor_id    uuid,
  actor_email text not null,
  tabla       text not null,
  operacion   text not null check (operacion in ('alta','edicion','baja')),
  fila_id     uuid,
  -- El nombre del item al momento del cambio, para poder leer el registro sin
  -- ir a buscar una fila que quizás ya se borró.
  etiqueta    text,
  -- { campo: { antes, despues } }. En un alta, `antes` viene null; en una
  -- baja, `despues`.
  cambios     jsonb not null default '{}'::jsonb
);

create index if not exists idx_actividad_fecha on actividad (ocurrio_en desc);

comment on table actividad is
  'Quién cambió qué, y cuándo. Solo se agrega: no hay política de update ni de delete.';

-- ------------------------------------------------------------
--  4) EL TRIGGER
--
--  Esto es lo que hace que el registro valga algo. Escribirlo desde las
--  acciones del servidor sería registrar solo lo que pasa por el panel — y un
--  admin con su token puede pegarle directo a la API de Supabase, que es justo
--  el caso que preocupa. Con el trigger, la fila queda entre por donde entre.
--
--  `security definer` para poder escribir en `actividad` sin darle a nadie
--  permiso de insert sobre ella.
-- ------------------------------------------------------------
create or replace function registrar_actividad()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_antes    jsonb := '{}'::jsonb;
  v_despues  jsonb := '{}'::jsonb;
  v_op       text;
  v_cambios  jsonb;
  v_email    text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if tg_op = 'INSERT' then
    v_op := 'alta';
    v_despues := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    v_op := 'edicion';
    v_antes := to_jsonb(old);
    v_despues := to_jsonb(new);
  else
    v_op := 'baja';
    v_antes := to_jsonb(old);
  end if;

  -- Solo los campos que de verdad cambiaron. `updated_at` se mueve en cada
  -- escritura sin que nadie lo haya decidido, así que ensucia más de lo que
  -- cuenta; `id` ya va en su propia columna.
  select jsonb_object_agg(k, jsonb_build_object('antes', v_antes -> k, 'despues', v_despues -> k))
    into v_cambios
    from jsonb_object_keys(v_antes || v_despues) as k
   where v_antes -> k is distinct from v_despues -> k
     and k not in ('id', 'updated_at');

  -- Un update que no movió ningún campo visible no es un evento. Sin esto, el
  -- registro se llenaría de filas que no dicen nada.
  if v_cambios is null or v_cambios = '{}'::jsonb then
    return coalesce(new, old);
  end if;

  insert into actividad (actor_id, actor_email, tabla, operacion, fila_id, etiqueta, cambios)
  values (
    auth.uid(),
    -- Sin JWT es el SQL Editor con la llave secreta. Se deja dicho en vez de
    -- guardar un vacío que después nadie sabe interpretar.
    case when v_email = '' then 'llave secreta (SQL Editor)' else v_email end,
    tg_table_name,
    v_op,
    coalesce(v_despues ->> 'id', v_antes ->> 'id')::uuid,
    coalesce(v_despues ->> 'nombre', v_antes ->> 'nombre'),
    v_cambios
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists inventory_actividad on inventory;
create trigger inventory_actividad
  after insert or update or delete on inventory
  for each row execute function registrar_actividad();

drop trigger if exists menu_items_actividad on menu_items;
create trigger menu_items_actividad
  after insert or update or delete on menu_items
  for each row execute function registrar_actividad();

-- ------------------------------------------------------------
--  5) EL REGISTRO NO SE EDITA
--
--  Solo hay política de select, y solo para el dueño. Sin política de insert,
--  update ni delete, el RLS las niega — incluso al encargado, incluso al
--  dueño. Las filas entran únicamente por el trigger de arriba, que corre como
--  dueña de la tabla y por eso no necesita política.
--
--  Si el empleado pudiera borrar filas de acá, el registro no probaría nada.
-- ------------------------------------------------------------
alter table actividad enable row level security;

drop policy if exists actividad_ver on actividad;
create policy actividad_ver on actividad
  for select to authenticated using (es_dueno());

revoke all on actividad from anon, authenticated;
grant select on actividad to authenticated;

notify pgrst, 'reload schema';

-- ------------------------------------------------------------
--  PARA SUMAR AL EMPLEADO
--
--    update admins set rol = 'encargado' where email = 'elcorreo@ejemplo.com';
--
--  Y para ver quién tiene qué:  select email, rol from admins;
-- ------------------------------------------------------------
