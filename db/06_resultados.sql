-- ============================================================================
-- CIEHS · Resultados de las investigaciones (2026-09-09)
--
-- Idempotente. NO usar `supabase db push` ni `apply_migration`.
--
-- Lo que responde la pregunta de estos estudios es la COMPARACION entre
-- tratamientos (50/100/150 % de solucion; con y sin bioestimulante). Por eso
-- `tratamiento` es NOT NULL: una medicion sin grupo entra en la base pero no
-- dice nada, porque no hay contra que contrastarla.
--
-- Alta publica en borrador + validacion por el panel, igual que
-- registros_campo y community_comments.
-- ============================================================================

-- Conclusion y estado de la hipotesis: uno por investigacion, no una serie.
alter table ciehs.investigations add column if not exists conclusion text;
alter table ciehs.investigations add column if not exists hipotesis_estado text;
do $$ begin
  alter table ciehs.investigations add constraint inv_hipotesis_estado_valido
    check (hipotesis_estado is null or hipotesis_estado in ('en_curso','confirmada','refutada','parcial'));
exception when duplicate_object then null; end $$;

comment on column ciehs.investigations.hipotesis_estado is
  'Que paso con la hipotesis. Se admite refutada a proposito: una hipotesis que no se cumple es un resultado valido y ensena mas que forzar la que gustaba.';

create table if not exists ciehs.resultados (
  id           uuid primary key default gen_random_uuid(),
  investigation_code text not null,
  tratamiento  text not null,
  medido_en    date not null default current_date,
  variable     text not null,
  valor        numeric(10,3) not null,
  unidad       text,
  n_muestras   smallint,
  equipo       text,
  grado        text,
  nota         text,
  published    boolean not null default false,
  created_at   timestamptz not null default now(),

  constraint res_trat_corto   check (char_length(tratamiento) between 1 and 60),
  constraint res_var_corta    check (char_length(variable)    between 2 and 80),
  constraint res_unidad_corta check (unidad is null or char_length(unidad) <= 20),
  constraint res_nota_corta   check (nota   is null or char_length(nota)   <= 400),
  constraint res_equipo_corto check (equipo is null or char_length(equipo) <= 80),
  constraint res_grado_corto  check (grado  is null or char_length(grado)  <= 40),
  constraint res_n_positivo   check (n_muestras is null or (n_muestras > 0 and n_muestras <= 999)),
  constraint res_fecha_rango  check (medido_en >= date '2026-01-01' and medido_en <= current_date + 1)
);

comment on table ciehs.resultados is
  'Mediciones de resultado de cada investigacion, agrupadas por tratamiento. Nacen sin publicar y las valida el panel, igual que los registros de campo.';

create index if not exists resultados_inv_var on ciehs.resultados (investigation_code, variable, medido_en);

alter table ciehs.resultados enable row level security;

drop policy if exists "resultados_lectura_publica" on ciehs.resultados;
create policy "resultados_lectura_publica"
  on ciehs.resultados for select using (published);

drop policy if exists "resultados_alta_publica" on ciehs.resultados;
create policy "resultados_alta_publica"
  on ciehs.resultados for insert to anon, authenticated
  with check (published = false);

drop policy if exists "resultados_admin_todo" on ciehs.resultados;
create policy "resultados_admin_todo"
  on ciehs.resultados for all to authenticated
  using (ciehs.is_admin()) with check (ciehs.is_admin());

grant select, insert on ciehs.resultados to anon, authenticated;
grant update, delete on ciehs.resultados to authenticated;

-- Recordatorio: al insertar desde el cliente, no encadenar .select(). El
-- RETURNING evaluaria la politica de lectura sobre una fila que nace con
-- published=false y por tanto no es legible.
