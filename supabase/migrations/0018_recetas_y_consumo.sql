-- ============================================================
--  CASTA BURGER — cuánto lleva cada hamburguesa, y que se descuente sola
--
--  Hasta acá el inventario se ajustaba a mano (§2 del brief lo dejaba fuera
--  del alcance). Ahora cada producto puede declarar qué consume, y al entregar
--  un pedido el stock baja solo.
--
--  Segura de correr de nuevo.
-- ============================================================

-- ------------------------------------------------------------
--  1) LAS RECETAS
--
--  Una fila = "este producto consume tanto de este ingrediente, por unidad".
--
--  `proteina` es la columna que evita el error caro. La proteína no es un
--  producto del menú sino un texto que elige el cliente (Carne, Cordero,
--  Pollo), así que sin esto una receta por producto descontaría carne aunque
--  hubiera pedido pollo. Con null la línea aplica siempre —el pan, el queso,
--  el empaque— y con una proteína puesta, solo cuando se eligió esa.
--
--  Los extras no necesitan nada especial: en la base son productos del menú
--  con su propio id, así que "tocineta adicional" lleva su receta como
--  cualquier otro y se descuenta sola.
-- ------------------------------------------------------------
create table if not exists recetas (
  id           uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  inventory_id uuid not null references inventory(id) on delete cascade,
  proteina     text check (proteina in ('Carne','Cordero','Pollo')),
  cantidad     numeric(12,3) not null check (cantidad > 0),
  updated_at   timestamptz not null default now()
);

-- `nulls not distinct` para que dos líneas sin proteína del mismo par cuenten
-- como repetidas. Sin eso, Postgres las deja pasar y el ingrediente se
-- descontaría dos veces.
create unique index if not exists recetas_unicas
  on recetas (menu_item_id, inventory_id, proteina) nulls not distinct;

create index if not exists idx_recetas_producto on recetas (menu_item_id);

comment on table recetas is
  'Qué consume cada producto por unidad. proteina null = la línea aplica siempre.';

-- ------------------------------------------------------------
--  2) EL LIBRO DE CONSUMOS
--
--  Esta tabla es la que impide que el inventario se corrompa en silencio, y es
--  más importante que la resta en sí.
--
--  `order_id` es la clave primaria: un pedido puede figurar consumido una sola
--  vez. Sin esto, cualquier cosa que dispare el cambio de estado dos veces —un
--  reintento, dos pantallas de cocina tocando a la vez, un clic doble—
--  descontaría el doble y nadie se enteraría hasta el conteo físico.
--
--  `detalle` guarda lo que se restó, ingrediente por ingrediente. No se
--  recalcula al revertir: si la receta cambió entre el consumo y la anulación,
--  devolver "lo que la receta dice hoy" dejaría el stock peor que antes. Se
--  devuelve exactamente lo que se sacó.
-- ------------------------------------------------------------
create table if not exists consumos (
  order_id    uuid primary key references orders(id) on delete cascade,
  aplicado_en timestamptz not null default now(),
  detalle     jsonb not null
);

comment on table consumos is
  'Un pedido consume el inventario una sola vez. detalle = lo que se restó, para poder devolverlo igual.';

-- ------------------------------------------------------------
--  3) QUÉ CONSUME UN PEDIDO
--
--  Suma las recetas de cada línea: el producto y sus extras, multiplicado por
--  la cantidad de la línea, filtrando por la proteína que se eligió.
-- ------------------------------------------------------------
create or replace function consumo_de_pedido(p_order uuid)
returns table (inventory_id uuid, cantidad numeric)
language sql
stable
security definer
set search_path = public
as $$
  with lineas as (
    select
      oi.menu_item_id,
      oi.cantidad,
      oi.opciones ->> 'proteina' as proteina,
      oi.opciones -> 'extras'    as extras
    from order_items oi
    where oi.order_id = p_order
  ),
  -- El producto en sí. `menu_item_id` puede ser null si el producto se borró
  -- del menú después: ese pedido viejo simplemente no descuenta.
  base as (
    select r.inventory_id, r.cantidad * l.cantidad as cantidad
      from lineas l
      join recetas r on r.menu_item_id = l.menu_item_id
     where r.proteina is null or r.proteina = l.proteina
  ),
  -- Los extras. Van sin filtro de proteína: "tocineta adicional" es lo mismo
  -- se haya pedido con carne o con pollo.
  extras as (
    select r.inventory_id, r.cantidad * l.cantidad as cantidad
      from lineas l
      cross join lateral jsonb_array_elements(coalesce(l.extras, '[]'::jsonb)) as e
      join recetas r on r.menu_item_id = (e ->> 'id')::uuid
     where r.proteina is null
  )
  select t.inventory_id, sum(t.cantidad) as cantidad
    from (select * from base union all select * from extras) t
   group by t.inventory_id;
$$;

