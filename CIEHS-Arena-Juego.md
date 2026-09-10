---
title: CIEHS · Arena, el modo de juego
aliases: [Arena CIEHS, Expediciones CIEHS, Retos CIEHS]
tags: [ciehs, arena, juego, gamificacion, animacion, accesibilidad]
estado: en produccion
publicado-en: https://ciehs.vercel.app/#/juega
actualizado: 2026-09-10
---

# CIEHS · Arena, el modo de juego

Capa de juego a pantalla completa, independiente del portal. Índice en [[CIEHS]];
el resto del sitio está en [[CIEHS-Portal-Educativo]].

> [!abstract] Qué es
> Al entrar se oculta la navegación y el reto ocupa toda la ventana con su propia
> paleta, su propio ritmo y su propia identidad. **No debe parecer la misma web**:
> ese es el requisito de diseño del que sale todo lo demás.

---

## 1. Los cinco niveles

| Nivel | Retos | Carácter |
|---|---|---|
| **Inicial** (Ciclo II) | 30 | Escucha y opciones de dos palabras. **+70 % de tiempo** por reto |
| **Primaria** | 30 | Observación y primeras medidas |
| **Secundaria** | 30 | Variables y parámetros del cultivo |
| **Expedición Preuniversitaria** | 30 | Cálculo, proporciones y diseño experimental |
| **Expedición Universitaria** | 30 | Análisis, estadística y fisiología |

**150 retos en total.** Todo el contenido deriva de la ciencia que el portal ya
explica o de conocimiento estándar del área — no hay datos inventados sobre el
CIEHS. Ver [[CIEHS-Metodologia-Pedagogica]] para la fuente pedagógica.

### Por qué existen las expediciones

La institución llega hasta secundaria. Preuniversitario y universitario no son
"un curso más": se plantean como un **desafío excepcional**, con reglas propias.

| Regla | Valor |
|---|---|
| Tiradas | **1 al día**, con cuenta atrás visible |
| Vidas | **1** — un fallo y termina |
| Retos | 10 seguidos |
| Puntos | **×2** |
| Acceso | Preuniversitaria: 12 retos de Secundaria · Universitaria: 10 de la preuniversitaria |

> [!important] El bloqueo se comprueba dos veces
> No basta con deshabilitar el botón: `nuevaPartida()` vuelve a comprobar el
> bloqueo antes de consumir la tirada. Un botón deshabilitado en el DOM se
> reactiva desde la consola en dos segundos.

Cada expedición tiene su **antesala** — sello, lema y las cuatro reglas — antes
de gastar la tirada, para que nadie entre sin saber qué arriesga. Superarla
entera deja un sello permanente en la tarjeta del menú.

---

## 1 bis. La Arena, dentro de la ruta pedagógica

Hasta el 2026-09-10 la Arena era un juego **al lado** de la ruta de 9 pasos, no
dentro de ella: un estudiante podía jugar treinta retos sin saber qué parte de su
propia indagación estaba practicando.

### Cómo se alinea

Cada reto ya llevaba una **ambientación** (`tema`) que clasificaba su
contenido, así que la alineación se hace por ahí y **no reto a reto**:

| Fase de la ruta | Temas | Por qué |
|---|---|---|
| **Indaga** · pasos 1–3 | `invernadero` · `abismo` | La planta y el agua son los dos objetos que hay que conocer antes de poder preguntar nada |
| **Experimenta** · pasos 4–6 | `pociones` · `datos` | Preparar la solución y leer los propios datos es el trabajo experimental |
| **Transforma** · pasos 7–9 | `taller` · `tormenta` | Mejorar el módulo y actuar por el clima es llevar el resultado a una acción |

Reparto real de los 150 retos: **Indaga 58 · Experimenta 52 · Transforma 40**.
Ningún reto queda sin fase.

### Dónde se ve

- **Durante el reto**, junto al nombre de la ambientación: *Ruta CIEHS · Indaga*.
  Se oculta por debajo de 560 px, donde la cabecera ya va justa.
- **Al terminar la partida**, un recuento por fase: *Experimenta · 3 de 5*. No es
  decoración: es lo que convierte la partida en algo que el estudiante puede
  llevar a su bitácora —«trabajé Experimenta y fallé la mitad»— en vez de un
  número suelto.

> [!important] Es una tabla de seis líneas, no un campo en 150 retos
> Deliberado. Si el equipo docente decide que `abismo` pertenece a
> *Experimenta* y no a *Indaga*, se cambia `FASE_POR_TEMA` en un sitio y no en
> ciento cincuenta.

