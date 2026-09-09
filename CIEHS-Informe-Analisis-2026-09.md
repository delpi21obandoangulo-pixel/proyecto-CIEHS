---
title: CIEHS · Informe de análisis integral (septiembre 2026)
aliases: [Informe CIEHS, Análisis CIEHS 2026, Auditoría integral CIEHS]
tags: [ciehs, informe, analisis, seguridad, pentest, calidad, pwa, accesibilidad]
fecha: 2026-09-09
metodo: caja blanca · código, base de datos y ataques contra producción
alcance: funcionalidad, errores, seguridad, accesibilidad, comparación y mejoras
veredicto: sano · 1 defecto funcional (login admin) · 2 de 21 ataques con éxito (uno externo, uno ya corregido)
actualizado: 2026-09-09
---

# CIEHS · Informe de análisis integral

Análisis completo del portal <https://ciehs.vercel.app> ejecutado el 2026-09-09
con acceso al código, a la base de datos y atacando el despliegue real. Parte de
[[CIEHS]]. Complementa y actualiza [[CIEHS-Pentest-2026-09]] y
[[CIEHS-Auditoria-Seguridad-Auth]].

> [!abstract] En una línea
> El portal está **sano**. Se probaron **21 vectores de ataque**: solo **2**
> tuvieron éxito — uno es **ajeno al CIEHS** (contaminación cruzada de Aura) y el
> otro (**inundación sin límite de tasa**) **ya quedó corregido** en esta misma
> revisión. Hay **un defecto funcional real**: el **login de administración no
> deja entrar**, y aquí se explica por qué y cómo se arregla. Se añadió además
> **modo offline (PWA)** por la conexión intermitente del laboratorio.

---

## 1. Método

Auditoría de caja blanca en cuatro frentes, cada hallazgo verificado contra el
despliegue real, no supuesto:

1. **Estático** — sintaxis de los 7 archivos JS, superficie de XSS, patrones de
   error comunes.
2. **Runtime** — las 14 rutas cargadas en producción: consola, imágenes,
   resiliencia del router.
3. **Seguridad** — 21 ataques contra la API REST, el almacenamiento y las
   cabeceras del sitio en producción, con la clave anónima real.
4. **Comparación y accesibilidad** — contraste con portales escolares y de
   ferias de ciencia; auditoría mecánica de accesibilidad; SEO.

---

## 2. Estado funcional

### 2.1 Lo que está bien

| Área | Resultado |
|---|---|
| Sintaxis JS | Los 7 archivos compilan sin error |
| Enrutado | 14 rutas pintan título y contenido; una ruta inválida cae a inicio sin dejar la app en blanco |
| Imágenes | 17 en total, **ninguna rota** |
| Consola | **Sin errores** en el barrido de las 14 rutas |
| XSS almacenado | Superficie limpia: todo dato de usuario pasa por `esc()`; `enfasis()` escapa antes de añadir `<em>` |
| Resiliencia | Cada sección conserva respaldo estático si la base no responde |

### 2.2 Defecto funcional: el login de administración no entra

**Severidad: alta** (el panel entero queda inaccesible) · **Origen: datos, no código.**

La cuenta `delpi21obandoangulo@gmail.com` **se creó con «Iniciar sesión con
Google»**, no con correo y contraseña. En la base:

- `provider = google`, `providers = ["google"]`
- **cero identidades de tipo `email`**
- el hash de contraseña guardado (`$2a$06$…`, coste 6) **no corresponde a
  ninguna** de las contraseñas que se creyeron fijadas — el coste 6 delata un
  `UPDATE` por SQL con la contraseña mal escapada en la terminal.

Por eso da igual cuántas veces se «cambie la contraseña» por SQL: sin identidad
`email` y con un hash desconocido, `signInWithPassword` siempre responde
*credenciales inválidas*. **Esto explica el «cambié la contraseña y sigue
saliendo incorrecto».**

