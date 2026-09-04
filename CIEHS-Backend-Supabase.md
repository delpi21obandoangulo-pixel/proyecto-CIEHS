---
title: CIEHS · Backend Supabase
aliases: [Esquema ciehs, Base de datos CIEHS, RLS CIEHS]
tags: [ciehs, supabase, postgres, rls, backend, aislamiento]
instancia: kumxtheybmqbfixatnok (compartida)
esquema: ciehs
estado: en produccion
actualizado: 2026-09-04
---

# CIEHS · Backend Supabase

Esquema de datos del portal. Índice en [[CIEHS]]. Ver también [[CIEHS-Portal-Educativo]],
[[CIEHS-Auditoria-Seguridad-Auth]] y [[CIEHS-Metodologia-Pedagogica]].

> [!important] Aislamiento estricto
> El portal usa **exclusivamente** el esquema `ciehs` de una instancia
> **compartida** con otros proyectos del ecosistema. Es la «opción tolerada» de
> la política de aislamiento: lo preferible sería un proyecto Supabase propio.
> Migrar después solo exige cambiar la URL y la clave publicable.

---

## 1. Reglas de convivencia en instancia compartida

- El cliente del navegador queda **forzado** a `db: { schema: 'ciehs' }`.
  Ninguna consulta del portal puede alcanzar `public` (Aura) ni `safary_kids`.
- **Nunca `supabase db push`.** El historial
  `supabase_migrations.schema_migrations` es global en esta instancia y
  escribirlo contaminaría a los demás proyectos. El DDL se aplica de forma
  aislada desde `db/01_schema.sql`, que es idempotente.
- Única referencia fuera del esquema: las claves foráneas a `auth.users`.

> [!caution] Consecuencia inevitable
> `auth.users` es común a toda la instancia: una cuenta del CIEHS existe en el
> mismo registro que las de los demás proyectos. Lo que impide el cruce es RLS
> más la tabla `ciehs.admins` — **probado**: un usuario autenticado que no
> figura en `admins` no escribe nada. Un proyecto propio eliminaría también
> esta condición.

**Blast radius compartido:** una caída o un agotamiento de conexiones de la
instancia afecta a los tres proyectos a la vez.

---

## 2. Tablas

| Tabla | Contenido | Lectura pública |
|---|---|---|
| `site_config` | Portada, KPIs y aviso institucional (**fila única**, `id = 1`) | sí |
| `modules` | Los 4 módulos y sus rangos objetivo de pH y CE | solo `published` |
| `telemetry_readings` | Lecturas de pH y CE con fecha y autor | solo de módulos publicados |
| `investigations` | Fichas de investigación completas | solo `published` |
| `resources` | Recursos para docentes | solo `published` |
| `qr_codes` | Destino y ubicación de cada código QR | solo `active` |
| `admins` | Quién puede escribir | **no** |

7 tablas · 13 políticas · RLS activo en las 7.

### Detalles que no son obvios

- `site_config` tiene `check (id = 1)`: es una fila única por diseño, no una
  tabla de filas.
- `telemetry_readings` **arranca vacía a propósito**. Sembrar mediciones
  inventadas en un portal científico escolar repetiría justo el defecto que se
  corrigió al retirar el rótulo falso de «tiempo real». La interfaz muestra un
  estado vacío honesto hasta que el equipo anote la primera lectura.
- `investigations.tags` es `text[]`; los nombres científicos van entre
  asteriscos (`*Lactuca sativa*`) y el portal los convierte en cursiva
  **después** de escapar el texto.
- `modules` conserva el código `MOD-DWC-02` aunque el módulo se llame «Raíz
  Flotante»: el código identifica el módulo **físico** y es lo que apunta su QR.

---

## 3. RLS

**Lectura pública** de lo publicado; **escritura** solo con sesión iniciada *y*
figurando en `ciehs.admins`.

```sql
-- La telemetria de un modulo no publicado tampoco se ve: si no, delataria
-- la existencia de un modulo que aun no se ha anunciado.
create policy telemetry_lectura_publica on ciehs.telemetry_readings
  for select to anon, authenticated
  using (exists (select 1 from ciehs.modules m
                 where m.id = module_id and m.published));
```

`ciehs.is_admin()` es `security definer` (las políticas necesitan consultar
`admins` aunque el llamante no pueda leerla) y **no es ejecutable por `anon`**:
solo se consulta tras iniciar sesión.

### Columnas vetadas al rol anónimo

`telemetry_readings.recorded_by` y `site_config.updated_by` guardan el uuid de
auth de una persona real. En instancia compartida ese uuid aparece también en
los otros proyectos, así que publicarlo permitiría correlacionar identidades.

> [!bug] Trampa de permisos, ya pisada
> Un `GRANT` a nivel de **tabla** cubre todas las columnas y **no se recorta con
> un `REVOKE` por columna**. Hay que retirar el permiso de tabla y conceder solo
> las columnas públicas. Consecuencia directa: el cliente debe pedir **columnas
> explícitas y nunca `*`** sobre esas dos tablas, o la consulta entera falla
> con 42501.

---

## 4. Capa de datos del navegador

`assets/js/ciehs-data.js` expone `window.CIEHSData`:

- `cargarPortal()` — una sola tanda de 5 consultas.
- `sesion()` · `entrar(email, pass)` · `salir()` · `esAdmin()`
- `guardarConfig(valores)` · `registrarLectura(lectura)`
- `ultimaLecturaPorModulo()` · `ultimaSincronizacion()`

`entrar()` no se conforma con la sesión: **comprueba además `esAdmin()`** y
cierra sesión si la cuenta no está autorizada, para que el panel no se abra en
un estado en el que todas las escrituras fallarían.

La clave publicable viaja en el código **a propósito**: está pensada para el
navegador y por sí sola no da acceso a nada. Quien protege los datos es RLS.

---

## 5. Puesta en marcha

### Exponer el esquema en la API — imprescindible

PostgREST solo sirve los esquemas declarados en la configuración del proyecto.
Es un ajuste **de plataforma**: no hay ajuste a nivel de rol, así que no se
puede hacer por SQL.

> Project Settings → API → **Exposed schemas** → añadir `ciehs`
> (sin quitar `public`, `graphql_public` ni `safary_kids`).

Sin ese paso el portal funciona igual, pero muestra el contenido estático y
avisa de que no hay conexión — el error `PGRST106` se traduce a un mensaje
legible precisamente porque se resuelve ahí y no tocando código ni base.

### Registrar un administrador

Crear el usuario en Authentication → Users y luego:

```sql
insert into ciehs.admins (user_id, email, display_name)
select id, email, 'Coordinación CIEHS'
from auth.users where email = 'CORREO_DEL_COORDINADOR'
on conflict (user_id) do nothing;
```

---

## 6. Pendientes

- [x] `investigations` se **lee** de la base y pinta la sección entera.
- [ ] Interfaz de **edición** de `investigations` y `resources` en el panel:
      hoy solo se editan por SQL.
- [ ] Subida de archivos para `resources.file_url` (Supabase Storage).
- [ ] Evaluar migración a proyecto Supabase propio → elimina el blast radius
      compartido y la convivencia en `auth.users`.
- [ ] Exportación de mediciones a CSV: los estudiantes deberían poder llevarse
      los datos a la hoja de cálculo.

---

## Enlaces

- [[CIEHS-Portal-Educativo]] — arquitectura del portal y alojamiento.
- [[CIEHS-Auditoria-Seguridad-Auth]] — autenticación y hallazgos de seguridad.
- [[CIEHS-Metodologia-Pedagogica]] — qué contenido pedagógico consume estos datos.
