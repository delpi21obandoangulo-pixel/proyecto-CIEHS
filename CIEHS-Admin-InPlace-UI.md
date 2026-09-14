---
title: CIEHS · Edición in-place (Admin UI)
aliases: [Edición in-place CIEHS, Admin in-place, CMS del CIEHS]
tags: [ciehs, administracion, cms, arquitectura, seguridad, accesibilidad]
estado: en produccion
publicado-en: https://ciehs.vercel.app/
actualizado: 2026-09-13
revision: 2 — texto con formato y barra de administración
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

> [!tip] Revisión 2 — 2026-09-13
> Dos cambios que esta nota ya recoge:
>
> 1. **El texto editable conserva negrita y cursiva.** Antes se aplanaba.
> 2. **El código de acceso ya es el estado, no un menú.** Entrar deja el portal
>    entero en administración, con una barra fija arriba; la palanca flotante
>    que había que pulsar aparte desapareció.
>
> Las dos se explican en § 3 bis.

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

El modal **está en retirada**. Conserva dos cosas y las dos son temporales:
la **puerta** —teclear el código— y los formularios de **alta** que todavía no
se han trasladado a su sección (registrar una lectura de pH, dar de alta una
investigación, moderar la cola de aportes). Mientras duren ahí se llega a
ellos desde el botón **Formularios** de la barra, que existe sólo si `app.js`
publica el puente `CIEHS.abrirFormularios` — el día que cada alta esté en su
sitio, el botón se cae solo y el modal se queda únicamente con el código.



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

> [!danger] Lista blanca, nunca `innerHTML` con lo que venga de la base
> Todo texto guardado se **reconstruye nodo a nodo** contra una lista blanca
> (`b`, `strong`, `i`, `em`, `br`) y sin copiar ni un atributo. Es **lo único**
> que impide que `ciehs.textos` sea un XSS almacenado servido a cualquier
> visitante si el código de administración llegara a filtrarse. Los detalles, en
> § 3 bis → «El texto conserva su formato».
>
> *Hasta la revisión 1 esta decisión era «pintar con `textContent` a secas», y
> la nota avisaba de que si algún día hacía falta énfasis se resolvería con
> lista blanca y no relajando la regla. Es exactamente lo que se hizo.*

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

## 3 bis. La barra: administrar es un estado, no un menú

Hasta la revisión 1 hacían falta **tres pasos** para editar una frase: entrar
con el código, cerrar el modal que se abría encima, y encontrar y pulsar una
palanca flotante en una esquina. Tres pasos para lo que es un solo estado.

Ahora **el código correcto es el estado**. Al validarlo, el modal se cierra y
el portal entra en administración, con una barra fija por encima de la
cabecera:

| Pieza | Qué hace |
|---|---|
| **Modo administración** + punto verde | dice en qué estado está el portal |
| contador de cambios | cuántos se han publicado **en esta sesión**; no persiste a propósito |
| **Formularios** | provisional: abre las altas que aún viven en el modal |
| **Ver como visitante** | apaga los controles **sin cerrar la sesión** — la barra se vuelve gris y dice «Administración en pausa» |
| **Salir** | tira el código y devuelve el portal a su estado público |

La cabecera del portal es `sticky` a `top:0`, así que hay que bajarla justo lo
que mide la barra. No se usa una constante: la barra crece a dos líneas en
móvil y con el texto del sistema en grande. Se mide con `getBoundingClientRect`
y se publica como `--ed-admin-alto`, que es lo que lee el CSS.

> [!check] Comprobado al salir
> Quedan 34 lápices y papeleras montados en el DOM, y es deliberado: **cero
> visibles, cero alcanzables con el tabulador y ningún `[data-edit]` conserva
> su `role="button"`**. Retirarlos de verdad obligaría a desmontar los oyentes
> que `montarTexto` colgó de cada nodo; sin guardar sus referencias, lo único
> posible sería borrar el nodo y reiniciar `_edMontado`, lo que **duplicaría
> los oyentes** al volver a entrar y haría que un clic abriera el editor dos
> veces. Se cambia el día que haga falta desmontar de verdad.

