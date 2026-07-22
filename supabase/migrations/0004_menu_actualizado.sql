-- ============================================================
--  CASTA BURGER — menú actualizado (PDF "MENU CASTA", julio 2026)
--
--  Cambios contra el menú anterior:
--   1. El White Meal deja de existir. Las burgers tienen un solo precio.
--   2. Precios nuevos: 6.99 / 9.99 / 12.99
--   3. Bebidas con precio real, y se suman los formatos que faltaban
--      (1 L zero y bombonita de 650 ml en sus dos versiones)
--   4. Las papás pasan a ser un producto de la carta y no una casilla suelta
--   5. Las promos quedan fijas: vienen con carne y no se modifican
--
--  Idempotente: se puede correr de nuevo sin duplicar.
-- ============================================================

-- ------------------------------------------------------------
--  1) Fuera el White Meal
-- ------------------------------------------------------------
alter table menu_items drop column if exists precio_white_meal;

-- ------------------------------------------------------------
--  2) Burgers con los precios nuevos
-- ------------------------------------------------------------
update menu_items set precio = 6.99 where slug = 'cheese-burger';
update menu_items set precio = 9.99 where slug = 'casta-burger';
update menu_items set precio = 12.99 where slug = 'casta-smash';

-- ------------------------------------------------------------
--  3) El Combo sale de circulación
--
--  "Combo 3 Cheese Burger" y la promo "3 Cheese Burger" son el mismo
--  producto al mismo precio. Tenerlo dos veces en la misma página confunde
--  al cliente y hace llegar a cocina dos nombres distintos para lo mismo.
--  Queda en Promos, que además muestra el ahorro.
--
--  Se marca no disponible en vez de borrarlo: es reversible con un toggle y
--  no rompe pedidos viejos que lo referencien.
-- ------------------------------------------------------------
update menu_items set disponible = false where slug = 'combo-3-cheese';

-- ------------------------------------------------------------
--  4) Extras: las papás entran como producto
-- ------------------------------------------------------------
insert into menu_items (slug, nombre, descripcion, precio, categoria, orden, tags)
values
  ('servicio-papas', 'Servicio de papas',
   '150 g de papás full sal y paprika.', 2.50, 'Extras', 0, '{"150 g"}')
on conflict (slug) do update set
  nombre      = excluded.nombre,
  descripcion = excluded.descripcion,
  precio      = excluded.precio,
  categoria   = excluded.categoria,
  orden       = excluded.orden,
  tags        = excluded.tags,
  disponible  = true;

-- ------------------------------------------------------------
--  5) Bebidas con precio real
-- ------------------------------------------------------------
insert into menu_items (slug, nombre, precio, categoria, orden, tags)
values
  ('coca-lata-original',   'Coca-Cola lata original',       2.00, 'Bebidas', 1, '{"355 ml"}'),
  ('coca-lata-zero',       'Coca-Cola lata zero',           2.00, 'Bebidas', 2, '{"355 ml"}'),
  ('coca-bombonita',       'Coca-Cola bombonita original',  1.50, 'Bebidas', 3, '{"650 ml"}'),
  ('coca-bombonita-zero',  'Coca-Cola bombonita zero',      1.50, 'Bebidas', 4, '{"650 ml"}'),
  ('coca-1l',              'Coca-Cola 1 L original',        2.00, 'Bebidas', 5, '{"1 L"}'),
  ('coca-1l-zero',         'Coca-Cola 1 L zero',            2.00, 'Bebidas', 6, '{"1 L"}')
on conflict (slug) do update set
  nombre     = excluded.nombre,
  precio     = excluded.precio,
  categoria  = excluded.categoria,
  orden      = excluded.orden,
  tags       = excluded.tags,
  disponible = true;

-- La Nevada sigue en el menú impreso pero no está en la lista de bebidas
-- actuales ni tiene precio. Se oculta hasta que el negocio confirme; volver
-- a mostrarla es cambiar este flag.
update menu_items set disponible = false where slug = 'nevada-manzana';

-- ------------------------------------------------------------
--  6) Promos: fijas, con carne, y ahora sí con ahorro real
-- ------------------------------------------------------------
insert into menu_items
  (slug, nombre, descripcion, precio, precio_suelto, categoria, orden, tags)
values
  ('promo-2x1-cheese', '2x1 en Cheese Burger',
   'Dos Cheese Burger de carne por el precio de una.',
   7.00, 13.98, 'Promos', 1, '{"2 burgers","carne"}'),

  ('promo-2-casta-regalo', '2 Casta Burger + 1 de regalo',
   'Dos Casta Burger de carne y una Cheese Burger de regalo.',
   20.00, 26.97, 'Promos', 2, '{"3 burgers","carne"}'),

  ('promo-3-cheese', '3 Cheese Burger',
   'Tres Cheese Burger de carne para compartir.',
   17.70, 20.97, 'Promos', 3, '{"3 burgers","carne"}')

on conflict (slug) do update set
  nombre        = excluded.nombre,
  descripcion   = excluded.descripcion,
  precio        = excluded.precio,
  precio_suelto = excluded.precio_suelto,
  categoria     = excluded.categoria,
  orden         = excluded.orden,
  tags          = excluded.tags,
  disponible    = true;
