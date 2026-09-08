-- =============================================================================
-- CIEHS · ampliacion 2026 — infraestructura real y secciones nuevas
--
-- Aplica sobre el esquema dedicado "ciehs" de la instancia compartida
-- kumxtheybmqbfixatnok. NO usar `supabase db push` ni `apply_migration`: el
-- historial supabase_migrations.schema_migrations es global en esta instancia
-- y escribirlo contaminaria a los demas proyectos. Ejecutar de forma aislada
-- (SQL Editor o execute_sql) despues de 01_schema.sql.
--
-- Idempotente: se puede volver a ejecutar sin efectos secundarios.
--
-- Que cambia:
--   1. La infraestructura real: 15 modulos de Raiz Flotante (DWC), sin bomba
--      de aire por ahora. NFT y Vertical pasan a proyeccion futura y Sustrato
--      Inerte desaparece.
--   2. Carpeta de campo digital (field_notes).
--   3. Bitacora agronomica administrable (crop_log).
--   4. Recursos docentes reproducibles (columnas nuevas en resources).
--   5. Comunidad: pedidos de cosecha, comentarios moderados y transparencia.
-- =============================================================================

-- ============================================================ 1. MODULOS ====
-- El portal ya no describe cuatro sistemas distintos: describe quince modulos
-- del mismo sistema (Raiz Flotante) mas dos proyecciones a futuro.
alter table ciehs.modules
  add column if not exists notes  text,
  add column if not exists future boolean not null default false;

-- 'proyectado' se suma a los estados posibles.
alter table ciehs.modules drop constraint if exists modules_status_valido;
alter table ciehs.modules add constraint modules_status_valido
  check (status in ('activo','mantenimiento','inactivo','proyectado'));

-- Los cuatro modulos de la maqueta anterior (NFT-01, DWC-02, SUS-03, VER-04)
-- describian una infraestructura que no existe. Se retiran junto con sus
-- lecturas (on delete cascade) y se sustituyen por los quince reales.
delete from ciehs.modules where code in ('MOD-NFT-01','MOD-DWC-02','MOD-SUS-03','MOD-VER-04');

insert into ciehs.modules (code, name, system, crop, ph_min, ph_max, ce_min, ce_max, status, position, published, future, notes)
values
  ('MOD-DWC-01', 'Raiz Flotante 01', 'Raiz flotante (DWC)', 'Lechuga crespa',    5.5, 6.5, 1.2, 1.8, 'activo',  1,  true, false, 'Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-02', 'Raiz Flotante 02', 'Raiz flotante (DWC)', 'Lechuga crespa',    5.5, 6.5, 1.2, 1.8, 'activo',  2,  true, false, 'Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-03', 'Raiz Flotante 03', 'Raiz flotante (DWC)', 'Lechuga americana', 5.5, 6.5, 1.2, 1.8, 'activo',  3,  true, false, 'Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-04', 'Raiz Flotante 04', 'Raiz flotante (DWC)', 'Lechuga americana', 5.5, 6.5, 1.2, 1.8, 'activo',  4,  true, false, 'Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-05', 'Raiz Flotante 05', 'Raiz flotante (DWC)', 'Espinaca',          6.0, 6.8, 1.8, 2.3, 'activo',  5,  true, false, 'Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-06', 'Raiz Flotante 06', 'Raiz flotante (DWC)', 'Espinaca',          6.0, 6.8, 1.8, 2.3, 'activo',  6,  true, false, 'Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-07', 'Raiz Flotante 07', 'Raiz flotante (DWC)', 'Cebolla china',     6.0, 7.0, 1.4, 1.8, 'activo',  7,  true, false, 'Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-08', 'Raiz Flotante 08', 'Raiz flotante (DWC)', 'Cebolla china',     6.0, 7.0, 1.4, 1.8, 'activo',  8,  true, false, 'Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-09', 'Raiz Flotante 09', 'Raiz flotante (DWC)', 'Albahaca',          5.8, 6.5, 1.4, 1.8, 'activo',  9,  true, false, 'Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-10', 'Raiz Flotante 10', 'Raiz flotante (DWC)', 'Albahaca',          5.8, 6.5, 1.4, 1.8, 'activo', 10,  true, false, 'Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-11', 'Raiz Flotante 11', 'Raiz flotante (DWC)', 'Acelga',            6.0, 6.8, 1.6, 2.2, 'activo', 11,  true, false, 'Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-12', 'Raiz Flotante 12', 'Raiz flotante (DWC)', 'Acelga',            6.0, 6.8, 1.6, 2.2, 'activo', 12,  true, false, 'Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-13', 'Raiz Flotante 13', 'Raiz flotante (DWC)', 'Lechuga crespa',    5.5, 6.5, 1.2, 1.8, 'activo', 13,  true, false, 'Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-14', 'Raiz Flotante 14', 'Raiz flotante (DWC)', 'Espinaca',          6.0, 6.8, 1.8, 2.3, 'activo', 14,  true, false, 'Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-15', 'Raiz Flotante 15', 'Raiz flotante (DWC)', 'Almacigo / rotacion',5.8, 6.5, 1.0, 1.6, 'activo', 15,  true, false, 'Modulo de almacigo y rotacion. Sin bomba de aire: oxigenacion por difusion en superficie.'),
  ('PROY-NFT',   'Sistema NFT',      'Nutrient Film Technique', null,            5.5, 6.5, 1.2, 1.8, 'proyectado', 90, true, true,  'Proyeccion a futuro: no esta instalado ni en operacion.'),
  ('PROY-VER',   'Sistema vertical', 'Columnas verticales',     null,            5.8, 6.5, 1.2, 1.6, 'proyectado', 91, true, true,  'Proyeccion a futuro: no esta instalado ni en operacion.')
