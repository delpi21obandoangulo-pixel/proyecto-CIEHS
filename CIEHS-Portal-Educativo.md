---
title: CIEHS · Portal educativo
aliases: [Portal CIEHS, ciehs.vercel.app, Arquitectura del portal]
tags: [ciehs, portal, arquitectura, vercel, frontend]
institucion: I.E. N.° 80033 “José Olaya Balandra” — Huanchaco, La Libertad, Perú
produccion: https://ciehs.vercel.app
repositorio: github.com/delpi21obandoangulo-pixel/proyecto-CIEHS
estado: en produccion
actualizado: 2026-09-04
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
  que conocen la nota, no el proceso. El contexto costero de Huanchaco es la
  **condición** en la que hay que resolverlo, no el origen del problema.
- **Léxico institucional:** en todo el portal y en estas notas se dice
  **«institución educativa»**, nunca «colegio».
- **Cifras:** 280 estudiantes de 1.° a 5.° de secundaria · 10 equipos de gestión ·
  15 módulos activos · 20 kg de cosecha acumulada · 90 % de ahorro hídrico
- **Módulos:** `MOD-DWC-01` … `MOD-DWC-15`, **todos raíz flotante (DWC)** y
  **operando sin bomba de aire** (la aireación forzada es mejora planificada).
  `PROY-NFT` y `PROY-VER` son proyecciones a futuro: no están instalados.
- **Especies:** lechuga crespa · lechuga americana · espinaca · cebolla china ·
  albahaca · acelga
- **Equipos de gestión:** Indagación · Cultivo y manejo hidropónico · Monitoreo y
  registro · Cosecha y acondicionamiento · Producción y comunicación · Ventas y
  atención · Tesorería y registro de ventas · Inventario · Impacto ambiental ·
  Coordinación
- **Contacto:** ciehs.olaya@gmail.com · Área de Ciencia y Tecnología (CyT) ·
  lunes a viernes, 1:00 p. m. a 6:00 p. m.
- **Paleta:** `#10b981` primario · `#059669` oscuro · `#0284c7` azul de Huanchaco

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
