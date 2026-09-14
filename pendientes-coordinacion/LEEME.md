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
| ~~[[pendientes-coordinacion/08-rotar-codigo-de-acceso\|08]]~~ | ~~Rotar el código de acceso al panel~~ · **CERRADO el 2026-09-13** | — | Hecho: código nuevo de 140 bits activo y verificado; el publicado en GitHub ya no abre nada |
| ~~[[pendientes-coordinacion/01-mural-panel-que-buscamos\|01]]~~ | ~~Repintar el panel del mural~~ · **CERRADO el 2026-09-10** | — | Hecho: la coordinación entregó un mural nuevo con el texto corregido. Queda repintar el mural **físico** de la pared |
| [[pendientes-coordinacion/02-autorizacion-de-imagen\|02]] | **Autorización de imagen**: revisión de Dirección, confirmar custodia, distribuir | Decisión institucional y firmas en papel | Publicar rostros sin tapar, y que `consent_ref` apunte a algo real |
| [[pendientes-coordinacion/03-vercel-github-app\|03]] | **Instalar la Vercel GitHub App** | Flujo OAuth en tu navegador con tu sesión | Despliegue automático por push |
| [[pendientes-coordinacion/04-validacion-cneb\|04]] | **Validar la correspondencia CNEB** | Reunión del equipo de área | Que la ruta pase de propuesta a programación validada |
| [[pendientes-coordinacion/05-datos-del-laboratorio\|05]] | **CE del agua, ficha de la UNT, cómo se repone** | Hay que medir y pedir el papel | Que los rangos publicados sean reproducibles |
| [[pendientes-coordinacion/06-tienda-precios-y-catalogo\|06]] | **Precios, fotos, egresos, aviso de reserva** | Decisión de la coordinación y captura en el panel | Dejar la tienda operativa |
| [[pendientes-coordinacion/07-licencia\|07]] | **Elegir la licencia** del código, del contenido y de las imágenes | Es la obra de la institución, no una corrección de documentación | Que otra escuela pueda reutilizar el trabajo |

---

## Si solo puedes hacer una

**La 02.** Es la única con consecuencia legal: mientras la custodia de las
autorizaciones no esté confirmada, el campo `consent_ref` no tiene destino
verificable y no debería publicarse ninguna fotografía con rostro sin tapar.

La buena noticia es que el portal **pixela las caras por defecto**, así que el
proyecto puede seguir publicando su trabajo sin esperar a nada. La 02 solo abre
la puerta de las caras visibles, que hoy no hace falta.

> [!success] La 08 ya no está en esta lista
> Era la que ocupaba este sitio: el código de administración estuvo publicado
> en un repositorio público. **Rotado y verificado el 2026-09-13** — el código
> viejo ya no valida ni escribe. Sigue en el historial de git, porque git no
> olvida, pero es un dato muerto.

## Si tienes cinco minutos

**La 03.** Son cuatro clics y a partir de ahí ya no hace falta empujar nada a
mano.

---

## Lo que no está aquí

Lo que sí se podía hacer desde el código ya está hecho: contraste AA,
exportación de mediciones a CSV, los retos de la Arena alineados con la ruta, la
revisión de seguridad de producción y la contradicción de licencia retirada. De
esa última quedó la parte que sí es tuya, y es la 07.

Esta carpeta queda fuera del sitio publicado: `.vercelignore` excluye todos los
`.md` y, por si acaso, la carpeta entera.

---

## Enlaces

- [[CIEHS]] — índice general del proyecto.
- [[CIEHS-Privacidad-Menores]] — el protocolo del que sale la 02.
- [[CIEHS-Agronomia-Hidroponia]] — donde aterrizan los datos de la 05.
- [[CIEHS-Tienda-Escolar]] — donde aterriza la 06.
