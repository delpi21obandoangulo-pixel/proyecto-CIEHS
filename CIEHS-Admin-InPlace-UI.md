---
title: CIEHS · Edición in-place (Admin UI)
aliases: [Edición in-place CIEHS, Admin in-place, CMS del CIEHS]
tags: [ciehs, administracion, cms, arquitectura, seguridad, accesibilidad]
estado: en produccion
publicado-en: https://ciehs.vercel.app/
actualizado: 2026-09-13
revision: 3 — el modal desaparece; los formularios van a su sección
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

> [!tip] Revisión 3 — 2026-09-13
> **El modal de doce pestañas ya no existe.** Lo que queda de él es la puerta:
> teclear el código. Todo lo demás se hace sobre el portal.
>
> | | Antes | Ahora |
> |---|---|---|
> | Corregir una frase | abrir panel → adivinar pestaña → guardar → cerrar para ver | pulsar la frase |
> | Dar de alta un lote | abrir panel → pestaña Bitácora → «+ Nuevo lote» | «+ Nuevo lote», que está junto a la bitácora |
> | Cambiar el precio | abrir panel → pestaña Catálogo → buscar en la lista → Editar | el lápiz de la tarjeta |
> | Ver cómo queda | cerrar el panel | ya lo estás viendo |
>
> Antes: **577 textos editables, 35 con aviso, fichas con lápiz y papelera, y
> el texto conserva negrita y cursiva** (revisiones 1 y 2, §§ 3 bis a 3 quater).

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

**El modal ya no existe como panel.** De sus ~620 líneas queda el paso del
código: un cuadro con un campo y un botón. Las doce pestañas se retiraron el
2026-09-13 y sus formularios viven ahora en el **cajón** (§ 3 quinquies).

Con sesión activa, la píldora «Administración» **ya no abre nada**: pedir otra
vez un código que acabas de dar sería el mismo error de siempre, un paso de
más entre la intención y el cambio.



---

## 2. El contrato: se gobierna por atributos

`assets/js/ciehs-inline.js` **no contiene una lista de selectores**. Lee
atributos del HTML, así que añadir una sección editable mañana no obliga a
tocar el módulo.

| Atributo | Qué habilita | Dónde se guarda |
|---|---|---|
| `data-edit="clave"` | texto editable en contexto | `ciehs.textos` |
| `data-edit-img="clave"` | imagen reemplazable | `ciehs.imagenes` + bucket |
| `data-edit-fondo="clave"` | fondo CSS reemplazable | `ciehs.imagenes` + bucket |
| `data-ciehs-tipo` + `data-ciehs-id` | **lápiz y papelera** en esa ficha | su propia tabla |
| `data-edit-aviso="…"` | pide la venia antes de abrir, y pinta el halo ámbar | — |
| `data-alta="bitacora"` | botón que abre ese formulario en el cajón | — |
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

> [!done] El fondo del hero ya se edita (§ 3 sexies)
> Era la última pieza del portal que no se podía cambiar sin tocar el
> repositorio. **La suposición de este aviso era errónea** y conviene dejarlo
> dicho: `style.backgroundImage` **sí** funciona bajo esta CSP; lo que no
> funciona es lo contrario, insertar una hoja por JS. Comprobado, no supuesto.

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

## 3 quinquies. El cajón: cada formulario, en su sección

Las doce pestañas no se reorganizaron: **se retiraron**. Su propio comentario
en el CSS decía que existían porque «el panel creció a tres áreas y en un modal
de 88vh se perdía el hilo». La salida no era organizar mejor el panel — era no
tener panel.

Ahora cada sección trae el botón que abre **su** formulario, y el formulario se
abre en un **cajón lateral** que deja ver el portal al lado, que es lo que se
está editando.

| Sección del portal | Botón |
|---|---|
| Inicio (galería) | + Nueva fotografía |
| Investigaciones | + Nueva investigación · + Resultados · + Nueva entrada de campo |
| Investigaciones (aportes) | Moderar los aportes recibidos |
| Trazabilidad | + Nuevo lote |
| Datos | + Registrar lectura de pH y CE · Validar mediciones |
| Espacio docente | + Nuevo recurso |
| Comunidad | + Nuevo producto · Pedidos, comentarios y caja |
| *(la portada)* | desde la barra: no tiene sección propia donde anclar un botón — es el hero |

**El cajón no lleva barra de pestañas.** Si has entrado por «+ Nuevo lote» ya
estás en la bitácora; volver a preguntártelo sería no haber escuchado el clic.

