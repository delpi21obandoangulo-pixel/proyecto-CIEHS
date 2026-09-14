-- ============================================================================
-- CIEHS · Autoría de los aportes (2026-09-13)
--
-- Aplicar de forma AISLADA (SQL Editor o psql). NO usar `supabase db push` ni
-- `apply_migration`: el historial supabase_migrations.schema_migrations es
-- global en esta instancia y contaminaría a Aura y a Safari (Sección 1.4).
--
-- AISLAMIENTO: todo dentro del esquema ciehs. No toca public ni safary_kids.
-- Idempotente.
--
-- PARA QUE
-- --------
-- Un aporte se firmaba con `equipo` y `grado` y nada más: quien hacía el
-- trabajo no aparecía. Para un portal que publica investigación escolar eso es
-- un problema real — el crédito es parte de lo que se enseña.
--
-- ======================= POR QUE LOS CAMPOS SON ASI =========================
-- La página /privacidad del portal es un compromiso público con las familias, y
-- dice literalmente que NUNCA se publican «apellidos completos de estudiantes».
-- No prohíbe el nombre de pila, y no dice nada de los docentes, que son
-- adultos. De ahí sale la forma de estas columnas:
--
--   · DOCENTE    -> autor_nombre lleva nombre y apellidos. Es un adulto que
--                   firma su trabajo.
--   · ESTUDIANTE -> autor_nombre lleva SOLO el nombre de pila y autor_inicial
--                   la inicial del apellido. Se publica «María Q. · 4.° A».
--
-- El CHECK de autor_inicial (<= 2 caracteres) no es cosmética: es lo que hace
-- que la política se cumpla POR CONSTRUCCION y no por confianza. Un formulario
-- se puede saltar; una restricción de la base, no. Si alguien intenta meter el
-- apellido entero ahí, la fila se rechaza.
--
-- Los colaboradores van en jsonb porque son una lista de personas, no un texto:
-- guardar «José M., Lucía T.» en una columna de texto obligaría a parsear
-- después para pintarlos, y a nadie le sale bien parsear nombres.
-- ============================================================================

alter table ciehs.aportes
  add column if not exists autor_nombre  text,
  add column if not exists autor_inicial text,
  add column if not exists colaboradores jsonb not null default '[]'::jsonb;

-- Nombre de pila o nombre completo del docente. 80 basta y sobra.
alter table ciehs.aportes drop constraint if exists aportes_autor_corto;
alter table ciehs.aportes add  constraint aportes_autor_corto
  check (autor_nombre is null or char_length(autor_nombre) between 2 and 80);

-- LA restricción que sostiene la política de menores.
alter table ciehs.aportes drop constraint if exists aportes_inicial_corta;
alter table ciehs.aportes add  constraint aportes_inicial_corta
  check (autor_inicial is null or char_length(autor_inicial) <= 2);

-- Una lista, y no más de diez: un aporte escolar con quince autores es un error
-- de tecleo, y sin tope esta columna es una vía para inflar la fila.
alter table ciehs.aportes drop constraint if exists aportes_colab_lista;
alter table ciehs.aportes add  constraint aportes_colab_lista
  check (jsonb_typeof(colaboradores) = 'array' and jsonb_array_length(colaboradores) <= 10);

-- Cada colaborador: { "n": nombre, "i": inicial, "g": grado }. Se valida la
-- forma aquí y no solo en el cliente, porque el cliente es del visitante.
alter table ciehs.aportes drop constraint if exists aportes_colab_forma;
alter table ciehs.aportes add  constraint aportes_colab_forma
  check (
    not exists (
      select 1
        from jsonb_array_elements(colaboradores) as c
       where jsonb_typeof(c) <> 'object'
          or coalesce(char_length(c ->> 'n'), 0) not between 2 and 80
          or coalesce(char_length(c ->> 'i'), 0) > 2
          or coalesce(char_length(c ->> 'g'), 0) > 40
    )
  );

comment on column ciehs.aportes.autor_nombre  is
  'Docente: nombre y apellidos. Estudiante: SOLO el nombre de pila (ver /privacidad).';
comment on column ciehs.aportes.autor_inicial is
  'Inicial del apellido del estudiante. Max 2 caracteres: es lo que impide publicar apellidos de menores.';
comment on column ciehs.aportes.colaboradores is
  'Lista [{n,i,g}] de quienes colaboran, con la misma regla que el autor.';

-- ============================================================================
-- No se tocan las políticas RLS: estas columnas viajan en el mismo INSERT en
-- cuarentena que ya existía, y se leen con la misma política de lectura de las
-- filas aprobadas. Añadir columnas no cambia quién puede escribir ni leer.
-- ============================================================================
