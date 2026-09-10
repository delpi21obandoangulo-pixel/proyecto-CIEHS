---
title: CIEHS · Privacidad y uso de imagen de menores
aliases: [Privacidad CIEHS, Protocolo de imagen, Ley 29733 CIEHS]
tags: [ciehs, privacidad, menores, legal, ley-29733]
estado: publicado · rostros tapados en origen · sin aprobacion de direccion
publicado-en: https://ciehs.vercel.app/#/privacidad
actualizado: 2026-09-09
---

# CIEHS · Privacidad y uso de imagen de menores

Protocolo de qué se publica y qué no. Parte de [[CIEHS]]; el riesgo que lo
motiva está registrado en [[CIEHS-Auditoria-Seguridad-Auth]].

> [!warning] Corrección del registro — 2026-09-09
> Una versión anterior de esta nota afirmaba que la Dirección había aprobado
> formalmente el protocolo en esta fecha. **Eso no consta.** El CIEHS es, en la
> práctica, un proyecto personal del docente coordinador apoyado en el
> laboratorio de la institución educativa, y no se tramitó tal aprobación. Se deja escrito en
> lugar de borrarlo: un documento que dice tener un respaldo que no tiene es
> peor que uno que reconoce no tenerlo.
>
> **Qué cambia con eso: nada del deber legal.** Que el proyecto sea personal no
> rebaja el listón de la Ley N.° 29733 — si acaso lo sube, porque desaparece el
> paraguas institucional que normalmente da cobertura al tratamiento de datos
> de estudiantes.

> [!success] Cómo se resuelve de verdad: **las caras se tapan antes de subir**
> Desde el 2026-09-09 el portal no publica rostros. Toda fotografía pasa por un
> editor que **pixela las caras en el propio navegador**, y lo que se sube es la
> imagen ya tapada: el original nunca sale del dispositivo.
>
> Eso desactiva el problema en origen. Una imagen sin rostro identificable
> **deja de ser un dato personal**, y con ello decae la exigencia de
> autorización del apoderado para esa fotografía. No es un permiso conseguido:
> es un dato que ya no existe.
>
> La autorización escrita sigue siendo obligatoria **solo** si alguna vez se
> quisiera publicar una cara sin tapar (§2 y §3). Hoy el portal no ofrece esa
> vía por defecto.
>
> Este documento no es asesoría legal.

> [!important] Dónde viven las fotografías, y por qué importa
> Las que muestran personas **no van al repositorio**: van al bucket
> `ciehs-evidencias` de Supabase Storage. El repositorio es **público** y el
> historial de git es permanente, así que un commit con la cara de un menor no
> se deshace ni borrando el archivo después.
>
> Como el §3 promete que la autorización es **revocable en cualquier momento** y
> el §6 que el contenido se retira sin pedir explicaciones, esa promesa solo se
> puede cumplir si el archivo se puede borrar de verdad. Desde el panel,
> eliminar una evidencia borra **la ficha y el objeto**.

---

## 1. Principio de fondo

> El portal difunde **el trabajo científico**, no la identidad de quien lo hace.

Un logro se atribuye al equipo y al grado, nunca a un menor identificable. Todo
lo demás son consecuencias de esta regla.

---

## 2. Qué sí y qué no

### Sí se publica
- Nombre del equipo de investigación y grado o sección.
- Fotografías de módulos, cultivos, instrumentos y del mural.
- Fotografías de manos trabajando, planos generales de espalda o imágenes donde
  no se distinga el rostro.
- Datos, gráficos, bitácoras e informes de investigación.
- Fotografías **con las caras tapadas**, que es lo que hace el portal por
  defecto en toda imagen que se sube → §2 bis.
- Fotografías con rostro **sin tapar**: solo con autorización escrita del
  apoderado, vigente y archivada. El portal no ofrece hoy esa vía.

### Nunca se publica
- Apellidos completos de estudiantes.
- Rostros identificables sin autorización firmada.
- Domicilio, teléfono, correo personal, DNI o código de matrícula.
- Datos de salud, situación familiar o cualquier dato sensible.
- Geolocalización precisa asociada a una persona.
- **Metadatos de las fotografías** — se retiran antes de subirlas. Una foto de
  móvil puede llevar coordenadas GPS del laboratorio y del propio domicilio.


---

## 2 bis. El tapado de rostros

Desde el 2026-09-09, **toda imagen que se sube al portal pasa por un editor que
pixela las caras en el propio navegador**. Es la pieza que hace viable publicar
el trabajo del laboratorio sin publicar a los menores que lo hacen.

### Por qué pixelado y no desenfoque

Un desenfoque gaussiano es reversible en la práctica: existen técnicas de
deconvolución que recuperan buena parte del rostro, y sobre caras pequeñas el
resultado puede volver a ser identificable. **El pixelado con bloques grandes
promedia y descarta la información: no queda nada que recuperar.** Para
anonimizar a un menor esa diferencia no es un matiz técnico.

Comprobado: un patrón de ajedrez de negro puro y blanco puro sale de la zona
tapada como **gris uniforme (125,125,125)**.

El tamaño del bloque es proporcional a la cara —un quinto de su lado menor, con
un mínimo de 12 px—, porque una cara pequeña necesita bloques relativamente más
grandes para quedar irreconocible.

### Por qué en el navegador

**El archivo original nunca sale del dispositivo.** Lo que se sube es un canvas
re-codificado. Eso tiene un segundo efecto que importa: la recodificación
**elimina todos los metadatos EXIF**, incluido el GPS, que en una foto de móvil
puede llevar las coordenadas del laboratorio o de la casa de un estudiante.

