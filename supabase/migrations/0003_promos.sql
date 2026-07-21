-- ============================================================
--  CASTA BURGER — las promos pasan a ser productos de verdad
--
--  Vivían en un archivo de código, así que no se podían agregar al carrito:
--  el pedido solo acepta productos que existan en `menu_items`, porque es
--  ahí donde el servidor busca los precios.
--
--  Idempotente: se puede correr de nuevo sin duplicar.
-- ============================================================

-- 1) La categoría 'Promos' no estaba permitida por el check original
alter table menu_items drop constraint if exists menu_items_categoria_check;
alter table menu_items add constraint menu_items_categoria_check
  check (categoria in ('Burgers','Combo','Extras','Bebidas','Promos'));

-- 2) Lo que costaría comprando cada cosa suelta. Solo se usa en promos, y
--    solo se muestra si es mayor al precio: tachar un precio que no es más
--    alto sería publicidad engañosa.
alter table menu_items
  add column if not exists precio_suelto numeric(10,2);

-- 3) Las promos
insert into menu_items
  (slug, nombre, descripcion, precio, precio_suelto, categoria, orden, tags)
values
  ('promo-2x1-cheese', '2x1 en Cheese Burger',
   'Llevás dos Cheese Burger por el precio de una.',
   7.00, 10.00, 'Promos', 1, '{"2 burgers"}'),

  ('promo-2-casta-regalo', '2 Casta Burger + 1 de regalo',
   'Pedís dos Casta Burger y te llevás una Cheese Burger sin costo.',
   20.00, null, 'Promos', 2, '{"3 burgers"}'),

  ('promo-3-cheese', '3 Cheese Burger',
   'Tres Cheese Burger para compartir.',
   17.70, null, 'Promos', 3, '{"3 burgers"}')

on conflict (slug) do update set
  nombre        = excluded.nombre,
  descripcion   = excluded.descripcion,
  precio        = excluded.precio,
  precio_suelto = excluded.precio_suelto,
  categoria     = excluded.categoria,
  orden         = excluded.orden,
  tags          = excluded.tags;

-- NOTA: `precio_suelto` va en null en las dos últimas a propósito. Con los
-- precios actuales de burger sola, esas dos promos no representan ahorro
-- (una empata y la otra sale más cara que comprar suelto), así que no se
-- muestra ningún tachado. Si el negocio confirma que son con White Meal,
-- se cargan 24.98 y 21.00 respectivamente y el ahorro aparece solo.
