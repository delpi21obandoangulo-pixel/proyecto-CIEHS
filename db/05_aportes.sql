-- ============================================================================
-- CIEHS · Aportes de los equipos (2026-09-09)
--
-- Idempotente. NO usar `supabase db push` ni `apply_migration`.
--
-- Fotos, videos, articulos y trabajos de investigacion que suben los propios
-- estudiantes. El problema de fondo: permitir subidas anonimas en un sitio
-- publico convierte el bucket en alojamiento gratuito para cualquiera que
-- encuentre la URL. La respuesta es CUARENTENA:
--
--   1. El bucket es PRIVADO. No hay URL publica; se firman enlaces temporales.
--   2. La politica de lectura de storage.objects exige que exista una ficha
--      APROBADA apuntando a ese objeto. Sin ficha aprobada, el archivo no
--      existe para nadie salvo un administrador.
--   3. Retirar la aprobacion lo vuelve inaccesible al instante, sin tener que
--      acordarse de borrar el archivo aparte.
--
-- Verificado el 2026-09-09 contra la instancia real: en cuarentena no se puede
-- firmar el enlace, la ficha no es visible y la URL publica directa da 400;
-- tras aprobar, el enlace firmado descarga con su content-type correcto; al
-- retirar la aprobacion vuelve a bloquearse.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ciehs-aportes', 'ciehs-aportes', false, 26214400,
        array['image/jpeg','image/png','image/webp',
              'video/mp4','video/webm',
              'application/pdf',
              'audio/mpeg','audio/mp4','audio/ogg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create table if not exists ciehs.aportes (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null,
  title        text not null,
  description  text,
  equipo       text,
  grado        text,
  storage_path text not null unique,
  mime         text,
  size_bytes   bigint,
  published    boolean not null default false,
  created_at   timestamptz not null default now(),

  constraint aportes_kind_valido  check (kind in ('foto','video','articulo','investigacion','audio','otro')),
  constraint aportes_title_corto  check (char_length(title) between 3 and 160),
  constraint aportes_desc_corta   check (description is null or char_length(description) <= 800),
  constraint aportes_equipo_corto check (equipo is null or char_length(equipo) <= 80),
  constraint aportes_grado_corto  check (grado  is null or char_length(grado)  <= 40),
  constraint aportes_tam_maximo   check (size_bytes is null or size_bytes <= 26214400)
);

comment on table ciehs.aportes is
  'Bandeja de aportes: fotos, videos, articulos y trabajos de investigacion que suben los equipos. Llegan en cuarentena (published=false) a un bucket PRIVADO y solo son legibles cuando el panel los aprueba. Retirar la aprobacion los vuelve inaccesibles al instante.';

create index if not exists aportes_kind_fecha on ciehs.aportes (kind, created_at desc);

alter table ciehs.aportes enable row level security;

drop policy if exists "aportes_lectura_publicada" on ciehs.aportes;
create policy "aportes_lectura_publicada"
  on ciehs.aportes for select using (published);

drop policy if exists "aportes_alta_publica" on ciehs.aportes;
create policy "aportes_alta_publica"
  on ciehs.aportes for insert to anon, authenticated
  with check (published = false);

drop policy if exists "aportes_admin_todo" on ciehs.aportes;
create policy "aportes_admin_todo"
  on ciehs.aportes for all to authenticated
  using (ciehs.is_admin()) with check (ciehs.is_admin());

grant select, insert on ciehs.aportes to anon, authenticated;
grant update, delete on ciehs.aportes to authenticated;

-- --------------------------- politicas del bucket --------------------------
drop policy if exists "aportes_obj_lectura_aprobada" on storage.objects;
create policy "aportes_obj_lectura_aprobada"
  on storage.objects for select
  using (
    bucket_id = 'ciehs-aportes'
    and exists (
      select 1 from ciehs.aportes a
      where a.storage_path = storage.objects.name and a.published
    )
  );

-- El coordinador tiene que poder ABRIR lo pendiente: aprobar a ciegas un
-- archivo que no se ha visto es justo lo que la cuarentena existe para evitar.
drop policy if exists "aportes_obj_admin_lee_todo" on storage.objects;
create policy "aportes_obj_admin_lee_todo"
  on storage.objects for select to authenticated
  using (bucket_id = 'ciehs-aportes' and ciehs.is_admin());

drop policy if exists "aportes_obj_alta_publica" on storage.objects;
create policy "aportes_obj_alta_publica"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'ciehs-aportes');

drop policy if exists "aportes_obj_admin_borra" on storage.objects;
create policy "aportes_obj_admin_borra"
  on storage.objects for delete to authenticated
  using (bucket_id = 'ciehs-aportes' and ciehs.is_admin());

-- Riesgo residual conocido: un anonimo puede depositar un objeto sin crear su
-- ficha. Queda huerfano, invisible para todos e imposible de leer, pero ocupa
-- cuota. Conviene revisar el bucket de vez en cuando desde el panel de Supabase.
