---
title: CIEHS · Portal educativo
aliases: [Portal CIEHS, ciehs.vercel.app, Arquitectura del portal]
tags: [ciehs, portal, arquitectura, vercel, frontend]
institucion: I.E. N.° 80033 “José Olaya Balandra” — Huanchaco, La Libertad, Perú
produccion: https://ciehs.vercel.app
repositorio: github.com/delpi21obandoangulo-pixel/proyecto-CIEHS
estado: en produccion
actualizado: 2026-09-13
---

# CIEHS · Portal educativo

Arquitectura del portal. Índice general en [[CIEHS]]. Notas hermanas:
[[CIEHS-Backend-Supabase]], [[CIEHS-Metodologia-Pedagogica]] y
[[CIEHS-Auditoria-Seguridad-Auth]].

> [!abstract] Qué es
> Portal del laboratorio de hidroponía escolar del **Centro de Investigación
> Escolar Hidropónico Sostenible**. Una sola página con doce secciones
> independientes, sin framework ni paso de compilación.

---

## 1. Arquitectura

| Pieza | Decisión |
|---|---|
| **Punto de entrada** | `index.html` — único. Había un `ciehs.html` byte a byte idéntico; se eliminó porque cada corrección había que hacerla dos veces |
| **Stack** | HTML + CSS + JavaScript sin dependencias de compilación |
| **Lógica** | `assets/js/ciehs-app.js` — **cero JavaScript en línea**, para que la CSP pueda prohibirlo |
| **Estilos** | `assets/css/ciehs.css` — **cero CSS en línea**, ni bloque `<style>` ni atributos `style=` |
| **Enrutado** | Por fragmento: `#/ruta`. Ver §2 |
| **Datos** | Supabase, esquema `ciehs` → [[CIEHS-Backend-Supabase]] |
| **Alojamiento** | Vercel, proyecto propio `ciehs`. Ver §4 |
| **Bibliotecas** | `qrcode-generator` y `supabase-js`, ambas servidas desde `/assets/js` del propio dominio |

### Las trece rutas

`inicio` · `metodologia` · `investigaciones` · `equipos` · `modulos` ·
`trazabilidad` · `datos` · `juega` · `docentes` · `mural` · `eureka` ·
`contacto` · `privacidad`

---

## 2. Enrutado por URL

Cada sección vive en `#/ruta`. El prefijo `#/` es deliberado: varias secciones
tienen un `id` que coincide con el nombre de su ruta, y un fragmento pelado
(`#modulos`) haría que el navegador saltara por scroll a ese elemento antes de
que el router pudiera actuar.

**Principio de diseño:** un clic escribe la URL y deja que el evento
`hashchange` haga el render. Así un clic en el menú y una pulsación de Atrás
recorren el mismo camino de código y no pueden desincronizarse.

- Rutas inválidas se reescriben a `#/inicio` con `replaceState`.
- Se toleran `#modulos`, `#/MODULOS` y `#/modulos?utm=qr`; los parámetros de
  campaña se conservan para poder medir qué QR se escanea.
- `window.CIEHS` expone `navigate`, `urlFor`, `routes` y `currentRoute`.

> [!warning] Límite conocido de SEO
> Los buscadores **no tratan un fragmento como URL propia**. El enrutado
> resolvió compartir enlaces, el botón Atrás y los códigos QR, pero Google
> sigue indexando una sola página. Indexar cada sección por separado exigiría
> migrar a rutas reales (`/modulos`) con una entrada HTML por sección.
> El `sitemap.xml` declara solo la URL canónica, y así queda documentado.

---

## 3. Códigos QR

Ocho códigos reales generados en el navegador, más el de la bitácora de lote.

- Apuntan a las rutas del router mediante `CIEHS.urlFor()`, así que la URL se
  deriva del dominio donde esté desplegado y no está escrita a mano.
- **Nivel de corrección de errores Q (25 %)**: van pegados junto a módulos
  hidropónicos, con humedad y salpicaduras.
- Zona tranquila de 4 módulos, negro sobre blanco — lo que exige el estándar y
  lo que los lectores reconocen con más fiabilidad, aunque el portal sea oscuro.
- Descarga individual en **SVG, no PNG**: el mismo archivo sirve para una
  etiqueta de 5 cm y para un panel de feria de 1 m.
- Hoja imprimible con `break-inside: avoid` para que ninguna ficha se parta.

