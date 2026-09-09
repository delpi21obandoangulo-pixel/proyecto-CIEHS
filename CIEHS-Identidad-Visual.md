---
title: CIEHS · Identidad visual
aliases: [Escudo CIEHS, Marca CIEHS, Paleta CIEHS, Mural CIEHS]
tags: [ciehs, identidad, marca, diseno, mural]
estado: isotipo del CIEHS como marca del portal · plano ambiental + vidrio
actualizado: 2026-09-09
---

# CIEHS · Identidad visual

Marca, paleta y piezas gráficas del portal. Parte de [[CIEHS]]; el uso en la
interfaz se describe en [[CIEHS-Portal-Educativo]].

---

## 1. Origen: el mural institucional

Todas las piezas salen de un **único mural ilustrado** aportado por la
coordinación, que reúne el escudo, el reto climático, los ODS y los elementos de
Huanchaco (caballito de totora, pingüino de Humboldt).

El mural sirve a la vez de **fuente de los logotipos** y de imagen real de la
sección Mural del portal, con cuatro puntos interactivos sobre las zonas que
nombran.

---

## 2. Piezas

| Archivo | Qué es | Dónde se usa |
|---|---|---|
| `escudo-ie80033.png` | Escudo oficial de la I.E. N.° 80033, fondo transparente | **Ya no se usa en el portal** — se conserva para documentos del colegio |
| `sello-accion-clima.png` | Sello «Yo me sumo a la Acción por el Clima» | Reservado; hoy no aparece en el portal |
| `mural-ciehs.jpg` | Mural completo, 1280 px | Sección Mural |
| `icon-32/180/512.png` | Iconos derivados del **isotipo**, generados por `tools/generar-marca.js` | Pestaña del navegador, pantalla de inicio |
| `ciehs-og.png` | Tarjeta 1200×630 al compartir, con el isotipo y el nombre completo; misma herramienta | Open Graph y Twitter Card |
| `logo-ciehs.svg` | **Logo del proyecto**: isotipo + logotipo | Hero, sección Mural, descargable |
| `logo-ciehs-claro.svg` | El mismo, para fondos oscuros | Arena y cualquier fondo oscuro |
| `isotipo-ciehs.svg` | Solo el emblema. **Fuente única de toda la marca del portal** | Cabecera, hero, pie, iconos, tarjeta social |
| `evidencias/invernadero-dwc.jpg` | Invernadero de madera con malla raschel y mesas DWC | Galería «El CIEHS en acción», portada |
| `evidencias/mesas-dwc.jpg` | Módulos de raíz flotante en batería | Galería, portada |
| `evidencias/almacigo-trasplante.jpg` | Mesa recién trasplantada, plántulas separadas | Galería, portada |
| `evidencias/cosecha-empaque.jpg` | Lechugas cosechadas y embolsadas | Galería, portada |

> [!important] Las fotografías con rostros NO viven en el repositorio
> Las cuatro de arriba son de infraestructura, sin ninguna persona, y sí están
> en `assets/`. Las que muestran estudiantes van a **Supabase Storage**
> (bucket `ciehs-evidencias`), nunca a git.
>
> El motivo no es el peso, es la reversibilidad. El repositorio es **público** y
> su historial es permanente: un commit con la cara de un menor no se puede
> deshacer, aunque después se borre el archivo. Y el protocolo promete que la
> autorización es **revocable en cualquier momento** (§3) y que el contenido se
> retira sin exigir explicaciones (§6). Con las fotografías en el bucket esa
> promesa se puede cumplir: borrar la evidencia desde el panel borra la ficha
> **y** el archivo, y desaparece de verdad.
>
> Todas pasan por `tools/limpiar-metadatos-jpeg.js` antes de subirse.