> [!success] Cómo se arregla — un solo paso
> El arreglo correcto pasa por la API de GoTrue, que fija la contraseña **y**
> habilita la identidad de correo a la vez. Está listo en
> `tools/fijar-clave-admin.js`:
>
> ```powershell
> $env:SUPABASE_SERVICE_ROLE_KEY="<service_role de kumxtheybmqbfixatnok>"
> $env:CIEHS_ADMIN_PASSWORD="<la contraseña que quieras>"
> node tools/fijar-clave-admin.js
> ```
>
> El script se autoverifica: tras fijarla, inicia sesión por el mismo camino que
> el modal y comprueba `is_admin()`. Si no entrara, lo diría.
>
> No pude ejecutarlo yo: el entorno bloquea que yo maneje la `service_role`
> (guardas de credenciales, no fallos). El circuito del modal **sí está
> verificado**: ante una contraseña falsa responde `invalid_credentials` y
> muestra el error correcto; lo único que falta es una contraseña válida sobre
> una identidad de correo.

### 2.3 Errores menores corregidos en esta revisión

- **`theme-color` obsoleto.** Estaba en `#0a0f0d` (negro del diseño original);
  el portal es claro desde el rediseño. La barra del navegador móvil se teñía de
  negro sobre una página clara. Corregido a `#f4f6f9`.

---

## 3. Seguridad — 21 ataques, 2 con éxito

Ataques ejecutados con la **clave anónima real** (la publicable, que viaja en el
navegador por diseño) contra el despliegue de producción.

### 3.1 Tabla de resultados

| # | Ataque | Resultado |
|---|---|---|
| A1 | INSERT anónimo en `site_config` | 🛡️ bloqueado (grant) |
| A2 | Leer borradores de `productos` | 🛡️ bloqueado (RLS) |
| A3 | Leer `orders` (nombre y contacto de familias) | 🛡️ bloqueado — 0 filas |
| A4 | Leer `pedido_lineas` | 🛡️ bloqueado — 0 filas |
| A5 | Leer la tabla `admins` | 🛡️ bloqueado (401) |
| A6 | Alta de pedido con `status` forzado | 🛡️ bloqueado (WITH CHECK) |
| A7 | Alta de registro autopublicándose | 🛡️ bloqueado (WITH CHECK) |
| A8 | **Leer el esquema `public` de Aura** | ⚠️ **ÉXITO** (externo — ver 3.2) |
| A9 | Leer el esquema `safary_kids` de Safari | 🛡️ bloqueado (404) |
| A10 | Leer `auth.users` vía REST | 🛡️ bloqueado (esquema no expuesto) |
| A11 | Inyección SQL en filtro PostgREST | 🛡️ bloqueado (parametrizado) |
| A12 | Listar el bucket privado `ciehs-aportes` | 🛡️ bloqueado — 0 objetos |
| A13 | Descargar un objeto del bucket privado | 🛡️ bloqueado (400) |
| A14 | Asignación masiva (`published=true`) | 🛡️ bloqueado (WITH CHECK) |
| A15 | Leer comentarios sin moderar | 🛡️ bloqueado — 0 filas |
| A16 | Leer aportes en cuarentena | 🛡️ bloqueado — 0 filas |
| A17 | **Inundar las tablas de alta pública** | ⚠️ **ÉXITO** (corregido — ver 3.3) |
| A18 | XSS almacenado vía comentario | 🛡️ bloqueado (y se escapa al pintar) |
| A19 | Clickjacking (iframe del portal) | 🛡️ bloqueado (`frame-ancestors 'none'` + `X-Frame-Options DENY`) |
| A20 | Redirección abierta / `javascript:` por el router | 🛡️ bloqueado (siempre se queda en el dominio) |
| A21 | Ejecutar `<script>` inline (evadir CSP) | 🛡️ bloqueado (la CSP no ejecuta el inline) |

**19 de 21 bloqueados. 2 con éxito.**

### 3.2 Éxito A8 — contaminación cruzada (externo al CIEHS)

Con la clave anónima del CIEHS se lee la tabla `profiles` del esquema `public`,
que es de **Aura**. La instancia Supabase `kumxtheybmqbfixatnok` es física y
compartida por tres proyectos ([[Esquema ciehs]]), y la clave publicable es **de
la instancia**, no del CIEHS.

- **El CIEHS no lo causa ni lo empeora.** Su cliente está forzado a su propio
  esquema; el ataque usa una petición cruda que ignora el portal.