Sus títulos y ubicaciones se sirven de la tabla `qr_codes`.

---

## 4. Alojamiento y seguridad de transporte

Migrado de **Surge.sh** a un **proyecto Vercel propio y aislado**, conforme a la
política de aislamiento estricto: no comparte proyecto con Aura ni Kunturmasha.
Surge no permitía configurar cabeceras HTTP, que era el bloqueo principal.

Cabeceras en `vercel.json`: `Content-Security-Policy`, `Strict-Transport-Security`,
`X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy` y
`Permissions-Policy`. Detalle en [[CIEHS-Auditoria-Seguridad-Auth]].

> [!tip] Cacheo — trampa ya pisada
> `/assets/*` llevó por error `Cache-Control: immutable, max-age=1 año` con
> nombres de archivo **sin hash**. Cualquier corrección del JS habría quedado
> retenida en el navegador del visitante durante un año. Ahora el JS revalida
> siempre (el ETag hace que la respuesta normal sea un 304 mínimo) y las
> imágenes caducan en una semana. **No volver a marcar `immutable` mientras los
> nombres de archivo no lleven hash.**

`.vercelignore` excluye `db/`, todos los `.md` y `.env*`: la documentación
interna y las notas de esta bóveda no se publican **en el sitio**.

> [!warning] El repositorio de GitHub sí es público
> `.vercelignore` solo controla qué sube al *hosting*, no qué hay en el
> repositorio. `github.com/delpi21obandoangulo-pixel/proyecto-CIEHS` es
> **público** y contiene todas estas notas, incluidos el pentest y la auditoría
> de seguridad. Si algo no debe ser legible por cualquiera, no basta con
> añadirlo a `.vercelignore`: hay que sacarlo del repositorio o hacerlo privado.

### Despliegue (estado a 2026-09-08)

| Pieza | Estado |
|---|---|
| Enlace local `.vercel/project.json` | Correcto: `delpi21obandoangulo-pixels-projects/ciehs` |
| Despliegue manual | **Funciona directo**: `vercel --prod` sin banderas |
| Rama de producción | `master` (es la rama por defecto del repositorio) |
| Despliegue automático por push | **NO habilitado aún** — ver abajo |

> [!bug] `vercel git connect` falla: falta instalar la GitHub App
> Devuelve *«Failed to connect … Make sure there aren't any typos and that you
> have access to the repository»* aunque el repositorio existe, es público y el
> remoto `origin` es correcto. La causa es que la **Vercel GitHub App no está
> instalada** en la cuenta `delpi21obandoangulo-pixel`, o esa cuenta de GitHub no
> está vinculada a la de Vercel. Se resuelve **desde el navegador**, no por CLI:
> Vercel → proyecto `ciehs` → Settings → Git → *Connect Git Repository*, y
> autorizar la app sobre `proyecto-CIEHS`. Después ya no hace falta `git connect`.

> [!danger] Antes de conectar: el remoto debe ir al día
> En cuanto la app quede instalada, Vercel construirá desde la punta de `master`
> **del repositorio**, no desde la copia local. Si el remoto va por detrás de lo
> que está en producción, la primera compilación automática **revierte el sitio**.
> Ocurrió casi: `origin/master` se quedó en `078fe0f` mientras producción ya
> servía `dd24f99`. Se resolvió empujando el commit antes de tocar nada.
> **Regla: `git push` antes de conectar, y comprobar que `git rev-parse HEAD` y
> `git rev-parse origin/master` coinciden.**

> [!danger] No añadir nada en línea, ni script ni estilo
> La CSP es `script-src 'self'` y `style-src 'self'` con `style-src-attr 'none'`.
> Un `<script>`, un `<style>` o un atributo `style=` nuevo **no se aplicaría** y
> el fallo sería silencioso. La lógica va a `assets/js/ciehs-app.js` y los
> estilos a `assets/css/ciehs.css`; lo dinámico, por `element.style` desde JS.

---

## 5. Mejora progresiva

El portal **nunca depende de la red para poder leerse**. Si Supabase no
responde, el HTML que ya vino con la página se queda tal cual y la interfaz lo
dice. En un laboratorio escolar la conexión falla a menudo y la página no puede
quedarse en blanco por eso.

Los valores de respaldo del HTML se mantienen sincronizados con los de la base
(por ejemplo, la cosecha acumulada) para que offline y online digan lo mismo.

