-- ============================================================
--  CASTA BURGER — la cuota mensual del servicio
--
--  El sistema lo opera TaquionLabs a cambio de una cuota mensual que vence
--  cada día 15. Si pasa la fecha sin pago registrado, la web del menú cae en
--  mantenimiento y el panel muestra el aviso de cobro — automático, calculado
--  contra la fecha, sin que nadie apague nada a mano.
--
--  No se borra ni se bloquea ningún dato: pedidos, menú, recetas, inventario y
--  costos quedan intactos. Se tapa el acceso, y al registrar el pago vuelve.
--
--  El control (registrar el pago, suspender) lo hace TaquionLabs desde afuera:
--  esta app solo LEE la fecha, no la puede tocar. Hoy la mueve TaquionLabs con
--  su llave secreta; más adelante, una consola independiente. La app del
--  cliente no carga ninguna palanca, que es lo más seguro.
--
--  Segura de correr de nuevo: no pisa una fecha ya cargada.
-- ============================================================

-- ------------------------------------------------------------
--  1) HASTA CUÁNDO ESTÁ PAGO
--
--  Una sola fila. `pagado_hasta` es el último día cubierto: con '2026-09-15'
--  el servicio funciona todo el 15 y cae a las 00:00 del 16, hora de Caracas.
--
--  Nadie de la app la puede leer ni escribir: RLS activo, ninguna política, y
--  los permisos revocados. Solo la llave secreta (service_role) la mueve.
-- ------------------------------------------------------------
create table if not exists suscripcion (
  id           boolean primary key default true check (id),
  pagado_hasta date not null,
  updated_at   timestamptz not null default now()
);

insert into suscripcion (id, pagado_hasta)
values (true, '2026-09-15')
on conflict (id) do nothing;

alter table suscripcion enable row level security;
revoke all on suscripcion from anon, authenticated;

-- ------------------------------------------------------------
--  2) ¿ESTÁ VENCIDA?
--
--  La fecha de hoy se calcula acá, en America/Caracas, y no en el servidor de
--  la app: Vercel corre en UTC, y a las 8 PM de Caracas ya es "mañana" allá.
--  Calculado del lado equivocado, el corte caería cuatro horas antes.
--
--  Sin fila, devuelve false. Mejor que un olvido deje el servicio andando a
--  que un error lo tumbe.
-- ------------------------------------------------------------
create or replace function suscripcion_vencida()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select (now() at time zone 'America/Caracas')::date > pagado_hasta
       from suscripcion
      where id),
    false
  );
$$;

revoke all on function suscripcion_vencida() from public, anon, authenticated;
grant execute on function suscripcion_vencida() to service_role;

notify pgrst, 'reload schema';

-- ------------------------------------------------------------
--  CÓMO SE MUEVE (TaquionLabs, con la llave secreta):
--
--    activar hasta el 15 que viene:
--      update suscripcion set pagado_hasta = '2026-10-15', updated_at = now();
--    suspender ahora:
--      update suscripcion set pagado_hasta = current_date - 1, updated_at = now();
--
--  La web y el panel reaccionan en menos de un minuto.
-- ------------------------------------------------------------
