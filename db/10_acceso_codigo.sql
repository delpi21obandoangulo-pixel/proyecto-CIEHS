-- ============================================================================
-- CIEHS · Acceso a administración por CÓDIGO (sin correo ni contraseña)
--
-- POR QUÉ ASÍ
-- -----------
-- El panel de administración escribe directamente sobre las tablas del esquema
-- ciehs (portada, investigaciones, estados de pedido, publicar/ocultar, etc.).
-- Todas esas escrituras están protegidas por RLS y la política llama a
-- ciehs.is_admin(). Un simple candado en el navegador NO sirve: la base seguiría
-- devolviendo 401 y el panel no guardaría nada. Por eso el código se valida en
-- el SERVIDOR.
--
-- CÓMO
-- ----
-- PostgREST expone las cabeceras de cada petición en el GUC `request.headers`.
-- El portal, tras teclear el código, manda en cada petición la cabecera
-- X-CIEHS-Code. is_admin() la lee y la compara (por hash sha256) con el código
-- guardado. Si coincide, la sesión anónima queda autorizada a escribir y TODAS
-- las políticas RLS existentes siguen valiendo sin tocarlas.
--
-- Se conserva además el camino histórico (usuario autenticado en ciehs.admins),
-- por si algún día se vuelve a usar una cuenta con sesión.
--
-- AISLAMIENTO: todo vive en el esquema `ciehs`. No toca public ni safary_kids.
-- Idempotente: se puede volver a ejecutar sin romper nada.
-- ============================================================================

-- 1) Config del código de acceso (una sola fila). Solo guarda el hash sha256,
--    nunca el código en claro. Cerrada a anon/authenticated: la lee únicamente
--    is_admin()/verificar_codigo (SECURITY DEFINER, que saltan RLS).
create table if not exists ciehs.acceso_config (
  id           smallint primary key default 1,
  codigo_hash  text not null,
  actualizado  timestamptz not null default now(),
  constraint acceso_config_una_fila check (id = 1)
);

alter table ciehs.acceso_config enable row level security;
revoke all on ciehs.acceso_config from anon, authenticated, public;

-- 2) Fijar el código de acceso.
--
--    !! EL CÓDIGO NO SE ESCRIBE AQUÍ. Este archivo está en un repositorio
--    PÚBLICO: cualquiera que lo lea obtiene acceso de administración enviando
--    la cabecera X-CIEHS-Code. Hasta el 2026-09-10 el código estuvo escrito en
--    claro en esta misma línea, y por eso hubo que rotarlo.
--
--    El código vigente vive en la bóveda local (C:\Users\delpi\.boveda), nunca
--    en el repositorio. Para fijar uno nuevo se ejecuta esta sentencia a mano,
--    sustituyendo el marcador, y NO se guarda el resultado en el repositorio:
--
--      insert into ciehs.acceso_config (id, codigo_hash, actualizado)
--      values (1, encode(extensions.digest('<CÓDIGO>','sha256'),'hex'), now())
--      on conflict (id) do update
--        set codigo_hash = excluded.codigo_hash,
--            actualizado = now();
--
--    Solo se guarda el hash sha256; el código en claro no toca la base.

-- 3) is_admin(): admite el camino histórico (usuario en ciehs.admins) O un
--    código válido en la cabecera X-CIEHS-Code. Al resolverse aquí dentro,
--    ninguna política RLS necesita cambios.
create or replace function ciehs.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path to 'ciehs','pg_temp'
as $$
declare
  hdrs           json;
  codigo         text;
  hash_guardado  text;
begin
  -- camino histórico: sesión autenticada listada en ciehs.admins
  if auth.uid() is not null
     and exists (select 1 from ciehs.admins a where a.user_id = auth.uid()) then
    return true;
  end if;

  -- camino por código: cabecera X-CIEHS-Code de la petición
  begin
    hdrs := current_setting('request.headers', true)::json;
  exception when others then
    hdrs := null;
  end;

  if hdrs is not null then
    codigo := hdrs ->> 'x-ciehs-code';
    if codigo is not null and length(codigo) > 0 then
      select c.codigo_hash into hash_guardado from ciehs.acceso_config c limit 1;
      if hash_guardado is not null
         and encode(extensions.digest(codigo, 'sha256'), 'hex') = hash_guardado then
        return true;
      end if;
    end if;
  end if;

  return false;
end
$$;

-- 4) verificar_codigo(): el modal la llama para decir "sí / no" sin tener que
--    intentar una escritura. Devuelve solo un booleano; nunca revela el código.
create or replace function ciehs.verificar_codigo(p_codigo text)
returns boolean
language sql
stable
security definer
set search_path to 'ciehs','pg_temp'
as $$
  select exists (
    select 1 from ciehs.acceso_config c
    where c.codigo_hash = encode(extensions.digest(coalesce(p_codigo,''), 'sha256'), 'hex')
  );
$$;

revoke all on function ciehs.verificar_codigo(text) from public;
grant  execute on function ciehs.verificar_codigo(text) to anon, authenticated;

-- Comprobación rápida (debe devolver true / false):
--   select ciehs.verificar_codigo('<CÓDIGO>');  -- true
--   select ciehs.verificar_codigo('000');        -- false
