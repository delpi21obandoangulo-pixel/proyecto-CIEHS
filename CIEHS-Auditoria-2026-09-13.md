---
title: CIEHS · Auditoría de seguridad y accesibilidad — 2026-09-13
tags: [ciehs, auditoria, seguridad, accesibilidad, administracion]
alcance: el portal completo, con foco en la edición in-place
metodo: medido contra la base y el navegador reales, no revisión de código
actualizado: 2026-09-13
---

# Auditoría de seguridad y accesibilidad · 2026-09-13

Hecha después de convertir el portal entero en editable sobre sí mismo (577
textos, fichas con lápiz y papelera, cajón de formularios, fondo del hero). Todo
lo de aquí está **medido**: escrituras reales contra la base, tabulaciones reales
en el navegador, contrastes calculados sobre los colores que de verdad se pintan.

> [!danger] Lo único grave no es de código
> **El código de administración sigue siendo el que se publicó en GitHub.**
> Verificado con `git log -S`: aparece en `ed46c57` y `e6ec83d`, y el repositorio
> es público. Además el 2026-09-13 se escribió en una conversación de chat.
> Ficha y procedimiento en `.boveda\ciehs-codigo-acceso\FICHA.md`; detalle en
> `pendientes-coordinacion/08-rotar-codigo-de-acceso.md`. **Rotarlo es lo primero.**

---

## 1. Seguridad

### 1.1 RLS: lo que puede un desconocido con la clave pública

La `anon key` viaja en el navegador y es pública por diseño. Se probó qué se
puede hacer **sin** el código de administración:

| Operación | Resultado |
|---|---|
| `INSERT` en `textos`, `imagenes`, `productos`, `arena_preguntas` | **401** — rechazado |
| `UPDATE productos`, `UPDATE modules` | 204, **0 filas afectadas** |
| `DELETE productos`, `DELETE evidencias` | 204, **0 filas afectadas** |
| Leer `acceso_config`, `acceso_intentos`, `admins` | **401** — rechazado |

Comprobado después que **los datos siguen intactos**: 6 productos con sus
precios, la evidencia, `MOD-DWC-01` con su cultivo.

> [!warning] Un 204 de PostgREST no significa que haya borrado
> `UPDATE`/`DELETE` sin permiso devuelven **204 igualmente**, porque RLS filtra
> las filas antes: la operación «tiene éxito» sobre cero filas. Auditando esto
> hay que mirar el **efecto**, no el código de estado. Con
> `Prefer: return=representation` se ve la verdad: devuelve `[]`.

### 1.2 XSS almacenado — la superficie que más importa

`ciehs.textos` la escribe quien tenga el código y **se sirve a todos los
visitantes**. Si el saneador falla, eso es un XSS almacenado en el portal de un
colegio.

- `tools/prueba-saneador.html`: **17 casos, 0 ejecuciones, 17 limpios**
  (`<script>`, `<img onerror>`, `<svg onload>`, `href="javascript:"`, atributos
  sobre etiqueta permitida, HTML mal formado, comentarios con carga dentro).
- Se comprobó también el **camino real**: pegar HTML con `<script>` e
  `<img onerror>` en un párrafo. Cero ejecuciones, y la negrita pegada sobrevive.
- El aviso de `data-edit-aviso` sale de un atributo del HTML: se pinta con
  `textContent`. Metiéndole `<img src=x onerror=…>` **no ejecuta** y se ve
  literal.

> [!fix] Arreglado durante esta auditoría
> La prueba llevaba una **copia** del saneador y sólo un comentario pidiendo
> acordarse de sincronizarla. Un aviso que depende de la memoria se acaba
> incumpliendo, así que ahora la página **se autoverifica**: lee
> `ciehs-inline.js`, compara las dos listas por sus claves (no por el texto, que
> daría falsas alarmas por el espaciado) y avisa en rojo si divergen.

### 1.3 Claves e inyección

Las claves se interpolan en selectores. Se validan contra
`^[a-z0-9][a-z0-9._-]{1,80}$` en el cliente **y** en el CHECK del servidor.
Comprobado: rechaza `a"]/*`, la vacía y una de 90 caracteres; acepta
`metodologia.peai-card.familias`.

### 1.4 El código de administración en el navegador

No se guarda en `localStorage` ni en `sessionStorage` ni en cookies: vive en
memoria y caduca por inactividad. Comprobado: cero claves sospechosas.

### 1.5 CSP

Se midió con la política de producción, no de memoria:

| Vía | Resultado |
|---|---|
| `element.style.backgroundImage = …` | funciona |
| `<style>` creado por JS + `insertRule` | **falla** — `sheet` sale `null` |

Nada de lo añadido la viola. Detalle en [[CIEHS-Admin-InPlace-UI]] § 3 sexies.

