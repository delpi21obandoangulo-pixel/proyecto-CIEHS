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
en esa tabla (probado). Migrar a un proyecto Supabase propio elimina también
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
| `modules` | Los 4 módulos y sus rangos objetivo de pH y CE | solo `published` |
| `telemetry_readings` | Lecturas de pH y CE con fecha y autor | solo de módulos publicados |
| `investigations` | Fichas de investigación | solo `published` |
| `resources` | Recursos para docentes | solo `published` |
| `qr_codes` | Destino y ubicación de cada código QR | solo `active` |
| `admins` | Quién puede escribir | no |

La escritura exige sesión iniciada **y** figurar en `ciehs.admins`.