---

## 6. Datos institucionales oficiales

- **Lema:** «Dios, Patria y Cultura» · **Eje:** Reto Acción por el Clima (ODS 13)
- **Enfoque rector:** Habilidades de Pensamiento de Orden Superior (HPOS) y
  competencias científicas del CNEB — el estudiante es el protagonista.
- **Problemática de partida:** identificada **dentro de la I.E. N.° 80033**, en su
  población escolar y sus agentes educativos, no en un diagnóstico territorial
  ajeno. Seis situaciones: la indagación se enseña pero apenas se practica · la
  institución no dispone de un espacio de cultivo viable · bajo consumo de
  hortalizas frescas en la población escolar · residuos plásticos propios sin ruta
  de reaprovechamiento · docentes sin espacio propio de experimentación · familias
  que conocen la calificación, no el proceso. El contexto costero de Huanchaco es la
  **condición** en la que hay que resolverlo, no el origen del problema.
- **Léxico institucional:** en todo el portal y en estas notas se dice
  **«institución educativa»**, nunca «colegio».
- **Cifras:** 280 estudiantes de 1.° a 5.° de secundaria · 10 equipos de gestión ·
  15 módulos activos · 20 kg de cosecha acumulada · 90 % de ahorro hídrico
- **Módulos:** `MOD-DWC-01` … `MOD-DWC-15`, **todos raíz flotante (DWC)** y
  **operando sin bomba de aire** (la aireación forzada es mejora planificada).
  Del **01 al 11 son módulos de mesa**; del **12 al 15, botellas reutilizadas**
  — que es el cierre visible del problema 04: el envase que iba a la playa
  sostiene ahora un cultivo. Menos volumen de solución significa revisar el
  nivel y la CE con más frecuencia, así que no es solo un detalle de aspecto.
- **Distribución agronómica real (2026-09-13):**

  | Módulos | Especie | pH | CE (mS/cm) |
  |---|---|---|---|
  | `01`–`07` | Lechuga crespa | 5.5–6.5 | 1.2–1.8 |
  | `08`–`09` | Lechuga arrepollada | 5.5–6.5 | 1.2–1.8 |
  | `10`–`11` | Espinaca | 6.0–6.8 | 1.8–2.3 |
  | `12`–`15` (botellas) | Cebolla china | 6.0–7.0 | 1.4–1.8 |

  «Lechuga americana» pasa a llamarse por su nombre real, **arrepollada**.
- **Especies previstas, NO sembradas:** albahaca y acelga. Están **en proyecto
  de pedido de semilla y preparación del módulo**: no ocupan ninguno de los
  quince y no hay lecturas suyas en la bitácora. Sus rangos publicados son
  bibliografía, no mediciones del CIEHS, y se rotulan como tales.
- **Sistemas:** solo dos, **germinación en almácigo** y **raíz flotante (DWC)**.
  `PROY-NFT` y `PROY-VER` **se retiraron** el 2026-09-13 (`db/15`): describían
  infraestructura inexistente y cualquier selector del panel podía ofrecerlas
  para registrar una medición. NFT, sustrato inerte y vertical no figuran ya ni
  en el portal, ni en los bancos de preguntas, ni en la base.
- **Equipos de gestión:** Indagación · Cultivo y manejo hidropónico · Monitoreo y
  registro · Cosecha y acondicionamiento · Producción y comunicación · Ventas y
  atención · Tesorería y registro de ventas · Inventario · Impacto ambiental ·
  Coordinación
- **Contacto:** ciehs.olaya@gmail.com · Área de Ciencia y Tecnología (CyT) ·
  lunes a viernes, 1:00 p. m. a 6:00 p. m.
- **Paleta:** `#10b981` primario · `#059669` oscuro · `#0284c7` azul de Huanchaco

---

## 6 bis. Administración: edición in-place (2026-09-13)

El panel modal de doce pestañas deja de ser la forma de editar el contenido. El
administrador ve **el mismo portal que un estudiante** y, con el modo edición
encendido, corrige el texto donde está, reemplaza la fotografía sobre la
fotografía y borra una publicación desde su propia tarjeta. Apagado, no queda
rastro de interfaz de administración.

Detalle completo, contrato de atributos y decisiones de seguridad en
**[[CIEHS-Admin-InPlace-UI]]**. Lo que hay que recordar desde aquí:

