---
title: 1 · Mural — repintar el panel «¿Qué buscamos con este proyecto?»
tags: [ciehs, pendiente-coordinacion, mural, identidad]
depende-de: coordinación · no se puede resolver desde el código
actualizado: 2026-09-10
---

# 1 · Mural: repintar el panel «¿Qué buscamos con este proyecto?»

> [!warning] La ilustración y el portal dicen cosas distintas
> El 2026-09-09 se corrigió la redacción de **qué busca el proyecto**. El portal
> ya dice la nueva; el panel **pintado dentro** de `assets/img/mural-ciehs.jpg`
> —y por tanto el mural físico— sigue diciendo la anterior. Mientras eso siga
> así, quien mire la página del mural lee dos versiones a la vez.

### El texto que debe decir

> **¿QUÉ BUSCAMOS CON ESTE PROYECTO?**
>
> Que los estudiantes sean protagonistas de su aprendizaje, desarrollando
> competencias científicas al realizar investigaciones, innovando soluciones
> sostenibles y preparándose para enfrentar el cambio climático y construir un
> futuro mejor.

### El texto que dice hoy (para reconocerlo)

> Producir alimentos saludables de manera sostenible con hidroponía, cuidando el
> agua, reduciendo residuos y mitigando el cambio climático.

### Qué NO puede cambiar

De esto salen el logo, el escudo y los cuatro puntos interactivos del portal.
Una ilustración «parecida» obliga a rehacer las tres cosas.

1. **La composición entera**, elemento por elemento y en la misma posición: el
   escudo de la I.E. al centro, el reto climático en cinta azul arriba, la
   rejilla de ODS a la derecha con el 13 destacado, el logo CIEHS a la
   izquierda, el caballito de totora y el pingüino de Humboldt abajo a la
   izquierda, el módulo hidropónico con lechugas al centro-abajo, los dos
   estudiantes a la derecha, el cartel «Cultivamos Ciencia, Cosechamos Futuro».
2. **Las proporciones**: 1280 × 853 px (3:2). El portal recorta con
   `object-fit:cover` y los cuatro puntos se posicionan en **porcentaje**; si
   cambia el encuadre, hay que recolocarlos en `index.html`.
3. **Las cuatro zonas que apuntan los puntos** — módulo hidropónico (1), raíces
   en la mano del estudiante (2), rejilla de ODS (3) y cinta del escudo (4).
4. **El estilo** del panel: caja blanca redondeada, ícono de diana a la
   izquierda, título en azul y mayúsculas, cuerpo en dos o tres líneas.

### Dos caminos

| Camino | Qué implica | Riesgo |
|---|---|---|
| **A · Regenerar la ilustración completa** con la herramienta que la produjo | Un solo archivo nuevo, coherente | Alto: si la composición se mueve, hay que rehacer logo, escudo y las cuatro posiciones de los puntos |
| **B · Repintar solo el panel** sobre el JPG actual, en un editor de imagen | Quirúrgico; todo lo demás queda intacto por definición | Bajo, pero exige acertar con la tipografía del panel |

**Recomendado: B**, salvo que la herramienta original permita regenerar con la
misma semilla. Y en cualquiera de los dos, **el mural físico hay que repintarlo
igual**: la ilustración es su copia, no al revés.

### Al cerrarlo

Actualizar `assets/img/mural-ciehs.jpg`, comprobar en
`/#/mural` que los cuatro puntos siguen cayendo donde deben, y marcar el
pendiente en [[CIEHS-Metodologia-Pedagogica]].

---

Vuelve a [[CIEHS-Identidad-Visual]] · índice de la carpeta en [[pendientes-coordinacion/LEEME|LEEME]].