> [!tip] Cómo se hizo la transparencia
> El fondo se elimina por **inundación desde los bordes hacia dentro**, no
> borrando todo píxel blanco. Un umbral simple habría agujereado los blancos
> interiores del logo — la vincha de José Olaya, el campo blanco del escudo.
> Resultado: 22 % y 34 % de píxeles transparentes con el centro intacto.
>
> El escudo es **apaisado** (428×369). Los iconos cuadrados lo centran sobre
> lienzo transparente en vez de deformarlo.

Sobre el blanco del portal el PNG transparente funciona tal cual: **no
lleva panel blanco detrás**. Una sombra suave lo despega del fondo sin necesidad
de un recuadro.

El mural aparece además **en el propio hero**, bajo el escudo y el sello, como
acceso directo a su versión interactiva: es la primera cosa que un visitante ve
del laboratorio, y el QR 02 del laboratorio físico lleva al mismo sitio.


---

## 2 ter. El logo del CIEHS

Hasta 2026-09-09 el proyecto no tenía marca propia: usaba el escudo del colegio
para todo. Son dos cosas distintas y conviene no confundirlas.

> **El escudo es de la institución. El logo es del proyecto.**

Desde 2026-09-09 el portal —que es una pieza del proyecto, no del colegio— usa
**solo el isotipo del CIEHS** en cabecera, hero, pie, favicons, iconos de la PWA
y tarjeta al compartir. La institución sigue presente, pero **por escrito**:
«Un proyecto de la I.E. N.° 80033 "José Olaya Balandra" · Huanchaco».

Esto **no degrada al escudo**: en documentos, oficios y piezas oficiales del
colegio el escudo manda y el logo del CIEHS no lo sustituye. Lo que cambia es
que el proyecto deja de tomar prestada una marca ajena para nombrarse a sí mismo.

### De dónde sale

El mural ya traía su propio emblema —una planta sobre ondas de agua, junto al
nombre CIEHS—. Se **redibujó en SVG** en lugar de recortarlo, porque en el mural
mide 85 px: escalado a la cabecera o a un favicon se deshacía.

Se le añadió una cosa que el emblema original no tenía: **la raíz sumergida**.
El mural la dibuja en su propia ilustración del módulo DWC, y es lo que
distingue este isotipo de cualquier logo de planta — dice *hidroponía*, no
*huerto*.

| Elemento | Qué significa |
|---|---|
| La hoja | Lo que se cultiva; de ahí el verde institucional |
| El agua | El azul de Huanchaco y el recurso que el proyecto aprende a no desperdiciar |
| La raíz sumergida | Raíz flotante (DWC): sin suelo, con la raíz en la solución |

### Los tres archivos

| Archivo | Cuándo |
|---|---|
| `logo-ciehs.svg` | Uso normal, sobre fondo claro |
| `logo-ciehs-claro.svg` | Sobre fondo oscuro (la Arena) |
| `isotipo-ciehs.svg` | Solo el emblema: pie, usos pequeños |

Es vector: se escala sin perder nitidez y **nunca hay que pedir «otro tamaño»**.

### Reglas

- Sobre fondo oscuro se usa la versión clara. **El emblema nunca cambia de
  dibujo** — solo el color del texto y el aro. Un logo que se redibuja según el
  fondo deja de ser el mismo logo.
- Por debajo de 24 px el isotipo pierde el detalle de las raíces, pero **se
  mantiene**: a ese tamaño lo que identifica es la silueta y el aro verde. Los
  PNG pequeños salen del mismo SVG con `node tools/generar-marca.js`, que le
  deja un 8 % de aire por lado para que el recorte circular de Android no se
  coma el borde.
- Se descarga desde la propia sección **Nuestro Mural**, para que nadie tenga
  que pedirlo por correo.

---

## 3. Paleta institucional

### El cambio de 2026, en dos pasos

**Primero**, el portal dejó el negro de ingeniería con el que nació: la
identidad del CIEHS es el **Reto Acción por el Clima** —aire limpio, agua y
cultivo— y un fondo negro le trabajaba en contra.

