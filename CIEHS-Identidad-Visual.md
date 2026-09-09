---
title: CIEHS · Identidad visual
aliases: [Escudo CIEHS, Marca CIEHS, Paleta CIEHS, Mural CIEHS]
tags: [ciehs, identidad, marca, diseno, mural]
estado: escudo oficial en uso · blanco por capas + capa de movimiento
actualizado: 2026-09-08
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
| `escudo-ie80033.png` | Escudo oficial de la I.E. N.° 80033, fondo transparente | Marca del encabezado, tarjeta del hero, pie, iconos, tarjeta social |
| `sello-accion-clima.png` | Sello «Yo me sumo a la Acción por el Clima» | Hero, junto al escudo · tarjeta social |
| `mural-ciehs.jpg` | Mural completo, 1280 px | Sección Mural |
| `icon-32/180/512.png` | Iconos derivados del escudo | Pestaña del navegador, pantalla de inicio |
| `ciehs-og.png` | Tarjeta 1200×630 al compartir | Open Graph y Twitter Card |

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
| `--paper` | `#f4f6f9` | Lienzo de la página |
| `--veil` | `#fafbfd` | Secciones alternas y estados vacíos |
| `--surface` | `#ffffff` | Tarjetas y paneles elevados |
| `--surface-2` | `#eff2f7` | Pozos hundidos: cabeceras de tabla, campos, esqueletos |
| `--surface-3` | `#e4e9f0` | Separadores macizos y bordes de estado vacío |

#### Tinta y acento

| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#0d1117` | Titulares y cifras |
| `--ink-soft` | `#47505f` | Texto corrido |
| `--ink-mute` | `#8b95a7` | Etiquetas, unidades, metadatos |
| `--leaf-500` | `#059669` | Verde institucional, degradados y barras |
| `--leaf-600` | `#065f46` | Verde más oscuro |
| `--leaf-300` | `#047857` | **Acento de texto** — ver la nota de abajo |
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

## 3 bis. La capa de movimiento

Con una paleta casi monocroma el movimiento deja de ser adorno: es lo que
jerarquiza. Dice qué acaba de cambiar, qué se puede tocar y qué está cargando.
Vive al final de `assets/css/ciehs.css` y en el bloque 9 de
`assets/js/ciehs-app.js`.

| Pieza | Qué hace |
|---|---|
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

## 4. Reglas de uso

- El escudo **no se recolorea, no se recorta y no se deforma**. Si hace falta
  otro tamaño, se reescala proporcionalmente desde el PNG original.
- Nunca sustituir el escudo por una reinterpretación vectorial: la versión
  provisional que existía antes se retiró precisamente por eso.
- El sello del clima acompaña al escudo, nunca lo reemplaza.
- En pantallas estrechas el escudo baja de 250 px a 190 px y el sello de 96 px
  a 78 px; por debajo de eso el texto del escudo deja de leerse.

---

## 5. Pendientes

- [ ] Conseguir el escudo en **vector** (SVG o AI) si la institución lo tiene:
      el actual procede de una ilustración rasterizada y a tamaños grandes
      pierde definición.
- [ ] Fotografías reales del laboratorio y de los quince módulos DWC, sujetas al
      protocolo de [[CIEHS-Privacidad-Menores]].
- [ ] Fotografía del mural físico instalado, para acompañar a la ilustración.

---

## Enlaces

- [[CIEHS]] — índice general.
- [[CIEHS-Portal-Educativo]] — dónde se coloca cada pieza en la interfaz.
- [[CIEHS-Privacidad-Menores]] — qué imágenes pueden publicarse.
- [[CIEHS-Arena-Juego]] — la arena tiene paleta e iconografía propias.
