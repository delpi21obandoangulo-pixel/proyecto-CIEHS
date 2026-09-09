---
title: CIEHS · Estados de UI asíncrona
aliases: [Estados de carga CIEHS, Skeletons CIEHS, Empty states CIEHS, estado-caja]
tags: [ciehs, portal, frontend, ux, async, accesibilidad]
componente: .estado-caja + .skeleton
codigo: assets/css/ciehs.css · assets/js/ciehs-app.js
estado: en produccion
actualizado: 2026-09-09
---

# CIEHS · Estados de UI asíncrona

Qué ve el visitante cuando una sección **no puede enseñar todavía lo que
promete**. Parte de [[CIEHS-Portal-Educativo]]; los datos que se esperan y de
dónde salen se describen en [[CIEHS-Backend-Supabase]].

---

## 1. El problema: tres cosas distintas que se veían igual

Cada sección que depende de la base tiene tres momentos sin contenido, y son
**tres cosas opuestas** para quien mira:

| Estado | Qué pasó | Qué necesita el visitante |
|---|---|---|
| **Cargando** | La petición está en vuelo | Saber que viene algo, y cuánto |
| **Vacío** | La base respondió y no hay filas | Saber que es normal y quién lo llenará |
| **Error** | La base no respondió | **Poder reintentar** |

Antes de 2026-09-09 esto vivía repartido por cada pintor: **ocho cajas hechas a
mano** (`.tele-empty`, `.res-vacio`, `.carpeta-estado`, `.tienda-estado`,
`.transp-estado`, `.comentarios-estado`, `.res-empty`, `.campo-vacio`) decían lo
mismo con estilos distintos. Y ninguna separaba las dos últimas: «todavía no hay
comentarios» y «no se pudo cargar» se veían idénticas.

El síntoma más caro estaba en la carpeta de campo: un estudiante **sin conexión**
leía que *su módulo no tiene mediciones*. Es falso, y además desanima justo a
quien iba a registrar la primera.

---

## 2. La solución: un componente y una fase

Un solo componente CSS (`.estado-caja`) y un solo helper JS (`CIEHS.estado`),
con tres variantes que comparten caja y se separan por color e icono.

### Tres decisiones de diseño

**Ámbar, no rojo, en el error.** En un laboratorio escolar la conexión se cae a
todas horas y no es culpa de nadie. El rojo se reserva para lo que el visitante
ha hecho mal y **puede corregir** (validación de formularios). Un rojo por cada
caída de red convierte la alarma en ruido de fondo.

**Botón solo en el error.** De los tres es el único que el visitante puede
arreglar. Poner «Reintentar» sobre un estado vacío sería prometer que insistir
sirve de algo.

**Se enseña el motivo técnico.** `No se pudo cargar (TypeError: Failed to fetch)`.
Quien mira la pantalla en el laboratorio suele ser también quien puede avisar de
que la base está caída, y un mensaje sin causa no le sirve para eso.

### La fase

```js
CIEHS.faseDatos()  // 'cargando' | 'listo' | 'error'
```

Existe porque `CIEHSData.conectado` vale `false` **tanto mientras carga como
cuando falla**. Sin distinguirlos no se puede elegir entre esqueleto y error, y
esa confusión es exactamente la que producía los mensajes falsos.

Cada reintento vuelve a poner la fase en `'cargando'`: si no, al pulsar el botón
no habría ninguna señal de que la pulsación hizo algo.

---

## 3. El barrido, y por qué no es un `pulse`

Los esqueletos llevan **dos capas de movimiento**, cada una diciendo una cosa
distinta:

- **Barrido** (`brilloEsqueleto`, en `::after`) — un destello que cruza de
  izquierda a derecha. **Tiene dirección**, y eso es lo que comunica «esto se
  está llenando» en lugar de «esto existe».
- **Latido** (`latidoEsqueleto`, en el elemento) — una oscilación suave de
  opacidad. Dice «sigue vivo» incluso cuando el barrido está fuera de cuadro.

Se evaluó sustituir el barrido por un `pulse` solo. **Se descartó**: el barrido
ya era el patrón del proyecto en cuatro puntos, y cambiarlo habría dejado dos
lenguajes de espera conviviendo. El latido se añadió *encima*, no *en lugar de*.

Las dos se apagan solas con `prefers-reduced-motion` por la regla global del
principio de `ciehs.css`.

### Glassmorphism: no es decoración, es continuidad

Los esqueletos eran bloques de `--surface-2` **opaco**. Desde que el portal tiene
plano ambiental detrás (ver [[CIEHS-Identidad-Visual]]), un bloque gris macizo
abría un agujero en la composición justo donde iba a aparecer una tarjeta
traslúcida — y al llegar los datos el cambio daba un salto de color.

Ahora el esqueleto **tiene ya el material de lo que sustituye**:

```css
.skeleton{
  background:rgba(255,255,255,0.42);
  border:1px solid rgba(255,255,255,0.55);
  backdrop-filter:blur(8px) saturate(120%);
}
```

---

## 4. Cómo se apoyan los estados sobre el cliente aislado

Toda esta capa es **presentación pura**: no abre ni una consulta propia. Se monta
sobre el snapshot único que `CIEHSData.cargarPortal()` ya trae, y por eso **no
puede romper el aislamiento** que describe [[CIEHS-Backend-Supabase]]:

- El cliente sigue forzado a `db: { schema: 'ciehs' }`. Los estados no
  construyen consultas, así que no hay forma de que una sección alcance `public`
  ni ningún esquema ajeno.
- No hay una petición por sección. Hay **una sola tanda** (`Promise.all` de 15
  consultas) y todas las secciones leen del mismo resultado. Un estado por
  sección con su propio `fetch` habría multiplicado por quince la superficie
  contra la base y roto la regla de una sola tanda.
- El vacío se calcula sobre las filas que **RLS ya dejó pasar**. Si una política
  oculta filas, la sección dice «todavía no hay» — que es la verdad *desde el
  punto de vista de ese visitante*, y es justo lo que debe decir.

> Corolario que conviene recordar: **«vacío» en el portal público significa
> «vacío para ti»**, no «vacío en la tabla». Un dato sin publicar existe en la
> base y es invisible aquí, por diseño. Ver [[CIEHS-Privacidad-Menores]].

### El reintento del panel es local

En el panel de administración el botón recarga **solo ese listado**, no el
portal. Recargar entero para arreglar una lista repintaría los otros once
listados y podría cerrar el formulario que el equipo tenga a medio escribir.
Se distingue con `Estado.error(texto, motivo, local)`.

---

## 5. El cuarto caso: datos caducados

Fácil de pasar por alto, y apareció al probar, no al diseñar: **la recarga falla
pero ya había datos buenos en pantalla**.

- Borrarlos para enseñar un error **tira información válida**.
- Dejarlos callados es peor: se leen cifras viejas como si fueran de ahora.

Se hacen las dos cosas. Los datos se quedan y aparece `.datos-caducados`, una
barra anclada abajo que dice **desde cuándo son** y ofrece reintentar. No es un
modal: lo que hay en pantalla sigue siendo útil y se puede seguir leyendo. En
móvil sube por encima del FAB de administración, que vive en la misma esquina.

---

## 6. Dos trampas encontradas, para no repetirlas

**El componente se llamó `.estado` y colisionó.** Esa clase ya existía como
insignia «publicado / borrador» en siete puntos del panel. La regla `.estado{}`
les impuso `display:flex`, fondo blanco y `gap:14px`. Se renombró a
**`.estado-caja`**; hay una nota en el CSS junto a `.inv-item .estado` para que
no se repita. Regla general: antes de crear una clase genérica en un archivo de
3.800 líneas, buscarla.

**Las media queries no sirven aquí.** La caja vive tanto a lo ancho de una
sección (1160 px) como dentro del panel de administración, que mide **410 px con
el viewport a 1440**. Una media query mira la ventana y no se entera: el texto
quedaba estrangulado en una columna de cinco líneas junto al botón. Se resuelve
con `flex-wrap` y una base de `16rem` para el texto, que sí reaccionan al ancho
**del contenedor**.

---

## 7. Dónde NO se puso esqueleto, a propósito

`#invGrid` y `#phModulosChart` traen **respaldo estático real y legible** en el
HTML — las dos fichas oficiales de investigación y los rangos de referencia de
cada cultivo, que son objetivos fijados por el equipo y siguen siendo correctos
sin base. Cambiar contenido útil por un brillo empeora la sección.

Ahí el estado lo lleva la **línea de procedencia**, que es la que tiene que
decir si lo que se lee viene de la base o del respaldo.

> Principio: el esqueleto sustituye a la **nada**, nunca a algo que ya se lee.

---

## 8. Cobertura

| Módulo | Secciones con los tres estados |
|---|---|
| Investigaciones | Resultados por investigación · carpeta de campo · aportes publicados · línea de procedencia |
| Trazabilidad | Bitácora agronómica (oculta la tabla si no hay filas) |
| Datos | Telemetría · carpeta de campo digital (4 casos) · selector de módulos · línea de sincronización |
| Comunidad | Comentarios · catálogo de la tienda · reparto de transparencia |
| Docentes | Vacío del filtro de recursos, con botón para deshacerlo |
| Panel admin | Los 12 listados, con reintento local |

Dos secciones distinguen además el **vacío del filtro** del vacío real: «la
carpeta tiene 8 entradas, pero ninguna de esta clase» no es lo mismo que «la
carpeta está vacía», y la primera ofrece deshacer el filtro.

---

## 9. Pendientes

- [ ] `--ink-mute` sigue en 3.0:1 cuando cae fuera de una tarjeta (ver
      [[CIEHS-Identidad-Visual]]). Afecta a los metadatos dentro de los estados.
- [ ] Los estados están verificados en navegador para el portal público; los 12
      listados del panel solo de forma estática, porque probarlos pide el código
      de administración.
- [ ] Un `aria-busy` en los contenedores mientras `fase === 'cargando'` ayudaría
      a los lectores de pantalla más que el `role="status"` actual.

---

## Enlaces

- [[CIEHS-Portal-Educativo]] — arquitectura del portal donde viven estos estados.
- [[CIEHS-Backend-Supabase]] — el cliente aislado y la tanda única que alimenta la fase.
- [[CIEHS-Identidad-Visual]] — plano ambiental, tokens de tinta y contraste medido.
- [[CIEHS-Privacidad-Menores]] — por qué «vacío» significa «vacío para ti».
- [[CIEHS-Tienda-Escolar]] — catálogo y transparencia, dos de las secciones cubiertas.
- [[CIEHS]] — índice general.