> [!warning] La sesión caduca por inactividad
> Cuando eso ocurre, la barra se retira **y se anuncia**. Si desapareciera sin
> más, el siguiente guardado fallaría con un 401 y parecería que el código
> estaba mal — que es el peor síntoma posible.

### El texto conserva su formato

Hasta la revisión 1, lo guardado se repintaba con `textContent`. Era la barrera
que impedía convertir `ciehs.textos` en un **XSS almacenado** servido a todos
los visitantes, y por eso no se tocaba. Pero tenía un precio: el portal tiene
**154 párrafos con negrita dentro**, y editar uno lo devolvía en texto plano.
Con 27 textos rotulados era una molestia; rotulado el portal entero, habría sido
la razón por la que nadie usa esto.

La salida ya estaba escrita en la cabecera del propio archivo: *«se resuelve con
lista blanca de etiquetas, no quitando esta línea»*.

- Se parsea en un documento **inerte** (`DOMParser`) — ahí no se ejecuta un
  script ni corre un `onerror` — y sobre ese árbol muerto se reconstruye otro
  **nodo a nodo**, creando sólo `b`, `strong`, `i`, `em`, `br` y **sin copiar ni
  un atributo**. No es «quitar lo peligroso», es **copiar lo permitido**.
- De `script`, `style`, `iframe`, `svg` y compañía no se conserva **ni el
  contenido**; el resto de etiquetas se desenvuelve y queda su texto.
- El filtrado corre **dos veces**, al guardar y al pintar. Que el valor se
  saneara al escribirlo no basta: la fila pudo llegar a la tabla por otra vía.
- En ningún punto se asigna `innerHTML` con algo que venga de la base.

> [!danger] `<a>` queda fuera a propósito
> Sin enlaces, un código de administración filtrado **no permite convertir un
> párrafo del portal en un cebo hacia otro sitio**. Ampliar la lista blanca es
> una decisión de seguridad, no de estilo.

La comprobación está hecha y es repetible: `tools/prueba-saneador.html`, con
diecisiete cargas colgadas de verdad del documento. Tiene que dar **cero
ejecuciones** y las diecisiete en `LIMPIO`. Si se toca la lista blanca, hay que
traer el cambio a esa página o estará midiendo código que ya no existe.

---

## 3 ter. El portal entero, rotulado

El motor se gobierna por atributos, asi que su alcance es exactamente **lo que
este rotulado**. Hasta la revision 1 habia 27 textos con `data-edit`, casi todos
en dos secciones: el resto del portal no se podia tocar.

Ahora hay **577**, repartidos por las catorce rutas, mas **35 con aviso**.

| Ruta | Textos | | Ruta | Textos |
|---|--:|---|---|--:|
| metodologia | 134 | | trazabilidad | 44 |
| modulos | 75 | | privacidad | 31 |
| equipos | 54 | | datos | 29 |
| juega | 50 | | docentes | 27 |
| investigaciones | 21 | | mural | 21 |
| comunidad | 19 | | portal (nav y pie) | 17 |
| eureka | 16 | | contacto | 7 |
| inicio | 5 | | | |

El rotulado no se hizo a mano: lo genera `tools/rotular-editables.js`, que es
**idempotente** —al añadir una seccion basta con volver a pasarlo—. Lo que deja
fuera y por que esta en `tools/LEEME.md`; en resumen, **nada que repinte el JS**,
porque ahi un `data-edit` guardaria un valor que el siguiente refresco borra.

> [!check] Comprobado: el contenido no se toco
> `index.html` es identico **byte a byte** quitando los atributos nuevos. Se
> añadieron 550 atributos y no se movio una letra del texto.

### Por que `inicio` solo tiene 5

No es un olvido. El hero lo pinta `pintarConfig` desde `ciehs.site_config`, y la
galeria de evidencias desde `ciehs.evidencias`: las dos son editables, pero **por
su tabla**, no por `ciehs.textos`. Rotularlas habria dado un lapiz que miente.