> [!caution] Llega hasta la fase, no hasta el paso
> Decir cuál de las **tres fases** practica un reto se sostiene con lo que el
> proyecto ya tenía clasificado. Decir cuál de los **nueve pasos** sería
> inventar programación: eso lo decide el equipo de área, y se recoge en
> [[pendientes-coordinacion/04-validacion-cneb|04 · Validación CNEB]] junto con
> el resto de la correspondencia.

---

## 1 ter. Todos los retos tienen voz (2026-09-10)

Antes solo sonaban los de tipo `escucha`, donde el audio **es** el enunciado.
Los demás se leían únicamente si el estudiante ya había activado la voz en el
portal — y dentro de la Arena no había forma de pedirla. Un reto escrito se
quedaba mudo para quien lo necesitaba.

Ahora **cada reto lleva su botón «Escuchar la pregunta»**, y se lee el enunciado
con sus opciones numeradas: *«Opción 1… Opción 2…»*.

### Dos caminos, y por qué no uno solo

| Camino | Cuándo suena |
|---|---|
| **Automático** | Solo si el estudiante ya activó la voz en el portal |
| **A petición**, con el botón | **Siempre**, aunque la voz global esté apagada |

No se puso a sonar automáticamente para todos, y es deliberado por dos razones:
arrancar audio sin que nadie lo haya pedido es intrusivo en un aula con treinta
estudiantes, y además **los navegadores bloquean la reproducción automática**
hasta que hay una interacción — así que «que suene siempre solo» ni siquiera es
técnicamente fiable.

Es la misma lógica del DUA que rige el resto del portal: más de una vía para
recibir lo mismo, y ninguna obligatoria.

> [!note] Comprobado
> Con el botón, la Arena emite cuatro locuciones encadenadas: el enunciado y
> cada una de las opciones. Verificado sobre un reto de Secundaria.

---

## 2. Seis formatos de reto

`opcion` · `vf` · `escucha` · `orden` · `dial` · `escribe`

- **escucha** — el enunciado **no aparece escrito**: se lee en voz alta.
- **dial** — se ajusta un valor numérico (pH, CE, volumen, porcentaje).
- **orden** — arrastrar, **más flechas**: en móvil arrastrar es poco fiable y
  con teclado es directamente inaccesible.

---

## 3. Contramedidas frente a resolverlo desde fuera

- Cronómetro por reto: **30 s** fácil, **22 s** media, **16 s** difícil, con
  8 s extra en los de escucha y el multiplicador de nivel.
- En los retos de escucha no hay texto que copiar.
- `dial` y `orden` no se resuelven pegando una respuesta: hay que manipular.
- Selección, copiado y menú contextual desactivados dentro de la arena.
- Salir de la pestaña con el cronómetro corriendo **congela el reto** y lo marca
  como consultado; el recuento aparece al final de la partida.

> [!warning] Esto es fricción, no seguridad
> Está escrito así en el propio código. Ninguna de estas medidas es infalible.
> **Un examen calificado no debería apoyarse solo en ellas.** Es la misma
> distinción que se aplicó al PIN en [[CIEHS-Auditoria-Seguridad-Auth]].

---

## 4. Ambientaciones

Ocho fondos generativos en canvas. **No hay ni una imagen ni un archivo de audio
que descargar**: los fondos se dibujan por código y los sonidos son tonos
sintetizados con Web Audio. En un laboratorio con mala conexión, eso importa.

| Tema | Qué se ve |
|---|---|
| `pociones` | Viales de colores con burbujas y volutas de vapor |
| `abismo` | Columna de burbujas y ondas, como dentro del depósito |
| `invernadero` | Hojas cayendo y raíces que laten desde el borde |
| `tormenta` | Nubes, lluvia oblicua y algún relámpago |
| `datos` | Rejilla, barras que respiran y puntos recorriendo ejes |
| `taller` | Pistas de circuito con pulsos |
| `umbral` *(expedición)* | Haces de luz volumétrica, polvo en suspensión y anillo latiendo |
| `santuario` *(expedición)* | Constelación de nodos que se enlazan al acercarse |

Los dos últimos son exclusivos de las expediciones y deliberadamente **más
lentos y sobrios**: ahí manda la luz, no el confeti.

---

## 5. Movimiento

### Base
Fundido entre ambientaciones · acento interpolado con `@property` · entrada
escalonada de opciones y tarjetas · chispas al acertar · contadores que suben
en lugar de saltar · brillo recorriendo el cronómetro.

### Relieve e iluminación
El panel **se comporta como un objeto físico**: se inclina siguiendo al cursor,
recibe una luz especular que nace bajo el puntero, y sus hijos se separan del
plano con `translateZ` — el enunciado flota por delante de las opciones. En las
expediciones la inclinación es el doble.

