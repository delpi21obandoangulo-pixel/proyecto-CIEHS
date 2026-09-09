-- ============================================================================
-- CIEHS · Galeria de evidencias (2026-09-09)
--
-- Idempotente a proposito. NO usar `supabase db push`: el historial
-- supabase_migrations.schema_migrations es global en esta instancia compartida
-- y escribirlo contaminaria a Aura y a Safari. Se aplica a mano.
--
-- Por que las imagenes no van en el repositorio: es publico y su historial es
-- permanente. El protocolo de imagen promete que la autorizacion del apoderado
-- es revocable en cualquier momento; con las fotografias en git eso no se
-- puede cumplir. En el bucket si: borrar la evidencia borra el archivo.
-- ============================================================================

-- ---------------------------------------------------------------- bucket ---
-- Storage es comun a toda la instancia: bucket propio y nunca tocar los de
-- Aura (avatars, profile-media, battle-videos).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ciehs-evidencias', 'ciehs-evidencias', true, 6291456,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "ciehs_evidencias_lectura_publica" on storage.objects;
create policy "ciehs_evidencias_lectura_publica"
  on storage.objects for select
  using (bucket_id = 'ciehs-evidencias');

drop policy if exists "ciehs_evidencias_admin_inserta" on storage.objects;
create policy "ciehs_evidencias_admin_inserta"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'ciehs-evidencias' and ciehs.is_admin());

drop policy if exists "ciehs_evidencias_admin_actualiza" on storage.objects;
create policy "ciehs_evidencias_admin_actualiza"
  on storage.objects for update to authenticated
  using (bucket_id = 'ciehs-evidencias' and ciehs.is_admin())
  with check (bucket_id = 'ciehs-evidencias' and ciehs.is_admin());

drop policy if exists "ciehs_evidencias_admin_borra" on storage.objects;
create policy "ciehs_evidencias_admin_borra"
  on storage.objects for delete to authenticated
  using (bucket_id = 'ciehs-evidencias' and ciehs.is_admin());

-- ----------------------------------------------------------------- tabla ---
create table if not exists ciehs.evidencias (
  id           uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  title        text not null,
  eyebrow      text,
  body         text,
  alt          text not null,
  width        smallint,
  height       smallint,
  consent_ref  text,
  position     smallint not null default 0,
  published    boolean  not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table ciehs.evidencias is
  'Galeria "El CIEHS en accion". Las imagenes viven en el bucket ciehs-evidencias, NO en el repositorio git, que es publico: asi una revocacion de autorizacion se ejecuta de verdad (se borra la fila y el objeto) en vez de quedar para siempre en el historial.';
comment on column ciehs.evidencias.consent_ref is
  'Referencia al respaldo de la autorizacion firmada del apoderado. Obligatorio de facto para cualquier fotografia con rostro identificable.';

alter table ciehs.evidencias enable row level security;

drop policy if exists "evidencias_lectura_publica" on ciehs.evidencias;
create policy "evidencias_lectura_publica"
  on ciehs.evidencias for select using (published);

drop policy if exists "evidencias_admin_todo" on ciehs.evidencias;
create policy "evidencias_admin_todo"
  on ciehs.evidencias for all to authenticated
  using (ciehs.is_admin()) with check (ciehs.is_admin());

grant select on ciehs.evidencias to anon, authenticated;
grant insert, update, delete on ciehs.evidencias to authenticated;
