---
title: CIEHS · Backend Supabase
aliases: [Esquema ciehs, Base de datos CIEHS, RLS CIEHS]
tags: [ciehs, supabase, postgres, rls, backend, aislamiento]
instancia: kumxtheybmqbfixatnok (compartida)
esquema: ciehs
bucket: ciehs-evidencias
estado: en produccion
actualizado: 2026-09-09
---

# CIEHS · Backend Supabase

Esquema de datos del portal. Índice en [[CIEHS]]. Ver también [[CIEHS-Portal-Educativo]],
[[CIEHS-Auditoria-Seguridad-Auth]] y [[CIEHS-Metodologia-Pedagogica]].

> [!important] Aislamiento estricto
> El portal usa **exclusivamente** el esquema `ciehs` de una instancia
> **compartida** con Aura (`public`) y Safari (`safary_kids`). Es la «opción
> tolerada» de la política de aislamiento.
>
> Un proyecto Supabase propio sería lo ideal, pero **no cabe en el plan
> gratuito**: Supabase permite 2 proyectos y ya están ocupados por Aura y
> Kunturmasha; un tercero sería de pago. Por eso el CIEHS convive en el proyecto
> de Aura, y no es una decisión reversible sin coste. Si algún día se paga o se
> libera un proyecto, migrar solo exige cambiar la URL y la clave publicable: el
> esquema y el código no cambian.

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
| `evidencias` | Galería «El CIEHS en acción». Imágenes en el bucket `ciehs-evidencias`, no en git → §7 | solo `published` |
| `modules` | Los **15 módulos DWC** más las dos proyecciones (`PROY-NFT`, `PROY-VER`) y sus rangos objetivo de pH y CE | solo `published` |
| `telemetry_readings` | Lecturas de pH y CE con fecha y autor | solo de módulos publicados |
| `investigations` | Fichas de investigación completas | solo `published` |
| `resources` | Recursos del espacio docente (con `file_kind`, `duration`, `featured`) | solo `published` |
| `qr_codes` | Destino y ubicación de cada código QR | solo `active` |
| `field_notes` | **Carpeta de campo digital**: artículos, informes, fotos y evidencias | solo `published` |
| `crop_log` | **Bitácora agronómica**: lote, siembra, semana, pH, CE, fase y cosecha | solo `published` |
| `orders` | Pedidos de cosecha de la comunidad | **no** — solo administración |
| `community_comments` | Caja de comentarios, moderada antes de publicar | solo `published` |
| `transparency_entries` | Ingresos y egresos del panel de transparencia | solo `published` |
| `admins` | Quién puede escribir | **no** |

12 tablas · RLS activo en las 12.

### Escritura abierta al público: las dos excepciones

`orders` y `community_comments` son las únicas tablas donde el rol `anon` puede
**insertar**, porque son formularios abiertos de la comunidad. Ninguna de las dos
queda por eso expuesta:

- `orders` **no tiene política de lectura pública en absoluto**. Un pedido lleva
  nombre y contacto de una familia; se escribe y solo lo lee la administración.
  La política de alta exige además `status = 'pendiente'`: nadie puede darse de
  alta un pedido ya «entregado».
- `community_comments` nace con `published = false` forzado por el `with check`
  de la política de alta, junto con `reply is null`. Nadie puede autopublicarse
  ni fabricar una respuesta del CIEHS. La lectura pública solo alcanza a lo que
  un administrador ha aprobado.

Ambos formularios llevan además un campo trampa (*honeypot*) en el cliente y
`check` de longitud en las columnas. Probado con el rol anónimo: inserta, y al
intentar leer devuelve cero filas.

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
- [ ] Migración a proyecto Supabase propio: **bloqueada por el plan gratuito**
      (2 proyectos, ocupados por Aura y Kunturmasha). Queda para cuando se pague
      o se libere uno; entonces elimina el blast radius y la convivencia en
      `auth.users`.
- [ ] Exportación de mediciones a CSV: los estudiantes deberían poder llevarse
      los datos a la hoja de cálculo.
