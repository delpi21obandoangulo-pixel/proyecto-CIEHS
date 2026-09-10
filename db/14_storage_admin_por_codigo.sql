-- ============================================================================
-- CIEHS · Storage: el administrador por CÓDIGO también manda (2026-09-10)
--
-- EL FALLO
-- --------
-- Cuando el panel pasó a entrar por código (db/10 y db/11), el archivo 11
-- extendió al rol `anon` TODAS las políticas de administración... de las
-- TABLAS. Se olvidó de las de `storage.objects`, que se quedaron en
-- `to authenticated`.
--
-- La entrada por código NO usa sesión: las peticiones del panel viajan con el
-- rol `anon` y la cabecera X-CIEHS-Code. Y una política RLS es POR ROL: aunque
-- ciehs.is_admin() devuelva true, si la política no incluye a anon, a esa
-- petición no se le aplica y RLS la niega.
--
-- Consecuencias, las tres reales y las tres invisibles hasta que se probaban:
--
--   · Aportes en cuarentena: el coordinador NO podía abrirlos. Al publicarlos
--     sí se veían, porque entonces entraba la otra política —la de lectura
--     aprobada, que es `to public`—. Es decir, el sistema obligaba a aprobar a
--     ciegas justo lo que la cuarentena existe para evitar.
--   · Tampoco podía borrar el archivo de un aporte.
--   · Y no podía subir, actualizar ni borrar NINGUNA evidencia.
--
-- POR QUÉ ES SEGURO EXTENDERLAS
-- -----------------------------
-- Igual que en db/11: is_admin() sigue siendo la ÚNICA puerta. El USING de cada
-- política es ciehs.is_admin(); sin la cabecera con el código correcto devuelve
-- false y RLS bloquea, tenga el rol el permiso que tenga. Lo que se corrige es
-- que la política se EVALÚE para el rol que de verdad usa el panel.
--
-- Idempotente. NO usar `supabase db push` ni `apply_migration`: el historial de
-- migraciones es global en esta instancia y contaminaría a Aura y a Safari.
-- ============================================================================

-- 1) Las políticas de administración de storage, también para anon.
alter policy "aportes_obj_admin_lee_todo"       on storage.objects to anon, authenticated;
alter policy "aportes_obj_admin_borra"          on storage.objects to anon, authenticated;
alter policy "ciehs_evidencias_admin_inserta"   on storage.objects to anon, authenticated;
alter policy "ciehs_evidencias_admin_actualiza" on storage.objects to anon, authenticated;
alter policy "ciehs_evidencias_admin_borra"     on storage.objects to anon, authenticated;

-- ============================================================================
-- 2) Bucket propio para los adjuntos de la carpeta de campo
--
-- El formulario de la carpeta solo aceptaba un ENLACE, y eso invitaba al fallo
-- que se acabó dando: se guardó `blob:https://web.whatsapp.com/...`, copiado
-- con «copiar dirección de la imagen» desde WhatsApp Web. Una URL blob: es una
-- referencia a la memoria de UNA pestaña: fuera de ella no apunta a nada. En el
-- portal el botón «Ver el archivo adjunto» aparecía y no abría nada.
--
-- Bucket propio y no `ciehs-evidencias` por dos razones: aquel admite solo
-- imágenes de hasta 6 MB, y está atado al protocolo de imagen de menores. Aquí
-- entran además vídeo, audio y documentos, y son piezas que publica el
-- coordinador, no fotografías de estudiantes.
--
-- PÚBLICO a propósito: lo que se adjunta a una entrada publicada de la carpeta
-- es material que ya se está publicando. Lo que NO debe entrar aquí son
-- fotografías de personas: esas van por Evidencias, que sí pasa por el
-- protocolo. El formulario lo advierte de forma explícita.
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ciehs-carpeta', 'ciehs-carpeta', true, 26214400,
        array['image/jpeg','image/png','image/webp','image/gif',
              'video/mp4','video/webm','video/quicktime',
              'audio/mpeg','audio/mp4','audio/ogg',
              'application/pdf','text/plain','text/csv',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "carpeta_obj_lectura_publica" on storage.objects;
create policy "carpeta_obj_lectura_publica"
  on storage.objects for select
  using (bucket_id = 'ciehs-carpeta');

drop policy if exists "carpeta_obj_admin_inserta" on storage.objects;
create policy "carpeta_obj_admin_inserta"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'ciehs-carpeta' and ciehs.is_admin());

drop policy if exists "carpeta_obj_admin_actualiza" on storage.objects;
create policy "carpeta_obj_admin_actualiza"
  on storage.objects for update to anon, authenticated
  using (bucket_id = 'ciehs-carpeta' and ciehs.is_admin());

drop policy if exists "carpeta_obj_admin_borra" on storage.objects;
create policy "carpeta_obj_admin_borra"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'ciehs-carpeta' and ciehs.is_admin());

-- 3) Limpieza del dato que dejó el fallo. Una URL blob: guardada no se puede
--    reparar —el archivo original nunca llegó a salir del navegador—, así que
--    se vacía el campo y la entrada queda sin adjunto hasta que se vuelva a
--    subir de verdad.
update ciehs.field_notes
   set media_url = null
 where media_url like 'blob:%' or media_url like 'data:%';
