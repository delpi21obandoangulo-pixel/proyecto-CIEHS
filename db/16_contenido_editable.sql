-- ============================================================================
-- CIEHS · Contenido editable in-place (2026-09-13)
--
-- Aplicar de forma AISLADA (SQL Editor o psql). NO usar `supabase db push` ni
-- `apply_migration`: el historial supabase_migrations.schema_migrations es
-- global en esta instancia compartida (Seccion 1.4 de las directrices).
--
-- AISLAMIENTO: todo dentro del esquema ciehs. No toca public ni safary_kids.
-- Idempotente.
--
-- PARA QUE
-- --------
-- El panel de administracion aislado obligaba a mantener DOS inventarios del
-- mismo contenido: el texto en el HTML y un formulario aparte que lo repetia.
-- Con la edicion in-place el administrador edita sobre la propia pagina, asi
-- que hace falta un sitio donde guardar tres cosas que hasta ahora solo
-- existian en el codigo fuente:
--
--   ciehs.textos           cualquier texto rotulado con data-edit en el HTML
--   ciehs.imagenes         las imagenes de hueco fijo (mural, cabeceras)
--   ciehs.arena_preguntas  correcciones a los retos de la arena
--
-- Lo que YA tenia tabla (modulos, evidencias, aportes, recursos, comentarios,
-- productos, bitacora...) se sigue editando contra su tabla de siempre: aqui no
-- se duplica nada.
--
-- ============================ NOTA DE SEGURIDAD =============================
-- El valor de ciehs.textos se pinta SIEMPRE con textContent, nunca con
-- innerHTML (ver assets/js/ciehs-inline.js, funcion aplicarTextos). Eso es lo
-- que impide que un valor guardado se convierta en HTML ejecutable. Si alguna
-- vez se quiere permitir negrita o enlaces, NO se resuelve quitando el
-- textContent: se resuelve con una lista blanca de etiquetas en el cliente. Un
-- administrador con codigo es un usuario privilegiado, pero el codigo puede
-- filtrarse, y entonces esta tabla seria un XSS almacenado servido a todo
-- visitante del portal.
--
-- Los CHECK de longitud no son cosmetica: sin ellos, cualquiera que tenga el
-- codigo puede inflar la respuesta de portada hasta dejar el portal inservible
-- en la conexion del laboratorio.
-- ============================================================================

-- --------------------------------------------------------------- textos ----
-- clave: el identificador que lleva el atributo data-edit en el HTML. Se
-- restringe el juego de caracteres para que la clave no pueda usarse como
-- vector (se interpola en selectores del lado cliente).
create table if not exists ciehs.textos (
  clave       text primary key
              constraint textos_clave_forma check (clave ~ '^[a-z0-9][a-z0-9._-]{1,80}$'),
  valor       text not null
              constraint textos_valor_largo check (char_length(valor) <= 4000),
  actualizado timestamptz not null default now()
);

-- ------------------------------------------------------------- imagenes ----
-- Huecos de imagen fijos del portal (el mural, por ejemplo). storage_path
-- apunta al bucket ciehs-evidencias, que ya existe desde db/03.
create table if not exists ciehs.imagenes (
  clave        text primary key
               constraint imagenes_clave_forma check (clave ~ '^[a-z0-9][a-z0-9._-]{1,80}$'),
  storage_path text not null
               constraint imagenes_path_largo check (char_length(storage_path) <= 400),
  alt          text
               constraint imagenes_alt_largo check (alt is null or char_length(alt) <= 300),
  actualizado  timestamptz not null default now()
);

-- ------------------------------------------------------- arena_preguntas ----
-- Correccion de un reto de la arena. El banco base sigue viviendo en
-- assets/js/ciehs-arena-preguntas.js; esta tabla solo guarda el DELTA, de modo
-- que el portal funciona igual sin conexion (mejora progresiva) y lo editado
-- desde el portal se superpone cuando la base responde.
--
-- El payload va en jsonb y no en columnas porque hay seis tipos de reto
-- (opcion, vf, escribe, escucha, orden, dial) con formas distintas; una columna
-- por variante daria una tabla con la mitad de las celdas vacias. La forma la
-- valida el cliente al aplicar el delta, y el CHECK de abajo garantiza al menos
-- que es un objeto y no un array o un escalar suelto.
create table if not exists ciehs.arena_preguntas (
  id          text primary key
              constraint arena_id_forma check (id ~ '^[a-z0-9][a-z0-9._-]{1,60}$'),
  payload     jsonb not null
              constraint arena_payload_objeto check (jsonb_typeof(payload) = 'object')
              constraint arena_payload_largo  check (pg_column_size(payload) <= 8000),
  oculta      boolean not null default false,
  actualizado timestamptz not null default now()
);

