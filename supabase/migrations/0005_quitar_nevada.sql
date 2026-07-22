-- ============================================================
--  CASTA BURGER — la Nevada sale del menú
--
--  No está entre las bebidas actuales del negocio. Se borra en vez de
--  ocultarse porque no va a volver.
--
--  Idempotente: si ya no existe, no hace nada.
-- ============================================================

-- Si algún pedido viejo la tuviera, se le suelta la referencia en vez de
-- perder la línea: `order_items` ya guarda copia del nombre y el precio, así
-- que el histórico sigue siendo legible.
update order_items
   set menu_item_id = null
 where menu_item_id in (select id from menu_items where slug = 'nevada-manzana');

delete from menu_items where slug = 'nevada-manzana';