- **El CIEHS no puede corregirlo.** La lectura la permite la RLS de Aura sobre
  su propia tabla.
- Coincide exactamente con lo que ya registró [[CIEHS-Pentest-2026-09]]. Esta
  revisión **confirma que sigue abierto**.
- **Contramedida** (la tiene Aura, no el CIEHS): endurecer la RLS de
  `public.profiles` para que `anon` no lea filas ajenas. Un proyecto Supabase
  propio para el CIEHS lo eliminaría de raíz, pero no cabe en el plan gratuito.

> Se detuvo el sondeo de datos de Aura en cuanto se confirmó el hecho: enumerar
> el dataset de otro proyecto viola la regla de aislamiento del propio
> ecosistema. El hallazgo quedó acotado a «se leen `id` y `username`», sin
> extraer más.

### 3.3 Éxito A17 — inundación sin límite de tasa (corregido)

**Confirmado explotable:** un anónimo insertó **10 comentarios en 2 segundos**,
y en una segunda prueba **10 de 10** sin ningún freno. El mismo vector servía
para `orders`, `registros_campo`, `resultados` y `aportes`. Riesgos: ahogar la
cola de moderación con basura y —vía `aportes`— consumir la cuota de
almacenamiento del plan gratuito.

**Contramedida implementada y verificada** (`db/09_antiflood.sql`): un disparador
`ciehs.frenar_alta_masiva()` en las cinco tablas de alta pública limita a **12
altas por minuto por tabla** en el alta anónima; el administrador autenticado
queda **exento**.

Verificado en producción tras aplicarlo:

- Anónimo: **20 intentos → 12 aceptados, 8 frenados** (HTTP 400).
- Admin (con JWT simulado): **15 de 15**, sin freno.

> [!warning] Límite honesto de la contramedida
> No corta el flood al 100 %: lo reduce de ~300/min a 12/min y se auto-recupera
> cada minuto. No cubre la subida rápida de **objetos huérfanos** al bucket
> (la subida al almacén ocurre antes de crear la ficha y vive en
> `storage.objects`, tabla compartida que no conviene tocar con un disparador).
> Para ese residuo la vía correcta es un **CAPTCHA/Turnstile** en los formularios
> o una **limpieza periódica de huérfanos**. Queda en el backlog (§6).

### 3.4 Cabeceras HTTP — posición muy fuerte

Verificadas en producción, todas presentes y correctas:

- **CSP estricta** sin `unsafe-inline` (ni en scripts ni en estilos);
  `script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`,
  `frame-src` acotado a PhET, `connect-src` acotado a Supabase.
