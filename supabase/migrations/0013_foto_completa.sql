-- ============================================================
--  CASTA BURGER — la foto completa, para verla en grande
--
--  La tarjeta del menú muestra la foto en un cuadro de 96 px, así que lo que
--  hay guardado en `foto_url` es un recorte cuadrado. Las fotos del fotógrafo
--  son verticales y con reflejo: el recorte se come justo eso.
--
--  Ahora, al tocar la tarjeta, se abre la foto entera. Como no es el mismo
--  archivo, hace falta una columna aparte en vez de reusar `foto_url`.
--
--  Puede quedar en null aunque haya miniatura, y está bien: sin foto completa
--  la tarjeta no se ofrece como tocable. Es mejor eso que prometer una foto
--  que no abre.
--
--  Los archivos ya están en el repo, en `public/productos/`. Como todas las
--  rutas de fotos, son del sitio y NUNCA de otro dominio: next/image rechaza
--  dominios no declarados y tumbaría la página entera.
--
--  Segura de correr de nuevo.
-- ============================================================

alter table menu_items add column if not exists foto_completa_url text;

update menu_items set foto_completa_url = '/productos/cheese-burger-completa.webp'
 where slug = 'cheese-burger';

update menu_items set foto_completa_url = '/productos/casta-burger-completa.webp'
 where slug = 'casta-burger';

update menu_items set foto_completa_url = '/productos/casta-smash-completa.webp'
 where slug = 'casta-smash';

update menu_items set foto_completa_url = '/productos/servicio-papas-completa.webp'
 where slug = 'servicio-papas';
