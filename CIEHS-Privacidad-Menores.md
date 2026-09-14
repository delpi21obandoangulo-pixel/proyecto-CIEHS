---
title: CIEHS · Privacidad y uso de imagen de menores
aliases: [Privacidad CIEHS, Protocolo de imagen, Ley 29733 CIEHS]
tags: [ciehs, privacidad, menores, legal, ley-29733]
estado: publicado · rostros tapados en origen · sin aprobacion de direccion
publicado-en: https://ciehs.vercel.app/#/privacidad
actualizado: 2026-09-13
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

> El portal difunde **el trabajo científico** y reconoce a quien lo hizo, sin
> hacerlo identificable.

Todo lo demás son consecuencias de esta regla.

> [!warning] Este principio cambió el 2026-09-13
> Hasta esa fecha decía: «Un logro se atribuye al equipo y al grado, **nunca a
> un menor identificable**». Era exacto mientras un aporte se firmaba solo con
> el equipo y el grado. Desde que las publicaciones llevan firma, ya no lo era:
> se publica el nombre de pila y una inicial. Se cambió el principio en lugar de
> dejarlo diciendo algo que el portal ya no cumplía → §2 ter.
>
> Lo que **no** cambió es la promesa que sostiene todo: un apellido completo de
> un menor sigue sin publicarse nunca.

---

## 2. Qué sí y qué no

### Sí se publica
- Nombre del equipo de investigación y grado o sección.
- **La firma de quien publica**: nombre de pila y la inicial del apellido si es
  estudiante («María Q.»), nombre completo si es docente. Igual para quienes
  figuren como colaboradores → §2 ter.
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

## 2 ter. La firma de un aporte

Desde el **2026-09-13** las publicaciones de la carpeta de campo llevan firma.
Antes se firmaban con `equipo` y `grado` y nada más: quien hacía el trabajo no
aparecía por ningún lado. En un portal que publica investigación escolar eso es
un problema real — el crédito es parte de lo que se enseña.

El problema es que el crédito choca de frente con el §1. La forma de los campos
es lo que resuelve el choque, y **no la decide el diseño, la decide esta nota**:

| Quién firma | Qué se publica | Por qué |
|---|---|---|
| **Estudiante** | Nombre de pila + inicial del apellido → «María Q. · 4.° A» | El §2 prohíbe apellidos completos de menores. No prohíbe el nombre de pila |
| **Docente** | Nombre y apellidos completos | Es un adulto que firma su propio trabajo. Esta nota nunca dijo nada de los docentes |

Los colaboradores siguen exactamente la misma regla que el autor.

### La inicial va en un campo aparte, y eso es deliberado

En el formulario, el estudiante **no** escribe «nombre y apellido» en una caja.
Escribe el nombre en una y la inicial en otra **de un solo carácter**. Un campo
ancho invitaría a teclear el apellido entero, que es justo lo que no se publica.

Al elegir «docente» en el selector de rol, el campo de inicial desaparece y la
etiqueta pasa a «Nombre y apellidos» — y se **borra** lo que hubiera dentro,
para que no viaje un dato que ya no corresponde.

### Pero un formulario se salta

Esconder un campo no es una garantía: cualquiera abre la consola del navegador y
envía lo que quiera. Por eso la regla vive también **en la base de datos**, donde
no se puede esquivar — `ciehs.aportes`, restricción `aportes_inicial_corta`:

```sql
check (autor_inicial is null or char_length(autor_inicial) <= 2)
```

Esa línea es lo que convierte la promesa de esta nota en algo que se cumple **por
construcción y no por confianza**. Si alguien intenta meter «Quispe» ahí, la
fila se rechaza. Comprobado contra la base real el 2026-09-13, junto con las
restricciones hermanas que limitan la lista de colaboradores →
[[CIEHS-Backend-Supabase]] §10.

### Lo que esto no arregla

En un colegio, «María Q. · 4.° A» identifica a una persona concreta para
cualquiera que esté dentro del colegio. La firma protege frente a un buscador o
un desconocido, **no frente a la comunidad escolar**, y no pretende hacerlo: la
autoría es justamente lo contrario del anonimato. Conviene tenerlo escrito para
que nadie lea el §1 como una promesa de anonimato que nunca fue.

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