-- ------------------------------------------------------------
--  4) EL DESCUENTO, AL ENTREGAR
--
--  Va como trigger y no en las acciones del servidor por lo mismo que el
--  registro de actividad: un admin con su token puede mover el estado de un
--  pedido pegándole directo a la API de Supabase. Acá, además, hay una razón
--  más fuerte: el descuento pasa a ser atómico con el cambio de estado. O
--  pasan las dos cosas o no pasa ninguna.
--
--  Se permite que el stock quede NEGATIVO a propósito. La hamburguesa se hizo
--  igual: si el número dijera cero cuando en realidad se debían 3 kg, el
--  inventario mentiría justo cuando más importa. Un negativo es un cartel de
--  "acá falta contar algo", y la pantalla lo muestra en rojo.
-- ------------------------------------------------------------
create or replace function aplicar_consumo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_detalle jsonb;
begin
  -- Marca para que el registro de actividad ignore lo que toque este trigger.
  -- Sin esto, una noche de 50 pedidos con 4 ingredientes cada uno mete 200
  -- filas automáticas en Actividad y tapa lo único que esa pantalla existe
  -- para mostrar: los cambios que hizo una persona a mano. Es `true` = solo
  -- para esta transacción, así que no se filtra a la siguiente consulta.
  perform set_config('casta.automatico', '1', true);
  -- ENTREGADO: descontar, una sola vez.
  if new.estado = 'entregado' and old.estado is distinct from 'entregado' then
    if exists (select 1 from consumos where order_id = new.id) then
      return new;
    end if;

    select jsonb_agg(jsonb_build_object('inventory_id', c.inventory_id, 'cantidad', c.cantidad))
      into v_detalle
      from consumo_de_pedido(new.id) c;

    -- Sin recetas cargadas no hay nada que descontar, y tampoco hay que dejar
    -- una fila vacía: si mañana se cargan, este pedido no debe descontar
    -- retroactivamente algo que ya se cocinó sin registrar.
    if v_detalle is null then
      return new;
    end if;

    update inventory i
       set cantidad = i.cantidad - (d ->> 'cantidad')::numeric,
           updated_at = now()
      from jsonb_array_elements(v_detalle) as d
     where i.id = (d ->> 'inventory_id')::uuid;

    insert into consumos (order_id, detalle) values (new.id, v_detalle);
    return new;
  end if;

  -- DEJA DE ESTAR ENTREGADO (se anuló la venta, o volvió a la cocina):
  -- devolver exactamente lo que se sacó.
  if old.estado = 'entregado' and new.estado is distinct from 'entregado' then
    select detalle into v_detalle from consumos where order_id = new.id;
    if v_detalle is null then
      return new;
    end if;

    update inventory i
       set cantidad = i.cantidad + (d ->> 'cantidad')::numeric,
           updated_at = now()
      from jsonb_array_elements(v_detalle) as d
     where i.id = (d ->> 'inventory_id')::uuid;

    delete from consumos where order_id = new.id;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_consumo on orders;
create trigger orders_consumo
  after update of estado on orders
  for each row execute function aplicar_consumo();

-- ------------------------------------------------------------
--  5) PERMISOS
--
--  Las recetas las maneja quien maneja el inventario: dueño y encargado. El
--  libro de consumos se lee pero NO se escribe a mano — lo escribe el trigger,
--  que corre como dueña de la tabla. Si se pudiera editar, se podría borrar la
--  marca de un pedido y volver a descontarlo.
-- ------------------------------------------------------------
alter table recetas  enable row level security;
alter table consumos enable row level security;

drop policy if exists recetas_gestion on recetas;
create policy recetas_gestion on recetas
  for all to authenticated using (puede_gestionar()) with check (puede_gestionar());

drop policy if exists consumos_ver on consumos;
create policy consumos_ver on consumos
  for select to authenticated using (puede_gestionar());

revoke all on consumos from anon, authenticated;
grant select on consumos to authenticated;

-- El registro de actividad también mira las recetas: cambiar cuánta carne
-- lleva una hamburguesa mueve el inventario de todos los pedidos que vengan.
drop trigger if exists recetas_actividad on recetas;
create trigger recetas_actividad
  after insert or update or delete on recetas
  for each row execute function registrar_actividad();

-- ------------------------------------------------------------
--  6) EL REGISTRO DE ACTIVIDAD IGNORA EL DESCUENTO AUTOMÁTICO
--
--  Única razón por la que se toca una función ya en producción: sin el
--  guardia de abajo, Actividad se llenaría de filas que no son de nadie.
--  Lo demás de `registrar_actividad` queda igual.
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
  -- Lo que movió el descuento automático al entregar un pedido no es "alguien
  -- cambió el inventario": es la consecuencia de una venta, y ya queda
  -- registrada en el pedido y en `consumos`.
  if coalesce(current_setting('casta.automatico', true), '') = '1' then
    return coalesce(new, old);
  end if;

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

  select jsonb_object_agg(k, jsonb_build_object('antes', v_antes -> k, 'despues', v_despues -> k))
    into v_cambios
    from jsonb_object_keys(v_antes || v_despues) as k
   where v_antes -> k is distinct from v_despues -> k
     and k not in ('id', 'updated_at');

  if v_cambios is null or v_cambios = '{}'::jsonb then
    return coalesce(new, old);
  end if;

  insert into actividad (actor_id, actor_email, tabla, operacion, fila_id, etiqueta, cambios)
  values (
    auth.uid(),
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

notify pgrst, 'reload schema';
