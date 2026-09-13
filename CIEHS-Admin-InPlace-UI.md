---
title: CIEHS · Edición in-place (Admin UI)
aliases: [Edición in-place CIEHS, Admin in-place, CMS del CIEHS]
tags: [ciehs, administracion, cms, arquitectura, seguridad, accesibilidad]
estado: en produccion
publicado-en: https://ciehs.vercel.app/
actualizado: 2026-09-13
---

# CIEHS · Edición in-place (Admin UI)

Cómo se edita el portal desde el propio portal. Índice en [[CIEHS]]; las tablas
y políticas están en [[CIEHS-Backend-Supabase]] y el modelo de acceso en
[[CIEHS-Auditoria-Seguridad-Auth]].

> [!abstract] La idea en una frase
> El administrador ve **exactamente el mismo portal que un estudiante**, y al
> encender el modo edición aparecen controles superpuestos sobre lo que de
> verdad se puede cambiar. Apagado, no queda ni un píxel de interfaz de
> administración: esa es la condición, no un detalle estético.

---

## 1. Qué sustituye, y por qué

Había un panel aislado: un modal con **doce pestañas** que repetía, en
formularios, contenido que ya estaba en la página. Dos inventarios del mismo
texto, con el defecto clásico de esa arquitectura:

- para corregir una frase había que **adivinar en qué pestaña vivía**;
- al guardarla **no se veía el resultado** hasta cerrar el modal;
- y cada sección nueva obligaba a escribir su formulario gemelo.

Es el mismo problema que ya se resolvió con la navegación (tres inventarios de
enlaces → uno) y con los estados de datos (seis cajas → un inventario). Aquí la
respuesta es la misma: **un solo sitio donde vive cada cosa**, y ese sitio es
la página.

El modal **no desaparece**. Sigue existiendo para lo que es genuinamente un
formulario de alta —registrar una lectura de pH, dar de alta una investigación,
moderar la cola de aportes—, que no es editar lo que ya se está viendo.

---

## 2. El contrato: se gobierna por atributos

`assets/js/ciehs-inline.js` **no contiene una lista de selectores**. Lee
atributos del HTML, así que añadir una sección editable mañana no obliga a
tocar el módulo.

| Atributo | Qué habilita | Dónde se guarda |
|---|---|---|
| `data-edit="clave"` | texto editable en contexto | `ciehs.textos` |
| `data-edit-img="clave"` | imagen reemplazable | `ciehs.imagenes` + bucket |
| `data-ciehs-tipo` + `data-ciehs-id` | borrar esa publicación de un clic | su propia tabla |
| `data-modulo="MOD-DWC-01"` | cultivo y rangos de pH/CE | `ciehs.modules` |
| `data-arena-id="ar-ini-10"` | corregir enunciado y explicación | `ciehs.arena_preguntas` |

La clave se valida contra `^[a-z0-9][a-z0-9._-]{1,80}$` **en el cliente y en el
servidor** (CHECK de la tabla). El cliente no lo repite por desconfianza del
servidor: lo repite para ahorrar el viaje y dar el mensaje en castellano.

### Dos caminos separados

1. **Aplicar** — todos los visitantes, siempre. Lo guardado se pinta sobre el
   HTML estático.
2. **Editar** — solo con código de administración activo.

Si la base no responde, se queda el HTML: la misma mejora progresiva que en el
resto del portal (ver [[CIEHS-Estados-UI-Async]]).

---

## 3. Decisiones que conviene no deshacer

> [!danger] `textContent`, nunca `innerHTML`
> Todo texto guardado se pinta con `textContent`. Es **lo único** que impide que
> `ciehs.textos` sea un XSS almacenado servido a cualquier visitante si el
> código de administración llegara a filtrarse. Donde el párrafo traía negritas,
> la interfaz **avisa antes de guardar** de que se pierden, en lugar de abrir la
> puerta a HTML. Si algún día hace falta énfasis, se resuelve con lista blanca
> de etiquetas en el cliente, no quitando esa línea.

**De la arena solo se aceptan `q` y `exp`, y solo si son texto.** Dejar tocar
`correcta` u `ops` convertiría una escritura en la base en la capacidad de dejar
un reto sin respuesta válida. Rehacer un reto sigue siendo trabajo de código.

**Las correcciones de la arena son un DELTA, no una sustitución.** El banco vive
en `assets/js/ciehs-arena-preguntas.js` y ahí sigue: es lo que permite jugar sin
conexión, que en el laboratorio pasa a menudo. El delta se funde **al construir
cada ronda**, no mutando el banco; si se escribiera encima, restaurar una
corrección obligaría a recargar la página.

**Las tres tablas nuevas van en su propia carga, no en `cargarPortal()`.** Si el
DDL no está aplicado, esas consultas fallan; metidas en la tanda principal
habrían tumbado el portal entero al respaldo estático por unas tablas que solo
le importan al administrador.

**La lista de módulos se pinta desde la base.** Antes era HTML fijo. Si no se
pintara desde la base, lo editado se guardaría y no se vería. Con lista vacía
**no se pinta nada**: se conserva el respaldo estático, porque cambiar un dato
desactualizado por ninguno es peor.

> [!warning] Esconder un botón no es control de acceso
> Quien manda es RLS. Sin la cabecera con el código correcto, `is_admin()`
> devuelve `false` y el servidor rechaza la escritura, active o no el navegador
> estos controles. Esto es **interfaz, no autorización**.

---

## 4. Accesibilidad

- `role="button"` y `tabindex` se ponen y se **quitan** con el modo edición. Si
  quedaran pegados, un `<h4>` rotulado se anunciaría como botón para siempre y
  cada párrafo editable sería una parada de tabulación falsa: el administrador
  acabaría con un portal **peor** que el del estudiante, justo lo contrario de
  lo que persigue esta arquitectura.
- Una única región viva (`role="status"`) anuncia el resultado de cada acción.
  Sin ella, para un lector de pantalla un guardado correcto es indistinguible de
  un clic que no hizo nada.
- Escape cancela, `Ctrl`/`Cmd`+`Enter` guarda.
- Ningún estado se confía solo al color: verde para guardar, rojo para borrar,
  ámbar para revertir, **y todos con texto o `aria-label` explícito**.
- El campo de archivo va fuera del recorrido de tabulación y con nombre propio:
  `u-visually-hidden` oculta a la vista pero **no** al lector de pantalla.

---

## 5. Repintados

Cada vez que un pintor rehace su sección aparecen nodos nuevos sin controles. En
lugar de pedir a cada uno de los quince pintores que avise, se observa el DOM
con `MutationObserver`. Así la edición in-place no obliga a modificar quince
funciones ni se rompe cuando mañana se añada la decimosexta.

---

## 6. Pendiente

- [ ] Aplicar `db/16_contenido_editable.sql` en la base del CIEHS.
- [ ] Rotular con `data-edit` el resto de secciones (van 27 claves: cabeceras de
      módulos, las seis tarjetas de problemática con su respuesta y las notas).
- [ ] Reordenar módulos arrastrando, contra `modules.position`.

---

Relacionado: [[CIEHS-Portal-Educativo]] · [[CIEHS-Backend-Supabase]] ·
[[CIEHS-Auditoria-Seguridad-Auth]] · [[CIEHS-Arena-Juego]] ·
[[CIEHS-Estados-UI-Async]] · [[CIEHS-Identidad-Visual]]
