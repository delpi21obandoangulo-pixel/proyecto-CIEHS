-- =============================================================================
-- CIEHS · esquema dedicado "ciehs"
-- Instancia compartida kumxtheybmqbfixatnok (Seccion 1.4, opcion tolerada).
--
-- Aplicar de forma AISLADA (SQL Editor o psql). NO usar `supabase db push`:
-- el historial supabase_migrations.schema_migrations es global en esta
-- instancia y escribirlo contaminaria a los demas proyectos.
--
-- No se toca public, safary_kids ni ningun otro esquema. La unica referencia
-- externa son las FKs a auth.users, registro de identidades de la instancia.
-- Idempotente: se puede volver a ejecutar sin efectos secundarios.
-- =============================================================================

create schema if not exists ciehs;
grant usage on schema ciehs to anon, authenticated;

-- ---------------------------------------------------------------- admins ----
create table if not exists ciehs.admins (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  created_at   timestamptz not null default now()
);

-- security definer: las politicas necesitan consultar esta tabla aunque el
-- llamante no tenga permiso de lectura sobre ella. Solo devuelve un booleano
-- sobre el propio auth.uid(); no expone ninguna fila.
create or replace function ciehs.is_admin()
returns boolean language sql stable security definer
set search_path = ciehs, pg_temp as $fn$
  select exists (select 1 from ciehs.admins a where a.user_id = auth.uid());
$fn$;

revoke all on function ciehs.is_admin() from public;
grant execute on function ciehs.is_admin() to authenticated;

create or replace function ciehs.touch_updated_at()
returns trigger language plpgsql
set search_path = ciehs, pg_temp as $fn$
begin new.updated_at := now(); return new; end;
$fn$;

-- ----------------------------------------------------------- site_config ----
create table if not exists ciehs.site_config (
  id             smallint primary key default 1 check (id = 1),
  hero_title     text,
  hero_subtitle  text,
  kpi_cosecha_kg numeric(8,2) check (kpi_cosecha_kg >= 0),
  kpi_ahorro_pct smallint     check (kpi_ahorro_pct between 0 and 100),
  aviso          text,
  aviso_active   boolean not null default false,
  updated_at     timestamptz not null default now(),
  updated_by     uuid references auth.users(id)
);

-- --------------------------------------------------------------- modules ----
create table if not exists ciehs.modules (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  system     text not null,
  crop       text,
  ph_min     numeric(3,1) check (ph_min between 0 and 14),
  ph_max     numeric(3,1) check (ph_max between 0 and 14),
  ce_min     numeric(4,2) check (ce_min >= 0),
  ce_max     numeric(4,2) check (ce_max >= 0),
  status     text not null default 'activo',
  position   smallint not null default 0,
  published  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modules_ph_rango check (ph_min is null or ph_max is null or ph_min <= ph_max),
  constraint modules_ce_rango check (ce_min is null or ce_max is null or ce_min <= ce_max)
);

-- ---------------------------------------------------- telemetry_readings ----
create table if not exists ciehs.telemetry_readings (
  id           bigint generated always as identity primary key,
  module_id    uuid not null references ciehs.modules(id) on delete cascade,
  measured_at  timestamptz not null default now(),
  ph           numeric(3,1) check (ph between 0 and 14),
  ce           numeric(4,2) check (ce >= 0),
  water_temp_c numeric(4,1),
  notes        text,
  recorded_by  uuid references auth.users(id),
  created_at   timestamptz not null default now()
);
create index if not exists telemetry_modulo_fecha_idx
  on ciehs.telemetry_readings (module_id, measured_at desc);

