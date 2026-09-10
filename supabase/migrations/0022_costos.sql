-- ============================================================
--  CASTA BURGER — cuánto cuesta hacer cada hamburguesa
--
--  Compras era texto libre y un monto: "Carne, $8". Servía para la caja del
--  día —ventas menos gastos— y para nada más. No se podía saber cuánto cuesta
--  una Cheese Burger, que es la pregunta que decide si el precio sirve.
--
--  Ahora una compra puede decir de qué ingrediente es, cuánto y en qué unidad.
--  De ahí sale el costo por unidad, y como la receta ya dice "120 g de
--  proteína", sale solo cuánto costó esa hamburguesa.
--
--  Lo que NO hace: tocar el inventario. El stock se ajusta a mano y se
--  seguirá ajustando a mano; si una compra además sumara, lo que hoy hacen
--  después de comprar quedaría contado dos veces.
--
--  Segura de correr de nuevo.
-- ============================================================

-- ------------------------------------------------------------
--  1) UNA COMPRA PUEDE APUNTAR A UN INGREDIENTE
--
--  Las tres columnas son opcionales a propósito: el gas, las bolsas y el
--  delivery son gastos reales que no son ingrediente de nada. Esos siguen
--  entrando como antes, con su descripción, y suman a la caja sin aportar al
--  costo de ningún producto.
--
--  `on delete set null` y no cascade: si se borra un ingrediente del
--  inventario, el gasto ocurrió igual y tiene que seguir contando en la caja
--  de ese día. Lo que se pierde es a qué producto atribuirlo.
-- ------------------------------------------------------------
alter table purchases add column if not exists inventory_id uuid
  references inventory(id) on delete set null;
alter table purchases add column if not exists cantidad numeric(12,3);
alter table purchases add column if not exists unidad text;

alter table purchases drop constraint if exists purchases_unidad_valida;
alter table purchases add constraint purchases_unidad_valida
  check (unidad is null or unidad in ('und','g','kg','ml','L'));

-- Con ingrediente, la cantidad y la unidad son obligatorias: sin ellas no hay
-- costo por unidad, que es todo el punto.
alter table purchases drop constraint if exists purchases_ingrediente_completo;
alter table purchases add constraint purchases_ingrediente_completo check (
  inventory_id is null
  or (cantidad is not null and cantidad > 0 and unidad is not null)
);

create index if not exists idx_purchases_ingrediente
  on purchases (inventory_id, fecha desc);

-- ------------------------------------------------------------
--  2) CUÁNTO CUESTA HOY CADA INGREDIENTE
--
--  La última compra, no el promedio. Es el precio que va a pagar para
--  reponer, y ese es el que decide si el precio de venta todavía sirve. Un
--  promedio arrastra lo que costaba hace tres meses y hace parecer sano un
--  margen que ya no existe.
--
--  El costo queda expresado en la unidad DEL INVENTARIO, no en la de la
--  compra: así se multiplica derecho contra lo que dice la receta. Comprar
--  "1 kg por $8" con el inventario en gramos da $0.008 por gramo.
--
--  Si la compra quedó en una unidad que no convierte con la del inventario
--  —comprada por unidades, inventariada en kilos— la fila no aparece. Es
--  preferible no mostrar costo a mostrar uno inventado.
-- ------------------------------------------------------------
create or replace view costo_ingrediente
with (security_invoker = true) as
select distinct on (p.inventory_id)
  p.inventory_id,
  i.unidad as unidad,
  round(
    (p.monto / p.cantidad)
    * unidad_factor(i.unidad) / unidad_factor(p.unidad)
  , 6) as costo_unitario,
  p.fecha  as desde,
  p.monto  as ultimo_monto,
  p.cantidad as ultima_cantidad,
  p.unidad as ultima_unidad
from purchases p
join inventory i on i.id = p.inventory_id
where p.inventory_id is not null
  and p.cantidad is not null
  and p.cantidad > 0
  and unidad_base(p.unidad) = unidad_base(i.unidad)
order by p.inventory_id, p.fecha desc, p.created_at desc;

comment on view costo_ingrediente is
  'Costo por unidad de inventario de cada ingrediente, según su última compra.';

notify pgrst, 'reload schema';
