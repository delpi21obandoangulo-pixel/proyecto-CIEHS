---
title: CIEHS · Backend Supabase
aliases: [Esquema ciehs, Base de datos CIEHS, RLS CIEHS]
tags: [ciehs, supabase, postgres, rls, backend, aislamiento]
instancia: kumxtheybmqbfixatnok (compartida)
esquema: ciehs
bucket: ciehs-evidencias
estado: en produccion
actualizado: 2026-09-13
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

> [!warning] Este inventario está incompleto
> La tabla lista 13 filas y dice «12 tablas», y además **faltan** las que
> llegaron después del 2026-09-09: `aportes` (→ §10), y las de `db/16` y `db/17`
> — `textos`, `imagenes`, `arena_preguntas`, `acceso_intentos`, `acceso_config`.
> No lo corrijo a ojo: rehacer el inventario pide contarlo contra la base, y eso
> queda como pendiente en §6.

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
- [x] `get_advisors` sobre el esquema `ciehs`. Hecho el 2026-09-10: tres índices
      de cobertura añadidos (`db/13_indices_fk.sql`) y el resto documentado como
      aceptado → [[CIEHS-Auditoria-Seguridad-Auth]] §9.
- [ ] Migración a proyecto Supabase propio: **bloqueada por el plan gratuito**
      (2 proyectos, ocupados por Aura y Kunturmasha). Queda para cuando se pague
      o se libere uno; entonces elimina el blast radius y la convivencia en
      `auth.users`.
- [x] Exportación de mediciones a CSV. Hecho el 2026-09-10: botón en el visor
      de la carpeta de campo, un archivo por módulo → §8.
- [x] Autoría (`recorded_by`, `updated_by`) la pone el servidor, no el cliente
      → [[CIEHS-Auditoria-Seguridad-Auth]].
- [x] Firma de quien publica un aporte. Hecho el 2026-09-13, `db/18` → §10.
- [x] Registro de autorizaciones de imagen. Hecho el 2026-09-13, `db/19` → §11.
      **En producción y validado contra la base real**, pero la tabla está
      vacía: no autoriza nada hasta que existan fichas firmadas
      → [[pendientes-coordinacion/02-autorizacion-de-imagen|02 · Autorización de imagen]].
- [ ] **Rehacer el inventario de tablas del §2 contra la base.** Está desfasado:
      dice «12 tablas» sobre una lista de 13 y le faltan al menos seis de
      `db/16`, `db/17` y `db/18`. Pide contarlo, no completarlo de memoria.

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

## 9. Adjuntos de la carpeta de campo, y una URL que no podía funcionar

El formulario de la carpeta solo aceptaba un **enlace**. Eso invitaba al fallo
que se acabó dando: se guardó `blob:https://web.whatsapp.com/0a30fc1f-…`,
copiado con «copiar dirección de la imagen» desde WhatsApp Web.

> [!bug] Por qué una URL `blob:` no puede funcionar
> Es una referencia a la **memoria de una pestaña concreta**. Vive mientras esa
> pestaña está abierta y solo dentro de ella. Fuera, no apunta a nada — ni en
> otro navegador, ni en otro equipo, ni al día siguiente.
>
> El campo era `type="url"` y `blob:` **es** una URL válida, así que el
> formulario la aceptó sin rechistar. En el portal aparecía el botón «Ver el
> archivo adjunto» y no abría nada.

### Qué se hizo

1. **Subida real**, a un bucket propio `ciehs-carpeta` — público, 25 MB,
   admitiendo imagen, vídeo, audio, PDF y ofimática. Bucket propio y no
   `ciehs-evidencias` porque aquel admite solo imágenes de 6 MB y está atado al
   protocolo de imagen de menores.
2. En `media_url` se guarda la **ruta dentro del bucket**;
   `urlArchivoCarpeta()` la resuelve. Si lo que hay es una URL absoluta —un
   enlace externo legítimo— se respeta tal cual.
3. El formulario **rechaza** `blob:` y `data:` con un mensaje que dice qué
   hacer en su lugar, y el portal no pinta el enlace si no se resuelve: mejor
   ningún botón que un botón que no lleva a ningún lado.
4. Se vació el `media_url` roto. No se puede reparar: el archivo original
   nunca llegó a salir del navegador.

> [!warning] Lo que este formulario NO hace
> **No pasa por el editor que tapa las caras.** Si en la imagen o el vídeo
> aparece un estudiante, va por *Evidencias*. El formulario lo advierte, pero
> conviene saber que la advertencia es la única defensa aquí →
> [[CIEHS-Privacidad-Menores]].

