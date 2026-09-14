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

-- ============================================================================
-- Cada colaborador: { "n": nombre, "i": inicial, "g": grado }.
--
-- POR QUE ESTO ES UNA FUNCION Y NO UN CHECK A SECAS
-- ------------------------------------------------
-- Validar la lista exige mirar CADA elemento, y recorrer un jsonb obliga a
-- desplegarlo con jsonb_array_elements, que es una consulta. Un CHECK no admite
-- subconsultas: PostgreSQL corta con «0A000: cannot use subquery in check
-- constraint». Una llamada a función sí se admite, así que el recorrido vive
-- aquí dentro y el CHECK solo pregunta sí o no.
--
-- La función es IMMUTABLE de verdad: depende únicamente de su argumento, no lee
-- ninguna tabla ni el reloj. Esa es la condición para que valga en un CHECK.
--
-- Va con search_path vacío y todo calificado con pg_catalog. En una instancia
-- compartida —Aura en public, Safari en safary_kids— dejar que el search_path
-- del que llama decida qué `jsonb_typeof` se ejecuta sería precisamente el tipo
-- de acoplamiento que este esquema existe para evitar.
-- ============================================================================
create or replace function ciehs.colaboradores_validos(lista jsonb)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $fn$
  select case
    when lista is null then true
    when pg_catalog.jsonb_typeof(lista) <> 'array' then false
    else coalesce((
      select pg_catalog.bool_and(
             pg_catalog.jsonb_typeof(c) = 'object'
         and coalesce(pg_catalog.length(c ->> 'n'), 0) between 2 and 80
         and coalesce(pg_catalog.length(c ->> 'i'), 0) <= 2
         and coalesce(pg_catalog.length(c ->> 'g'), 0) <= 40
      )
      from pg_catalog.jsonb_array_elements(lista) as c
    ), true)   -- lista vacía: bool_and sobre cero filas da NULL, y eso es válido
  end;
$fn$;

comment on function ciehs.colaboradores_validos(jsonb) is
  'Valida la lista de colaboradores de ciehs.aportes. Existe porque un CHECK no admite subconsultas y recorrer un jsonb obliga a una.';

-- La ejecuta quien inserta, que es el visitante anónimo del formulario.
grant execute on function ciehs.colaboradores_validos(jsonb) to anon, authenticated;

-- Se valida la forma en la base y no solo en el cliente, porque el cliente es
-- del visitante.
alter table ciehs.aportes drop constraint if exists aportes_colab_forma;
alter table ciehs.aportes add  constraint aportes_colab_forma
  check (ciehs.colaboradores_validos(colaboradores));

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
