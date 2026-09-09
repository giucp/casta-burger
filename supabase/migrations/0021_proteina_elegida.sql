-- ============================================================
--  CASTA BURGER — la receta dice "240 g de proteína", como el menú
--
--  Entre dos Casta Burger no cambia nada salvo la proteína: el mismo pan, el
--  mismo queso, la misma tocineta. Pero la receta obligaba a cargar tres
--  líneas casi idénticas —una por carne, otra por cordero, otra por pollo— y
--  a contestar "cuándo aplica esto" en cada ingrediente, incluida la tocineta,
--  que aplica siempre y siempre va a aplicar siempre.
--
--  Peor: si el dueño cargaba solo la de carne y entraba un pedido de cordero,
--  no se descontaba nada. La hamburguesa salía, el cordero se iba de la
--  nevera, y el inventario no se enteraba.
--
--  Ahora una línea de receta puede decir "la proteína que elija el cliente", y
--  el descuento resuelve cuál al momento de entregar.
--
--  Segura de correr de nuevo.
-- ============================================================

-- ------------------------------------------------------------
--  1) QUÉ ITEM DEL INVENTARIO ES CADA PROTEÍNA
--
--  Va en una tabla y no adivinado por el nombre. "Carne molida" hoy se llama
--  así; el día que alguien la renombre "Carne de res molida", una heurística
--  por texto dejaría de encontrarla y el descuento desaparecería sin avisar.
--  Tres filas que se configuran una vez.
-- ------------------------------------------------------------
create table if not exists proteina_ingrediente (
  proteina     text primary key check (proteina in ('Carne','Cordero','Pollo')),
  inventory_id uuid not null references inventory(id) on delete cascade,
  updated_at   timestamptz not null default now()
);

comment on table proteina_ingrediente is
  'De qué item del inventario sale cada proteína. Lo usa la línea de receta "la que elija el cliente".';

-- Arranque con lo que ya existe en el inventario. Si algún nombre no está, esa
-- fila simplemente no se crea y la pantalla lo va a mostrar como pendiente.
insert into proteina_ingrediente (proteina, inventory_id)
select v.proteina, i.id
  from (values ('Carne','Carne molida'),
               ('Cordero','Cordero molido'),
               ('Pollo','Pollo molido')) as v(proteina, nombre)
  join inventory i on lower(i.nombre) = lower(v.nombre)
on conflict (proteina) do nothing;

-- ------------------------------------------------------------
--  2) LA LÍNEA QUE NO NOMBRA UN INGREDIENTE
--
--  `es_proteina` = esta línea es la proteína del producto, sea cual sea. No
--  tiene `inventory_id` porque todavía no se sabe cuál: se resuelve con lo que
--  pidió el cliente.
--
--  Y como no hay un ingrediente del que heredar la unidad, la línea guarda la
--  suya. El resto de las líneas siguen guardando el número en la unidad de su
--  ingrediente, como hasta ahora.
-- ------------------------------------------------------------
alter table recetas add column if not exists es_proteina boolean not null default false;
alter table recetas add column if not exists unidad text;

alter table recetas alter column inventory_id drop not null;

alter table recetas drop constraint if exists recetas_proteina_o_ingrediente;
alter table recetas add constraint recetas_proteina_o_ingrediente check (
  (es_proteina and inventory_id is null and unidad is not null)
  or
  (not es_proteina and inventory_id is not null)
);

alter table recetas drop constraint if exists recetas_unidad_valida;
alter table recetas add constraint recetas_unidad_valida
  check (unidad is null or unidad in ('und','g','kg','ml','L'));

-- La línea de proteína no lleva filtro de proteína: ES la proteína. Poner las
-- dos cosas a la vez sería pedir "la que elija el cliente, pero solo si eligió
-- pollo", que no quiere decir nada.
alter table recetas drop constraint if exists recetas_proteina_sin_filtro;
alter table recetas add constraint recetas_proteina_sin_filtro
  check (not es_proteina or proteina is null);

-- ------------------------------------------------------------
--  3) EL CONSUMO, RESOLVIENDO LA PROTEÍNA
--
--  Cuatro orígenes que se suman: los ingredientes del producto, su proteína,
--  y lo mismo para lo que traiga adentro una promo. Más los extras.
--
--  La conversión de unidad va acá porque la receta guarda "240 g" y el
--  inventario del cordero puede estar en kilos. Si las unidades no comparten
--  base —una proteína cargada en unidades— la línea no aporta nada en vez de
--  restar un número inventado; la pantalla de Recetas lo avisa.
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
  -- Lo que la promo contiene, aplanado a "producto + proteína + cuántos".
  contenido as (
    select l.menu_item_id, l.proteina, l.cantidad
      from lineas l
     where not exists (select 1 from promo_componentes pc where pc.promo_id = l.menu_item_id)
    union all
    select pc.menu_item_id, pc.proteina, pc.cantidad * l.cantidad
      from lineas l
      join promo_componentes pc on pc.promo_id = l.menu_item_id
  ),
  -- Los ingredientes con nombre. `menu_item_id` puede ser null si el producto
  -- se borró del menú: ese pedido viejo simplemente no descuenta.
  base as (
    select r.inventory_id, r.cantidad * c.cantidad as cantidad
      from contenido c
      join recetas r on r.menu_item_id = c.menu_item_id
     where not r.es_proteina
       and (r.proteina is null or r.proteina = c.proteina)
  ),
  -- La proteína elegida, resuelta al item que le toca y convertida a su unidad.
  de_proteina as (
    select pi.inventory_id,
           round(
             r.cantidad * c.cantidad
             * unidad_factor(r.unidad) / unidad_factor(inv.unidad)
           , 3) as cantidad
      from contenido c
      join recetas r on r.menu_item_id = c.menu_item_id and r.es_proteina
      join proteina_ingrediente pi on pi.proteina = c.proteina
      join inventory inv on inv.id = pi.inventory_id
     where unidad_base(r.unidad) = unidad_base(inv.unidad)
  ),
  -- Los extras. Van sin filtro de proteína: "tocineta adicional" es lo mismo
  -- se haya pedido con carne o con pollo.
  extras as (
    select r.inventory_id, r.cantidad * l.cantidad as cantidad
      from lineas l
      cross join lateral jsonb_array_elements(coalesce(l.extras, '[]'::jsonb)) as e
      join recetas r on r.menu_item_id = (e ->> 'id')::uuid
     where r.proteina is null and not r.es_proteina
  )
  select t.inventory_id, sum(t.cantidad) as cantidad
    from (
      select * from base
      union all select * from de_proteina
      union all select * from extras
    ) t
   where t.cantidad > 0
   group by t.inventory_id;
$$;

-- ------------------------------------------------------------
--  4) QUIÉN TOCA ESTO
-- ------------------------------------------------------------
alter table proteina_ingrediente enable row level security;

drop policy if exists proteina_ingrediente_gestion on proteina_ingrediente;
create policy proteina_ingrediente_gestion on proteina_ingrediente
  for all to authenticated using (puede_gestionar()) with check (puede_gestionar());

notify pgrst, 'reload schema';