- [x] Autoría (`recorded_by`, `updated_by`) la pone el servidor, no el cliente
      → [[CIEHS-Auditoria-Seguridad-Auth]].

## 7. Galería de evidencias: imágenes fuera de git

Añadido el 2026-09-09. Es la única parte del portal cuyo contenido **no** puede
vivir en el repositorio, y el motivo es de privacidad, no técnico.

### El bucket

`ciehs-evidencias`, público en lectura, límite de 6 MB, solo `image/jpeg`,
`image/png` y `image/webp`.

> [!warning] Storage es de toda la instancia
> Los *buckets* no están dentro del esquema `ciehs`: viven en `storage` y son
> comunes a Aura y Safari. Se aplica la misma regla de convivencia que a las
> tablas: **un bucket propio con nombre propio**, y jamás tocar `avatars`,
> `profile-media` ni `battle-videos`, que son de Aura.

Políticas sobre `storage.objects`, acotadas por `bucket_id`:

| Operación | Quién |
|---|---|
| `select` | cualquiera (la galería carga sin sesión) |
| `insert` / `update` / `delete` | solo `ciehs.is_admin()` |

### La tabla `ciehs.evidencias`

| Columna | Para qué |
|---|---|
| `storage_path` | Nombre del objeto en el bucket. Único. |
| `title`, `eyebrow`, `body` | Texto de la lámina |
| `alt` | Obligatorio: es lo que oye quien no ve la imagen |
| `width`, `height` | Se leen del archivo al subirlo, para reservar el hueco y evitar el salto de maquetación |
| `consent_ref` | **Dónde está la autorización firmada.** Sin esto, meses después nadie sabe con qué respaldo se publicó cada rostro |
| `position`, `published` | Orden y visibilidad |

### Por qué no en el repositorio

El repositorio es **público** y el historial de git es permanente. Un commit con
la cara de un menor no se deshace: queda en el historial, en los clones y en los
forks aunque se borre el archivo. Pero
[[CIEHS-Privacidad-Menores]] promete que la autorización es **revocable en
cualquier momento** (§3) y que el contenido se retira sin pedir explicaciones
(§6). Con git esa promesa no se puede cumplir; con el bucket sí: eliminar una
evidencia desde el panel borra **la fila y el objeto**.

Por eso `CIEHSData.eliminarEvidencia()` borra primero el archivo y después la
fila. Dejar el objeto huérfano sería lo peor de los dos mundos: invisible en el
portal pero todavía descargable por URL directa.

### Respaldo estático

La portada trae cuatro láminas en el HTML —solo infraestructura, sin personas—.
Si la base no responde o la galería está vacía, se quedan esas. Cuando la base
entrega filas, sustituyen a las estáticas y el carrusel se recompone
(`window.CIEHS.recomponerGaleria()`).

### La CSP hubo que ampliarla

`img-src` solo admitía `'self'` y `data:`. Ahora incluye el origen de Supabase
—o las imágenes se bloquearían en producción sin previo aviso— y `blob:`,
porque al subir se mide el archivo cargándolo con `URL.createObjectURL`.

### Quién puede subir

Solo un administrador del CIEHS, desde la pestaña **Evidencias** del panel, con
su propia sesión. No hay ninguna vía automatizada, y es deliberado: la
`service_role` de esta instancia pertenece a Aura y Safari según su ficha de la
bóveda, y reutilizarla para el CIEHS sería cruce de credenciales entre
proyectos.


---

## Enlaces

- [[CIEHS-Portal-Educativo]] — arquitectura del portal y alojamiento.
- [[CIEHS-Auditoria-Seguridad-Auth]] — autenticación y hallazgos de seguridad.
- [[CIEHS-Metodologia-Pedagogica]] — qué contenido pedagógico consume estos datos.
- [[CIEHS-Arena-Juego]] — un marcador entre clases necesitaría una tabla aquí.
- [[CIEHS-Pentest-2026-09]] — el pentest y el argumento del proyecto propio.
- [[CIEHS-Tienda-Escolar]] — catálogo, reservas de cosecha y transparencia.