Por eso **toda** imagen pasa por el editor, tenga caras o no: si el borrado de
metadatos dependiera de que alguien se acuerde de pedirlo, algún día no se
acordaría.

### La puerta

Una imagen no se puede subir «sin decidir». O se tapó al menos una cara, o
alguien marcó expresamente que en esa imagen no aparece ninguna. No hay tercera
opción, y el botón de subir lo impide.

La detección automática (`FaceDetector`) se ofrece **solo si el navegador la
trae**, y nunca sustituye a la revisión manual: lo que encuentra se añade como
recuadros normales, editables y borrables. Se ensancha un 18 % lo que detecta,
porque los detectores ajustan al rostro y dejan fuera frente, orejas y mentón,
que también identifican.

> [!warning] En vídeo no hay tapado automático
> Cubrir caras en vídeo exige procesar y recodificar cada fotograma, y eso no
> es viable con las bibliotecas disponibles en este portal. El formulario lo
> dice de forma explícita y pide grabar manos, planos generales o de espalda.
> **No se ofrece una función que aparente funcionar y no lo haga.**

---

## 3. La autorización

Tres condiciones que la hacen válida y no meramente formal:

1. **Específica** — dice para qué se usará la imagen, no da permiso en blanco.
2. **Revocable** en cualquier momento y sin dar motivos.
3. **No condiciona la participación** — ningún estudiante queda fuera del CIEHS
   por no autorizarla. Esto es lo que evita que la autorización se convierta en
   una presión encubierta.

---

## 4. Qué datos trata el portal

Inventario real, verificado en el código y no supuesto:

| Qué | Dónde | Sale del equipo |
|---|---|---|
| Progreso del Pasaporte (`ciehs_pasaporte_v1`) | `localStorage` | **No** |
| Progreso de minijuegos (`ciehs_minijuegos_v1`) | `localStorage` | **No** |
| Progreso de la Arena (`ciehs_arena_v1`) | `localStorage` | **No** |
| Aviso cerrado (`ciehs_aviso_dismissed`) | `sessionStorage` | **No** |
| Sesión de administración (`ciehs-auth`) | `localStorage` del coordinador | Sí, a Supabase |
| Contenido y mediciones | Base de datos `ciehs` | Público, sin datos personales |
| Tipografías | Google Fonts | **Sí — la IP del visitante llega a Google** |
| Simuladores PhET | phet.colorado.edu | **Solo si el visitante pulsa «Abrir simulador»**; hasta entonces, no |

Sin registro de visitantes, sin cookies de seguimiento, sin analítica. El
formulario de contacto no almacena nada: abre el cliente de correo del visitante.

> [!note] Los dos terceros del portal
> **Google Fonts** carga con la página y expone la IP del visitante sin que él
> pueda evitarlo. **PhET** solo se contacta si alguien pulsa «Abrir simulador»,
> y el aviso lo dice antes de pulsar.
>
> Google Fonts es el que conviene quitar: Alojar las fuentes
> en el propio dominio lo eliminaría por completo, igual que se hizo con las
> bibliotecas de JavaScript. Queda como pendiente, no como decisión cerrada.

---

## 5. Marco legal

**Ley N.° 29733**, Ley de Protección de Datos Personales del Perú, y su
reglamento. Tratándose de menores, el consentimiento lo otorga el padre, la
madre o el apoderado. La institución educativa es la responsable del
tratamiento.

Derechos ejercitables: **acceso, rectificación, cancelación y oposición**, ante
ciehs.olaya@gmail.com.

---

## 6. Retirada de contenido

Cualquier persona puede pedir que se retire algo escribiendo al correo del
CIEHS. **No se exige justificar la decisión ni aportar documentación**: el
contenido se retira mientras se revisa. Es deliberado — poner trámites delante
de una familia que quiere proteger a su hijo convierte el derecho en un
obstáculo.

---

## 7. Pendientes

- [x] **Aprobación formal de la Dirección.** Obtenida el 2026-09-09. Era el
      bloqueo que retenía todo lo demás.
- [ ] Redactar y distribuir la **ficha de autorización de imagen** para
      apoderados.
- [ ] Definir **quién archiva y custodia** las autorizaciones firmadas. Ahora
      es lo más urgente: las autorizaciones ya existen y el campo `consent_ref`
      de cada evidencia debe apuntar a un sitio concreto y localizable.
- [x] Procedimiento para **retirar metadatos** de las fotografías antes de
      subirlas. Hecho: hay un limpiador propio que descarta todos los segmentos
      APPn y de comentario de cada JPEG. Se aplicó a las cuatro publicadas.
- [ ] Decidir sobre las tipografías propias para eliminar la llamada a Google.
- [ ] Revisar la contradicción de licencia del repositorio
      → [[CIEHS-Auditoria-Seguridad-Auth]]

---

## Enlaces

- [[CIEHS]] — índice general.
- [[CIEHS-Auditoria-Seguridad-Auth]] — riesgos y hallazgos de seguridad.
- [[CIEHS-Identidad-Visual]] — qué imágenes existen hoy en el portal.
- [[CIEHS-Arena-Juego]] — qué guarda el juego en el navegador.
- [[CIEHS-Pentest-2026-09]] — evaluación de ciberseguridad del portal.
- [[CIEHS-Portal-Educativo]] — dónde vive la página de privacidad.
