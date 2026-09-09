-- ============================================================================
-- CIEHS · Acceso por código — PARTE 2: permisos de escritura para el rol anon
--
-- CONTEXTO
-- --------
-- La entrada por código NO usa sesión (el inicio anónimo está deshabilitado en
-- la instancia). Por tanto las peticiones del panel viajan con el rol `anon` y
-- la cabecera X-CIEHS-Code. Con la PARTE 1 (db/10) ya aplicada, is_admin() valida
-- esa cabecera y devuelve true. Pero faltan DOS cosas para que anon pueda escribir:
--
--   1. Las políticas de administración están declaradas solo para el rol
--      `authenticated`. Las políticas RLS son POR ROL: si no incluyen a anon, a
--      una petición anon no se le aplica ninguna política de escritura y RLS la
--      niega por defecto. -> Se extienden a `anon, authenticated`.
--   2. El rol anon no tiene privilegio de tabla (INSERT/UPDATE/DELETE) sobre las
--      tablas de administración. Postgres comprueba el GRANT ANTES que la RLS.
--      -> Se concede el DML a anon.
--
-- POR QUÉ ES SEGURO
-- ----------------
-- is_admin() sigue siendo la ÚNICA puerta. USING/WITH CHECK de cada política de
-- administración es ciehs.is_admin(); sin la cabecera con el código correcto,
-- is_admin() devuelve false y RLS bloquea toda escritura, tenga o no el GRANT.
-- Las políticas públicas de alta (aportes/comentarios/pedidos/registros/
-- resultados con published=false, status='pendiente', etc.) NO se tocan: el
-- público sigue pudiendo enviar sus aportes y nada más. Es el patrón estándar de
-- Supabase: grants amplios + RLS como control real.
--
-- AISLAMIENTO: todo dentro del esquema `ciehs`. No toca public ni safary_kids.
-- Idempotente.
-- ============================================================================

-- 1) Extender cada política de administración (is_admin()) también al rol anon.
alter policy aportes_admin_todo                       on ciehs.aportes              to anon, authenticated;
alter policy community_comments_escritura_admin       on ciehs.community_comments   to anon, authenticated;
alter policy crop_log_escritura_admin                 on ciehs.crop_log             to anon, authenticated;
alter policy evidencias_admin_todo                    on ciehs.evidencias           to anon, authenticated;
alter policy field_notes_escritura_admin              on ciehs.field_notes          to anon, authenticated;
alter policy investigations_escritura_admin           on ciehs.investigations       to anon, authenticated;
alter policy modules_escritura_admin                  on ciehs.modules              to anon, authenticated;
alter policy orders_escritura_admin                   on ciehs.orders               to anon, authenticated;
alter policy lineas_admin_todo                        on ciehs.pedido_lineas        to anon, authenticated;
alter policy productos_admin_todo                     on ciehs.productos            to anon, authenticated;
alter policy qr_codes_escritura_admin                 on ciehs.qr_codes             to anon, authenticated;
alter policy registros_admin_todo                     on ciehs.registros_campo      to anon, authenticated;
alter policy resources_escritura_admin                on ciehs.resources            to anon, authenticated;
alter policy resultados_admin_todo                    on ciehs.resultados           to anon, authenticated;
alter policy site_config_escritura_admin              on ciehs.site_config          to anon, authenticated;
alter policy telemetry_readings_escritura_admin       on ciehs.telemetry_readings   to anon, authenticated;
alter policy transparency_entries_escritura_admin     on ciehs.transparency_entries to anon, authenticated;

-- 2) Conceder el DML al rol anon (RLS lo sigue gobernando por is_admin()).
grant insert, update, delete on ciehs.aportes              to anon;
grant insert, update, delete on ciehs.community_comments   to anon;
grant insert, update, delete on ciehs.crop_log             to anon;
grant insert, update, delete on ciehs.evidencias           to anon;
grant insert, update, delete on ciehs.field_notes          to anon;
grant insert, update, delete on ciehs.investigations       to anon;
grant insert, update, delete on ciehs.modules              to anon;
grant insert, update, delete on ciehs.orders               to anon;
grant insert, update, delete on ciehs.pedido_lineas        to anon;
grant insert, update, delete on ciehs.productos            to anon;
grant insert, update, delete on ciehs.qr_codes             to anon;
grant insert, update, delete on ciehs.registros_campo      to anon;
grant insert, update, delete on ciehs.resources            to anon;
grant insert, update, delete on ciehs.resultados           to anon;
grant insert, update, delete on ciehs.site_config          to anon;
grant insert, update, delete on ciehs.telemetry_readings   to anon;
grant insert, update, delete on ciehs.transparency_entries to anon;

-- Comprobación tras aplicar (debe permitir la escritura SOLO con la cabecera):
--   set role anon;
--   select set_config('request.headers','{"x-ciehs-code":"12435687"}',true);
--   select ciehs.is_admin();   -- true
--   reset role;