### 1.6 Freno al tanteo

`db/17` está aplicada desde el 2026-09-13 (**hasta ese día estaba en el
repositorio pero no en la base**): 10 intentos fallidos cada 15 minutos. Contra
fuerza bruta sobra. No protege del código publicado, que no hay que adivinar.

---

## 2. Accesibilidad

### 2.1 El portal público

Sin sesión no queda rastro de administración: **0 controles visibles**, 0
`[data-edit]` con `role="button"`, 0 tabulables añadidos, cajón y modal ocultos.
14 imágenes, **ninguna sin `alt`**, ningún `alt=""` sin `aria-hidden`. Sin saltos
en la jerarquía de encabezados.

### 2.2 Dos defectos reales, encontrados y corregidos

> [!bug] `aria-modal="true"` era una promesa incumplida
> El cajón y la ficha de venia declaraban ser modales y dejaban **41 elementos
> tabulables fuera**. Quien navega con teclado se salía del diálogo y seguía por
> el portal de detrás sin saber que seguía abierto. **Declarar `aria-modal` y no
> cumplirlo es peor que no declararlo.**
>
> Corregido con una trampa de foco compartida (`atraparFoco`, en
> `ciehs-inline.js`, que el cajón de `app.js` reutiliza). Medido después:
> **0 salidas en 60 tabulaciones** en el cajón y **0 en 40** en la venia.

> [!bug] El foco no volvía al cerrar
> Al cerrar el cajón, el foco se quedaba en un botón que acababa de ocultarse y
> el teclado volvía al principio del documento: quien pulsaba «+ Nuevo lote» en
> Trazabilidad aparecía al inicio de la página. Ahora vuelve al botón que lo
> abrió — comprobado, y la venia devuelve el foco al párrafo.

### 2.3 Contraste, medido sobre los colores reales

La barra usa `linear-gradient`, así que se midió contra el **tramo más claro**
(`#047857`), que es el caso peor:

| Elemento | Antes | Ahora | Mínimo |
|---|--:|--:|--:|
| barra · estado | 5.48 | 5.48 | 4.5 |
| barra · botón | 5.48 | 5.48 | 4.5 |
| barra en pausa | 7.73 | 7.73 | 4.5 |
| **barra · pista** | **4.25** ❌ | **4.78** ✅ | 4.5 |
| **contador** | **3.96** ❌ | **7.81** ✅ | 4.5 |
| cajón · título y cerrar | 18.92 | 18.92 | 4.5 |
| botón «+ Añadir» | 5.48 | 5.48 | 4.5 |

El contador tenía un velo **blanco** al 17 %, que aclaraba el verde y hundía el
contraste del texto blanco. Con un velo **negro** al 22 % el fondo se oscurece y
sube a 7.81:1.

### 2.4 Nombres accesibles

Los 8 controles visibles en modo administración tienen nombre. Los 577 textos
editables llevan `role="button"`, `tabindex="0"` y `aria-label`; los 35 con
consecuencias lo **anuncian** («Atención: cambiarlo tiene consecuencias»). La
barra es una `region` con nombre y los anuncios van por una región viva
`role="status" aria-live="polite"`.

### 2.5 Movimiento e impresión

`@media print` oculta toda la interfaz de edición, cajón incluido. El cajón sólo
anima bajo `prefers-reduced-motion: no-preference`. **Corregido en esta
auditoría**: `.ed-alta` y `.ed-cajon-panel` faltaban en el bloque `reduce`.

---

## 3. Lo que queda abierto

| | Qué | Quién |
|---|---|---|
| 🔴 | **Rotar el código de administración.** Publicado en GitHub y en un chat | coordinación |
| 🟡 | **577 paradas de tabulación** en modo edición. Es esperable —todo es editable— pero recorrer el portal con teclado se hace largo. Valorar un «saltar los editables» | pendiente de decidir |
| 🟡 | Los **recursos destacados** llevan el rotulado pero `ciehs.resources` está vacía: no se pudo probar en vivo | comprobar al cargar el primero |
| 🟢 | Repintar el **mural físico** de la pared, y su errata «disponibilidad» → «disposición» | coordinación |

## Cómo repetir esto

```bash
npx http-server -p 8140 -c-1
# /tools/prueba-saneador.html  → 0 ejecuciones, 17 limpios, copia sincronizada
```

Las escrituras sin código se prueban con `curl` contra `/rest/v1`, **siempre con
`Prefer: return=representation`** para ver las filas afectadas y no fiarse del
204. Para comprobar un borrado en Storage hay que romper la caché del CDN con
`?t=<algo>`: sin eso el objeto sigue respondiendo 200 después de borrado, y eso
ya llevó a un diagnóstico equivocado una vez.
