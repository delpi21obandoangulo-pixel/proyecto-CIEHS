-- ============================================================================
-- CIEHS · Endurecimiento del acceso por codigo (2026-09-13)
--
-- Aplicar de forma AISLADA (SQL Editor o psql). NO usar `supabase db push` ni
-- `apply_migration`: el historial supabase_migrations.schema_migrations es
-- global en esta instancia compartida (Seccion 1.4 de las directrices).
--
-- AISLAMIENTO: esquema ciehs. La unica lectura externa es vault.decrypted_secrets,
-- que es infraestructura de la plataforma y no datos de otro proyecto.
-- Idempotente.
--
-- ============================== LOS TRES FALLOS =============================
--
-- H1. ORACULO DE FUERZA BRUTA SIN FRENO (grave)
--     ciehs.verificar_codigo(text) esta concedida a `anon` y no tiene limite de
--     intentos. Cualquiera con la clave publicable -que viaja en el navegador a
--     proposito- puede llamarla en bucle hasta acertar. Y acertar el codigo no
--     da "algo de acceso": da EL acceso, porque is_admin() es la unica puerta
--     de todas las politicas de escritura del portal.
--
-- H2. HASH DESNUDO (medio)
--     codigo_hash es un sha256 de una sola vuelta y sin sal ni pimienta. Si esa
--     fila se filtra alguna vez -un volcado, una politica mal puesta, una copia
--     de seguridad mal guardada-, un codigo corto cae en segundos con una tabla
--     precalculada. El hash no es un secreto, pero tampoco debe ser un recibo.
--
-- H3. CODIGO CORTO PERMITIDO (grave, y es la causa de que H1 importe)
--     Nada impedia fijar un PIN de ocho digitos. 10^8 se recorre entero muy
--     rapido, y contra el camino de la CABECERA ni siquiera hay freno posible:
--     is_admin() se evalua dentro de cada politica RLS, en cada consulta, y
--     ponerle un contador de intentos ahi seria escribir en disco en cada fila
--     leida del portal. Es decir: el freno de H1 quita el oraculo COMODO, pero
--     lo unico que hace el ataque inviable de verdad es que el codigo tenga
--     entropia. Por eso fijar_codigo() lo exige y no se puede saltar.
--
-- ORDEN DE APLICACION SEGURO
-- --------------------------
-- Este archivo NO invalida el codigo vigente al aplicarse: sin pimienta en el
-- Vault, hash_codigo() calcula exactamente el mismo sha256 de antes. El cambio
-- de hash solo ocurre cuando se añade la pimienta, y entonces hay que volver a
-- fijar el codigo. Secuencia recomendada:
--
--   1. Aplicar este archivo.                (nada se rompe)
--   2. Crear la pimienta en el Vault.       (ver el paso 2 mas abajo)
--   3. select ciehs.fijar_codigo('<CODIGO NUEVO, LARGO Y ALEATORIO>');
--   4. Guardar ese codigo en la boveda local y en ningun otro sitio.
-- ============================================================================

-- ==================== 1) Pimienta: el secreto fuera de la tabla ============
-- La pimienta NO se guarda junto al hash. Vive en el Vault de Supabase, que se
-- cifra con una clave que no esta en la base de datos. Asi, quien consiga leer
-- ciehs.acceso_config se lleva un hash que no puede atacar sin ademas romper el
-- Vault.
--
-- Si el secreto no existe, la funcion devuelve cadena vacia y el hash queda
-- como estaba. Eso es deliberado: permite aplicar este archivo sin dejar fuera
-- a nadie, y decidir despues cuando rotar.
--
-- Crear el secreto (una sola vez, con un valor largo y aleatorio):
--   select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'),
--                              'ciehs_codigo_pepper',
--                              'Pimienta del codigo de administracion del CIEHS');
create or replace function ciehs.pimienta()
returns text
language plpgsql
stable
security definer
set search_path to 'ciehs', 'vault', 'extensions', 'pg_temp'
as $$
declare p text;
begin
  begin
    select decrypted_secret into p
      from vault.decrypted_secrets
     where name = 'ciehs_codigo_pepper'
     limit 1;
  exception when others then
    -- El Vault puede no estar disponible en un entorno de pruebas. Que falte
    -- la pimienta degrada la defensa en profundidad; que reviente la funcion
    -- dejaria al coordinador sin poder entrar. Se elige lo primero.
    p := null;
  end;
  return coalesce(p, '');