**Después**, el papel verdoso de niebla marina (`#f2f8f5`) se neutralizó hasta
el **blanco por capas** que hay hoy. La referencia es la banca digital: ahí el
blanco no es «el fondo», es el material. Cinco planos de blanco a gris muy frío
separados por sombra suave, nunca por líneas duras, y el color reservado para
lo que significa algo. El esmeralda institucional sigue siendo el acento; lo
que cambió es la dosis: antes teñía el fondo entero, ahora solo marca el dato
vivo.

#### Los cinco planos, por elevación

Se eligen por **altura en la jerarquía**, no por gusto: cuanto más arriba está
un elemento, más cerca del blanco puro y más sombra lleva debajo.

| Token | Valor | Uso |
|---|---|---|
| `--paper` | `#eef2f6` | Color base bajo el plano ambiental |
| `--veil` | `#fafbfd` | Secciones alternas y estados vacíos |
| `--surface` | `#ffffff` | Tarjetas y paneles elevados |
| `--surface-2` | `#eff2f7` | Pozos hundidos: cabeceras de tabla, campos, esqueletos |
| `--surface-3` | `#e4e9f0` | Separadores macizos y bordes de estado vacío |

#### Tinta y acento

| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#0d1117` | Titulares y cifras |
| `--ink-soft` | `#47505f` | Texto corrido |
| `--ink-mute` | `#66707f` | Etiquetas, unidades, metadatos (era `#8b95a7`; no llegaba a AA) |
| `--leaf-500` | `#059669` | Verde institucional, degradados y barras |
| `--leaf-600` | `#065f46` | Verde más oscuro |
| `--leaf-300` | `#045c40` | **Acento de texto** — ver la nota de abajo (era `#047857`) |
| `--azure-500` | `#0284c7` | Azul de Huanchaco |
| `--sun-500` | `#b45309` | Acento cálido, avisos y eje climático |

#### Elevación y movimiento

Tres sombras encadenadas y muy tenues (`--shadow-1/2/3`) en vez de una sola
marcada: así el borde de la tarjeta se **apoya** en el fondo en lugar de flotar
recortado. `--ring-accent` es el halo esmeralda del foco y del hover.

Las curvas viven en `--ease-out` (lo que no debe llamar la atención),
`--ease-spring` (sobrepasa y vuelve: material con inercia) y `--ease-soft`.

> [!important] `--leaf-300` es el verde **más oscuro**, no el más claro
> En todo el CSS, `--leaf-300` significa «el verde con el que se escribe»:
> cintillos, cifras destacadas, enlaces. Sobre fondo oscuro eso exigía un tono
> claro (`#6ee7b7`); sobre blanco exige el contrario. El nombre del token se
> conservó para no reescribir doscientas reglas, pero su valor se invirtió. Al
> tocar la paleta hay que respetar ese papel, no el número del nombre.

La Arena (capa de juego a pantalla completa) **conserva su fondo oscuro a
propósito**: es un espacio inmersivo, no una página del portal.

---

## 3 quinquies. Estados de datos: cargando · error · vacío

Toda sección que dependa de Supabase tiene **tres** momentos en los que no puede
enseñar lo que promete, y son tres cosas distintas:

| Estado | Qué significa | Cómo se ve | ¿Botón? |
|---|---|---|---|
| **cargando** | La petición está en vuelo | Esqueleto con la forma de lo que va a llegar | No |
| **vacío** | La base respondió y no hay nada | Caja neutra, borde discontinuo, icono verde | No |
| **error** | La base no respondió | Caja ámbar, borde continuo, motivo técnico | **Sí, «Reintentar»** |

Un solo componente (`.estado`, al final de `assets/css/ciehs.css`) y un solo
helper (`CIEHS.estado`, en `ciehs-app.js`). Antes esto vivía repartido: seis
clases distintas decían lo mismo con cajas distintas y **ninguna separaba las dos
últimas** — «todavía no hay comentarios» y «no se pudo cargar» se veían igual,
siendo lo opuesto la una de la otra.

