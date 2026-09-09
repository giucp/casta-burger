-- ============================================================
--  CASTA BURGER — la unidad deja de ser una etiqueta
--
--  El descuento resta número contra número: `inventory.cantidad` menos lo que
--  dice la receta. La unidad nunca participó. Como además se escribía a mano,
--  "gr", "g" y "gramos" eran tres unidades distintas para el sistema, y cargar
--  60 en una receta contra un inventario en kilos sacaba 60 KILOS de carne sin
--  avisar.
--
--  Acá la unidad pasa a ser una lista cerrada, y cambiarla convierte los
--  números en vez de solo cambiarles el nombre.
--
--  Segura de correr de nuevo.
-- ============================================================

-- ------------------------------------------------------------
--  1) MÁS PRECISIÓN ANTES DE PODER CONVERTIR
--
--  `numeric(10,2)` alcanzaba mientras todo se cargaba a mano en la unidad
--  grande. Con conversión no: 5 ml de salsa sobre un inventario en litros son
--  0.005 L, que con dos decimales se redondean a cero y el descuento no
--  existe. Tres decimales = un gramo cuando se mide en kilos.
-- ------------------------------------------------------------
alter table inventory
  alter column cantidad      type numeric(12,3),
  alter column umbral_alerta type numeric(12,3);

-- ------------------------------------------------------------
--  2) LA LISTA CERRADA
--
--  Primero se normaliza lo que ya está escrito, después se pone el candado.
--  Al revés fallaría con los datos que hay.
--
--  Lo que no se reconoce cae en 'und'. Es la opción segura: 'und' no convierte
--  con nada, así que un item mal etiquetado queda visible y quieto en vez de
--  multiplicarse por mil.
-- ------------------------------------------------------------
update inventory set unidad = case lower(trim(unidad))
  when 'g'        then 'g'
  when 'gr'       then 'g'
  when 'grs'      then 'g'
  when 'gramo'    then 'g'
  when 'gramos'   then 'g'
  when 'kg'       then 'kg'
  when 'kgs'      then 'kg'
  when 'k'        then 'kg'
  when 'kilo'     then 'kg'
  when 'kilos'    then 'kg'
  when 'ml'       then 'ml'
  when 'mililitro'  then 'ml'
  when 'mililitros' then 'ml'
  when 'l'        then 'L'
  when 'lt'       then 'L'
  when 'lts'      then 'L'
  when 'litro'    then 'L'
  when 'litros'   then 'L'
  else 'und'
end
where unidad is distinct from case lower(trim(unidad))
  when 'g' then 'g' when 'gr' then 'g' when 'grs' then 'g'
  when 'gramo' then 'g' when 'gramos' then 'g'
  when 'kg' then 'kg' when 'kgs' then 'kg' when 'k' then 'kg'
  when 'kilo' then 'kg' when 'kilos' then 'kg'
  when 'ml' then 'ml' when 'mililitro' then 'ml' when 'mililitros' then 'ml'
  when 'l' then 'L' when 'lt' then 'L' when 'lts' then 'L'
  when 'litro' then 'L' when 'litros' then 'L'
  else 'und'
end;

alter table inventory drop constraint if exists inventory_unidad_valida;
alter table inventory add constraint inventory_unidad_valida
  check (unidad in ('und','g','kg','ml','L'));

-- ------------------------------------------------------------
--  3) CAMBIAR LA UNIDAD CONVIERTE LOS NÚMEROS
--
--  Dos casos, y son distintos:
--
--  - Compatible (g ↔ kg, ml ↔ L): el item es el mismo, cambia cómo se mide.
--    Se convierten la cantidad, el umbral Y las recetas que lo usan. Sin lo
--    último, pasar la carne de kg a g dejaría las recetas mil veces cortas.
--
--  - Incompatible (kg → und): no es una conversión, es una corrección. El
--    queso facilista estaba cargado en kg y en el negocio se cuenta por
--    unidad; nadie sabe cuántos gramos pesa una lámina y adivinarlo sería
--    inventar stock. Se cambia la etiqueta y los números quedan como están,
--    para que la persona los ajuste mirando.
--
--  Todo junto en una transacción: o se convierte todo o no se toca nada.
-- ------------------------------------------------------------
create or replace function unidad_base(u text)
returns text language sql immutable as $$
  select case u when 'g' then 'g' when 'kg' then 'g'
                when 'ml' then 'ml' when 'L' then 'ml'
                else 'und' end;
$$;

create or replace function unidad_factor(u text)
returns numeric language sql immutable as $$
  select case u when 'kg' then 1000 when 'L' then 1000 else 1 end;
$$;

create or replace function cambiar_unidad_inventario(
  p_item   uuid,
  p_nueva  text
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_vieja  text;
  v_factor numeric;
begin
  if p_nueva not in ('und','g','kg','ml','L') then
    raise exception 'Unidad no válida: %', p_nueva;
  end if;

  select unidad into v_vieja from inventory where id = p_item for update;
  if v_vieja is null then
    raise exception 'No existe ese item del inventario';
  end if;
  if v_vieja = p_nueva then
    return;
  end if;

  if unidad_base(v_vieja) = unidad_base(p_nueva) then
    v_factor := unidad_factor(v_vieja) / unidad_factor(p_nueva);

    update inventory
       set cantidad      = round(cantidad * v_factor, 3),
           umbral_alerta = round(umbral_alerta * v_factor, 3),
           unidad        = p_nueva,
           updated_at    = now()
     where id = p_item;

    update recetas
       set cantidad   = round(cantidad * v_factor, 3),
           updated_at = now()
     where inventory_id = p_item;
  else
    update inventory
       set unidad     = p_nueva,
           updated_at = now()
     where id = p_item;
  end if;
end;
$$;

comment on function cambiar_unidad_inventario(uuid, text) is
  'Cambia la unidad de un item. Si es compatible convierte cantidad, umbral y recetas; si no, solo cambia la etiqueta.';

notify pgrst, 'reload schema';