-- -------------------------------------------------------- investigations ----
create table if not exists ciehs.investigations (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  title           text not null,
  question        text,
  hypothesis      text,
  var_independent text,
  var_dependent   text,
  method          text,
  status          text not null default 'en curso',
  position        smallint not null default 0,
  published       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ------------------------------------------------------------- resources ----
create table if not exists ciehs.resources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  level       text check (level in ('inicial','primaria','secundaria','todos')),
  area        text,
  kind        text,
  file_url    text,
  position    smallint not null default 0,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -------------------------------------------------------------- qr_codes ----
create table if not exists ciehs.qr_codes (
  id            uuid primary key default gen_random_uuid(),
  slot          smallint not null unique check (slot between 1 and 99),
  title         text not null,
  description   text,
  target_route  text not null check (target_route in (
                  'inicio','metodologia','investigaciones','equipos','modulos',
                  'trazabilidad','datos','juega','docentes','mural','eureka','contacto')),
  location_hint text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -------------------------------------------------------------- triggers ----
do $blk$
declare t text;
begin
  foreach t in array array['site_config','modules','investigations','resources','qr_codes'] loop
    execute format('drop trigger if exists touch_%1$s on ciehs.%1$I', t);
    execute format('create trigger touch_%1$s before update on ciehs.%1$I
                    for each row execute function ciehs.touch_updated_at()', t);
  end loop;
end $blk$;

-- ================================== RLS ======================================
alter table ciehs.admins             enable row level security;
alter table ciehs.site_config        enable row level security;
alter table ciehs.modules            enable row level security;
alter table ciehs.telemetry_readings enable row level security;
alter table ciehs.investigations     enable row level security;
alter table ciehs.resources          enable row level security;
alter table ciehs.qr_codes           enable row level security;

drop policy if exists admins_self_read on ciehs.admins;
create policy admins_self_read on ciehs.admins
  for select to authenticated using (user_id = auth.uid());

drop policy if exists site_config_lectura_publica on ciehs.site_config;
create policy site_config_lectura_publica on ciehs.site_config
  for select to anon, authenticated using (true);

drop policy if exists modules_lectura_publica on ciehs.modules;
create policy modules_lectura_publica on ciehs.modules
  for select to anon, authenticated using (published);

-- Solo se publican lecturas de modulos publicados: evita que la telemetria
-- filtre la existencia de un modulo que aun no se ha anunciado.
drop policy if exists telemetry_lectura_publica on ciehs.telemetry_readings;
create policy telemetry_lectura_publica on ciehs.telemetry_readings
  for select to anon, authenticated
  using (exists (select 1 from ciehs.modules m where m.id = module_id and m.published));

drop policy if exists investigations_lectura_publica on ciehs.investigations;
create policy investigations_lectura_publica on ciehs.investigations
  for select to anon, authenticated using (published);

drop policy if exists resources_lectura_publica on ciehs.resources;
create policy resources_lectura_publica on ciehs.resources
  for select to anon, authenticated using (published);

drop policy if exists qr_lectura_publica on ciehs.qr_codes;
create policy qr_lectura_publica on ciehs.qr_codes
  for select to anon, authenticated using (active);

-- Escritura: exige sesion iniciada Y figurar en ciehs.admins.
do $blk$
declare t text;
begin
  foreach t in array array['site_config','modules','telemetry_readings',
                           'investigations','resources','qr_codes'] loop
    execute format('drop policy if exists %1$s_escritura_admin on ciehs.%1$I', t);
    execute format('create policy %1$s_escritura_admin on ciehs.%1$I
                    for all to authenticated
                    using (ciehs.is_admin()) with check (ciehs.is_admin())', t);
  end loop;
end $blk$;

-- ============================== privilegios ==================================
grant select on all tables in schema ciehs to anon, authenticated;
revoke select on ciehs.admins from anon;
grant insert, update, delete on
  ciehs.site_config, ciehs.modules, ciehs.telemetry_readings,
  ciehs.investigations, ciehs.resources, ciehs.qr_codes
  to authenticated;
grant usage, select on all sequences in schema ciehs to authenticated;
alter default privileges in schema ciehs grant select on tables to anon, authenticated;

-- =============================================================================
-- Columnas vetadas al rol anonimo
--
-- site_config.updated_by y telemetry_readings.recorded_by guardan el uuid de
-- auth de una persona real. En una instancia compartida ese mismo uuid aparece
-- en otros proyectos, asi que publicarlo permitiria correlacionar identidades.
--
-- Un GRANT a nivel de tabla cubre TODAS las columnas y no se puede recortar con
-- un REVOKE por columna: hay que retirar el permiso de tabla y conceder solo
-- las columnas publicas. Por eso el cliente consulta columnas explicitas y
-- nunca "*" sobre estas dos tablas.
-- =============================================================================

revoke select on ciehs.telemetry_readings from anon;
grant select (id, module_id, measured_at, ph, ce, water_temp_c, notes, created_at)
  on ciehs.telemetry_readings to anon;

revoke select on ciehs.site_config from anon;
grant select (id, hero_title, hero_subtitle, kpi_cosecha_kg, kpi_ahorro_pct,
              aviso, aviso_active, updated_at)
  on ciehs.site_config to anon;

-- =============================================================================
-- Endurecimiento posterior a la auditoria
--
-- 1. AUTORIA POR EL SERVIDOR. Antes el navegador enviaba recorded_by y
--    updated_by, de modo que una cuenta de administracion podia atribuir una
--    lectura o una edicion a otra persona. Ahora los pone el servidor y se
--    retira el permiso de escribir esas columnas.
--
--    Recordatorio: un GRANT a nivel de TABLA cubre todas las columnas y no se
--    recorta con un REVOKE por columna. Hay que retirar el permiso de tabla y
--    conceder solo las columnas escribibles.
--
-- 2. Borrar la configuracion del portal no tiene caso de uso legitimo.
--
-- 3. Limites de tamano y coherencia: defensa en profundidad frente a una cuenta
--    comprometida o a un error de copiar y pegar.
-- =============================================================================

alter table ciehs.telemetry_readings alter column recorded_by set default auth.uid();
alter table ciehs.site_config        alter column updated_by  set default auth.uid();

revoke insert, update on ciehs.telemetry_readings from authenticated;
grant insert (module_id, measured_at, ph, ce, water_temp_c, notes),
      update (module_id, measured_at, ph, ce, water_temp_c, notes)
  on ciehs.telemetry_readings to authenticated;

revoke insert, update, delete on ciehs.site_config from authenticated;
grant update (hero_title, hero_subtitle, kpi_cosecha_kg, kpi_ahorro_pct, aviso, aviso_active)
  on ciehs.site_config to authenticated;

-- Un DEFAULT solo actua al insertar: para que un UPDATE registre quien edito,
-- la marca la pone el mismo trigger que fecha la fila.
create or replace function ciehs.touch_site_config()
returns trigger language plpgsql
set search_path = ciehs, pg_temp as $fn$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$fn$;

drop trigger if exists touch_site_config on ciehs.site_config;
create trigger touch_site_config before update on ciehs.site_config
  for each row execute function ciehs.touch_site_config();

alter table ciehs.site_config
  drop constraint if exists site_config_largos,
  add constraint site_config_largos check (
    coalesce(length(hero_title),0)    <= 200 and
    coalesce(length(hero_subtitle),0) <= 400 and
    coalesce(length(aviso),0)         <= 400);

alter table ciehs.telemetry_readings
  drop constraint if exists telemetry_fecha_razonable,
  add constraint telemetry_fecha_razonable check (
    measured_at <= now() + interval '1 day' and
    measured_at >= timestamptz '2024-01-01');

alter table ciehs.investigations
  drop constraint if exists investigations_largos,
  add constraint investigations_largos check (
    length(code) <= 40 and length(title) <= 500 and
    coalesce(length(question),0)   <= 800 and
    coalesce(length(hypothesis),0) <= 800 and
    coalesce(array_length(tags,1),0) <= 8);

-- =============================================================================
-- Endurecimiento posterior al pentest (auto-evaluacion de ciberseguridad)
--
-- La app NUNCA lee ciehs.admins directamente: comprueba con is_admin(), que es
-- SECURITY DEFINER y por tanto no depende de los permisos del llamante. Se
-- retira el SELECT de authenticated y la politica de auto-lectura: la tabla
-- queda accesible solo para el servidor. Elimina la superficie por la que un
-- autenticado podia ejecutar count(*) sobre admins (aunque solo recibiera 0).
-- =============================================================================

revoke select on ciehs.admins from authenticated;
drop policy if exists admins_self_read on ciehs.admins;