-- ---------------------------------------------------------------- touch ----
drop trigger if exists textos_touch on ciehs.textos;
drop trigger if exists imagenes_touch on ciehs.imagenes;
drop trigger if exists arena_preguntas_touch on ciehs.arena_preguntas;

create or replace function ciehs.touch_actualizado()
returns trigger language plpgsql
set search_path = ciehs, pg_temp as $fn$
begin new.actualizado := now(); return new; end;
$fn$;

create trigger textos_touch before update on ciehs.textos
  for each row execute function ciehs.touch_actualizado();
create trigger imagenes_touch before update on ciehs.imagenes
  for each row execute function ciehs.touch_actualizado();
create trigger arena_preguntas_touch before update on ciehs.arena_preguntas
  for each row execute function ciehs.touch_actualizado();

-- ------------------------------------------------------------------ RLS ----
alter table ciehs.textos          enable row level security;
alter table ciehs.imagenes        enable row level security;
alter table ciehs.arena_preguntas enable row level security;

-- Lectura publica: es contenido del portal, lo ve cualquier visitante.
drop policy if exists textos_lectura_publica on ciehs.textos;
create policy textos_lectura_publica on ciehs.textos
  for select to anon, authenticated using (true);

drop policy if exists imagenes_lectura_publica on ciehs.imagenes;
create policy imagenes_lectura_publica on ciehs.imagenes
  for select to anon, authenticated using (true);

-- Un reto oculto no se sirve al publico: ocultarlo es precisamente retirarlo.
-- La administracion si lo ve, por su politica FOR ALL de mas abajo.
drop policy if exists arena_lectura_publica on ciehs.arena_preguntas;
create policy arena_lectura_publica on ciehs.arena_preguntas
  for select to anon, authenticated using (not oculta);

-- Escritura: is_admin() y nada mas. Se declara para anon ADEMAS de
-- authenticated porque la entrada por codigo viaja con el rol anon (ver el
-- razonamiento completo en db/11_acceso_codigo_grants.sql). is_admin() sigue
-- siendo la unica puerta: sin la cabecera correcta devuelve false y RLS niega.
do $blk$
declare t text;
begin
  foreach t in array array['textos','imagenes','arena_preguntas'] loop
    execute format('drop policy if exists %1$s_escritura_admin on ciehs.%1$I', t);
    execute format('create policy %1$s_escritura_admin on ciehs.%1$I
                    for all to anon, authenticated
                    using (ciehs.is_admin()) with check (ciehs.is_admin())', t);
  end loop;
end $blk$;

-- ---------------------------------------------------------- privilegios ----
grant select on ciehs.textos, ciehs.imagenes, ciehs.arena_preguntas
  to anon, authenticated;
grant insert, update, delete on ciehs.textos          to anon, authenticated;
grant insert, update, delete on ciehs.imagenes        to anon, authenticated;
grant insert, update, delete on ciehs.arena_preguntas to anon, authenticated;

-- ------------------------------------------------------------- indices  ----
-- La portada pide la tabla entera de textos de una vez y ordenada por clave;
-- la primary key ya sirve ese orden, asi que no hace falta indice extra.

-- ------------------------------------------------------- comprobaciones ----
-- Sin codigo, esto debe fallar con 42501 / RLS:
--   set role anon;
--   insert into ciehs.textos (clave, valor) values ('prueba','x');
--   reset role;
-- Con codigo, debe funcionar:
--   set role anon;
--   select set_config('request.headers','{"x-ciehs-code":"<CODIGO>"}',true);
--   insert into ciehs.textos (clave, valor) values ('prueba','x')
--     on conflict (clave) do update set valor = excluded.valor;
--   delete from ciehs.textos where clave = 'prueba';
--   reset role;
