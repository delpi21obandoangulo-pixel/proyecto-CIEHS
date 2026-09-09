-- ============================================================================
-- CIEHS · Acceso por código — PARTE 3: EXECUTE de is_admin() para RLS
--
-- Las políticas RLS de administración evalúan ciehs.is_admin() CON LOS
-- PRIVILEGIOS DEL ROL QUE CONSULTA. En un endurecimiento anterior se revocó el
-- EXECUTE de is_admin() a anon/authenticated; el efecto colateral es que, al
-- entrar por código (rol anon), la política no puede ni evaluar la función y
-- toda escritura falla con:
--     ERROR 42501: permission denied for function is_admin
--
-- Conceder EXECUTE devuelve solo un booleano; no expone ningún dato. Es
-- imprescindible para que RLS funcione con el rol anon.
--
-- AISLAMIENTO: esquema ciehs. Idempotente.
-- ============================================================================
grant execute on function ciehs.is_admin() to anon, authenticated;

-- Retira la función de diagnóstico usada durante la depuración (si quedó).
drop function if exists ciehs.rol_actual();