---

## 8. Llevarse las mediciones: el CSV

Un dato que solo se puede mirar en una gráfica del portal no es del estudiante:
es del portal. El botón **Descargar CSV** del visor de la carpeta de campo
devuelve la medición a sus manos — para promediarla, graficarla de otra forma o
pegarla en el informe.

### Qué exporta

Un archivo **por módulo**, con **todas** sus variables, no solo la que está
dibujada: en una hoja de cálculo lo útil es la tabla entera.

| Columna | Origen |
|---|---|
| `modulo`, `fecha` | `module_code`, `medido_en` |
| `ph`, `ce_ms_cm`, `temp_c`, `altura_cm`, `hojas` | las cinco variables de `ciehs.registros_campo` |
| `equipo`, `grado` | atribución del trabajo — nunca el nombre de un menor |
| `estado` | `validado` o `pendiente de validar` |
| `nota` | la observación de quien midió |

Van también **los registros propios todavía pendientes de validar**, marcados en
la columna `estado`. Son los que el estudiante acaba de tomar, y es justo lo
que quiere llevarse. La gráfica ya los distingue con su propia leyenda, así que
el CSV no inventa una distinción nueva: refleja la que ya se ve.

### Por qué separador `;` y coma decimal

> [!important] Con el formato "correcto" la función sería inútil aquí
> El estándar internacional (RFC 4180) es coma como separador y punto decimal.
> Abierto en el **Excel en español** que hay en la institución, ese archivo mete
> la fila entera en una sola celda: Excel usa el separador de lista del sistema,
> que en es-PE es `;`.
>
> Así que el archivo se genera **para el Excel de aquí**: separador `;` y coma
> decimal. Google Sheets y LibreOffice lo detectan sin problema.

El archivo empieza con **BOM UTF-8**. Sin él, Excel abre el CSV en la
codificación del sistema y «módulo» se lee «mÃ³dulo». Las líneas terminan en
**CRLF**, que es lo que espera Excel y lo que dice el RFC.

Las notas se entrecomillan si llevan `;`, comillas o un salto de línea —
si no, una observación como «se repuso agua; bajó el nivel» partiría la fila
en dos.

### Detalles de implementación

- Se genera **en el navegador** con `Blob` + `URL.createObjectURL`. No hay
  petición al servidor: los datos ya están en el snapshot.
- El `objectURL` se revoca a los 30 s. Sin eso el archivo se queda en memoria
  hasta recargar la página.
- La descarga por `blob:` **no infringe la CSP** de producción: las directivas
  de *fetch* no gobiernan un `<a download>`. Comprobado inyectando la política
  de `vercel.json` en la página y descargando sin violaciones.
- El botón se deshabilita y dice por qué cuando el módulo elegido no tiene
  mediciones. Un botón que no hace nada al pulsarlo es peor que uno apagado.


---

## 10. La autoría de los aportes, y un CHECK que no se podía escribir

`db/18_autoria_aportes.sql`, aplicada el **2026-09-13**. Añade a `ciehs.aportes`
la firma de quien publica. El porqué pedagógico y la regla de privacidad que da
forma a las columnas están en [[CIEHS-Privacidad-Menores]] §2 ter; aquí queda lo
que hace falta para entender el esquema.

| Columna | Tipo | Para qué |
|---|---|---|
| `autor_nombre` | `text` | Docente: nombre y apellidos. Estudiante: **solo el nombre de pila** |
| `autor_inicial` | `text` | Inicial del apellido del estudiante. Máx. 2 caracteres |
| `colaboradores` | `jsonb not null default '[]'` | Lista `[{n,i,g}]`, misma regla que el autor |

Los colaboradores van en `jsonb` y no en texto porque son **una lista de
personas**, no una frase: guardar «José M., Lucía T.» obligaría a parsear nombres
después para pintarlos, y parsear nombres no le sale bien a nadie.

### Las cuatro restricciones

| Restricción | Qué impide |
|---|---|
| `aportes_autor_corto` | Nombre fuera de 2–80 caracteres |
| `aportes_inicial_corta` | **La que sostiene la política de menores**: `char_length(autor_inicial) <= 2` |
| `aportes_colab_lista` | Que no sea un array, o que pase de 10 elementos |
| `aportes_colab_forma` | Un colaborador mal formado: sin nombre útil, con apellido entero, con grado larguisimo |

### El error que obligó a reescribirlo: `0A000`

La primera versión de `aportes_colab_forma` recorría la lista así:

```sql
check (not exists (select 1 from jsonb_array_elements(colaboradores) as c where ...))
```