on conflict (code) do update set
  name      = excluded.name,
  system    = excluded.system,
  crop      = excluded.crop,
  ph_min    = excluded.ph_min,
  ph_max    = excluded.ph_max,
  ce_min    = excluded.ce_min,
  ce_max    = excluded.ce_max,
  status    = excluded.status,
  position  = excluded.position,
  published = excluded.published,
  future    = excluded.future,
  notes     = excluded.notes;

-- ================================================ 2. CARPETA DE CAMPO ========
-- Repositorio donde estudiantes y docentes publican articulos, informes,
-- fotografias y evidencias experimentales. Escritura solo del panel; lo que se
-- ve en publico es lo que el equipo coordinador ha marcado como publicado.
create table if not exists ciehs.field_notes (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  title        text not null,
  summary      text,
  body         text,
  kind         text not null default 'informe'
               check (kind in ('articulo','informe','foto','evidencia','bitacora')),
  team         text,                       -- equipo de gestion o grado, nunca un nombre completo
  author_label text,                       -- "5.° B · Equipo de Indagacion"
  media_url    text,
  published_on date,
  position     smallint not null default 0,
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists field_notes_pub_idx on ciehs.field_notes (published, position);

-- ========================================== 3. BITACORA AGRONOMICA ==========
-- Un registro por cultivo y lote: siembra, semana en curso, pH y cosecha.
create table if not exists ciehs.crop_log (
  id            uuid primary key default gen_random_uuid(),
  lote          text not null unique,
  crop          text not null,
  scientific    text,
  module_code   text,
  sown_on       date,
  week          smallint check (week between 0 and 60),
  ph            numeric(3,1) check (ph between 0 and 14),
  ce            numeric(4,2) check (ce >= 0),
  phase         text,
  harvest_on    date,
  harvest_kg    numeric(7,2) check (harvest_kg >= 0),
  notes         text,
  position      smallint not null default 0,
  published     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ======================================== 4. RECURSOS REPRODUCIBLES =========
-- La tabla ya existia para descargas. Se le anaden el tipo de archivo (para
-- decidir si el portal ofrece un reproductor o una descarga) y la duracion.
alter table ciehs.resources
  add column if not exists file_kind text
    check (file_kind is null or file_kind in ('pdf','audio','video','imagen','doc','enlace')),
  add column if not exists duration text,
  add column if not exists featured boolean not null default false;

-- ==================================== 5. COMUNIDAD, PEDIDOS Y CAJA ==========
-- Pedidos de cosecha. Escritura abierta a cualquier visitante (es el punto del
-- formulario) pero LECTURA SOLO PARA ADMINISTRACION: la lista de pedidos lleva
-- nombre y contacto de familias y no puede quedar expuesta al rol anonimo.
create table if not exists ciehs.orders (
  id             uuid primary key default gen_random_uuid(),
  requester_name text not null check (length(requester_name) between 2 and 80),
  contact        text not null check (length(contact) between 5 and 120),
  crop           text          check (crop is null or length(crop) <= 120),
  qty_kg         numeric(6,2)  check (qty_kg is null or (qty_kg > 0 and qty_kg <= 100)),
  notes          text          check (notes is null or length(notes) <= 500),
  status         text not null default 'pendiente'
                 check (status in ('pendiente','confirmado','entregado','anulado')),
  created_at     timestamptz not null default now()
);
create index if not exists orders_estado_idx on ciehs.orders (status, created_at desc);

-- Caja de comentarios de la comunidad escolar. Nace SIN publicar: nada aparece
-- en el portal hasta que la coordinacion lo aprueba. Es la misma logica que
-- protege la identidad de los menores en el resto del sitio.
create table if not exists ciehs.community_comments (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null check (length(display_name) between 2 and 60),
  role         text          check (role is null or role in ('estudiante','docente','familia','visitante')),
  message      text not null check (length(message) between 4 and 700),
  reply        text,
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists comments_pub_idx on ciehs.community_comments (published, created_at desc);

-- Panel de transparencia: en que se convierte lo recaudado con las cosechas.
create table if not exists ciehs.transparency_entries (
  id          uuid primary key default gen_random_uuid(),
  occurred_on date not null default current_date,
  period      text,
  concept     text not null,
  kind        text not null check (kind in ('ingreso','egreso')),
  amount_pen  numeric(9,2) not null check (amount_pen >= 0),
  note        text,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists transparencia_fecha_idx on ciehs.transparency_entries (occurred_on desc);

-- ============================================================= QR ===========
-- El portal gana rutas nuevas y los QR del laboratorio deben poder apuntar a
-- ellas. La comprobacion vieja solo conocia las doce originales.
alter table ciehs.qr_codes drop constraint if exists qr_codes_target_route_check;
alter table ciehs.qr_codes add constraint qr_codes_target_route_check
  check (target_route in (
    'inicio','metodologia','investigaciones','equipos','modulos','trazabilidad',
    'datos','juega','docentes','mural','eureka','contacto','privacidad','comunidad'));

-- ======================================================== TRIGGERS ==========
do $blk$
declare t text;
begin
  foreach t in array array['field_notes','crop_log','community_comments','transparency_entries'] loop
    execute format('drop trigger if exists touch_%1$s on ciehs.%1$I', t);
    execute format('create trigger touch_%1$s before update on ciehs.%1$I
                    for each row execute function ciehs.touch_updated_at()', t);
  end loop;
end $blk$;

-- ============================================================== RLS =========
alter table ciehs.field_notes           enable row level security;
alter table ciehs.crop_log              enable row level security;
alter table ciehs.orders                enable row level security;
alter table ciehs.community_comments    enable row level security;
alter table ciehs.transparency_entries  enable row level security;

-- Lectura publica solo de lo publicado.
do $blk$
declare t text;
begin
  foreach t in array array['field_notes','crop_log','community_comments','transparency_entries'] loop
    execute format('drop policy if exists %1$s_lectura_publica on ciehs.%1$I', t);
    execute format('create policy %1$s_lectura_publica on ciehs.%1$I
                    for select to anon, authenticated using (published)', t);
  end loop;
end $blk$;

-- orders NO tiene politica de lectura publica a proposito: solo administracion.
drop policy if exists orders_alta_publica on ciehs.orders;
create policy orders_alta_publica on ciehs.orders
  for insert to anon, authenticated with check (status = 'pendiente');

-- Un comentario nuevo entra siempre como borrador; nadie puede autopublicarse.
drop policy if exists comments_alta_publica on ciehs.community_comments;
create policy comments_alta_publica on ciehs.community_comments
  for insert to anon, authenticated with check (published = false and reply is null);

-- Escritura completa: sesion iniciada Y figurar en ciehs.admins.
do $blk$
declare t text;
begin
  foreach t in array array['field_notes','crop_log','orders',
                           'community_comments','transparency_entries'] loop
    execute format('drop policy if exists %1$s_escritura_admin on ciehs.%1$I', t);
    execute format('create policy %1$s_escritura_admin on ciehs.%1$I
                    for all to authenticated
                    using (ciehs.is_admin()) with check (ciehs.is_admin())', t);
  end loop;
end $blk$;

-- Permisos de tabla (RLS filtra filas; GRANT abre la puerta).
grant select on ciehs.field_notes, ciehs.crop_log,
                ciehs.community_comments, ciehs.transparency_entries to anon, authenticated;
grant insert on ciehs.orders, ciehs.community_comments to anon, authenticated;
grant select, insert, update, delete on ciehs.field_notes, ciehs.crop_log, ciehs.orders,
                ciehs.community_comments, ciehs.transparency_entries to authenticated;
