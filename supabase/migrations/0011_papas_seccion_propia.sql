-- ============================================================
--  CASTA BURGER — las papas salen de Extras y tienen sección propia
--
--  "Servicio de papas" estaba en Extras, así que aparecía como un agregado
--  más dentro de la hamburguesa ("Agregale algo") y en la lista plana de dos
--  columnas, sin lugar para una foto. Es un producto que se vende solo.
--
--  Pasa a la categoría 'Fries', que en la web se muestra como las burgers:
--  tarjeta grande con foto, precio y botón propio. Al salir de Extras
--  desaparece sola de "Agregale algo" — esa lista es la categoría Extras.
--
--  Segura de correr de nuevo.
-- ============================================================

-- 1) La categoría nueva tiene que estar permitida ANTES del update
alter table menu_items drop constraint if exists menu_items_categoria_check;
alter table menu_items add constraint menu_items_categoria_check
  check (categoria in ('Burgers','Fries','Extras','Bebidas','Promos'));

-- 2) Las papas se mudan. De paso se corrige "papás" (que son los padres) por
--    "papas", y queda el hueco de la foto listo para cuando llegue la real.
update menu_items
   set categoria   = 'Fries',
       orden       = 1,
       descripcion = '150 g de papas full sal y paprika.'
 where slug = 'servicio-papas';
