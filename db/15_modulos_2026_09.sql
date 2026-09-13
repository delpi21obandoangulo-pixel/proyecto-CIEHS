-- ============================================================================
-- CIEHS · Distribucion agronomica real y purga de los sistemas inexistentes
-- (2026-09-13)
--
-- Aplicar de forma AISLADA (SQL Editor o psql). NO usar `supabase db push` ni
-- `apply_migration`: el historial supabase_migrations.schema_migrations es
-- global en esta instancia compartida y escribirlo contaminaria a los demas
-- proyectos (Seccion 1.4 de las directrices).
--
-- AISLAMIENTO: todo vive en el esquema ciehs. No toca public ni safary_kids.
-- Idempotente: se puede volver a ejecutar sin efectos secundarios.
--
-- QUE CAMBIA Y POR QUE
-- --------------------
-- 1) La distribucion de cultivos de 02_infraestructura_2026.sql era plausible
--    pero no la del laboratorio. La real a septiembre de 2026 es:
--      MOD-DWC-01 .. 07  Lechuga crespa        (mesa)
--      MOD-DWC-08 .. 09  Lechuga arrepollada   (mesa)
--      MOD-DWC-10 .. 11  Espinaca              (mesa)
--      MOD-DWC-12 .. 15  Cebolla china         (BOTELLA reutilizada)
--    "Lechuga americana" pasa a llamarse por su nombre real, "arrepollada".
--    Albahaca y acelga SALEN: no estan sembradas. Quedan en el plan de
--    diversificacion, que vive en el portal y no en esta tabla, porque esta
--    tabla es el inventario de lo que existe.
--
-- 2) Se retiran PROY-NFT y PROY-VER. Describian infraestructura que no existe
--    ni sigue proyectada, y mientras estuvieran en la tabla cualquier selector
--    del panel podia ofrecerlas para registrar una medicion. Los dos unicos
--    sistemas del CIEHS son la germinacion en almacigo y la raiz flotante
--    (DWC); la germinacion no es un modulo y por eso no tiene fila aqui.
--
-- RIESGO DE DATOS: el delete arrastra en cascada las lecturas asociadas a esos
-- dos codigos (telemetry_readings.module_id ... on delete cascade). Son filas
-- de una infraestructura inexistente, asi que no hay dato real que perder; la
-- consulta comentada de abajo permite verlo ANTES de borrar.
-- ============================================================================

-- ---------------------------------------------------------------- 0) previo
-- Que se va a borrar exactamente (ejecutar antes, si se quiere comprobar):
--   select m.code, m.name, count(t.id) as lecturas
--     from ciehs.modules m
--     left join ciehs.telemetry_readings t on t.module_id = m.id
--    where m.code like 'PROY-%'
--    group by m.code, m.name;

-- ------------------------------------------------- 1) purga de proyecciones
delete from ciehs.modules where code like 'PROY-%';