**Viñeta de tensión:** se cierra y enrojece según se agota el cronómetro. Es
información periférica, no adorno: se ve por el rabillo del ojo.

### Detonación al fallar
Onda de choque expansiva · esquirlas con rotación propia · sacudida de toda la
escena · destello rojo · el panel se hunde en el eje Z como si encajara el golpe
· golpe grave sintetizado.

> [!tip] Trampa de CSS que costó encontrar
> Las animaciones de entrada usaban `animation-fill-mode: both`. El último
> fotograma fija `transform:none` y, como las animaciones tienen más prioridad
> que las declaraciones normales, **anulaba tanto el tilt 3D como los `:hover`**.
> La corrección es `backwards`: aplica el estado inicial durante el retardo y
> suelta el control al terminar.

### Lo que se retiró por genérico
El barrido de luz diagonal al pasar el cursor por una opción —el efecto de botón
más visto de la web— se sustituyó por una luz radial que nace donde está el
cursor: reacciona a dónde miras, no a un temporizador.

Los **emojis desaparecieron por completo** del motor. Cambian de dibujo en cada
sistema operativo y en las expediciones desentonaban. Ahora son marcas
vectoriales propias: brote, lente, matraz, umbral, corona y sello.

Todo el movimiento se apaga entero bajo `prefers-reduced-motion`.

---

## 6. La voz

Los retos de escucha usan la síntesis del navegador. Dos problemas resueltos:

**Sonaba robótica.** Se buscaba la primera voz en español disponible, que en
muchos equipos es masculina y plana. Ahora se recorre una lista de voces
femeninas conocidas por naturalidad, se descartan las de nombre masculino y se
prefieren las variantes latinoamericanas, más suaves que `es-ES`. Tono **1.25**
y velocidad **0.9**.

> [!bug] La voz enmudecía al salir y volver a entrar
> Dos causas conocidas del motor de síntesis, ambas silenciosas:
> 1. `cancel()` puede dejar el motor **en estado pausado**.
> 2. Llamar a `speak()` **en el mismo turno** que `cancel()` hace que la frase se
>    descarte sin aviso.
>
> Se corrige llamando a `resume()` y dejando pasar un tick antes de hablar, y
> cancelando + reanudando al cerrar la arena. Verificado con el ciclo completo
> entrar → jugar → salir → volver a entrar.

---

## 7. Archivos

| Archivo | Contenido |
|---|---|
| `assets/js/ciehs-arena.js` | Motor: niveles, expediciones, formatos, ambientaciones, animación, voz |
| `assets/js/ciehs-arena-preguntas.js` | Banco de 150 retos |
| `index.html` | Capa `#arenaCapa`, CSS de la arena y tarjeta de acceso |

El banco admite retos nuevos **sin tocar el motor**: basta añadir objetos al
array del nivel con `id`, `tema`, `tipo`, `dif`, `q`, los datos del formato y `exp`.

Progreso del jugador en `localStorage`, clave `ciehs_arena_v1`: récords,
retos resueltos, tiradas del día y sellos. Declarado en [[CIEHS-Privacidad-Menores]].
Los valores se **normalizan al cargar**: acaban insertados en HTML y el
contenido de `localStorage` lo controla quien usa el navegador.

---

## 8. Pendientes

- [x] Alinear los retos con la ruta pedagógica. Hecho el 2026-09-10 **hasta la
      fase** → §1 bis; el detalle paso a paso queda para la validación docente.
- [ ] Ampliar el banco por encima de 150 retos si el uso lo pide.
- [ ] Marcador entre clases: hoy el récord es solo local del navegador.
      Requeriría una tabla en [[CIEHS-Backend-Supabase]] y decidir antes qué se
      publica de cada estudiante.
- [ ] Modo docente: elegir qué temas entran en la ronda.
- [ ] Revisar la selección de voz en los equipos reales del laboratorio: la lista
      de voces disponibles cambia con el sistema operativo.

---

## Enlaces

- [[CIEHS]] — índice general.
- [[CIEHS-Portal-Educativo]] — el portal en el que vive la arena.
- [[CIEHS-Metodologia-Pedagogica]] — de dónde sale el contenido de los retos.
- [[CIEHS-Auditoria-Seguridad-Auth]] — la distinción entre fricción y seguridad.
- [[CIEHS-Privacidad-Menores]] — qué guarda el juego en el navegador.
- [[CIEHS-Identidad-Visual]] — la arena tiene paleta propia, distinta del portal.
