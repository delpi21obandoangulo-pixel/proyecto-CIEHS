-- ============================================================================
-- CIEHS · Registro de autorizaciones de imagen (2026-09-13)
--
-- Aplicar de forma AISLADA (SQL Editor o psql). NO usar `supabase db push` ni
-- `apply_migration`: el historial supabase_migrations.schema_migrations es
-- global en esta instancia y contaminaría a Aura y a Safari (Sección 1.4).
--
-- AISLAMIENTO: todo dentro del esquema ciehs. No toca public ni safary_kids.
-- Idempotente.
--
-- ===================== LO QUE ESTA TABLA NO GUARDA ==========================
-- Ni nombres, ni apellidos, ni DNI, ni fecha de nacimiento, ni el escaneo del
-- papel firmado. NADA que identifique a una persona.
--
-- Eso no es una omisión: es el punto entero. El protocolo
-- (pendientes-coordinacion/02) dice que el original vive en papel bajo llave y
-- que el índice código -> estudiante vive en UNA hoja de cálculo local del
-- coordinador, que no entra ni en el repositorio -es público y el historial de
-- git es permanente- ni en la base -es una instancia compartida-.
--
-- Aquí solo viven códigos y fechas. Quien se llevara esta tabla entera vería
-- «AUT-2026-014 · vigente» y no sabría de quién es. El nombre solo existe en el
-- papel y en la hoja local del coordinador.
--
-- ¿Para qué sirve entonces? Para lo único que la base puede hacer bien:
-- responder «¿este código existe y sigue vigente?». Hoy `consent_ref` acepta
-- cualquier cosa que se teclee, y un campo que acepta cualquier cosa es
-- decorativo. A partir de aquí, un código inventado se rechaza.
-- ============================================================================

create table if not exists ciehs.autorizaciones (
  codigo     text primary key,
  anio       integer not null,
  vigente    boolean not null default true,
  alta       date    not null default current_date,
  revocada   date,
  -- Nota operativa del coordinador. NO es para el nombre del estudiante: es
  -- para cosas como «entregada en secretaría» o «pendiente de segunda firma».
  nota       text
);

comment on table ciehs.autorizaciones is
  'Códigos de autorización de uso de imagen. SIN datos personales: el índice código->estudiante vive solo en la hoja local del coordinador (ver pendientes-coordinacion/02).';
comment on column ciehs.autorizaciones.codigo is
  'AUT-<año>-<correlativo de 3 dígitos>, escrito a mano en el papel al recibirlo.';
comment on column ciehs.autorizaciones.nota is
  'Nota operativa. NUNCA el nombre del estudiante.';

-- El formato del código es el del protocolo, y se valida aquí para que un
-- descuido de tecleo no cree un codigo que luego nadie sabe localizar.
alter table ciehs.autorizaciones drop constraint if exists autorizaciones_formato;
alter table ciehs.autorizaciones add  constraint autorizaciones_formato
  check (codigo ~ '^AUT-[0-9]{4}-[0-9]{3}$');

-- Una revocación tiene fecha, y una autorización vigente no la tiene. Sin esto
-- se puede quedar una fila «no vigente» sin saber desde cuándo, que es justo el
-- dato que hace falta si alguien pregunta por qué salió una foto.
alter table ciehs.autorizaciones drop constraint if exists autorizaciones_revocacion_coherente;
alter table ciehs.autorizaciones add  constraint autorizaciones_revocacion_coherente
  check ((vigente and revocada is null) or (not vigente and revocada is not null));

-- La nota es operativa y corta. Un campo de texto largo invita a escribir ahí
-- lo que no debe estar en esta tabla.
alter table ciehs.autorizaciones drop constraint if exists autorizaciones_nota_corta;
alter table ciehs.autorizaciones add  constraint autorizaciones_nota_corta
  check (nota is null or char_length(nota) <= 120);

-- ---------------------------------------------------------------- RLS ------
-- Solo administración, y también para LEER. Un listado público de códigos
-- vigentes no revela nombres, pero sí cuántos menores tienen autorización y
-- permitiría tantear códigos: no hay ninguna razón para que el visitante lo vea.
alter table ciehs.autorizaciones enable row level security;

drop policy if exists "autorizaciones_admin_todo" on ciehs.autorizaciones;
create policy "autorizaciones_admin_todo"
  on ciehs.autorizaciones for all to authenticated
  using (ciehs.is_admin()) with check (ciehs.is_admin());

-- ============================================================================
-- El enlace con los aportes.
--
-- `consent_ref` ya existía en ciehs.evidencias desde db/03, pero suelto: era
-- texto libre. Aquí se añade a `aportes` Y se ata con clave ajena, que es lo que
-- convierte el campo en una comprobación de verdad.
--
-- Lo rellena el COORDINADOR al aprobar el aporte, nunca quien lo sube. El
-- formulario de aportes es público: si el campo estuviera ahí, cualquiera podría
-- tantear códigos -AUT-2026-014 es adivinable- hasta acertar uno y firmar con
-- apellido completo respaldándose en la autorización de otra persona.
-- ============================================================================

alter table ciehs.aportes
  add column if not exists consent_ref text;

alter table ciehs.aportes drop constraint if exists aportes_consent_ref_fk;
alter table ciehs.aportes add  constraint aportes_consent_ref_fk
  foreign key (consent_ref) references ciehs.autorizaciones(codigo)
  on update cascade on delete restrict;

comment on column ciehs.aportes.consent_ref is
  'Código de la autorización que respalda publicar el nombre completo. Lo pone el coordinador al aprobar, nunca quien sube el aporte.';

-- Índice para la comprobación de vigencia, que es la consulta que se hará en
-- cada aprobación.
create index if not exists autorizaciones_vigentes_idx
  on ciehs.autorizaciones (vigente, anio);

-- ============================================================================
-- LO QUE ESTO NO RESUELVE, y conviene no creer que sí
--
-- La base puede garantizar que un código existe y está vigente. NO puede
-- garantizar que el nombre escrito en `autor_nombre` corresponda a la persona de
-- ese código, ni distinguir un nombre de pila de un apellido. Eso lo sostiene el
-- ojo del coordinador al aprobar, y el papel bajo llave.
--
-- Y nada de esto entra en funcionamiento hasta que existan autorizaciones
-- firmadas de verdad: faltan los dos pasos humanos de
-- pendientes-coordinacion/02 -confirmar la custodia y repartir las fichas-.
-- Una tabla vacía no autoriza nada.
-- ============================================================================
