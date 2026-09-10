---
title: CIEHS · Ficha de autorización de imagen
aliases: [Autorización de imagen CIEHS, consent_ref, Custodia de autorizaciones]
tags: [ciehs, privacidad, menores, legal, ley-29733, autorizacion]
estado: redactada · pendiente de confirmar quién custodia
actualizado: 2026-09-10
---

# CIEHS · Ficha de autorización de imagen

El documento que firma el apoderado, dónde se guarda y cómo se enlaza con cada
fotografía publicada. Cierra dos pendientes de [[CIEHS-Privacidad-Menores]].

> [!important] Antes de usarla: comprobar si hace falta
> El portal **pixela las caras en el navegador** antes de subir cualquier
> imagen. Una fotografía sin rostro identificable deja de ser un dato personal,
> y para esa fotografía **no se necesita esta ficha**.
>
> Esta autorización se pide **solo** para publicar un rostro **sin tapar**. Hoy
> el portal no ofrece esa vía por defecto, así que el caso normal es no
> necesitarla. Pedirla «por si acaso» a todas las familias sería recoger datos
> personales sin necesitarlos, que es justo lo que la Ley N.° 29733 evita.

---

## 1. Quién custodia

> [!warning] Falta una confirmación
> Lo de abajo es la propuesta operativa. **El docente coordinador debe
> confirmarla o cambiarla**, y anotar aquí la fecha en que lo hizo. Hasta
> entonces, `consent_ref` no tiene un destino verificable y no debería
> publicarse ninguna fotografía con rostro sin tapar.
>
> Confirmado por: ____________________  ·  Fecha: ____________

| Qué | Dónde | Quién responde |
|---|---|---|
| **Original en papel**, firmado | Archivador bajo llave en la institución educativa, carpeta «CIEHS · Autorizaciones de imagen» | Docente coordinador del CIEHS |
| **Índice** código ↔ estudiante ↔ fecha ↔ vigencia | Una sola hoja de cálculo **local**, en el equipo del coordinador | Docente coordinador del CIEHS |
| **Revocaciones** recibidas | Anotadas en el índice el mismo día, y el original se sella «REVOCADA» | Docente coordinador del CIEHS |

Tres reglas que no se negocian:

1. **El índice no entra en el repositorio.** El repositorio es público y el
   historial de git es permanente. Un archivo con nombres de menores no se
   deshace borrándolo después.
2. **El índice no entra en la base de datos.** En `ciehs.evidencias` solo viaja
   el **código**, nunca el nombre. Quien consulte la base ve `AUT-2026-014` y
   nada más; el nombre solo existe en el papel y en la hoja local.
3. **Si nadie puede localizar el papel en cinco minutos, la fotografía no se
   publica.** El campo `consent_ref` sirve para responder «¿con qué respaldo
   salió esta cara?» meses después. Si la respuesta no es localizable, el campo
   es decorativo.

---

## 2. El código `consent_ref`

Formato: **`AUT-<año>-<correlativo de tres dígitos>`** — por ejemplo
`AUT-2026-014`.

- Se escribe **a mano en la esquina superior derecha del papel** al recibirlo,
  y se anota en el índice.
- Se copia tal cual en el campo *Referencia de autorización* del panel, al
  publicar la evidencia.
- **Un código por estudiante y año escolar**, no por fotografía: una misma
  autorización cubre todas las imágenes de ese estudiante mientras esté vigente.
- Si una fotografía muestra a varios estudiantes con el rostro sin tapar, el
  campo lleva **todos** los códigos separados por espacio:
  `AUT-2026-014 AUT-2026-021`. Si falta uno, esa cara se pixela.

---

## 3. Qué hace válida a esta ficha

Las tres condiciones de [[CIEHS-Privacidad-Menores]] §3, y cómo las cumple el
documento de abajo:

| Condición | Cómo se cumple |
|---|---|
| **Específica** | Cada uso va en una casilla propia. Marcar «todo» exige marcar cuatro casillas, no una. Sin casillas marcadas, la ficha no autoriza nada |
| **Revocable** | Apartado 4 del documento: basta un correo o avisar al coordinador, sin dar motivos, con efecto el mismo día |
| **No condiciona la participación** | Frase destacada en el encabezado del documento, antes de las casillas, para que se lea antes de decidir |

