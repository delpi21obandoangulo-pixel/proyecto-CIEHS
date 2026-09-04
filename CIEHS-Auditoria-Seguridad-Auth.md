---
title: CIEHS · Auditoría de seguridad y autenticación
aliases: [Seguridad CIEHS, Auth CIEHS, Hallazgos de seguridad]
tags: [ciehs, seguridad, auth, rls, csp, privacidad, menores]
estado: hallazgos corregidos · riesgos abiertos documentados
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
| Lectura pública de las 5 tablas publicadas | 200 |
| `admins` desde anónimo | `permission denied` |
| Escritura anónima | 401 |
| **Autenticado que no es admin escribe** | **bloqueado** |
| Escritura con la identidad real del coordinador | permitida, trigger `updated_at` dispara |
| Credenciales incorrectas | mensaje limpio, botón reactivado |

> [!note] Sobre la fricción frente a la seguridad
> Antes de conectar el backend se retiró el literal del PIN del JavaScript y se
> dejó su huella SHA-256. Aquello era **fricción deliberada, no seguridad**:
> toda validación hecha en el cliente es evitable. Solo evitaba que la clave se
> leyera a simple vista en el código público. La protección real llegó con RLS.

---

## 2. Hallazgos corregidos

### 🔴 Identificadores de auth expuestos a cualquier visitante

`telemetry_readings.recorded_by` y `site_config.updated_by` devolvían por la API
pública el **uuid de auth de una persona real**. En instancia compartida ese
mismo uuid aparece en los otros proyectos, así que permitía **correlacionar
identidades entre ellos**. En un portal que publicará trabajo de menores, es
justo lo que hay que evitar.

Corregido con permisos por columna. La trampa técnica está documentada en
[[CIEHS-Backend-Supabase]] §3.

### 🔴 DDL completo publicado en el sitio

`/db/01_schema.sql` era accesible públicamente: tablas, políticas RLS y la
lógica de `is_admin()`. No es una credencial y RLS seguía protegiendo, pero
publicarlo no aporta nada al visitante y facilita buscar huecos.
`.vercelignore` ahora excluye `db/` y todos los `.md`.

### 🔴 Documentación interna descargable

En Surge, el informe empresarial `.docx` y el README quedaban descargables desde
el sitio. Excluidos al migrar a Vercel.

### 🟠 PIN publicado en el README

Retirado del README y del JavaScript.

### 🟠 Clickjacking

El HTML declaraba estar pensado «para ejecutarse embebido» y el hosting no
permitía cabeceras. `X-Frame-Options: DENY` más `frame-ancestors 'none'`.

### 🟠 `.env.local` con token OIDC

Creado por `vercel link`. Ya estaba fuera de git y devolvía 404; se añadió
`.env*` a `.vercelignore` como defensa en profundidad.

### 🟠 Rótulos que prometían lo que no hacían

No es seguridad, pero sí integridad: la sección Datos decía «monitoreo en tiempo
real» sobre HTML fijo, y el panel decía «Cambios guardados y **publicados en el
portal**» sin publicar nada fuera del navegador de quien editaba. Un coordinador
podía dar por difundido un aviso que solo veía él.

---

## 3. Cabeceras HTTP

Definidas en `vercel.json`, verificadas en producción:

| Cabecera | Valor |
|---|---|
| `Content-Security-Policy` | `default-src 'self'` · `frame-ancestors 'none'` · `object-src 'none'` · `connect-src` abierto **solo** al host Supabase del proyecto |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | cámara, micrófono y geolocalización denegados |

> [!warning] CSP con `'unsafe-inline'`
> `script-src` y `style-src` admiten `'unsafe-inline'` porque todo el CSS y el
> JS del portal viven en línea dentro de `index.html`. **Es la debilidad
> conocida de la CSP actual.** Endurecerla exige separar el código a archivos
> propios o firmar cada bloque con nonces, lo que a su vez requiere generar el
> HTML en cada petición.

---

## 4. Riesgos abiertos

### 🟠 Datos personales de menores — Ley N.° 29733 · *parcialmente atendido*

El portal publicará trabajo de estudiantes menores de edad. **No existe aviso de
privacidad, ni consentimiento de uso de imagen, ni criterio escrito de qué se
publica.** La sección de trazabilidad ya declara la intención correcta —«sin
exponer datos personales de los estudiantes»— pero no hay política que la
respalde.

La página de privacidad y el protocolo ya están **redactados y publicados** en
`#/privacidad`, con el inventario real de datos que trata el portal. Lo que
**sigue bloqueando** es la aprobación formal de la dirección y la ficha de
autorización para apoderados → [[CIEHS-Privacidad-Menores]].

### 🟠 Sin responsable ni proceso de actualización

No está escrito quién carga las mediciones, quién publica avisos ni quién
aprueba fotos. Sin eso, un portal así queda congelado a las pocas semanas.

### 🟠 Licencia contradictoria

El README declara MIT sin archivo `LICENSE`, y el pie dice «Todos los derechos
reservados». Para el material pedagógico descargable encaja mejor una Creative
Commons (CC BY-NC-SA).

### 🟡 Sin protección de contraseñas filtradas ni MFA

Los *advisors* de Supabase señalan que la instancia no comprueba contraseñas
contra HaveIBeenPwned y tiene pocas opciones de MFA. Es configuración **de la
instancia compartida**, así que afecta también a los otros proyectos y no debe
cambiarse sin acordarlo.

---

## 5. Qué revisar tras cada cambio

- [ ] `curl -I` sobre producción: las seis cabeceras siguen presentes.
- [ ] Que ningún documento interno responda 200 (`db/`, `*.md`, `.env*`).
- [ ] Que las consultas anónimas pidan **columnas explícitas** donde haya
      columnas vetadas — un `select=*` nuevo rompería la sección entera.
- [ ] `get_advisors` de Supabase: que no aparezca ninguna alerta con esquema
      `ciehs` (las de `public` y `safary_kids` son ajenas y no se tocan).

---

## Enlaces

- [[CIEHS-Portal-Educativo]] — arquitectura, alojamiento y cacheo.
- [[CIEHS-Backend-Supabase]] — esquema, RLS y permisos por columna.
- [[CIEHS-Metodologia-Pedagogica]] — contenido pedagógico que se publica.
