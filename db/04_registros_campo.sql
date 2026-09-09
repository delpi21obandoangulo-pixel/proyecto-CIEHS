-- ============================================================================
-- CIEHS · Carpeta de campo digital (2026-09-09)
--
-- Idempotente. NO usar `supabase db push` ni `apply_migration`: el historial
-- supabase_migrations.schema_migrations es global en esta instancia compartida
-- y escribirlo contaminaria a Aura y a Safari.
--
-- Los estudiantes registran mediciones desde la seccion publica, sin cuenta.
-- El alta anonima esta permitida pero SIEMPRE como borrador: el panel valida.
-- Es el mismo patron que community_comments, y ademas ensena algo cierto:
-- un dato cientifico se contrasta antes de darse por bueno.
-- ============================================================================

create table if not exists ciehs.registros_campo (
  id           uuid primary key default gen_random_uuid(),
  module_code  text not null,
  equipo       text,
  -- Grado y seccion, NUNCA el nombre del estudiante: el portal difunde el
  -- trabajo cientifico, no la identidad de quien lo hace.
  grado        text,
  medido_en    date not null default current_date,
  ph           numeric(4,2),
  ce           numeric(4,2),
  temp_c       numeric(4,1),
  altura_cm    numeric(5,1),
  hojas        smallint,
  nota         text,
  published    boolean not null default false,
  created_at   timestamptz not null default now(),

  -- Rangos fisicamente posibles. Es la unica defensa real contra un dedazo o
  -- un envio malicioso: el formulario tambien valida, pero eso vive en el
  -- navegador y cualquiera lo puede saltar.
  constraint registros_ph_rango     check (ph        is null or (ph        >= 0   and ph        <= 14)),
  constraint registros_ce_rango     check (ce        is null or (ce        >= 0   and ce        <= 10)),
  constraint registros_temp_rango   check (temp_c    is null or (temp_c    >= -5  and temp_c    <= 60)),
  constraint registros_altura_rango check (altura_cm is null or (altura_cm >= 0   and altura_cm <= 300)),
  constraint registros_hojas_rango  check (hojas     is null or (hojas     >= 0   and hojas     <= 500)),
  constraint registros_fecha_rango  check (medido_en >= date '2026-01-01' and medido_en <= current_date + 1),
  constraint registros_algo_medido  check (num_nonnulls(ph, ce, temp_c, altura_cm, hojas) >= 1),
  constraint registros_nota_corta   check (nota   is null or char_length(nota)   <= 400),
  constraint registros_equipo_corto check (equipo is null or char_length(equipo) <= 80),
  constraint registros_grado_corto  check (grado  is null or char_length(grado)  <= 40)
);

comment on table ciehs.registros_campo is
  'Carpeta de campo digital: mediciones que registran los propios estudiantes. Nacen sin publicar y las valida el panel, igual que los comentarios de la comunidad. Nunca guarda el nombre de un menor: equipo y grado bastan para atribuir el trabajo.';

create index if not exists registros_campo_modulo_fecha
  on ciehs.registros_campo (module_code, medido_en);

alter table ciehs.registros_campo enable row level security;

drop policy if exists "registros_lectura_publica" on ciehs.registros_campo;
create policy "registros_lectura_publica"
  on ciehs.registros_campo for select using (published);

drop policy if exists "registros_alta_publica" on ciehs.registros_campo;
create policy "registros_alta_publica"
  on ciehs.registros_campo for insert to anon, authenticated
  with check (published = false);

drop policy if exists "registros_admin_todo" on ciehs.registros_campo;
create policy "registros_admin_todo"
  on ciehs.registros_campo for all to authenticated
  using (ciehs.is_admin()) with check (ciehs.is_admin());

grant select, insert on ciehs.registros_campo to anon, authenticated;
grant update, delete on ciehs.registros_campo to authenticated;

-- OJO al integrarlo desde el cliente: NO encadenar .select() al insert. El
-- RETURNING obliga a Postgres a evaluar la politica de LECTURA sobre la fila
-- recien creada, que tiene published=false y por tanto no es legible; el
-- resultado es un "new row violates row-level security policy" enganoso.
