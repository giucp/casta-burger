-- ============================================================
--  CASTA BURGER — fuera la categoría Combo
--
--  El "Combo 3 Cheese Burger" no existe como tal: es la promo "3 Cheese
--  Burger", que ya está en Promos. Tener las dos confunde. Se borra el
--  producto Combo (que además ya estaba oculto desde la 0004).
--
--  Se suelta antes cualquier referencia en pedidos viejos, para no perder la
--  línea: order_items ya guarda copia del nombre y el precio.
-- ============================================================

update order_items
   set menu_item_id = null
 where menu_item_id in (select id from menu_items where categoria = 'Combo');

delete from menu_items where categoria = 'Combo';

-- La categoría deja de estar permitida en el check
alter table menu_items drop constraint if exists menu_items_categoria_check;
alter table menu_items add constraint menu_items_categoria_check
  check (categoria in ('Burgers','Extras','Bebidas','Promos'));
