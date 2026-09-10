---
title: CIEHS · Tienda escolar y reservas de cosecha
aliases: [Tienda CIEHS, Reservas CIEHS, Pedidos CIEHS, Transparencia CIEHS]
tags: [ciehs, tienda, pedidos, transparencia, comunidad]
estado: en produccion · catalogo publicado, precios pendientes
actualizado: 2026-09-09
---

# CIEHS · Tienda escolar y reservas de cosecha

Cómo la comunidad olayina reserva lo que se cosecha, y cómo se rinde cuentas de
lo que se recauda. Parte de [[CIEHS]]. La arquitectura de datos está en
[[CIEHS-Backend-Supabase]] y el sitio donde vive, en [[CIEHS-Portal-Educativo]].

> [!abstract] En una línea
> Catálogo de las **seis especies** que se cultivan, con el estado real de cada
> lote; carrito que suma solo; reserva sin cuenta; y un panel que publica **en
> qué proporción** se reinvierte lo recaudado — nunca cuánto.

---

## 1. El catálogo

Seis productos reales: lechuga crespa, lechuga americana, cebolla china,
albahaca, acelga y espinaca.

### El estado importa más que el stock

| Estado | Qué significa | ¿Se puede reservar? |
|---|---|---|
| **Disponible ahora** | Lote cortado o listo para cortar | Sí |
| **Próximo a cosecha** | Formado, aún sin cortar | No, pero se ve la fecha |
| **En crecimiento** | Recién trasplantado | No |
| **Agotado** | El lote se acabó | No |

En un huerto escolar la pregunta del vecino **no es «¿hay?» sino «¿cuándo
habrá?»**. Por eso lo que no está disponible se muestra igual —apagado y con su
fecha— en lugar de ocultarse: saber que la albahaca llega en dos semanas es lo
que hace volver a alguien.

> [!note] Por qué se conserva «agotado»
> No estaba en la lista pedida, pero sin ese estado habría que **borrar el
> producto y volver a crearlo** cada vez que se acaba un lote, perdiendo su
> histórico. Un lote que se acaba es información, no un error.

### Los precios están vacíos a propósito

Durante el desarrollo se sembraron precios de ejemplo. **Se han vaciado.**
Publicar un precio inventado en un sitio donde una familia va a pagar es peor
que no publicar ninguno. Los fija el coordinador desde *Administración →
Catálogo*; mientras tanto el carrito **suma unidades** y Ventas confirma el
importe al confirmar la entrega.

---

## 2. La reserva

Carrito que suma solo, con `+` y `−` por producto. Vive **en memoria y no en
`localStorage`**: los equipos del laboratorio son compartidos y nadie debería
encontrarse el pedido a medio hacer de la persona anterior.

Al recargar el catálogo la cesta se **depura contra lo que sigue disponible**, o
se enviaría una reserva de algo que ya no se ofrece.

El formulario pide solo nombre y contacto. Lleva una trampa oculta para robots
(un campo que una persona nunca rellena).

### Qué se guarda y dónde

- **Cabecera** en `ciehs.orders` (nombre, contacto, nota, estado).
- **Líneas** en `ciehs.pedido_lineas`, con el nombre y el precio **copiados**,
  no referenciados: si mañana sube el precio, el pedido ya hecho debe seguir
  diciendo lo que la familia aceptó.

Los estados se avanzan desde *Administración → Comunidad*, donde cada pedido
muestra sus líneas y su total.

---

## 3. Transparencia: proporción, nunca importes

El panel publica **en qué proporción** se reparte lo que se gasta, agrupado en
cuatro destinos fijos:

1. **Nutrientes y solución**
2. **Semillas y almácigo**
3. **Mantenimiento de los módulos DWC**
4. **Materiales de investigación**

No se publica ningún importe ni cuánto se vende. Lo que dice en qué cree un
proyecto es el **reparto**, no el monto.

> [!important] Se agrupa por categoría cerrada, no por texto libre
> Antes se agrupaba por el concepto escrito a mano, así que «solución
> nutritiva», «Solución Nutritiva» y «nutrientes» daban **tres porciones
> distintas del mismo gasto**. Ahora Tesorería elige el destino de una lista
> cerrada y el reparto significa siempre lo mismo.

Los porcentajes **se calculan solos** desde el registro de egresos: no hay
cifras tecleadas a mano que puedan desmentir a la contabilidad.

Mientras no haya egresos registrados se muestra el reparto **previsto**, dicho
con esa palabra. Enseñar un plan como si fuera gasto ejecutado sería mentir.

---

## 4. Qué pasa si la base no responde

Toda la sección tiene **respaldo estático en el propio HTML**: las seis especies
con su estado, y el reparto previsto. Si Supabase no contesta:

- El catálogo **sigue diciendo qué se cultiva y en qué punto está cada lote**.
- La transparencia sigue mostrando en qué se reinvierte.
- Solo se pierde la reserva en línea, que sin base no se podría guardar igual, y
  el mensaje lo dice con esas palabras.

> [!warning] El error que esto corrige
> La primera versión **vaciaba la rejilla** cuando no había datos y dejaba la
> sección en blanco — justo a quien peor conexión tiene, que es a quien más
> falta le hace saber qué se cultiva. Los pintores ya no borran el respaldo:
> solo lo sustituyen cuando de verdad llega algo.

---

## 5. Seguridad

| Tabla | Lectura | Escritura |
|---|---|---|
| `productos` | Pública, solo `published` | Solo `ciehs.is_admin()` |
| `orders` | **Ninguna** — lleva nombre y contacto | Alta pública; gestión solo admin |
| `pedido_lineas` | **Ninguna** | Alta pública; gestión solo admin |
| `transparency_entries` | Pública, solo `published` | Solo admin |

Un pedido lleva datos personales de una familia: dejarlo legible convertiría la
tienda en un listado de datos personales. Por eso **no hay política de lectura
pública** sobre `orders` ni sobre sus líneas.

> [!caution] Dos trampas comprobadas en vivo
> **1.** La política de alta de `orders` exige `status = 'pendiente'`. Otro
> valor hace fallar la inserción entera.
> **2.** **No encadenar `.select()` al insert de `orders`.** El `RETURNING`
> evalúa la política de *lectura* sobre una tabla que el visitante no puede
> leer, y falla con «violates row-level security», que parece un problema de
> escritura sin serlo. El cliente **genera el uuid** y no pide nada de vuelta;
> además así la operación es reintentable.

---

## 6. Pendientes

- [ ] **Fijar los precios** desde el panel. Es lo único que separa la tienda de
      estar operativa.
- [ ] Fotografía de cada especie (se suben desde *Evidencias* y se pega el
      nombre de archivo en el catálogo).
- [ ] Clasificar los egresos ya registrados que quedaron sin categoría.
- [ ] Aviso al coordinador cuando entra una reserva; hoy hay que mirar el panel.
      → los cuatro, con lo que hay que decidir antes, en
      [[pendientes-coordinacion/06-tienda-precios-y-catalogo|06 · Tienda]].

---

## Enlaces

- [[CIEHS]] — índice general.
- [[CIEHS-Portal-Educativo]] — cómo está construido el portal y dónde vive esta sección.
- [[CIEHS-Backend-Supabase]] — esquema `ciehs`, tablas y RLS.
- [[CIEHS-Identidad-Visual]] — la línea gráfica de las tarjetas.
- [[CIEHS-Privacidad-Menores]] — qué datos personales trata el portal.
