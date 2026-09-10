---
title: 6 · Tienda — fijar precios y completar el catálogo
tags: [ciehs, pendiente-coordinacion, tienda, panel]
depende-de: decisión de la coordinación y captura en el panel
actualizado: 2026-09-10
---

# 6 · Tienda: fijar precios y completar el catálogo

La tienda está construida y funcionando. **Lo único que separa a la tienda de
estar operativa es que alguien decida los precios y los escriba.** No es una
tarea de código: es una decisión, y la captura de esa decisión en el panel.

---

## 6.1 · Fijar los precios — lo que bloquea todo lo demás

Seis especies: lechuga crespa, lechuga americana, espinaca, cebolla china,
albahaca y acelga.

**Dónde:** panel de administración → catálogo de la tienda.

**Antes de escribir un número**, conviene que la decisión quede tomada de forma
explícita, porque esta tienda la sostienen estudiantes y la caja es visible en
el portal:

- ¿El precio cubre insumos, o también aspira a dejar margen para el propio
  laboratorio? Los dos son legítimos; lo que no funciona es no haberlo decidido.
- ¿Se vende por unidad, por atado o por peso? La unidad de venta debe ser la
  misma que la de la cosecha registrada, o la trazabilidad se rompe entre lo
  cosechado y lo vendido.
- ¿Hay precio distinto para la comunidad educativa y para fuera?

**Quién decide:** el equipo de Ventas y atención (EQ-06) con Tesorería (EQ-07),
que es a quienes les toca sostenerlo. Anotar aquí quién y cuándo:

Decidido por: ____________________  ·  Fecha: ____________

---

## 6.2 · Fotografía de cada especie

Seis fotografías, una por especie. **Producto, no personas** — así no entran en
el protocolo de imagen de menores.

**Cómo:** se suben desde *Evidencias* en el panel y luego se pega el nombre de
archivo en la ficha de la especie, dentro del catálogo.

Recordatorio: **toda** imagen pasa igual por el editor del navegador, tenga
caras o no. Es lo que borra los metadatos EXIF, incluida la ubicación GPS que
puede llevar una foto de móvil.

---

## 6.3 · Clasificar los egresos sin categoría

Hay egresos ya registrados que quedaron sin categoría. Mientras existan, el
resumen de caja del portal no cuadra por concepto, solo por total — y esa es
justamente la transparencia que la tienda promete.

**Dónde:** panel → tesorería → egresos sin categoría.

---

## 6.4 · Aviso cuando entra una reserva

Hoy hay que **acordarse de mirar el panel**: si nadie entra, la reserva espera.

Esto sí es una tarea de código, pero depende de una decisión previa tuya:

| Vía | Qué haría falta |
|---|---|
| **Correo** al coordinador | Una función de Supabase y un proveedor de correo |
| **Notificación push** en el navegador del coordinador | Claves VAPID propias; el portal ya es una PWA con service worker |
| **Nada, revisión diaria** | Fijar la hora y que sea rutina de EQ-06 |

Dime cuál y lo monto. La tercera es una decisión válida y la más barata.

---

Índice de la carpeta en [[pendientes-coordinacion/LEEME|LEEME]].
