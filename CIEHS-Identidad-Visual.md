---
title: CIEHS · Identidad visual
aliases: [Escudo CIEHS, Marca CIEHS, Paleta CIEHS, Mural CIEHS]
tags: [ciehs, identidad, marca, diseno, mural]
estado: escudo oficial en uso · línea gráfica luminosa
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

Sobre el papel luminoso del portal el PNG transparente funciona tal cual: **no
lleva panel blanco detrás**. Una sombra suave lo despega del fondo sin necesidad
de un recuadro.

El mural aparece además **en el propio hero**, bajo el escudo y el sello, como
acceso directo a su versión interactiva: es la primera cosa que un visitante ve
del laboratorio, y el QR 02 del laboratorio físico lleva al mismo sitio.

---

## 3. Paleta institucional

### El cambio de 2026: de negro de ingeniería a papel luminoso

El portal nacía con fondo negro. La identidad del CIEHS es el **Reto Acción por
el Clima** — aire limpio, agua y cultivo — y un fondo negro le trabajaba en
contra. La línea gráfica pasó a una base clara de **niebla marina**
(`--paper: #f2f8f5`) con tinta verde muy oscura (`--ink: #0c1f1a`), conservando
la misma paleta institucional.

| Token | Valor | Uso |
|---|---|---|
| `--paper` | `#f2f8f5` | Fondo general — papel de niebla marina |
| `--ink` | `#0c1f1a` | Texto principal |
| `--leaf-500` | `#059669` | Verde institucional, degradados y barras |
| `--leaf-600` | `#065f46` | Verde más oscuro |
| `--leaf-300` | `#047857` | **Acento de texto** — ver la nota de abajo |
| `--azure-500` | `#0284c7` | Azul de Huanchaco |
| `--sun-500` | `#b45309` | Acento cálido, avisos y eje climático |

> [!important] `--leaf-300` es el verde **más oscuro**, no el más claro
> En todo el CSS, `--leaf-300` significa «el verde con el que se escribe»:
> cintillos, cifras destacadas, enlaces. Sobre fondo oscuro eso exigía un tono
> claro (`#6ee7b7`); sobre papel claro exige el contrario. El nombre del token se
> conservó para no reescribir doscientas reglas, pero su valor se invirtió. Al
> tocar la paleta hay que respetar ese papel, no el número del nombre.

La Arena (capa de juego a pantalla completa) **conserva su fondo oscuro a
propósito**: es un espacio inmersivo, no una página del portal.

### Tipografías

- **Space Grotesk** — títulos y cifras
- **Inter** — texto corrido
- **JetBrains Mono** — códigos, etiquetas y datos (`MOD-DWC-01`, rangos de pH)
- **Cinzel** — lema institucional

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
