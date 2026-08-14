-- ============================================================
--  CASTA BURGER — las fotos de las promos
--
--  Van con recorte ancho (16:9) y no cuadrado como las del menú. Estas fotos
--  son composiciones horizontales —dos hamburguesas lado a lado, tres en
--  fila— y lo que comunican ES la cantidad. Un recorte cuadrado les cortaría
--  las de los extremos y la promo mostraría menos de lo que vende.
--
--  Por eso en la tarjeta van de banner ancho arriba, no de miniatura al
--  costado. Los archivos ya están en el repo, en `public/productos/`.
--
--  Para rehacerlas:
--    node scripts/fotos.mjs "<la foto>" <slug> ancha
--
--  Segura de correr de nuevo.
-- ============================================================

update menu_items
   set foto_url          = '/productos/promo-2x1-cheese.webp',
       foto_completa_url = '/productos/promo-2x1-cheese-completa.webp'
 where slug = 'promo-2x1-cheese';

update menu_items
   set foto_url          = '/productos/promo-2-casta-regalo.webp',
       foto_completa_url = '/productos/promo-2-casta-regalo-completa.webp'
 where slug = 'promo-2-casta-regalo';

update menu_items
   set foto_url          = '/productos/promo-3-cheese.webp',
       foto_completa_url = '/productos/promo-3-cheese-completa.webp'
 where slug = 'promo-3-cheese';
