-- ============================================================
--  CASTA BURGER — un producto se puede borrar sin romper el histórico
--
--  order_items.menu_item_id apunta a menu_items. Sin ON DELETE, borrar un
--  producto que ya se vendió fallaría por la referencia. Pero order_items
--  guarda copia del nombre y el precio, así que soltar la referencia no
--  pierde nada: el pedido viejo sigue legible.
--
--  Con ON DELETE SET NULL, el dueño puede borrar del menú un producto que
--  ya tiene ventas y el histórico queda intacto.
-- ============================================================

alter table order_items
  drop constraint if exists order_items_menu_item_id_fkey;

alter table order_items
  add constraint order_items_menu_item_id_fkey
  foreign key (menu_item_id) references menu_items(id) on delete set null;