El documento que cumple las tres, con su procedimiento de custodia y el formato
del código `consent_ref`, está en [[pendientes-coordinacion/02-autorizacion-de-imagen|02 · Autorización de imagen]].

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
contenido se retira **en un plazo máximo de 72 horas** desde que se recibe el
aviso, y se revisa después, no antes. Es deliberado — poner trámites delante
de una familia que quiere proteger a su hijo convierte el derecho en un
obstáculo.

> [!note] El plazo se añadió el 2026-09-13
> Antes decía solo «se retira mientras se revisa», que no dice cuándo y por
> tanto no es exigible. **72 horas es el techo, no el objetivo**: lo normal es
> el mismo día. Se compromete el techo porque es lo que una familia puede
> reclamar.
>
> La misma frase del portal se contradecía: pedía indicar «qué contenido es y
> **por qué**» y dos líneas después prometía que no hace falta justificar. Se
> quitó el «por qué»: la promesa que manda es la segunda.

---

## 7. Pendientes

- [ ] **Aprobación formal de la Dirección.** No consta — ver la corrección del
      registro al inicio de esta nota. Un pendiente anterior la daba por
      obtenida el 2026-09-09; era la misma afirmación que esa corrección
      desmiente, así que vuelve a estar abierto.
- [x] Redactar la **ficha de autorización de imagen** para apoderados. Hecho:
      [[pendientes-coordinacion/02-autorizacion-de-imagen|02 · Autorización de imagen]] §4, lista para imprimir. Falta que la Dirección la revise y que se
      distribuya.
- [ ] Definir **quién archiva y custodia** las autorizaciones firmadas. La
      propuesta operativa está escrita en [[pendientes-coordinacion/02-autorizacion-de-imagen|02 · Autorización de imagen]] §1 —original en papel bajo
      llave, índice local que nunca entra al repositorio ni a la base—, pero
      **falta que el coordinador la confirme**.
      Hasta entonces `consent_ref` no tiene destino verificable y no debe
      publicarse ninguna fotografía con rostro sin tapar.
      **El software ya no es el cuello de botella**: desde el 2026-09-13 el
      registro de códigos está en producción y validado →
      [[CIEHS-Backend-Supabase]] §11. Lo único que falta es físico — la firma de
      custodia y el reparto de las fichas.
- [ ] **Repartir las fichas** a las familias. El documento está listo para
      imprimir desde hace días; sin fichas firmadas el registro sigue vacío, y
      un registro vacío no autoriza nada.
- [x] Procedimiento para **retirar metadatos** de las fotografías antes de
      subirlas. Hecho: hay un limpiador propio que descarta todos los segmentos
      APPn y de comentario de cada JPEG. Se aplicó a las cuatro publicadas.
- [ ] **El campo del nombre no impide un apellido.** La base garantiza que no
      entre un apellido en `autor_inicial` (§2 ter), pero nada impide que un
      estudiante teclee «María Quispe Torres» en el campo del *nombre*. Hoy el
      único filtro es que el coordinador lo vea antes de publicar, y eso es un
      control humano, no una garantía. Opciones a valorar: rechazar en el
      formulario un nombre con espacios cuando el rol es «estudiante», o
      recortarlo a la primera palabra al guardar. Ninguna es gratis — hay
      nombres compuestos legítimos («María José»), así que no se decidió a la
      ligera y queda abierto.
- [ ] Decidir sobre las tipografías propias para eliminar la llamada a Google.
- [ ] Revisar la contradicción de licencia del repositorio. La contradicción ya
      se retiró; falta la decisión, y afecta directamente a esta nota: una
      licencia abierta sobre las fotografías haría **imposible cumplir** la
      promesa de revocación del §3 →
      [[pendientes-coordinacion/07-licencia|07 · Licencia]]

---

## Enlaces

- [[CIEHS]] — índice general.
- [[pendientes-coordinacion/02-autorizacion-de-imagen|02 · Autorización de imagen]] — el documento que firma el apoderado, dónde se custodia y cómo se
  enlaza con cada evidencia.
- [[CIEHS-Auditoria-Seguridad-Auth]] — riesgos y hallazgos de seguridad.
- [[CIEHS-Identidad-Visual]] — qué imágenes existen hoy en el portal.
- [[CIEHS-Arena-Juego]] — qué guarda el juego en el navegador.
- [[CIEHS-Pentest-2026-09]] — evaluación de ciberseguridad del portal.
- [[CIEHS-Portal-Educativo]] — dónde vive la página de privacidad.
