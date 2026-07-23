-- ============================================================
--  CASTA BURGER — el público ve también lo agotado (atenuado)
--
--  El §3 del brief diseñó el estado agotado como "tarjeta atenuada, botón
--  deshabilitado", no como "desaparece". Pero el RLS filtraba disponible=true,
--  así que un producto agotado se esfumaba del menú en vez de mostrarse gris.
--
--  Un menú no es información secreta: el público puede leerlo entero. Que un
--  producto se pueda PEDIR o no lo decide la web (atenúa lo agotado); que se
--  pueda CREAR/EDITAR lo sigue cuidando la policy de admin.
-- ============================================================

drop policy if exists menu_public_read on menu_items;

create policy menu_public_read on menu_items
  for select to anon using (true);