- El texto guardado se pinta con `textContent`, **nunca** `innerHTML`.
- El modal sigue existiendo para los formularios de alta, que es otra cosa.
- Requiere `db/16_contenido_editable.sql` aplicado.

## 6 ter. Seguridad reforzada del acceso (2026-09-13)

Tres hallazgos sobre el acceso por código, corregidos en `db/17`. El detalle
está en [[CIEHS-Auditoria-Seguridad-Auth]]; el resumen:

| | Estaba | Ahora |
|---|---|---|
| **Tanteo** | `verificar_codigo()` abierta a `anon` **sin límite de intentos** | 10 fallos por ventana de 15 min, con registro de *cuándo*, nunca de *qué* |
| **Hash** | sha256 de una vuelta, sin sal ni pimienta | pimienta en el **Vault de Supabase**, fuera de la base |
| **Entropía** | se podía fijar un PIN de 8 dígitos | `fijar_codigo()` exige 12 caracteres y 3 familias |

> [!danger] Contra la cabecera no cabe poner freno
> `is_admin()` se evalúa dentro de cada política RLS, en cada consulta: un
> contador ahí sería escribir en disco por cada fila leída del portal. El freno
> quita el oráculo **cómodo**; lo único que hace el ataque inviable de verdad es
> **la entropía del código**. Por eso el campo del modal perdió
> `inputmode="numeric"`, que era justo lo que empujaba a elegir un PIN corto.

En el cliente, además: la cabecera `X-CIEHS-Code` **solo viaja a la API del
propio proyecto**, el código **caduca a los 30 minutos sin actividad** (los
equipos del laboratorio son compartidos y el aula se queda vacía entre clase y
clase) y `guardarImagen()` rechaza URLs absolutas.

---

## 7. Pendientes

- [x] Sustituir la marca vectorial provisional por el **escudo institucional** → [[CIEHS-Identidad-Visual]].
- [x] Imagen real del **mural** integrada con puntos interactivos.
- [x] **Carpeta de campo digital**, **bitácora agronómica administrable**,
      **espacio docente** y **sección de comunidad** (pedidos, comentarios
      moderados y panel de transparencia) publicados y conectados a la base.
- [ ] **Fotografías del laboratorio y de los quince módulos DWC**, sujetas al
      protocolo de [[CIEHS-Privacidad-Menores]].
- [ ] **Archivos descargables**: el panel ya permite cargarlos; faltan los
      archivos reales, empezando por el audio-cuento «El viaje de una gota de agua».
- [x] Sustituir los equipos ficticios por los **diez equipos de gestión reales**, sin datos de menores.
- [x] **Página de privacidad y protocolo de imagen** publicada; falta la
      aprobación de dirección → [[CIEHS-Privacidad-Menores]].
- [ ] **Instalar la Vercel GitHub App** desde el navegador para habilitar el
      despliegue automático por push (§4). El CLI no puede hacerlo: es un flujo
      OAuth interactivo. Todo lo demás ya está listo — enlace correcto, rama
      `master` y repositorio sincronizado con producción. Pasos en
      [[pendientes-coordinacion/03-vercel-github-app|03 · Vercel GitHub App]].
- [x] Banco de preguntas ampliado a 72, y Arena con 150 retos → [[CIEHS-Arena-Juego]].

---

## Enlaces

- [[CIEHS-Metodologia-Pedagogica]] — ruta de 9 pasos y articulación con el CNEB.
- [[CIEHS-Backend-Supabase]] — esquema `ciehs`, tablas, RLS y capa de datos.
- [[CIEHS-Auditoria-Seguridad-Auth]] — autenticación, cabeceras y hallazgos.
- [[CIEHS-Identidad-Visual]] — escudo, sello, mural y paleta.
- [[CIEHS-Privacidad-Menores]] — qué se publica de los estudiantes.
- [[CIEHS-Arena-Juego]] — el modo de juego a pantalla completa.
- [[CIEHS]] — índice general.
- [[CIEHS-Tienda-Escolar]] — catálogo, reservas de cosecha y transparencia.
- [[CIEHS-Agronomia-Hidroponia]] — CE, pH, nutrientes por cultivo y recambio de solución.
- [[CIEHS-Estados-UI-Async]] — carga, error y vacío: qué se ve cuando la base no responde todavía.
- [[CIEHS-Admin-InPlace-UI]] — cómo se edita el portal desde el propio portal.