Y el script entero falló al aplicarlo:

> `ERROR: 0A000: cannot use subquery in check constraint`

**Un CHECK no admite subconsultas.** Y desplegar un `jsonb` para mirar elemento
por elemento obliga a `jsonb_array_elements`, que es exactamente eso. Como el
script va en una sola tanda, no se aplicó **nada**: ni las tres columnas ni las
otras tres restricciones, que sí eran válidas.

La salida es que una **llamada a función** sí se admite dentro de un CHECK. El
recorrido se mudó a `ciehs.colaboradores_validos(jsonb)` y el CHECK se quedó
preguntando sí o no:

```sql
create or replace function ciehs.colaboradores_validos(lista jsonb)
returns boolean language sql immutable parallel safe set search_path = ''
```

Tres decisiones de esa firma que no son adorno:

- **`immutable`** es la condición para poder usarla en un CHECK, y aquí es cierto
  de verdad: depende solo de su argumento, no lee ninguna tabla ni el reloj.
- **`set search_path = ''`** con todo calificado como `pg_catalog.…`. En una
  instancia compartida con Aura (`public`) y Safari (`safary_kids`), dejar que el
  `search_path` de quien llama decida qué `jsonb_typeof` se ejecuta sería
  justamente el acoplamiento que el esquema propio existe para evitar (§1).
- **`pg_catalog.length` y no `char_length`**, para no depender de cómo resuelve
  un alias del estándar SQL con el `search_path` cerrado.

> [!tip] La lección, más allá de esta tabla
> Si una restricción necesita **recorrer** algo —un array, un jsonb— no cabe en
> un CHECK tal cual. Saca el recorrido a una función `immutable` y deja el CHECK
> como una pregunta de sí o no.

### Comprobado, no supuesto

El 2026-09-13, contra la base real: cuatro intentos de violar la política,
rechazados por la restricción que tocaba y sin dejar fila — apellido entero en
`autor_inicial`, colaborador con apellido entero, once colaboradores, y
colaborador con nombre de una letra. Los dos de `aportes_colab_forma` son la
prueba de que la función se ejecuta bien **como rol `anon`** con el `search_path`
cerrado. Y un alta válida con firma completa volvió de la base idéntica a como se
envió.

### Degradación mientras una migración no está aplicada

El patrón que usó `ciehs-data.js` aquí vale para cualquier columna nueva:

- La lectura pide las columnas nuevas y, si el servidor responde que no existen,
  **reintenta con la lista corta**. La sección funciona igual, sin firmas.
- La consulta de la tanda principal del portal usa la lista **corta a
  propósito**: ahí una columna desconocida tumbaría el portal entero al respaldo
  estático por una firma.
- El INSERT intenta con firma y, si falla por eso, reintenta sin ella. **El
  trabajo se guarda; se pierde el crédito, no el archivo.** Y se avisa por
  pantalla, porque callarlo dejaría creer que el crédito quedó puesto.

No se tocaron las políticas RLS: las columnas viajan en el mismo INSERT en
cuarentena que ya existía y se leen con la misma política de las filas aprobadas.
Añadir columnas no cambia quién escribe ni quién lee.

---

## 11. Autorizaciones de imagen, y una política que no servía para nada

`db/19_autorizaciones.sql`, aplicada el **2026-09-13**. Es la pieza que permite
la alternativa al pixelado universal: un estudiante con autorización firmada por
su apoderado puede aparecer con cara y nombre completo, y el portal distingue
quién la tiene de quién no. El porqué y el procedimiento en papel están en
[[CIEHS-Privacidad-Menores]] §2 ter y en
[[pendientes-coordinacion/02-autorizacion-de-imagen|02 · Autorización de imagen]].

### Lo que esta tabla no guarda

Ni nombres, ni apellidos, ni DNI, ni el escaneo del papel. **Nada que identifique
a nadie.** No es una omisión, es el punto entero: el original vive en papel bajo
llave y el índice código → estudiante en una hoja de cálculo local del
coordinador, que no entra ni en el repositorio —es público y el historial de git
es permanente— ni en la base —es una instancia compartida—.

| Columna | Qué |
|---|---|
| `codigo` | `AUT-2026-014`, validado con expresión regular |
| `anio`, `vigente`, `alta`, `revocada` | fechas y estado |
| `nota` | operativa, máx. 120 caracteres. **Nunca el nombre** |

Subir el papel escaneado habría sido la peor pieza del sistema: un almacén con el
nombre y el DNI del apoderado, su firma y los datos del menor. Por eso el panel
no tiene ningún campo de archivo, y no es un descuido.

