-- ============================================================
--  CASTA BURGER — las fotos reales de los productos
--
--  Hasta acá las tarjetas mostraban un dibujo de línea: un placeholder que se
--  puso para no dejar el hueco vacío. Llegaron las fotos del fotógrafo, así
--  que las cuatro tarjetas con foto propia pasan a mostrarla.
--
--  Los archivos ya están en el repo, en `public/productos/`. `foto_url` es una
--  ruta del sitio, NUNCA una URL de otro dominio: next/image rechaza dominios
--  no declarados y tumbaría la página entera.
--
--  Para agregar una foto nueva:
--    node scripts/fotos.mjs "<la foto>" <slug>
--  y después un update como los de acá abajo.
--
--  Segura de correr de nuevo.
-- ============================================================

update menu_items set foto_url = '/productos/cheese-burger.webp'
 where slug = 'cheese-burger';

update menu_items set foto_url = '/productos/casta-burger.webp'
 where slug = 'casta-burger';

update menu_items set foto_url = '/productos/casta-smash.webp'
 where slug = 'casta-smash';

update menu_items set foto_url = '/productos/servicio-papas.webp'
 where slug = 'servicio-papas';