end
$$;

revoke all on function ciehs.pimienta() from public, anon, authenticated;

-- ==================== 2) Un solo sitio donde se calcula el hash ===========
-- Antes la formula estaba copiada en is_admin(), en verificar_codigo() y en el
-- comentario que explicaba como fijar el codigo: tres copias que podian
-- divergir, y divergir aqui significa quedarse fuera sin saber por que.
create or replace function ciehs.hash_codigo(p_codigo text)
returns text
language sql
stable
security definer
set search_path to 'ciehs', 'extensions', 'pg_temp'
as $$
  select encode(
           extensions.digest(ciehs.pimienta() || coalesce(p_codigo, ''), 'sha256'),
           'hex');
$$;

revoke all on function ciehs.hash_codigo(text) from public, anon, authenticated;

-- ==================== 3) Registro de intentos (para el freno) =============
-- Solo guarda CUANDO se intento, nunca QUE se intento: registrar el codigo
-- tecleado convertiria el log de seguridad en el peor sitio del sistema.
create table if not exists ciehs.acceso_intentos (
  id       bigint generated always as identity primary key,
  ocurrido timestamptz not null default now(),
  acerto   boolean not null
);

create index if not exists acceso_intentos_ocurrido_idx
  on ciehs.acceso_intentos (ocurrido desc);

alter table ciehs.acceso_intentos enable row level security;
revoke all on ciehs.acceso_intentos from anon, authenticated, public;

-- ==================== 4) verificar_codigo() con freno =====================
-- LIMITE HONESTO, y conviene tenerlo escrito:
--
--   · El freno es GLOBAL, no por IP, porque RLS no ve la IP (es la misma
--     limitacion que ya asumio db/09_antiflood.sql).
--   · Un global significa que alguien puede quemar los diez intentos y dejar
--     al coordinador esperando quince minutos. Se acepta: el coordinador
--     conoce el codigo y acierta a la primera, y un acierto LIMPIA el contador.
--     Quince minutos de espera en el peor caso es mejor que un oraculo abierto.
--   · Esto NO frena el camino de la cabecera (is_admin()). Ahi no se puede
--     poner contador sin escribir en disco en cada consulta del portal. Lo que
--     hace inviable ese camino es la entropia del codigo, que exige el paso 5.
create or replace function ciehs.verificar_codigo(p_codigo text)
returns boolean
language plpgsql
volatile
security definer
set search_path to 'ciehs', 'extensions', 'pg_temp'
as $$
declare
  max_intentos  constant int      := 10;
  ventana       constant interval := interval '15 minutes';
  recientes     int;
  hash_guardado text;
  ok            boolean;
begin
  select count(*) into recientes
    from ciehs.acceso_intentos
   where ocurrido > now() - ventana
     and not acerto;

  if recientes >= max_intentos then
    raise exception 'Demasiados intentos fallidos. Espera quince minutos antes de volver a probar.'
      using errcode = '55000';
  end if;

  select c.codigo_hash into hash_guardado from ciehs.acceso_config c limit 1;
  ok := hash_guardado is not null
        and hash_guardado = ciehs.hash_codigo(p_codigo);

  insert into ciehs.acceso_intentos (acerto) values (ok);

  -- Un acierto limpia los fallos: el coordinador que se equivoco dos veces y
  -- acerto a la tercera no arrastra un contador a medio gastar.
  if ok then
    delete from ciehs.acceso_intentos where not acerto;
  end if;

  -- Higiene: el registro no necesita memoria larga.
  delete from ciehs.acceso_intentos where ocurrido < now() - interval '1 day';

  return ok;
end
$$;

revoke all on function ciehs.verificar_codigo(text) from public;
grant  execute on function ciehs.verificar_codigo(text) to anon, authenticated;