Además `ciehs.aportes` gana `consent_ref` **con clave ajena**. Eso es lo que
convierte el campo en una comprobación de verdad: hasta ahora `consent_ref`
existía en `evidencias` como texto libre, y un campo que acepta cualquier cosa es
decorativo.

### El código lo pone el coordinador, nunca quien sube

El formulario de aportes es público. Con el campo ahí, cualquiera podría tantear
códigos —`AUT-2026-014` es adivinable— hasta acertar uno y firmar con apellido
completo amparándose en la autorización de otra persona. Va en la fila de
moderación, al lado del botón de aprobar, porque el código y la aprobación son el
mismo gesto.

> [!warning] Dos fallos encadenados al estrenarla, y cómo se vieron
> **1. Política RLS sin `GRANT`, y apuntada al rol equivocado.** La primera
> versión creó las políticas pero no los privilegios de tabla, y apuntó la
> política solo a `authenticated`. El portal administra con la clave publicable
> —o sea como `anon`, con la cabecera `X-CIEHS-Code`—, que es el patrón que fijó
> `db/11` para las otras diecisiete tablas. Resultado: el registro se leía vacío
> y cualquier alta moría con «permission denied». **Una política sin privilegio
> de tabla no hace nada, y un privilegio sin política tampoco.**
>
> Lo que despistó: el `SELECT` sí funcionaba, porque `db/01` dejó puesto un
> `alter default privileges ... grant select on tables`. La tabla nació con
> lectura y sin escritura, y parecía medio bien.
>
> **2. La degradación tapaba el fallo.** El detector daba por «migración no
> aplicada» cualquier error que mencionara la tabla, y «permission denied for
> table autorizaciones» la menciona. El panel decía en silencio «falta aplicar
> db/19» cuando db/19 estaba aplicada. Ahora se distingue por código: `42P01` y
> `42703` son migración ausente, `42501` es un error de verdad y se deja ver.
>
> **La lección:** una red de seguridad que convierte un error en silencio es peor
> que no tenerla. Y los dos fallos solo aparecieron porque la verificación
> **escribía** en vez de limitarse a leer — con lecturas se habría dado todo por
> bueno.

### Validado contra la base real (2026-09-13)

Con limpieza comprobada después: cero autorizaciones y cero aportes con
`consent_ref`.

| Prueba | Resultado |
|---|---|
| Alta sin código de administración | 401 · *violates row-level security policy* |
| Código duplicado | rechazado por la clave primaria |
| `vigente=false` sin fecha | rechazado por `autorizaciones_revocacion_coherente` |
| `consent_ref` inexistente | rechazado por la clave ajena |
| ¿El aporte se publicó igualmente? | **No** — misma sentencia |
| Atado y releído de la base | persiste |
| Borrar una autorización citada | rechazado (`on delete restrict`) |
| Revocar | la fila sigue, con su fecha |

### Lo que no resuelve

La base garantiza que un código existe y está vigente. **No** puede saber si
«María Quispe Torres» es un nombre de pila o lleva los apellidos. Por eso la fila
de moderación enseña la firma antes de aprobar y marca en rojo un nombre de más
de dos palabras sin respaldo detrás. No lo bloquea —hay nombres compuestos
legítimos y un docente firma entero con todo el derecho—: decidir es del
coordinador, avisar es del portal.

Y **la tabla vacía no autoriza nada**. Faltan los dos pasos humanos de
[[pendientes-coordinacion/02-autorizacion-de-imagen|02 · Autorización de imagen]]:
confirmar quién custodia los originales y repartir las fichas. Hasta entonces no
se publica ningún rostro sin tapar, y el panel lo dice cuando el registro está
vacío.

---

## Enlaces

- [[CIEHS-Privacidad-Menores]] — la regla que da forma a las columnas de autoría.
- [[CIEHS-Portal-Educativo]] — arquitectura del portal y alojamiento.
- [[CIEHS-Auditoria-Seguridad-Auth]] — autenticación y hallazgos de seguridad.
- [[CIEHS-Metodologia-Pedagogica]] — qué contenido pedagógico consume estos datos.
- [[CIEHS-Arena-Juego]] — un marcador entre clases necesitaría una tabla aquí.
- [[CIEHS-Pentest-2026-09]] — el pentest y el argumento del proyecto propio.
- [[CIEHS-Tienda-Escolar]] — catálogo, reservas de cosecha y transparencia.
- [[CIEHS-Estados-UI-Async]] — carga, error y vacío: qué se ve cuando la base no responde todavía.
