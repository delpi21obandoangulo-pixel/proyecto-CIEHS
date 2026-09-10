---
title: CIEHS · Auditoría de seguridad y autenticación
aliases: [Seguridad CIEHS, Auth CIEHS, Hallazgos de seguridad]
tags: [ciehs, seguridad, auth, rls, csp, privacidad, menores]
estado: hallazgos corregidos · riesgos abiertos documentados
ultima-auditoria: 2026-09-04
actualizado: 2026-09-04
---

# CIEHS · Auditoría de seguridad y autenticación

Registro de hallazgos, correcciones y riesgos abiertos. Índice en [[CIEHS]];
contexto en [[CIEHS-Portal-Educativo]] y [[CIEHS-Backend-Supabase]].

---

## 1. Autenticación del panel

**Antes:** un PIN de cuatro dígitos comparado en JavaScript, publicado además en
texto plano en el README del repositorio público.

**Ahora:** Supabase Auth con correo y contraseña, más comprobación de que la
cuenta figura en `ciehs.admins`. Dos condiciones independientes: tener sesión no
otorga ningún permiso sobre los datos del CIEHS.

| Prueba | Resultado |
|---|---|
| Lectura pública de las tablas publicadas | 200 |
| `admins` desde anónimo | `permission denied` |
| Escritura anónima | 401 |
| **Autenticado que no es admin escribe** | **bloqueado** |
| **Auto-promoción a admin** (`insert` en `ciehs.admins`) | **sin privilegio, ni anon ni authenticated** |
| Escritura con la identidad real del coordinador | permitida, triggers disparan |
| Credenciales incorrectas | mensaje limpio, botón reactivado |

**La sesión vive en `sessionStorage`, no en `localStorage`.** Los equipos del
laboratorio son compartidos: así la sesión de administración muere al cerrar la
pestaña en lugar de quedar disponible para quien se siente después.

> [!note] Sobre la fricción frente a la seguridad
> Antes de conectar el backend se retiró el literal del PIN del JavaScript y se
> dejó su huella SHA-256. Aquello era **fricción deliberada, no seguridad**.
> La misma distinción aplica a las contramedidas anti-IA de
> [[CIEHS-Arena-Juego]]: son fricción, y está escrito así en el código.

---

## 2. Hallazgos corregidos

### 🔴 `script-src` admitía `'unsafe-inline'`

Era la debilidad de fondo de toda la CSP: mientras hubiera JavaScript en línea,
la política estaba obligada a permitirlo, y eso deja abierta una clase entera
de XSS.

**Corregido.** Los **diez bloques `<script>` inline** de `index.html` se
extrajeron a `assets/js/ciehs-app.js` (60 KB) manteniendo su orden, y la
política pasó a `script-src 'self'`.

Verificado en producción recorriendo las 13 rutas, la Arena y el panel:
**cero violaciones de CSP y cero errores**.

### 🔴 Identificadores de auth expuestos a cualquier visitante

`telemetry_readings.recorded_by` y `site_config.updated_by` devolvían por la API
pública el **uuid de auth de una persona real**. En instancia compartida ese
mismo uuid aparece en los otros proyectos, así que permitía **correlacionar
identidades entre ellos**.

### 🟠 La autoría la ponía el cliente

El navegador enviaba `recorded_by` y `updated_by`, así que una cuenta de
administración podía **atribuir una lectura o una edición a otra persona**.
Ahora los pone el servidor (`default auth.uid()` al insertar, trigger al
actualizar) y se retiró el permiso de escribir esas columnas.

### 🔴 DDL completo publicado en el sitio

`/db/01_schema.sql` era accesible públicamente: tablas, políticas RLS y la
lógica de `is_admin()`. `.vercelignore` ahora excluye `db/` y todos los `.md`.

### 🟠 Otros

- **PIN publicado en el README** — retirado del README y del JavaScript.
- **Documentación interna descargable** — el `.docx` y el README quedaban
  descargables desde Surge. Excluidos al migrar a Vercel.
- **Clickjacking** — `X-Frame-Options: DENY` más `frame-ancestors 'none'`.
- **`.env.local` con token OIDC** — fuera de git y excluido explícitamente.
- **`DELETE` sobre `site_config`** — retirado: no tiene caso de uso legítimo.
- **Progreso de la Arena sin sanear** — los récords de `localStorage` acababan
  insertados en HTML. Es auto-XSS de bajo riesgo, pero se normalizan los tipos
  al cargar: un número no puede llevar marcado dentro.
