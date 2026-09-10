---
title: 7 · Decidir la licencia del proyecto
tags: [ciehs, pendiente-coordinacion, legal, licencia, propiedad-intelectual]
depende-de: decisión de la institución sobre su propia obra
actualizado: 2026-09-10
---

# 7 · Decidir la licencia del proyecto

El repositorio decía **dos cosas contradictorias**: el README lo distribuía bajo
**MIT** —con una insignia y una sección que remitía a sí misma— y el pie del
portal decía **«Todos los derechos reservados»**. No había archivo `LICENSE`.

La contradicción ya se retiró: el README ya no afirma MIT. **Falta decidir qué
dice en su lugar**, y eso no lo decide el código.

> [!warning] Lo que está en juego no es una formalidad
> Mientras no haya decisión, rige lo que dice el pie: **todos los derechos
> reservados**. Es el estado por defecto del derecho de autor y no impide nada
> de lo que el CIEHS hace hoy. Lo que impide es que **otra escuela reutilice el
> material**, que es justo lo que un proyecto de ciencia escolar suele querer.

---

## Lo que hay que decidir, y por qué no es una sola cosa

El repositorio contiene **tres clases de obra distintas**, y meterlas bajo una
sola licencia es lo que crea el problema:

| Qué | Ejemplos | Qué conviene |
|---|---|---|
| **Código** | `index.html`, `assets/js/*`, `assets/css/*`, `db/*.sql` | Una licencia de software permisiva, MIT por ejemplo |
| **Contenido pedagógico** | La ruta de 9 pasos, el banco de 150 retos, los textos del portal | Una Creative Commons, que es lo que se usa para material educativo |
| **Imágenes** | Fotografías del laboratorio, el mural, el escudo institucional | **Ninguna licencia abierta** — ver abajo |

> [!caution] Las fotografías no pueden ir en una licencia abierta
> Cuatro fotografías del laboratorio están versionadas en un repositorio
> **público**. Ponerlas bajo MIT o bajo cualquier CC permisiva autorizaría a
> cualquiera a copiarlas, modificarlas y redistribuirlas **para siempre**.
>
> Eso choca de frente con lo que [[CIEHS-Privacidad-Menores]] promete: que una
> autorización es **revocable en cualquier momento** y que el contenido se
> retira sin pedir explicaciones. Una promesa de retirada no se puede cumplir
> sobre una imagen que ya se licenció a todo el mundo de forma irrevocable.
>
> **Sea cual sea la decisión, las imágenes quedan fuera.**

---

## Las tres salidas

### A · Todo cerrado *(lo que rige ahora por defecto)*

No se hace nada más. El pie ya lo dice y es legalmente correcto.

- **A favor:** cero riesgo, cero trámite.
- **En contra:** ninguna otra escuela puede reutilizar el trabajo. Para un
  proyecto que se presenta a Eureka y quiere ser referente regional, es una
  puerta cerrada por omisión, no por decisión.

### B · Código MIT + contenido CC BY-NC-SA + imágenes reservadas *(recomendada)*

- **Código** bajo **MIT**: cualquiera puede levantar un portal como este.
- **Contenido pedagógico** bajo **CC BY-NC-SA 4.0**: se puede reutilizar y
  adaptar citando al CIEHS, sin uso comercial, y lo derivado se comparte igual.
- **Imágenes**: todos los derechos reservados, dicho explícitamente.

- **A favor:** es lo que hacen los proyectos educativos abiertos. Permite que
  otra escuela costera copie el sistema sin permitir que una empresa lo venda.
- **En contra:** hay que escribir dos archivos y mantener la distinción clara.

### C · Todo MIT

- **A favor:** lo más simple de explicar.
- **En contra:** **no es viable aquí.** Licenciaría también las fotografías, y
  eso rompe la promesa de revocación del protocolo de imagen.

---

## Si se elige B, esto es lo que hay que hacer

1. Crear `LICENSE` en la raíz con el texto MIT, titulado
   **«MIT License — código fuente del portal CIEHS»**, con
   `Copyright (c) 2026 I.E. N.° 80033 "José Olaya Balandra"`.
2. Crear `LICENSE-CONTENIDO.md` con el enlace a
   **CC BY-NC-SA 4.0** y la lista de qué cubre.
3. En ambos, una línea final: *«Las fotografías e ilustraciones de
   `assets/img/` quedan excluidas: todos los derechos reservados.»*
4. Restituir la insignia del README apuntando a `LICENSE`, y reescribir la
   sección **📄 Licencia** con las tres clases de obra.
5. Cambiar el pie del portal de «Todos los derechos reservados» a algo que no
   contradiga lo anterior — por ejemplo: *«© 2026 CIEHS · I.E. N.° 80033 José
   Olaya Balandra. Código bajo licencia MIT; contenido bajo CC BY-NC-SA 4.0;
   imágenes, todos los derechos reservados.»*

Dime cuál eliges y lo dejo hecho en una pasada. Este documento **no es asesoría
legal**: conviene que la Dirección lo valide, sobre todo porque la titularidad
de la obra de estudiantes menores de edad no es evidente.

---

## Pendientes

- [ ] Elegir entre A, B y C.
- [ ] Validación de la Dirección sobre la titularidad de la obra.
- [ ] Aplicar la elección en `LICENSE`, README y pie del portal.

---

Índice de la carpeta en [[pendientes-coordinacion/LEEME|LEEME]] ·
hallazgo original en [[CIEHS-Auditoria-Seguridad-Auth]] ·
la promesa que condiciona todo esto, en [[CIEHS-Privacidad-Menores]].