---

## 4. El documento, listo para imprimir

Copiar de aquí abajo a una hoja A4. Todo lo que va entre corchetes se rellena a
mano.

---

<div style="page-break-after: always"></div>

**I.E. N.° 80033 “JOSÉ OLAYA BALANDRA” — HUANCHACO, LA LIBERTAD**
**CIEHS · Centro de Investigación Escolar Hidropónico Sostenible**

## AUTORIZACIÓN DE USO DE IMAGEN DE MENOR DE EDAD

Código: `AUT-______-______`

---

**Su hijo o hija participa igual en el CIEHS, firme o no firme esta hoja.**
No autorizarla no le deja fuera de ninguna actividad, investigación ni equipo.
El portal del CIEHS **tapa las caras por defecto**: esta hoja solo se pide para
publicar el rostro **sin tapar**.

---

### 1. Quién autoriza

- Apoderado: **[nombre y apellidos]**
- Documento de identidad: **[DNI]**
- En calidad de: ☐ padre ☐ madre ☐ apoderado legal

### 2. Sobre quién

- Estudiante: **[nombre y apellidos]**
- Grado y sección: **[ej. 3.° B]**
- Equipo del CIEHS: **[ej. EQ-03 Monitoreo y registro]**

### 3. Para qué, exactamente

Autorizo que se publique la imagen del estudiante **con el rostro visible**,
únicamente en los usos que marco:

- ☐ **Portal web del CIEHS** (https://ciehs.vercel.app), sección de evidencias
  del laboratorio.
- ☐ **Material impreso del proyecto**: paneles de feria, murales, trípticos.
- ☐ **Presentación en ferias y concursos escolares**, incluida Eureka.
- ☐ **Redes sociales institucionales** de la institución educativa.

Casilla sin marcar = uso **no** autorizado.

En todos los casos, y aunque estén todas marcadas, **nunca** se publicarán:
apellidos completos, domicilio, teléfono, correo, DNI, código de matrícula,
datos de salud ni ubicación precisa del estudiante.

### 4. Hasta cuándo, y cómo retirarla

- **Vigencia:** el año escolar **[año]**. Al terminar caduca sola; para el
  siguiente año hace falta una hoja nueva.
- **Revocación:** puede retirarla **cuando quiera y sin dar motivos**,
  escribiendo a **ciehs.olaya@gmail.com** o avisando al docente coordinador. El
  material se retira del portal **el mismo día**, sin pedir explicaciones ni
  documentación.
- Retirarla no afecta en nada a la participación del estudiante.

### 5. Marco legal

Tratamiento de datos personales conforme a la **Ley N.° 29733** del Perú y su
reglamento. Derechos de acceso, rectificación, cancelación y oposición ante
**ciehs.olaya@gmail.com**.

---

Firma del apoderado: ______________________________

Aclaración: **[nombre]**  ·  DNI: **[número]**

Lugar y fecha: Huanchaco, **[día]** de **[mes]** de **[año]**

---

*Recibido por (docente coordinador):* ______________________  ·  *Fecha:* __________

<div style="page-break-after: always"></div>

---

## 5. Pendientes

- [ ] Confirmar quién custodia (§1) y anotar la fecha en el recuadro.
- [ ] Revisión de la ficha por la Dirección de la institución educativa antes de
      distribuirla. Este documento **no es asesoría legal**.
- [ ] Abrir el archivador y la hoja de índice, aunque estén vacíos: el
      procedimiento tiene que existir antes de la primera fotografía, no después.

---

## Enlaces

- [[CIEHS-Privacidad-Menores]] — el protocolo del que sale esta ficha.
- [[CIEHS-Backend-Supabase]] — la columna `consent_ref` de `ciehs.evidencias`.
- [[CIEHS-Portal-Educativo]] — dónde se cargan las evidencias.
- [[CIEHS]] — índice general.
