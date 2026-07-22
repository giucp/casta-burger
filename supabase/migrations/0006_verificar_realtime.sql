-- ============================================================
--  CASTA BURGER — asegurar Realtime en los pedidos
--
--  La 0001 ya agrega `orders` y `order_items` a la publicación, pero si esa
--  parte falló (o el proyecto se creó de otra forma) la pantalla de cocina se
--  queda muda sin dar ningún error: se suscribe bien y nunca recibe nada.
--
--  Este archivo lo deja en su lugar y además muestra cómo quedó.
--  Idempotente: si ya estaba, no hace nada.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table orders;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public' and tablename = 'order_items'
  ) then
    alter publication supabase_realtime add table order_items;
  end if;
end $$;

-- Para que Realtime pueda mandar la fila completa en updates y deletes.
-- Sin esto solo viaja la clave primaria.
alter table orders replica identity full;

-- Debe devolver dos filas: orders y order_items
select tablename as "tablas con Realtime activo"
  from pg_publication_tables
 where pubname = 'supabase_realtime' and schemaname = 'public'
 order by tablename;
