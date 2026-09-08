-- ============================================================
--  CASTA BURGER — las promos descuentan lo que de verdad son
--
--  Una promo no es un producto nuevo: son las mismas hamburguesas vendidas de
--  un golpe. Hasta acá, para que descontaran, había que cargarles una receta
--  propia — una copia de la receta de la hamburguesa, multiplicada a mano. Eso
--  significaba escribir los ingredientes de la Cheese Burger en cuatro lugares
--  y mantenerlos sincronizados para siempre. El día que cambie el pan, tres
--  copias quedan viejas en silencio y el inventario descuenta mal sin avisar.
--
--  Acá una promo declara QUÉ CONTIENE, no qué consume. El consumo sale solo,
--  de la receta de la hamburguesa que ya está cargada. Se carga una vez y vale
--  para las tres promos.
--
--  La regla no cambia: sin receta cargada no se descuenta nada. Si la Cheese
--  Burger no tiene receta, la promo 2x1 tampoco descuenta.
--
--  Segura de correr de nuevo.
-- ============================================================

-- ------------------------------------------------------------
--  1) QUÉ CONTIENE CADA PROMO
--
--  `proteina` va acá y no se pregunta al cliente porque las promos son fijas:
--  las tres dicen "de carne" en su propia descripción. Sin esta columna, la
--  línea de la receta marcada "Solo Carne" no aplicaría nunca en una promo
--  —el pedido no trae proteína elegida— y la promo descontaría el pan y el
--  queso pero no la carne. Sería el peor error posible: silencioso y solo en
--  el ingrediente más caro.
-- ------------------------------------------------------------
create table if not exists promo_componentes (
  promo_id     uuid not null references menu_items(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  cantidad     int  not null check (cantidad > 0),
  proteina     text check (proteina in ('Carne','Cordero','Pollo')),
  primary key (promo_id, menu_item_id)
);

comment on table promo_componentes is
  'Qué productos, y cuántos, trae cada promo. El consumo sale de la receta de esos productos.';

-- Las tres promos de hoy, leídas de su propia descripción.
insert into promo_componentes (promo_id, menu_item_id, cantidad, proteina)
select p.id, c.id, v.cantidad, v.proteina
  from (values
    ('promo-2x1-cheese',     'cheese-burger', 2, 'Carne'),
    ('promo-2-casta-regalo', 'casta-burger',  2, 'Carne'),
    ('promo-2-casta-regalo', 'cheese-burger', 1, 'Carne'),
    ('promo-3-cheese',       'cheese-burger', 3, 'Carne')
  ) as v(promo_slug, item_slug, cantidad, proteina)
  join menu_items p on p.slug = v.promo_slug
  join menu_items c on c.slug = v.item_slug
on conflict (promo_id, menu_item_id) do update
  set cantidad = excluded.cantidad,
      proteina = excluded.proteina;

-- ------------------------------------------------------------
--  2) QUÉ CONSUME UN PEDIDO, AHORA CON LAS PROMOS ADENTRO
--
--  Tres orígenes que se suman: el producto de la línea, los productos que la
--  promo contiene, y los extras. Un producto que no tiene receta no aporta
--  nada — el join simplemente no encuentra filas — y eso es exactamente la
--  regla que se quiere: sin receta, no se descuenta.
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
  -- Lo que la promo contiene, con la receta de cada hamburguesa. La proteína
  -- la pone el componente, no el pedido: en una promo el cliente no elige.
  de_promos as (
    select r.inventory_id, r.cantidad * pc.cantidad * l.cantidad as cantidad
      from lineas l
      join promo_componentes pc on pc.promo_id = l.menu_item_id
      join recetas r            on r.menu_item_id = pc.menu_item_id
     where r.proteina is null or r.proteina = pc.proteina
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
    from (
      select * from base
      union all select * from de_promos
      union all select * from extras
    ) t
   group by t.inventory_id;
$$;

-- ------------------------------------------------------------
--  3) QUIÉN TOCA ESTO
--
--  Se lee para mostrar en el panel; escribirlo es cambiar qué contiene una
--  promo, que es armar el menú. Mismo permiso que las recetas.
-- ------------------------------------------------------------
alter table promo_componentes enable row level security;

drop policy if exists promo_componentes_gestion on promo_componentes;
create policy promo_componentes_gestion on promo_componentes
  for all to authenticated using (puede_gestionar()) with check (puede_gestionar());

notify pgrst, 'reload schema';
