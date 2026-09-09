-- ============================================================================
-- CIEHS · Freno de tasa para el alta anónima (2026-09-09)
--
-- Idempotente. NO usar `supabase db push` ni `apply_migration`.
--
-- CONTRAMEDIDA al hallazgo A17 del pentest de septiembre: un anónimo podía
-- insertar 10 filas en 2 segundos sin freno alguno en las cinco tablas de alta
-- pública (comentarios, pedidos, registros de campo, resultados, aportes). Eso
-- permite inundar la cola de moderación y —vía aportes— consumir la cuota de
-- almacenamiento del plan gratuito.
--
-- No se usa la IP porque RLS no la ve. Se frena por RITMO GLOBAL de la tabla:
-- máximo 12 altas por minuto, un techo que un formulario escolar real nunca
-- alcanza y un script de inundación sí. El administrador autenticado queda
-- exento (is_admin() lee auth.uid() del JWT).
--
-- LÍMITES HONESTOS: no corta el flood al 100 %. Lo reduce de ~300/min a 12/min
-- y se auto-recupera cada minuto. Para el residuo (subida rápida de objetos
-- huérfanos al bucket, que este trigger no cubre porque vive en storage.objects,
-- tabla compartida) ver el informe de análisis: la vía correcta es un
-- CAPTCHA/Turnstile o una limpieza periódica de huérfanos, no un trigger sobre
-- una tabla que Aura y Safari también usan.
--
-- Verificado en produccion 2026-09-09:
--   · anónimo: 20 intentos -> 12 aceptados (201), 8 frenados (400)
--   · admin autenticado (JWT simulado): 15 de 15 aceptados, sin freno
-- ============================================================================

create or replace function ciehs.frenar_alta_masiva()
returns trigger
language plpgsql
security definer
set search_path = ciehs, pg_temp
as $$
declare
  max_por_minuto constant int := 12;
  recientes int;
begin
  if ciehs.is_admin() then
    return new;
  end if;

  execute format(
    'select count(*) from ciehs.%I where created_at > now() - interval ''1 minute''',
    tg_table_name
  ) into recientes;

  if recientes >= max_por_minuto then
    raise exception 'Demasiadas solicitudes en poco tiempo. Espera un minuto y vuelve a intentarlo.';
  end if;

  return new;
end $$;

comment on function ciehs.frenar_alta_masiva is
  'Contramedida anti-inundacion (pentest 2026-09, hallazgo A17). 12 altas/min por tabla en alta anonima; admin exento.';

drop trigger if exists frenar_flood on ciehs.community_comments;
create trigger frenar_flood before insert on ciehs.community_comments
  for each row execute function ciehs.frenar_alta_masiva();

drop trigger if exists frenar_flood on ciehs.orders;
create trigger frenar_flood before insert on ciehs.orders
  for each row execute function ciehs.frenar_alta_masiva();

drop trigger if exists frenar_flood on ciehs.registros_campo;
create trigger frenar_flood before insert on ciehs.registros_campo
  for each row execute function ciehs.frenar_alta_masiva();

drop trigger if exists frenar_flood on ciehs.resultados;
create trigger frenar_flood before insert on ciehs.resultados
  for each row execute function ciehs.frenar_alta_masiva();

drop trigger if exists frenar_flood on ciehs.aportes;
create trigger frenar_flood before insert on ciehs.aportes
  for each row execute function ciehs.frenar_alta_masiva();

-- Endurecimiento (advisor 0028): una función de disparador no debe ser
-- invocable como RPC. Revocar EXECUTE no afecta al disparador — Postgres no
-- comprueba EXECUTE al ejecutar un trigger. Verificado: el RPC directo pasa a
-- 404 y el trigger sigue frenando (12 aceptadas, resto topadas).
revoke execute on function ciehs.frenar_alta_masiva() from anon, authenticated, public;