- **Rótulos que prometían lo que no hacían** — «monitoreo en tiempo real» sobre
  HTML fijo y «publicados en el portal» sin publicar nada. No es seguridad,
  pero sí integridad.

---

## 3. Cabeceras HTTP

Verificadas en producción:

| Cabecera | Valor |
|---|---|
| `Content-Security-Policy` | `default-src 'self'` · **`script-src 'self'`** · **`style-src 'self'`** · **`style-src-attr 'none'`** · `frame-ancestors 'none'` · `object-src 'none'` · `connect-src` solo al host Supabase del proyecto |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Permitted-Cross-Domain-Policies` | `none` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | cámara, micrófono y geolocalización denegados |

> [!success] Sin `'unsafe-inline'` en ninguna directiva
> También se retiró de `style-src`, que era el último resto. Hizo falta:
> 1. Sacar el bloque `<style>` de 105 KB a `assets/css/ciehs.css`.
> 2. Convertir los **97 atributos `style=`** del maquetado en **90 clases
>    atómicas** (una por declaración `propiedad:valor`, reutilizadas donde se
>    repetían). Llevan `!important` porque reproducen el comportamiento del
>    atributo que sustituyen: un override puntual que gana al componente.
> 3. Sustituir los **tres `style=` que generaba el JavaScript** dentro de
>    `innerHTML` por CSSOM. Ese detalle es fácil de pasar por alto: un
>    `style=` insertado con `innerHTML` lo parsea el navegador y la política
>    lo bloquea igual que si estuviera escrito en el HTML.
>
> `style-src-attr 'none'` cierra la puerta de forma explícita. Manipular
> `element.style` desde JavaScript **no** está restringido por CSP: es CSSOM,
> no un atributo, y por eso el 3D de la Arena y las barras de rango siguen
> funcionando.
>
> **Verificación:** se capturó la huella de 20 propiedades computadas de los
> 191 elementos afectados antes del cambio y se comparó después.
> **Cero diferencias.** Ninguna violación de CSP en las 13 rutas ni en la Arena.

---

## 4. Comprobaciones de la base

```
7 tablas · RLS activo en las 7 · 13 políticas
is_admin()          security definer · search_path fijo · NO ejecutable por anon
touch_updated_at()  search_path fijo
ciehs.admins        sin insert/update/delete para anon ni authenticated
```

Límites de tamaño como defensa en profundidad frente a una cuenta comprometida
o a un error de copiar y pegar: títulos y avisos acotados, `measured_at` no
puede ser futura ni anterior a 2024, y `tags` no admite más de 8 entradas.

---

## 5. Dependencias

Ambas se sirven **desde el propio dominio**, no desde un CDN: así el visitante
no queda expuesto a un tercero y la CSP no necesita abrir `script-src` a
ningún host externo.

| Biblioteca | Versión | Notas |
|---|---|---|
| `@supabase/supabase-js` | **2.116.0** | Estaba en 2.58.0, 57 versiones por detrás. Es la que maneja red y autenticación, así que sus correcciones importan. Reincorporada el 2026-09-10 desde 2.115.0 → §8 |
| `qrcode-generator` | **2.0.4** | Cálculo puro, sin red ni dependencias. El salto de major resultó ser solo de empaquetado: misma API |

Tras actualizar se verificó que **los nueve códigos QR siguen decodificando
correctamente** con un lector independiente, y que la descarga en SVG no viola
la política.

> [!tip] Cómo comprobar si hay versiones nuevas
> `npm view <paquete> version` y comparar con la cadena de versión que lleva
> dentro el archivo de `assets/js` — no con lo que declare `package.json`.
> El portal no tiene paso de compilación: las bibliotecas se guardan ya
> construidas, así que **la versión que importa es la del archivo servido**.
>
> Desde el 2026-09-09 sí hay `package.json` (la nota decía lo contrario). Eso
> abrió una grieta nueva, ver §8: se puede actualizar la dependencia sin
> reincorporar el archivo, y entonces el repositorio declara una versión y
> sirve otra.

---

## 6. Riesgos abiertos

### 🔴 Datos personales de menores — Ley N.° 29733

La página de privacidad y el protocolo están **redactados y publicados**, con el
inventario real de datos que trata el portal. Lo que **sigue bloqueando** es la
aprobación formal de la dirección y la ficha de autorización para apoderados
→ [[CIEHS-Privacidad-Menores]].

**Hasta entonces no debe publicarse ninguna fotografía de un estudiante.**

### 🟠 Instancia compartida

`auth.users` es común a todos los proyectos de la instancia. Un administrador
del CIEHS es también `authenticated` frente a los esquemas `public` y
`safary_kids`: si esos proyectos tuvieran políticas laxas, podría leerlos.
**No depende de nuestro código y no podemos corregirlo desde aquí.** Un proyecto
Supabase propio lo elimina → [[CIEHS-Backend-Supabase]].

### 🟠 Sin responsable ni proceso de actualización

No está escrito quién carga las mediciones, quién publica avisos ni quién
aprueba fotos.

### 🟠 Licencia contradictoria

El README declara MIT sin archivo `LICENSE`, y el pie dice «Todos los derechos
reservados». Para el material pedagógico encaja mejor una Creative Commons.

### 🟡 Google Fonts

Único tercero al que el portal expone al visitante: recibe su IP. Alojar las
fuentes en el propio dominio lo eliminaría, igual que se hizo con las
bibliotecas de JavaScript.

### 🟡 Sin protección de contraseñas filtradas ni MFA

Los *advisors* de Supabase lo señalan. Es configuración **de la instancia
compartida**, así que afecta también a los otros proyectos y no debe cambiarse
sin acordarlo.

---

## 7. Qué revisar tras cada cambio

- [ ] `curl -I` sobre producción: las **nueve** cabeceras siguen presentes.
- [ ] Ninguna violación de CSP al recorrer las rutas
      (`securitypolicyviolation` en consola). **No basta**: un color descartado
      no salta en consola si el escucha se registró después de la carga → §8.
- [ ] `grep 'style="' index.html` y sobre los JavaScript propios: **cero**.
      Es la comprobación que sí encuentra lo que la consola calla.
- [ ] **Ningún `<script>` inline nuevo en `index.html`**: rompería la CSP
      estricta en silencio. La lógica va a `assets/js/ciehs-app.js`.
- [ ] **Ningún `<style>` ni atributo `style=` nuevo**, tampoco dentro de un
      `innerHTML`. Los estilos van a `assets/css/ciehs.css`; lo dinámico, por
      `element.style` desde JavaScript.
- [ ] Que ningún documento interno responda 200 (`db/`, `*.md`, `.env*`).
- [ ] Que las consultas anónimas pidan **columnas explícitas** donde haya
      columnas vetadas — un `select=*` nuevo rompería la sección entera.
- [ ] `get_advisors` de Supabase: ninguna alerta con esquema `ciehs`.
- [ ] Versiones de las dos bibliotecas frente al registro de npm (ver §5).
      Comparar contra la cadena que lleva **dentro el archivo servido**, no
      contra `package.json`: son cosas distintas y ya divergieron una vez.

> [!bug] La trampa que ya se pisó dos veces
> Un `GRANT` a nivel de **tabla** cubre todas las columnas y **no se recorta con
> un `REVOKE` por columna**. Hay que retirar el permiso de tabla y conceder solo
> las columnas permitidas. Pasó al cerrar las columnas de lectura y volvió a
> pasar al cerrar las de autoría.

---

## 8. Revisión del 2026-09-10

Pasada completa de la lista del §7 contra producción. Dos hallazgos reales, los
dos corregidos.

### 🔴 La CSP estaba descartando colores en silencio — corregido

`style-src-attr 'none'` bloquea **cualquier** estilo escrito en un atributo
`style=` del marcado. El atributo se queda en el DOM y el elemento sale sin
pintar: no hay error en consola, no hay hueco en el diseño, simplemente el color
no está.

Los cuatro puntos de color del reparto de caja (`.destino-lista i`) lo llevaban
así. **En producción llevaban tiempo saliendo transparentes**, comprobado sobre
el sitio real: atributo presente, `backgroundColor` = `rgba(0, 0, 0, 0)`.

Y había tres sitios más, latentes, que habrían fallado el día que hubiera datos:

| Dónde | Qué se habría roto |
|---|---|
| `index.html` ×4 | Los puntos del reparto previsto — **ya estaba roto** |
| `ciehs-app.js` · leyenda de resultados | El color de cada tratamiento, en cuanto un equipo publique resultados |
| `ciehs-app.js` · barra apilada de caja | El **ancho** de cada tramo, no solo el color: la barra entera, en cuanto Tesorería registre un egreso |
| `ciehs-app.js` · leyenda del reparto | El color de cada concepto |

**Corrección.** Los colores pasan a clases `.pal-1`…`.pal-6`, en el mismo orden
que las tablas `PALETA` y `COLORES` del JavaScript. El ancho de la barra, que
es un porcentaje calculado y no cabe en una clase, se aplica por **CSSOM**
(`element.style.width`) después de insertar: lo que la CSP bloquea es el
atributo del marcado, no `element.style`.

> [!warning] «Ninguna violación en consola» no basta
> El §7 pide comprobar que no hay `securitypolicyviolation`. Recorriendo las
> doce rutas de producción **no saltó ninguna** — y sin embargo cuatro elementos
> estaban rotos. Dos motivos: un escucha registrado después de la carga no ve
> las violaciones de tiempo de análisis, y un color descartado no rompe nada
> visible que delate el fallo.
>
> Lo que sí lo encuentra: buscar `style=` en el marcado y en las cadenas de
> `innerHTML`, y comparar el atributo con el estilo computado. Hoy no queda
> ninguno en `index.html` ni en los seis JavaScript propios.

### 🟡 El repositorio declaraba una versión y servía otra — corregido

`package.json` pedía `^2.116.0` y `node_modules` la tenía, pero
`assets/js/supabase.js` —el archivo que de verdad se ejecuta— seguía siendo
**2.115.0**. Se actualizó la dependencia sin reincorporar el archivo construido.

Reincorporado desde `node_modules/@supabase/supabase-js/dist/umd/supabase.js` y
verificado contra la base real: conexión establecida, y el portal trae config,
17 módulos, 8 códigos QR, 2 investigaciones y 6 productos, sin errores en
consola.

### Lo que salió limpio

| Comprobación | Resultado |
|---|---|
| Cabeceras en producción | Las nueve presentes: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP y X-Permitted-Cross-Domain-Policies |
| Documentos internos | `db/`, `*.md`, `.env*`, `.vercel/`, `tools/`, `package.json` y el `.docx`: **404** todos |
| `<script>` inline | Ninguno ejecutable. El único es `application/ld+json`, que es dato y la CSP no gobierna |
| `qrcode-generator` | 2.0.4, la última de npm |

### Dos cosas que quedan dichas, no corregidas

**`select('*')` en `modules` y `qr_codes`.** Hoy es correcto: ninguna de las
dos tiene columnas vetadas. Pero el esquema lleva
`alter default privileges … grant select`, así que **una columna nueva sería
legible y viajaría sola** al navegador. No es un fallo actual; es una trampa
armada para el futuro.

**El renderizador de tablas de `qrcode.js` escribe `style=`.** Es de la
biblioteca de terceros y la CSP lo bloquearía — pero el portal **no lo usa**:
construye el `path` del SVG a mano desde `q.isDark()`. Queda escrito para que
nadie lo marque como hallazgo en la próxima revisión.

### Lo que no se pudo comprobar

`get_advisors` de Supabase. Los servidores MCP disponibles se llaman
`supabase-aura` y `supabase-kunturmasha`; conectarse a la instancia por
cualquiera de ellos para inspeccionar el esquema `ciehs` cruza la frontera
entre proyectos, y esa decisión no es del código. **Queda pendiente de una
autorización explícita.**


---

## Enlaces

- [[CIEHS]] — índice general.
- [[CIEHS-Portal-Educativo]] — arquitectura, alojamiento y cacheo.
- [[CIEHS-Backend-Supabase]] — esquema, RLS y permisos por columna.
- [[CIEHS-Metodologia-Pedagogica]] — contenido pedagógico que se publica.
- [[CIEHS-Privacidad-Menores]] — protocolo de imagen y datos de menores.
- [[CIEHS-Arena-Juego]] — sus contramedidas también son fricción, no seguridad.
- [[CIEHS-Pentest-2026-09]] — auto-evaluación de ciberseguridad con 14 ataques.
