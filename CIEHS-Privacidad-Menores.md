---
title: CIEHS · Privacidad y uso de imagen de menores
aliases: [Privacidad CIEHS, Protocolo de imagen, Ley 29733 CIEHS]
tags: [ciehs, privacidad, menores, legal, ley-29733]
estado: publicado · APROBADO POR DIRECCION 2026-09-09
publicado-en: https://ciehs.vercel.app/#/privacidad
actualizado: 2026-09-09
---

# CIEHS · Privacidad y uso de imagen de menores

Protocolo de qué se publica y qué no. Parte de [[CIEHS]]; el riesgo que lo
motiva está registrado en [[CIEHS-Auditoria-Seguridad-Auth]].

> [!success] Bloqueo levantado — **aprobado por la Dirección el 2026-09-09**
> La Dirección de la I.E. N.° 80033 «José Olaya Balandra» aprobó formalmente
> este protocolo. Con eso decae el bloqueo general que impedía publicar
> cualquier fotografía de un estudiante.
>
> **Lo que sigue vigente, y no depende de esa aprobación:** una fotografía con
> rostro identificable necesita además **autorización escrita del apoderado**,
> vigente y archivada (§2 y §3). La aprobación de la Dirección habilita el
> marco; no sustituye el consentimiento de cada familia.
>
> Este documento sigue sin ser asesoría legal.

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
- Fotografías con rostro **solo** con autorización escrita del apoderado,
  vigente y archivada.

### Nunca se publica
- Apellidos completos de estudiantes.
- Rostros identificables sin autorización firmada.
- Domicilio, teléfono, correo personal, DNI o código de matrícula.
- Datos de salud, situación familiar o cualquier dato sensible.
- Geolocalización precisa asociada a una persona.
- **Metadatos de las fotografías** — se retiran antes de subirlas. Una foto de
  móvil puede llevar coordenadas GPS del laboratorio y del propio domicilio.

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

Sin registro de visitantes, sin cookies de seguimiento, sin analítica. El
formulario de contacto no almacena nada: abre el cliente de correo del visitante.

> [!note] La dependencia de Google Fonts
> Es el único tercero al que el portal expone al visitante. Alojar las fuentes
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
