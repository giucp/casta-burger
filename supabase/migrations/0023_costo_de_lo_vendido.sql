-- ============================================================
--  CASTA BURGER — cuánto se ganó con lo que se vendió hoy
--
--  El panel mostraba "Ganancia hoy = ventas − compras del día". Mezclaba dos
--  cosas que se mueven a ritmos distintos: las ventas son diarias y las
--  compras son semanales. Casi todas las noches las compras eran $0 y la
--  tarjeta no decía nada; la noche que sí compraban carne para la semana, una
--  buena noche de servicio aparecía en rojo.
--
--  El número que sirve es otro: lo que costaron los ingredientes que salieron
--  por la puerta. Está a mano porque `consumos` ya guarda, pedido por pedido,
--  exactamente qué se descontó —y la fila se borra al anular la venta, así
--  que lo que queda es siempre lo que de verdad se vendió.
--
--  Segura de correr de nuevo.
-- ============================================================

create or replace view costo_vendido_por_dia
with (security_invoker = true) as
select
  (o.created_at at time zone 'America/Caracas')::date as dia,
  -- Lo que costó lo consumido, al precio de la última compra de cada cosa.
  coalesce(
    sum((d ->> 'cantidad')::numeric * ci.costo_unitario)
      filter (where ci.inventory_id is not null),
    0
  ) as costo,
  -- Cuántas líneas se consumieron sin tener costo cargado. Mientras esto no
  -- sea 0, el costo de arriba está incompleto y la ganancia sale inflada. La
  -- pantalla lo dice: un número incompleto que se muestra como completo se
  -- toma por bueno, y este decide precios.
  count(*) filter (where ci.inventory_id is null) as lineas_sin_costo
from consumos c
join orders o on o.id = c.order_id
cross join lateral jsonb_array_elements(c.detalle) as d
left join costo_ingrediente ci
  on ci.inventory_id = (d ->> 'inventory_id')::uuid
group by 1;

comment on view costo_vendido_por_dia is
  'Cuánto costaron los ingredientes de lo vendido cada día, según la última compra de cada uno.';

notify pgrst, 'reload schema';