- **HSTS** 2 años, `includeSubDomains`, `preload`.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy` (cámara/micro/geo/FLoC desactivados),
  COOP y CORP `same-origin`.
- Sin `X-Powered-By`. La CSP incluso **bloqueó un `<script>` inline inyectado**
  en la prueba (A21): la defensa contra XSS es real, no solo declarativa.

---

## 4. Comparación con webs similares y qué se añadió

Contraste con recursos de referencia de hidroponía escolar y ferias de ciencia
(Science Buddies, Science Fair Central) y con las expectativas de una web
institucional 2026.

- **Lo pedagógico ya lo cubre y con creces.** Variables controladas, mediciones,
  gráficas automáticas por tratamiento, raíces visibles, articulación con el
  CNEB y el DUA: es más de lo que ofrece el material de referencia típico, que
  se queda en la guía de la actividad.
- **Faltaba resiliencia de conexión.** La referencia 2026 para un sitio escolar
  en zona de conexión intermitente es el **PWA con service worker**. El propio
  código de datos ya asumía que «la conexión falla a menudo». **Añadido en esta
  revisión** (§5).

### Mejoras aún recomendadas (no implementadas)

| Mejora | Por qué encaja en el CIEHS |
|---|---|
| **Notificación al coordinador** cuando entra una reserva o un aporte | Hoy hay que mirar el panel a mano; una reserva puede quedar sin ver |
| **CAPTCHA/Turnstile** en los formularios públicos | Cierra el residuo de A17 (objetos huérfanos) sin depender del ritmo |
| **Fuentes propias** en vez de Google Fonts | Elimina el único tercero que carga sin que el visitante pueda evitarlo → [[CIEHS-Privacidad-Menores]] |
| **Subtítulos** en los vídeos que suban los equipos | Cierra el DUA en el vídeo, hoy solo cubierto en texto y audio |
| **Boletín / suscripción** para familias | Difundir cosecha disponible y avances sin depender de que vuelvan a entrar |

---

## 5. Mejora implementada: modo offline (PWA)

Añadido en esta revisión y verificado en producción.

- **Service worker** (`sw.js`) que precachea el *app shell* (13 recursos: HTML,
  CSS, los JS y las imágenes clave). El portal **abre sin red** y cada sección
  muestra su respaldo estático.
- **Estrategia elegida para no servir código viejo:** red primero para
  HTML/JS/CSS (con red, siempre la última versión; sin red, la última vista),
  caché primero para media.
- **Supabase y PhET nunca se cachean.** Verificado que el dato sigue siendo
  fresco y que **ninguna respuesta de la API queda en caché** — cachearla daría
  pedidos y precios fantasma.
- **`manifest.json`** para instalar el portal en la pantalla de inicio como una
  app.

Verificado en producción: SW registrado y controlando la página, shell de 13
recursos, manifest con 3 iconos, datos vivos intactos. La confirmación final
—abrir el portal en modo avión en un móvil— queda para una prueba de campo.

---

## 6. Accesibilidad y SEO

- **Accesibilidad mecánica impecable:** 0 de 17 imágenes sin `alt`, 0 de **299**
  botones sin nombre accesible, 0 campos de formulario sin etiqueta, un solo
  `h1`. El DUA (voz en los juegos, doble vía de representación) refuerza esto
  → [[CIEHS-Voz-DUA]].
- **SEO completo:** `viewport`, `description`, canónica, Open Graph y Twitter
  Card completos, `lang="es-PE"`, datos estructurados JSON-LD, favicon y
  `apple-touch-icon`, `robots.txt` y `sitemap.xml`.
- Pendiente conocido y ya documentado: al ser SPA con enrutado por fragmento,
  los buscadores no indexan cada sección por separado. Migrar a rutas reales lo
  resolvería; es una decisión abierta, no un defecto.

---

## 7. Backlog priorizado

1. **Arreglar el login de administración** (§2.2). Bloquea el uso del panel.
   Un solo paso con `tools/fijar-clave-admin.js`.
2. **Poner los precios** de la tienda desde el panel → [[CIEHS-Tienda-Escolar]].
3. **CAPTCHA/Turnstile** en los formularios públicos: cierra el residuo de A17.
4. **Aviso al coordinador** ante nuevas reservas y aportes.
5. **Que Aura endurezca la RLS de `public.profiles`** (A8): fuera del CIEHS,
   pero conviene trasladarlo.
6. **Fuentes propias** para eliminar la llamada a Google Fonts.
7. Fotos reales de cada especie y de los módulos, con las caras tapadas
   → [[CIEHS-Privacidad-Menores]].

---

## 8. Qué cambió en esta revisión

- **Corregido A17:** disparador anti-inundación en 5 tablas (`db/09_antiflood.sql`).
- **Añadido PWA:** `sw.js`, `manifest.json`, registro del SW, enlace del manifest.
- **Corregido `theme-color`** obsoleto.
- **`tools/fijar-clave-admin.js`** dejado listo para el arreglo del login.
- Ficha de la bóveda corregida: la instancia tiene **tres** inquilinos, no dos.

Todo desplegado y verificado en <https://ciehs.vercel.app>.

---

## Enlaces

- [[CIEHS]] — índice general.
- [[CIEHS-Pentest-2026-09]] — pentest previo que este informe confirma y amplía.
- [[CIEHS-Auditoria-Seguridad-Auth]] — registro continuo de seguridad.
- [[CIEHS-Backend-Supabase]] — esquema, RLS y la instancia compartida.
- [[CIEHS-Tienda-Escolar]] — la tienda y su transparencia.
- [[CIEHS-Voz-DUA]] — voz, PhET y accesibilidad.
- [[CIEHS-Privacidad-Menores]] — terceros y datos personales.
