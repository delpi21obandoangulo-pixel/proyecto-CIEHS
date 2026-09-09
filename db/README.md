# Base de datos del CIEHS

## Aislamiento

El portal usa **exclusivamente** el esquema `ciehs` de la instancia Supabase
`kumxtheybmqbfixatnok`, compartida con otros proyectos del ecosistema.

- El cliente del navegador queda forzado a ese esquema (`db: { schema: 'ciehs' }`
  en `assets/js/ciehs-data.js`). Ninguna consulta del portal puede alcanzar
  `public`, `safary_kids` ni ningún otro esquema.
- El DDL **no** se aplica con `supabase db push`: el historial
  `supabase_migrations.schema_migrations` es global en esta instancia y
  escribirlo contaminaría a los demás proyectos. Se aplica el SQL de forma
  aislada (`01_schema.sql`).
- Única referencia fuera de `ciehs`: las claves foráneas a `auth.users`, que es
  el registro de identidades de toda la instancia y no puede duplicarse.

## Consecuencia conocida de compartir instancia

`auth.users` es común a todos los proyectos de esta base. Una cuenta de
administración del CIEHS existe en el mismo registro que las de los demás
proyectos. Lo que impide el cruce es RLS más la tabla `ciehs.admins`: tener
sesión no da ningún permiso sobre los datos del CIEHS si el `user_id` no está
en esa tabla (probado). Un proyecto propio eliminaria tambien
esta condición y solo exige cambiar la URL y la clave publicable.

## Puesta en marcha

### 1. Exponer el esquema en la API  ← imprescindible

PostgREST solo sirve los esquemas declarados en la configuración del proyecto.
Es un ajuste de plataforma: no se puede hacer por SQL.

> Supabase → Project Settings → API → **Exposed schemas** → añadir `ciehs`
> (sin quitar `public`, `graphql_public` ni `safary_kids`).

Mientras no se haga, el portal funciona igual pero muestra el contenido
estático y avisa de que no hay conexión.

Comprobación:

```bash
curl -H "apikey: <clave publicable>" -H "Accept-Profile: ciehs" \
  "https://kumxtheybmqbfixatnok.supabase.co/rest/v1/modules?select=code"
```

### 2. Crear la cuenta de administración

En Supabase → Authentication → Users → **Add user**, con el correo del
coordinador y una contraseña que solo conozca esa persona. Después, darle
permiso en el CIEHS:

```sql
insert into ciehs.admins (user_id, email, display_name)
select id, email, 'Coordinación CIEHS'
from auth.users
where email = 'CORREO_DEL_COORDINADOR'
on conflict (user_id) do nothing;
```

Sin esa fila, la cuenta puede iniciar sesión pero no escribe nada: el panel la
rechaza y RLS también.

## Tablas

| Tabla | Contenido | Lectura pública |
|---|---|---|
| `site_config` | Portada, KPIs y aviso institucional (fila única) | sí |
| `modules` | Los 15 módulos DWC y las 2 proyecciones, con sus rangos de pH y CE | solo `published` |
| `telemetry_readings` | Lecturas de pH y CE con fecha y autor | solo de módulos publicados |
| `investigations` | Fichas de investigación | solo `published` |
| `resources` | Recursos del espacio docente | solo `published` |
| `qr_codes` | Destino y ubicación de cada código QR | solo `active` |
| `field_notes` | Carpeta de campo digital | solo `published` |
| `crop_log` | Bitácora agronómica por lote | solo `published` |
| `orders` | Pedidos de cosecha | **no** — solo administración |
| `community_comments` | Caja de comentarios, moderada | solo `published` |
| `transparency_entries` | Ingresos y egresos publicados | solo `published` |
| `evidencias` | Galería «El CIEHS en acción»; imágenes en el bucket, no en git | solo `published` |
| `registros_campo` | Carpeta de campo digital: mediciones de los estudiantes | solo `published` |
| `aportes` | Fotos, vídeos y trabajos que suben los equipos; bucket privado en cuarentena | solo `published` |
| `resultados` | Mediciones de resultado por tratamiento de cada investigación | solo `published` |
| `productos` | Catálogo de la tienda, con estado y fecha de disponibilidad | solo `published` |
| `pedido_lineas` | Detalle de cada reserva | **no** — solo administración |
| `admins` | Quién puede escribir | no |

La escritura exige sesión iniciada **y** figurar en `ciehs.admins`, con tres
excepciones deliberadas: cualquiera puede **insertar** en `orders`, en
`community_comments`, en `registros_campo`, en `aportes`, en `resultados` y en `pedido_lineas`, porque son los formularios
abiertos de la comunidad y de los estudiantes. Ni
una ni otra queda expuesta por ello — `orders` no tiene ninguna política de
lectura pública, y un comentario nace forzado a `published = false`, de modo que
solo aparece en el portal cuando un administrador lo aprueba. `registros_campo`
sigue exactamente esa misma regla.

> **Al insertar desde el cliente, no encadenes `.select()`.** El `RETURNING`
> obliga a Postgres a evaluar la política de *lectura* sobre la fila recién
> creada, que nace con `published = false` y por tanto no es legible: el error
> que devuelve es un «new row violates row-level security policy» que despista,
> porque parece un fallo de escritura y no lo es.

## Aplicar los cambios

`01_schema.sql` crea el esquema base; `02_infraestructura_2026.sql` añade la
infraestructura real (15 módulos DWC, sin bomba de aire) y las tablas de las
secciones nuevas; `03_evidencias.sql` crea el bucket `ciehs-evidencias` y la
tabla de la galería de la portada; `04_registros_campo.sql` crea la carpeta de
campo digital; `05_aportes.sql` la bandeja de aportes en cuarentena; y
`06_resultados.sql` los resultados por tratamiento; `07_tienda.sql` el catálogo y
las líneas de pedido; y `08_tienda_estados.sql` el estado «próximo a cosecha» y
el destino canónico del gasto. Todos son idempotentes y se aplican
**de forma aislada** (SQL
Editor o `execute_sql`), nunca con `supabase db push` ni `apply_migration`: el
historial `supabase_migrations.schema_migrations` es global en esta instancia
compartida y escribirlo contaminaría a los demás proyectos.