### Las tres decisiones

**Ámbar y no rojo en el error.** En un laboratorio escolar la conexión se cae a
todas horas y no es una catástrofe ni culpa de nadie. El rojo se reserva para lo
que el visitante ha hecho mal y puede corregir (validación de formularios).

**El botón solo en el error.** De los tres estados es el único que el visitante
puede intentar arreglar. Poner «Reintentar» sobre un estado vacío sería prometer
que insistir sirve de algo.

**El motivo técnico se enseña.** «No se pudo cargar (TypeError: Failed to fetch)».
Quien mira la pantalla en el laboratorio suele ser también quien puede avisar de
que la base está caída, y un mensaje sin causa no le sirve para eso.

### El cuarto caso: datos caducados

Aparte, y fácil de pasar por alto: **la recarga falla pero ya había datos buenos
en pantalla**. Borrarlos para enseñar un error tiraría información válida;
dejarlos sin decir nada es peor, porque el visitante lee cifras viejas creyendo
que son de ahora.

Se resuelve con las dos cosas: los datos se quedan y aparece una barra anclada
abajo —`.datos-caducados`— que dice **desde cuándo son** y ofrece reintentar. No
es un modal: lo que hay en pantalla sigue siendo útil y se puede seguir leyendo.

### La fase

`CIEHS.faseDatos()` devuelve `'cargando' | 'listo' | 'error'`. Existe porque
`CIEHSData.conectado` vale `false` **tanto mientras carga como cuando falla**, y
sin distinguirlos no se puede elegir entre esqueleto y error. Cada reintento
vuelve a poner la fase en `'cargando'`: si no, al pulsar el botón no habría
ninguna señal de que la pulsación hizo algo.

---

## 3 quater. El plano ambiental (2026-09-09)

El portal dejó de apoyarse en blanco plano. Detrás de **toda** la página vive una
sola fotografía del laboratorio —`evidencias/mesas-dwc.jpg`, las mesas de raíz
flotante— fija respecto al scroll y con un avance lento en bucle (Ken Burns de
72 s, ida y vuelta para que no dé el tirón del reinicio). Las secciones dejaron
de ser bloques opacos: ahora son superficies traslúcidas y el fondo respira
debajo.

Vive al final de `assets/css/ciehs.css`, en el bloque *PLANO AMBIENTAL CONTINUO*.

### Cómo está montado

| Capa | Qué hace |
|---|---|
| `html` | Lleva el color base (`--paper`). **`body` es transparente**: si vuelve a tener fondo, tapa la fotografía |
| `.amb-img` | La fotografía, en `z-index:-1`, con `blur(3px) saturate(.8) contrast(.38) brightness(1.34)` |
| `.amb-veil` | El velo que sostiene la legibilidad |
| `main > section` | Vidrio al 0.52 · las `.alt` al 0.66 |
| `.card` (`--surface`) | Blanco al 0.88 — ya traía `backdrop-filter`, solo le faltaba dejar de ser opaco |

### Por qué `z-index:-1` y no `0`

El contenido de `<main>` son bloques sin `position`. Un elemento posicionado con
`z-index:0` se pintaría **por encima** de sus fondos; con z-index negativo cae al
nivel del lienzo, justo sobre el fondo de `<html>`. Ese es el motivo, y el único,
de que `body` sea transparente.

### Por qué `contrast(.38)`

Es la decisión que hace legible todo lo demás. El plástico negro de las mesas
baja a ~RGB(23) y ninguna cantidad razonable de velo salva el contraste del texto
sobre una mancha así. Comprimiendo el rango, el negro sube a ~118 y el blanco del
tecnopor baja a ~229: el fondo pasa a ser una acuarela sin negros.

Medido sobre el píxel **más oscuro** de la fotografía, con el velo en su punto más
fino y sobre la sección menos densa —el peor caso posible—:

| Tinta | Contraste | |
|---|---|---|
| `--ink` | 11.4:1 | ✅ |
| `--ink-soft` | 4.9:1 | ✅ |
| `--leaf-300` | 4.9:1 | ✅ |
| `--azure-300` | 5.1:1 | ✅ |
| `--sun-300` | 5.3:1 | ✅ |
| `--ink-mute` | 3.0:1 | ⚠️ dentro de una tarjeta, 4.7:1 |

Los tres tonos `-300` bajaron un escalón (`#047857`→`#045c40`, `#0369a1`→`#03527d`,
`#92400e`→`#7c3606`) precisamente por esta medición: son la tinta de los
antetítulos, que van directos sobre la superficie de sección. Con los valores
viejos, el 94 % del fondo los dejaba por debajo de 4.5:1.

`--ink-mute` queda como **pendiente conocido**: ya estaba en 3.0:1 sobre blanco
pleno antes de que existiera este plano, así que no es una regresión, pero sigue
sin llegar a AA cuando cae fuera de una tarjeta.

> Si se toca `contrast()`, `brightness()`, el velo o la densidad de las secciones,
> **hay que volver a medir**. Son números que se sostienen entre sí.

### En móvil

El plano se queda —es donde más se nota que el portal dejó de ser blanco— pero
**sin animar**. Lo caro no es pintarlo: es repintar cada fotograma una capa
desenfocada del tamaño de la pantalla mientras se hace scroll.

---

## 3 bis. La capa de movimiento

Con una paleta casi monocroma el movimiento deja de ser adorno: es lo que
jerarquiza. Dice qué acaba de cambiar, qué se puede tocar y qué está cargando.
Vive al final de `assets/css/ciehs.css` y en el bloque 9 de
`assets/js/ciehs-app.js`.

| Pieza | Qué hace |
|---|---|
| Brisa del hero | Escena en canvas: luz tamizada por la malla, hojas que cruzan y motas de polen |
| Barra de progreso | Línea de 2,5 px sobre el encabezado, marca lo leído |
| Reveal escalonado | Las tarjetas entran en cascada; el turno (`--i`) se cuenta **dentro de cada rejilla**, no sobre la lista global |
| Cifras que ruedan | Los KPI se cuentan al entrar en pantalla y al llegar dato nuevo de la base |
| Barras que se dibujan | Los rangos de pH y CE crecen desde cero al aparecer |
| Brillo especular | Una luz nace bajo el cursor sobre tarjetas y fichas — solo con ratón |
| Onda al pulsar | Ripple desde el punto exacto del clic en cada botón |
| Esqueletos | Bloques que respiran mientras responde la base, en el HTML desde el primer pintado |
| Encabezado compacto | Gana densidad al bajar y devuelve sitio al contenido |

### Tres reglas que no se pueden romper

1. **Nada queda invisible.** `prefers-reduced-motion` apaga la capa entera y
   deja cada elemento en su estado **final**, no en el inicial. Además, si el
   `IntersectionObserver` no entrega una sola vez en 3 s —los navegadores lo
   estrangulan en pestañas sin foco— se da por muerto y se muestra todo.
2. **Ninguna cifra se queda a medias.** Un contador congelado se lee como si
   fuera el valor definitivo: «48 estudiantes» en vez de 280. Al ocultarse la
   pestaña (`visibilitychange`, `pagehide`) toda cuenta en vuelo se remata en
   su valor real.
3. **Sin JS, la página se ve completa.** Las barras solo pasan a ancho cero
   *después* de que el script las prepare; si no llega a correr, se ven enteras.

Las filas que la base repinta —rangos de pH, bitácora, caja, comentarios— se
vuelven a numerar y a preparar al vuelo: `window.CIEHS.escalonar()`,
`window.CIEHS.recontar()` y `window.CIEHS.dibujarBarras()` son idempotentes
justamente para eso.


---

## 3 ter. La navegación: un solo inventario

