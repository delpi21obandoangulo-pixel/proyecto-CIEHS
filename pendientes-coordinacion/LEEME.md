---
title: Pendientes que dependen de la coordinación
aliases: [Pendientes coordinacion, Qué me toca a mí]
tags: [ciehs, pendiente-coordinacion, indice]
actualizado: 2026-09-10
---

# Pendientes que dependen de la coordinación

Todo lo que **no se puede resolver escribiendo código**. Cada archivo es una
tarea cerrada: qué falta, por qué está parada y qué hay que hacer exactamente.

No son notas de consulta: son encargos. Cuando uno se cierra, se marca aquí y
en la nota de la que salió.

---

## La lista

| # | Tarea | Por qué no puede hacerse desde el código | Qué desbloquea |
|---|---|---|---|
| [[pendientes-coordinacion/01-mural-panel-que-buscamos\|01]] | **Repintar el panel del mural** | Es una ilustración rasterizada, y el mural físico está en una pared | Que la imagen y el portal dejen de decir cosas distintas |
| [[pendientes-coordinacion/02-autorizacion-de-imagen\|02]] | **Autorización de imagen**: revisión de Dirección, confirmar custodia, distribuir | Decisión institucional y firmas en papel | Publicar rostros sin tapar, y que `consent_ref` apunte a algo real |
| [[pendientes-coordinacion/03-vercel-github-app\|03]] | **Instalar la Vercel GitHub App** | Flujo OAuth en tu navegador con tu sesión | Despliegue automático por push |
| [[pendientes-coordinacion/04-validacion-cneb\|04]] | **Validar la correspondencia CNEB** | Reunión del equipo de área | Que la ruta pase de propuesta a programación validada |
| [[pendientes-coordinacion/05-datos-del-laboratorio\|05]] | **CE del agua, ficha de la UNT, cómo se repone** | Hay que medir y pedir el papel | Que los rangos publicados sean reproducibles |
| [[pendientes-coordinacion/06-tienda-precios-y-catalogo\|06]] | **Precios, fotos, egresos, aviso de reserva** | Decisión de la coordinación y captura en el panel | Dejar la tienda operativa |

---

## Si solo puedes hacer una

**La 02.** No porque sea la más urgente en apariencia, sino porque es la única
con consecuencia legal: mientras la custodia no esté confirmada, el campo
`consent_ref` no tiene destino verificable y no debería publicarse ninguna
fotografía con rostro sin tapar.

La buena noticia es que el portal **pixela las caras por defecto**, así que el
proyecto puede seguir publicando su trabajo sin esperar a nada. La 02 solo
abre la puerta de las caras visibles, que hoy no hace falta.

## Si tienes cinco minutos

**La 03.** Son cuatro clics y a partir de ahí ya no hace falta empujar nada a
mano.

---

## Lo que no está aquí

Lo que sí se puede hacer desde el código vive en las notas de siempre y se va
resolviendo ahí: contraste AA, exportación de mediciones a CSV, alinear los
retos de la Arena con la ruta, la revisión de seguridad de producción y la
contradicción de licencia del repositorio.

Esta carpeta queda fuera del sitio publicado: `.vercelignore` excluye todos los
`.md` y, por si acaso, la carpeta entera.

---

## Enlaces

- [[CIEHS]] — índice general del proyecto.
- [[CIEHS-Privacidad-Menores]] — el protocolo del que sale la 02.
- [[CIEHS-Agronomia-Hidroponia]] — donde aterrizan los datos de la 05.
- [[CIEHS-Tienda-Escolar]] — donde aterriza la 06.
