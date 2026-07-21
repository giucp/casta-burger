-- ============================================================
--  CASTA BURGER — etiquetas de producto y carga del menú real
--
--  1. Agrega `tags`, que faltaba: son las etiquetas cortas de la tarjeta
--     ("120 g", "onion smash", "pan de batata").
--  2. Carga el menú del menú impreso del negocio.
--
--  Es idempotente: se puede correr de nuevo sin duplicar nada.
-- ============================================================

alter table menu_items
  add column if not exists tags text[] not null default '{}';

-- Clave estable para poder recargar sin duplicar. El id sigue siendo uuid.
alter table menu_items
  add column if not exists slug text;

create unique index if not exists idx_menu_slug on menu_items(slug);

insert into menu_items
  (slug, nombre, descripcion, precio, precio_white_meal, categoria, orden, tags)
values
  -- BURGERS
  ('cheese-burger', 'Cheese Burger',
   '120 g de proteína, queso facilista, salsa de la casa, tocineta y pan de batata.',
   5.00, 7.00, 'Burgers', 1, '{"120 g","tocineta","pan de batata"}'),

  ('casta-burger', 'Casta Burger',
   '240 g de proteína, onion smash, queso facilista, salsa de la casa, tocineta y pan de batata.',
   7.50, 9.99, 'Burgers', 2, '{"240 g","onion smash","doble"}'),

  ('casta-smash', 'Casta Smash',
   '360 g de proteína, onion smash, queso facilista, salsa de la casa, tocineta y pan de batata.',
   10.00, 12.99, 'Burgers', 3, '{"360 g","triple"}'),

  -- COMBO
  ('combo-3-cheese', 'Combo 3 Cheese Burger',
   'Tres Cheese Burger para compartir.',
   17.70, null, 'Combo', 1, '{"3 burgers"}'),

  -- EXTRAS
  ('extra-proteina', 'Proteína adicional',      null, 2.00, null, 'Extras', 1, '{}'),
  ('extra-tocineta', 'Tocineta adicional',      null, 1.00, null, 'Extras', 2, '{}'),
  ('extra-onion',    'Onion smash / cebolla planchada', null, 0.50, null, 'Extras', 3, '{}'),
  ('extra-salsa',    'Salsa de la casa adicional',      null, 0.50, null, 'Extras', 4, '{}'),
  ('extra-queso',    'Queso facilista adicional',       null, 1.00, null, 'Extras', 5, '{}'),

  -- BEBIDAS
  -- PENDIENTE: el menú impreso no trae precios. Van en null y la web las
  -- muestra como "Consultar" hasta que el negocio los confirme.
  ('coca-1l',             'Coca-Cola 1 L original',  null, null, null, 'Bebidas', 1, '{}'),
  ('coca-lata-zero',      'Coca-Cola lata zero',     null, null, null, 'Bebidas', 2, '{}'),
  ('coca-lata-original',  'Coca-Cola lata original', null, null, null, 'Bebidas', 3, '{}'),
  ('nevada-manzana',      'Nevada manzana 355 ml',   null, null, null, 'Bebidas', 4, '{}')

on conflict (slug) do update set
  nombre            = excluded.nombre,
  descripcion       = excluded.descripcion,
  precio            = excluded.precio,
  precio_white_meal = excluded.precio_white_meal,
  categoria         = excluded.categoria,
  orden             = excluded.orden,
  tags              = excluded.tags;

-- El público solo lee lo disponible; le hace falta ver también los que no
-- tienen precio todavía, así que la policy no cambia.