-- ------------------------------------------ 2) distribucion real, 15 modulos
-- El campo `system` es identico en los quince: raiz flotante. Lo que distingue
-- a las botellas se dice en `notes`, porque no son otro sistema sino otro
-- CONTENEDOR: mismo manejo, mucho menos volumen de solucion, y por eso su
-- nivel se revisa con mas frecuencia.
insert into ciehs.modules (code, name, system, crop, ph_min, ph_max, ce_min, ce_max, status, position, published, future, notes)
values
  ('MOD-DWC-01', 'Raiz Flotante 01', 'Raiz flotante (DWC)', 'Lechuga crespa',      5.5, 6.5, 1.2, 1.8, 'activo',  1, true, false, 'Modulo de mesa. Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-02', 'Raiz Flotante 02', 'Raiz flotante (DWC)', 'Lechuga crespa',      5.5, 6.5, 1.2, 1.8, 'activo',  2, true, false, 'Modulo de mesa. Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-03', 'Raiz Flotante 03', 'Raiz flotante (DWC)', 'Lechuga crespa',      5.5, 6.5, 1.2, 1.8, 'activo',  3, true, false, 'Modulo de mesa. Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-04', 'Raiz Flotante 04', 'Raiz flotante (DWC)', 'Lechuga crespa',      5.5, 6.5, 1.2, 1.8, 'activo',  4, true, false, 'Modulo de mesa. Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-05', 'Raiz Flotante 05', 'Raiz flotante (DWC)', 'Lechuga crespa',      5.5, 6.5, 1.2, 1.8, 'activo',  5, true, false, 'Modulo de mesa. Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-06', 'Raiz Flotante 06', 'Raiz flotante (DWC)', 'Lechuga crespa',      5.5, 6.5, 1.2, 1.8, 'activo',  6, true, false, 'Modulo de mesa. Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-07', 'Raiz Flotante 07', 'Raiz flotante (DWC)', 'Lechuga crespa',      5.5, 6.5, 1.2, 1.8, 'activo',  7, true, false, 'Modulo de mesa. Sin bomba de aire: oxigenacion por difusion en superficie y agitacion manual en cada control.'),
  ('MOD-DWC-08', 'Raiz Flotante 08', 'Raiz flotante (DWC)', 'Lechuga arrepollada', 5.5, 6.5, 1.2, 1.8, 'activo',  8, true, false, 'Modulo de mesa. Cabeza compacta: mas espacio entre plantas que la crespa.'),
  ('MOD-DWC-09', 'Raiz Flotante 09', 'Raiz flotante (DWC)', 'Lechuga arrepollada', 5.5, 6.5, 1.2, 1.8, 'activo',  9, true, false, 'Modulo de mesa. Cabeza compacta: mas espacio entre plantas que la crespa.'),
  ('MOD-DWC-10', 'Raiz Flotante 10', 'Raiz flotante (DWC)', 'Espinaca',            6.0, 6.8, 1.8, 2.3, 'activo', 10, true, false, 'Modulo de mesa. Es la especie mas sensible a la falta de oxigeno en la raiz: se vigila mas que el resto mientras no haya bomba de aire.'),
  ('MOD-DWC-11', 'Raiz Flotante 11', 'Raiz flotante (DWC)', 'Espinaca',            6.0, 6.8, 1.8, 2.3, 'activo', 11, true, false, 'Modulo de mesa. Es la especie mas sensible a la falta de oxigeno en la raiz: se vigila mas que el resto mientras no haya bomba de aire.'),
  ('MOD-DWC-12', 'Botella 12',       'Raiz flotante (DWC)', 'Cebolla china',       6.0, 7.0, 1.4, 1.8, 'activo', 12, true, false, 'BOTELLA reutilizada. Poco volumen de solucion: el nivel y la CE se desajustan antes, asi que se revisa con mas frecuencia que un modulo de mesa.'),
  ('MOD-DWC-13', 'Botella 13',       'Raiz flotante (DWC)', 'Cebolla china',       6.0, 7.0, 1.4, 1.8, 'activo', 13, true, false, 'BOTELLA reutilizada. Poco volumen de solucion: el nivel y la CE se desajustan antes, asi que se revisa con mas frecuencia que un modulo de mesa.'),
  ('MOD-DWC-14', 'Botella 14',       'Raiz flotante (DWC)', 'Cebolla china',       6.0, 7.0, 1.4, 1.8, 'activo', 14, true, false, 'BOTELLA reutilizada. Poco volumen de solucion: el nivel y la CE se desajustan antes, asi que se revisa con mas frecuencia que un modulo de mesa.'),
  ('MOD-DWC-15', 'Botella 15',       'Raiz flotante (DWC)', 'Cebolla china',       6.0, 7.0, 1.4, 1.8, 'activo', 15, true, false, 'BOTELLA reutilizada. Poco volumen de solucion: el nivel y la CE se desajustan antes, asi que se revisa con mas frecuencia que un modulo de mesa.')
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

-- Cualquier modulo que quedara de una carga anterior y no este en la lista de
-- arriba sobra: los quince son el inventario completo.
delete from ciehs.modules
 where code not in ('MOD-DWC-01','MOD-DWC-02','MOD-DWC-03','MOD-DWC-04','MOD-DWC-05',
                    'MOD-DWC-06','MOD-DWC-07','MOD-DWC-08','MOD-DWC-09','MOD-DWC-10',
                    'MOD-DWC-11','MOD-DWC-12','MOD-DWC-13','MOD-DWC-14','MOD-DWC-15');

-- ------------------------- 3) purga textual en el contenido ya publicado ---
-- La bitacora la escribe la coordinacion a mano, asi que puede arrastrar el
-- vocabulario viejo. Se normaliza sin borrar nada: solo se sustituye el nombre
-- de la especie renombrada y se suelta la referencia a codigos de modulo que
-- ya no existen (dejarla apuntando a un MOD-NFT-01 fantasma seria peor que
-- dejarla vacia).
update ciehs.crop_log
   set crop = 'Lechuga arrepollada'
 where crop ilike '%americana%';

update ciehs.crop_log
   set module_code = null
 where module_code is not null
   and module_code not in (select code from ciehs.modules);

-- ------------------------------------------------------- 4) comprobaciones
-- Deben devolver, respectivamente: 15 | 0 | el reparto 7 / 4 / 2 / 2
--   select count(*) from ciehs.modules;
--   select count(*) from ciehs.modules where code like 'PROY-%';
--   select crop, count(*) from ciehs.modules group by crop order by 2 desc;
