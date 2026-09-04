---
title: CIEHS · Identidad visual
aliases: [Escudo CIEHS, Marca CIEHS, Paleta CIEHS, Mural CIEHS]
tags: [ciehs, identidad, marca, diseno, mural]
estado: escudo oficial en uso
actualizado: 2026-09-04
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

Sobre el fondo oscuro del portal el PNG transparente funciona tal cual: **no
lleva panel blanco detrás**, que habría roto la continuidad del tema.

---

## 3. Paleta institucional

| Token | Valor | Uso |
|---|---|---|
| `--leaf-500` | `#10b981` | Verde primario, acentos y estados correctos |
| `--leaf-600` | `#059669` | Verde institucional oscuro, degradados |
| `--azure-600` | `#0284c7` | Azul de Huanchaco, enlaces y datos |
| `--sun-500` | `#e0ac3f` | Acento cálido, avisos y eje climático |

Los tres primeros son los **oficiales de la institución**. El resto del sistema
(neutros, superficies de cristal, sombras) se deriva de ellos.

### Tipografías

- **Space Grotesk** — títulos y cifras
- **Inter** — texto corrido
- **JetBrains Mono** — códigos, etiquetas y datos (`MOD-NFT-01`, rangos de pH)
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
- [ ] Fotografías reales del laboratorio y de los cuatro módulos, sujetas al
      protocolo de [[CIEHS-Privacidad-Menores]].
- [ ] Fotografía del mural físico instalado, para acompañar a la ilustración.

---

## Enlaces

- [[CIEHS]] — índice general.
- [[CIEHS-Portal-Educativo]] — dónde se coloca cada pieza en la interfaz.
- [[CIEHS-Privacidad-Menores]] — qué imágenes pueden publicarse.