> [!important] Los formularios no se reescribieron
> Se **movieron** tal cual, con sus ids intactos, de dentro del modal al cajón.
> `crearEditor(cfg)` los gobierna por id, así que reescribirlos habría sido
> trabajo gratis y una fuente de regresiones. Lo que cambió es **quién los abre
> y desde dónde**, no lo que son.

### Lo que se fue con las pestañas

- La barra `.admin-tabs` y su CSS.
- `.admin-session` — quién dice que hay sesión y permite cerrarla es la barra.
- El puente provisional `CIEHS.abrirFormularios` y su botón «Formularios», que
  ya avisaba en su comentario de que se caería solo. Su sitio en la barra lo
  ocupa ahora **«Portada»**.

> [!check] Comprobado con el código real, contra la base
> Los 11 botones existen y **solo se ve el de la sección en la que estás**: en
> Trazabilidad, «+ Nuevo lote» y ninguno más. Abre el cajón con el panel de
> Bitácora, el título correcto, el foco dentro y el portal sin desplazarse
> detrás. Escape cierra. El lápiz de una ficha abre el **cajón**, no el modal.
> Un envío real del formulario de producto respondió «Guardado y publicado» y
> los 6 productos siguieron intactos. Sin sesión: cero botones visibles, cajón
> oculto, cero halos, y la puerta abre con el campo del código y sin pestañas.

---

## 3 sexies. El fondo del hero

La primera imagen que ve cualquiera que entra, y la última que seguía atada al
repositorio. No es una etiqueta `<img>`: es un `background-image` del CSS
(`.hm-bg`), así que `data-edit-img` no le servía.

Lleva ahora `data-edit-fondo="hero.fondo"` y se guarda en la misma tabla que
las demás —`ciehs.imagenes`, que existe justo para los huecos de imagen fijos—.

> [!important] Lo que la CSP permite, comprobado y no supuesto
> La política de producción lleva `style-src-attr 'none'` y `style-src 'self'`.
> Se montó una página de prueba **con esa misma política** para medirlo:
>
> | Vía | Resultado |
> |---|---|
> | `element.style.backgroundImage = …` | **funciona** |
> | `style.setProperty(…)` | **funciona** |
> | `<style>` creado por JS + `insertRule` | **falla** — `sheet` sale `null` |
>
> Es justo al revés de lo que parece: `style-src-attr` gobierna el atributo
> `style=` del marcado, no la propiedad del CSSOM. Lo que la CSP no admite es
> una hoja en línea sin nonce. La URL apunta al bucket de Supabase, que
> `img-src` ya permitía.

`montarImagen` sirve a los dos casos —`<img>` y fondo— en vez de duplicarse:
cambian tres cosas (de dónde sale la clave, si hay `alt` que tocar, y dónde se
cuelga la barra) y el resto es idéntico. Duplicarla habría significado arreglar
dos veces cada fallo de la subida.

La barra va **arriba** y con `z-index` alto, no abajo como la de una foto: el
hero ocupa la pantalla entera y abajo a la derecha caía fuera de la vista, y el
velo y el título se pintan sobre el fondo y se la tragaban.

### Un defecto viejo que salió al hacer esto

`borrarImagen` borraba la fila **y dejaba el archivo en el bucket**. Como cada
reemplazo sube uno nuevo con marca de tiempo, cambiar el mural tres veces
dejaba tres archivos abandonados para siempre. En un plan gratuito eso es cuota
que no vuelve. Ahora el borrado se lleva el archivo, y el reemplazo retira el
anterior en cuanto la fila nueva está guardada.

`borrarArchivoEvidencia` devuelve **si borró de verdad**, y «Quitar» lo dice
cuando no pudo. `storage.remove()` responde 200 con lista vacía tanto si la
política no deja como si el objeto ya no estaba: callarlo daría por limpio algo
que sigue ocupando sitio.

> [!warning] Para comprobar un borrado en Storage, rompe la caché
> Durante esta prueba el objeto siguió respondiendo **200 en su URL pública
> después de borrarlo**, y eso llevó a un diagnóstico equivocado —que la
> política de `storage.objects` no dejaba borrar—. Era la **caché del CDN**.
> Con `?t=<algo>` en la URL responde 400, que es lo que hay que mirar.

> [!check] Comprobado con el código real, contra la base
> Subida → la fila aparece en `ciehs.imagenes` y el fondo apunta al bucket.
> Recarga **sin sesión** → el visitante ve el fondo nuevo. «Quitar» → la fila
> desaparece y el fondo vuelve al del CSS **sin recargar** (basta con soltar la
> propiedad; con un `<img>` no se puede, porque su `src` ya se pisó). Tras dos
> subidas y un quitar, **cero archivos huérfanos** y `ciehs.imagenes` vacía.

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