### Las imagenes ya estaban cubiertas

De las 16 etiquetas `<img>` del portal, **11 son piezas de marca** (emblema,
isotipo, logotipo) que se cambian en el repositorio —la propia pagina de
identidad dice que el dibujo no cambia— y **4 son el respaldo estatico de la
galeria**, que se repinta. La unica imagen de hueco fijo es el mural, y ya
llevaba `data-edit-img`. No habia 15 pendientes.

> [!todo] Lo que si falta: el fondo del hero
> Es una imagen fija en CSS (`.hm-bg`, `invernadero-dwc.jpg`), no una etiqueta
> `<img>`, asi que `data-edit-img` no le sirve. Y no basta con asignar
> `style.backgroundImage`: la CSP lleva `style-src-attr 'none'` y eso crea un
> atributo `style`. Habria que insertar la regla por CSSOM, como ya hace
> `ciehs-app.js` con la mascara del hero. Va con la portada, en la fase que
> traiga `site_config` al portal.

---

## 3 quater. Las fichas se editan, no solo se borran

El motor sabía **retirar** una publicación desde su propia tarjeta, pero no
cambiarla: para corregir el precio de un producto o la fecha de un lote había
que ir al panel y buscar la fila en una lista — justo el camino que la edición
in-place vino a quitar.

Ahora cada ficha con formulario lleva **lápiz y papelera**. El lápiz abre el
formulario de ESA fila, ya relleno.

> [!important] No se reescribió ningún formulario
> `crearEditor(cfg)` ya servía a seis secciones y sólo dependía de ids del DOM.
> Se le añadió `editar(clave)` —que carga la lista si hace falta, porque con la
> caché vacía `abrir()` no encontraría la fila y abriría **un alta en blanco**,
> que es el error más difícil de detectar— y `app.js` publica el puente
> `CIEHS.editarFicha(tipo, clave)`. El lápiz sólo llama.

| Tipo | Editor | Pestaña |
|---|---|---|
| `lote` | `edBitacora` | Bitácora |
| `nota` | `edCarpeta` | Carpeta |
| `recurso` | `edRecursos` | Recursos |
| `movimiento` | `edCaja` | Comunidad |
| `evidencia` | `edEvidencias` | Evidencias |
| `producto` | `edProductos` | Catálogo |

**El lápiz sólo aparece si el tipo tiene editor** (`CIEHS.puedeEditarFicha`).
`comentario`, `aporte` e `investigacion` se quedan con papelera: enseñar un
lápiz que no lleva a ninguna parte es peor que no enseñarlo.

Cuando los formularios se muden del modal a su sección, **el mapa sigue valiendo
tal cual**: lo que cambia es dónde vive el form, no quién lo abre.

### Dos rotulados que faltaban

- **`fichaInvestigacion`** llevaba `data-inv-code` —que usa el respaldo estático
  para leerse a sí mismo— pero no el par del motor. Además `investigacion` no
  estaba en el mapa `BORRABLES`, así que el atributo por sí solo no habría hecho
  nada: `montarBorrable` sale sin montar cuando el tipo no está en la tabla.
  Se retira **por `code`**, no por id, y el aviso dice que **arrastra los
  resultados**, porque `resultados` cuelga de la investigación.
- **La rejilla de recursos destacados** se quedó sin rotular; la normal sí lo
  estaba. Misma tabla, mismo borrado.

> [!caution] Lo destacado no se pudo probar en vivo
> `ciehs.resources` está **vacía**, así que no hay ninguna tarjeta destacada que
> mirar. El atributo está puesto y es idéntico al de la rejilla normal, que sí
> funciona — pero conviene comprobarlo el día que se cargue el primer recurso.

> [!check] Comprobado con el código real, contra la base
> Entrando con el código de administración: 21 fichas de 7 tipos en el portal.
> Lápiz **sólo** en los 4 tipos con editor que había en pantalla (evidencia,
> nota, lote, producto) y papelera en los 7. El lápiz de «Lechuga crespa» abrió
> el formulario de Catálogo con su nombre y su precio ya puestos.

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