-- ==================== 5) fijar_codigo(): entropia obligatoria =============
-- Es la pieza que de verdad cierra H3. Mientras fijar el codigo fuera un
-- `insert` a mano, nada impedia volver a poner un PIN de ocho digitos la
-- proxima vez que alguien rotara con prisa.
--
-- Doce caracteres y tres familias distintas dejan el espacio de busqueda muy
-- por encima de lo que se recorre por fuerza bruta contra una API, y ademas
-- descarta el error mas comun, que es reutilizar un numero corto memorizable.
-- Lo memorizable no hace falta: el codigo vive en la boveda local.
create or replace function ciehs.fijar_codigo(p_codigo text)
returns text
language plpgsql
volatile
security definer
set search_path to 'ciehs', 'extensions', 'pg_temp'
as $$
declare
  familias int := 0;
begin
  if p_codigo is null or char_length(p_codigo) < 12 then
    raise exception 'El codigo debe tener al menos 12 caracteres.';
  end if;
  if p_codigo ~ '[a-z]' then familias := familias + 1; end if;
  if p_codigo ~ '[A-Z]' then familias := familias + 1; end if;
  if p_codigo ~ '[0-9]' then familias := familias + 1; end if;
  if p_codigo ~ '[^a-zA-Z0-9]' then familias := familias + 1; end if;
  if familias < 3 then
    raise exception 'El codigo debe combinar al menos tres de: minusculas, mayusculas, digitos y simbolos.';
  end if;

  insert into ciehs.acceso_config (id, codigo_hash, actualizado)
  values (1, ciehs.hash_codigo(p_codigo), now())
  on conflict (id) do update
    set codigo_hash = excluded.codigo_hash,
        actualizado = now();

  delete from ciehs.acceso_intentos;

  return 'Codigo fijado. Guardalo en la boveda local y en ningun otro sitio.';
end
$$;

revoke all on function ciehs.fijar_codigo(text) from public, anon, authenticated;

-- ==================== 6) is_admin() usa el mismo hash =====================
-- Identica a la de db/10 salvo en que delega el calculo del hash. Se reescribe
-- entera y no por partes porque es la funcion que gobierna TODAS las politicas
-- de escritura: conviene poder leerla de arriba abajo en un solo sitio.
create or replace function ciehs.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path to 'ciehs', 'extensions', 'pg_temp'
as $$
declare
  hdrs          json;
  codigo        text;
  hash_guardado text;
begin
  -- camino historico: sesion autenticada listada en ciehs.admins
  if auth.uid() is not null
     and exists (select 1 from ciehs.admins a where a.user_id = auth.uid()) then
    return true;
  end if;

  -- camino por codigo: cabecera X-CIEHS-Code de la peticion
  begin
    hdrs := current_setting('request.headers', true)::json;
  exception when others then
    hdrs := null;
  end;

  if hdrs is null then
    return false;
  end if;

  codigo := hdrs ->> 'x-ciehs-code';
  if codigo is null or length(codigo) = 0 then
    return false;
  end if;

  select c.codigo_hash into hash_guardado from ciehs.acceso_config c limit 1;
  return hash_guardado is not null
         and hash_guardado = ciehs.hash_codigo(codigo);
end
$$;

grant execute on function ciehs.is_admin() to anon, authenticated;

-- ==================== 7) comprobaciones ===================================
-- Tras aplicar, y ANTES de rotar nada, el codigo vigente debe seguir valiendo
-- (porque sin pimienta el hash no cambia):
--   select ciehs.verificar_codigo('<CODIGO VIGENTE>');   -- true
--   select ciehs.verificar_codigo('000');                -- false
--
-- El freno se comprueba fallando once veces seguidas: la undecima debe dar
--   ERROR 55000: Demasiados intentos fallidos...
-- y despues, con el codigo bueno, hay que esperar la ventana o limpiar a mano:
--   delete from ciehs.acceso_intentos;
--
-- La entropia se comprueba intentando fijar un PIN corto, que debe fallar:
--   select ciehs.fijar_codigo('12345678');   -- ERROR: al menos 12 caracteres