Hasta 2026-09-08 los catorce apartados se listaban **tres veces**: una barra de
diez enlaces para escritorio, otra lista igual para móvil y una rejilla de doce
tarjetas en la portada. Tres sitios que actualizar y ninguno que agrupara nada.

Ahora hay **un botón de tres rayas** en todos los anchos y **un panel** con
cuatro familias:

| Familia | Apartados |
|---|---|
| **El CIEHS** | Inicio · Metodología y HPOS · Equipos de gestión · Nuestro mural |
| **Investigación** | Investigaciones · Módulos · Trazabilidad · Datos |
| **Participa** | Juega y aprende · Espacio docente · Comunidad y pedidos · Eureka 2026 |
| **Información** | Contacto · Privacidad y uso de imagen |

> [!warning] Las catorce rutas no se tocan
> Agrupar es cosa del menú, no de las URL. **Nueve códigos QR impresos** del
> laboratorio apuntan a `#/modulos`, `#/trazabilidad` y compañía: renombrar una
> ruta rompería un cartel que ya está pegado en una pared. La agrupación es
> solo una capa de presentación por encima del router.

El panel es un cajón lateral y no un desplegable porque así cabe una línea de
descripción bajo cada apartado — que es lo que hace legible un menú agrupado.
Tiene trampa de foco, cierra con `Escape`, con el velo y al elegir destino.

### Qué se fue de la portada

La portada termina en **«Ingresa como: Estudiante · Docente · Comunidad»**, y
debajo solo queda la galería de evidencias. Lo que había después se movió:

- **¿Quiénes somos?** (misión, visión, propósito, problemática y HPOS) → pasó a
  la ruta `metodologia`, que es donde encaja: HPOS es su enfoque rector.
- **La rejilla «Cada apartado, un espacio propio»** → se eliminó. Era el menú
  disfrazado de contenido; el panel de tres rayas hace ya ese trabajo.

---

## 4. Reglas de uso

- **La marca del portal es el isotipo del CIEHS**, en todas las páginas y en
  todos los tamaños. La institución se nombra por escrito, no con el escudo.
- Los cuatro PNG derivados (32, 180, 512 y la tarjeta al compartir) **no se
  editan a mano**: salen de `isotipo-ciehs.svg` con `node tools/generar-marca.js`.
  Editar el PNG y no el SVG es la forma segura de que las cuatro piezas dejen de
  coincidir.
- El isotipo **no se recolorea, no se recorta y no se deforma**. Sobre fondo
  oscuro se usa `logo-ciehs-claro.svg`; el dibujo no cambia, solo el texto y el aro.
- Si alguna pieza necesita el escudo del colegio (un oficio, una carátula), se
  usa `escudo-ie80033.png` **tal cual**: no se recolorea, no se recorta y nunca se
  sustituye por una reinterpretación vectorial.

---

## 5. Pendientes

- [ ] Subir `--ink-mute` a AA (4.5:1) cuando cae fuera de una tarjeta. Hoy está
      en 3.0:1; oscurecerlo más empieza a competir con `--ink-soft` y a borrar la
      jerarquía entre texto corrido y metadato, así que la salida probablemente
      sea densificar la superficie de sección, no la tinta.
- [ ] Conseguir el escudo de la I.E. en **vector** (SVG o AI) si la institución lo
      tiene, para las piezas oficiales del colegio: el PNG actual procede de una
      ilustración rasterizada y a tamaños grandes pierde definición.
- [ ] Fotografías reales del laboratorio y de los quince módulos DWC, sujetas al
      protocolo de [[CIEHS-Privacidad-Menores]].
- [ ] Fotografía del mural físico instalado, para acompañar a la ilustración.

---

## Enlaces

- [[CIEHS]] — índice general.
- [[CIEHS-Portal-Educativo]] — dónde se coloca cada pieza en la interfaz.
- [[CIEHS-Privacidad-Menores]] — qué imágenes pueden publicarse.
- [[CIEHS-Arena-Juego]] — la arena tiene paleta e iconografía propias.
