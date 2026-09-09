---
title: CIEHS · Voz y Diseño Universal para el Aprendizaje
aliases: [DUA CIEHS, Voz CIEHS, Audio CIEHS]
tags: [ciehs, dua, accesibilidad, voz, cneb]
estado: en produccion · voz del navegador
actualizado: 2026-09-09
---

# CIEHS · Voz y DUA

Cómo suena el portal y por qué. Parte de [[CIEHS]]; el juego al que sirve está
en [[CIEHS-Arena-Juego]].

> [!abstract] En una línea
> Todo lo que hay que **leer** para jugar se puede **escuchar**: la pregunta,
> las opciones y la explicación. Es el principio del DUA que exige el CNEB —
> el mismo contenido por más de una vía— llevado al sitio donde más pesa.

---

## 1. Qué se lee en voz alta

| Momento | Qué dice |
|---|---|
| Altavoz junto a la pregunta | El enunciado y **las opciones numeradas** |
| Al responder | «Correcto» o «No es esa», y la explicación |

Las opciones se numeran («Opción 1…, Opción 2…») porque oídas seguidas, sin
numerar, no hay forma de saber cuál es cuál.

Al responder **no se lee el «✓» ni la «✗»**: un lector de pantalla diría «marca
de verificación», que no explica nada. El acierto se dice con palabras.

---

## 2. Tres decisiones que cambian cómo suena

### Acento latinoamericano antes que castellano

La elección de voz prioriza `es-US`, `es-MX`, `es-419` y `es-PE` **por encima de
`es-ES`**. El castellano de España cecea, y a un estudiante de Huanchaco eso le
suena a una persona de fuera leyendo su examen.

En un Windows típico la voz elegida acaba siendo **«Google español de Estados
Unidos» (es-US)**: de mujer y latinoamericana.

### Voz de mujer, buscada por nombre

La API **no expone el género**. Se busca por nombre entre las conocidas —Sabina,
Paulina, Laura, Helena, Mónica…— y se puntúa. Si ninguna coincide, se prefiere
cualquier voz en español antes que una en inglés.

### Frase a frase, no de un tirón

Un párrafo leído sin pausas suena a máquina. Además **Chrome corta la locución a
los ~15 segundos**. Partir por frases resuelve las dos cosas de golpe.

Velocidad `0.95` y tono `1.08`: algo más lenta y algo más aguda es lo que separa
«lectura de robot» de «alguien explicando». Subir más el tono la vuelve chillona.

> [!warning] El divisor de frases NO usa *lookbehind*
> `(?<=...)` es un **error de sintaxis** en Safari anterior a la 16.4, y un
> error de sintaxis no rompe solo la voz: impide que se evalúe
> `ciehs-app.js` entero y tumba el portal completo en los iPad viejos de un
> colegio. Se parte con un bucle, que además respeta los decimales: «El pH es
> 6.5.» no se corta por la mitad.

---

## 3. Límites honestos de la voz del navegador

- **Suena a sintetizador.** Es correcta y se entiende, pero no es una voz
  humana. Para subir de nivel hay que pregrabar → §4.
- **La primera locución necesita un clic de la persona.** Los navegadores
  bloquean el audio que no nace de un gesto; por eso el botón habla al
  activarse.
- **«Google español» necesita conexión.** Sin red, el navegador cae a las voces
  locales del sistema, que suenan peor pero funcionan.
- **Cada equipo tiene voces distintas.** Lo que se oye en la tablet del
  laboratorio puede no ser lo que se oye en el móvil de casa.

---

## 4. Subir a una voz de gama alta

El portal **ya está preparado**: antes de sintetizar busca un archivo
`voz/<clave>.mp3` en el bucket `ciehs-aportes`. Si existe, reproduce ese. No
hace falta tocar el código.

> [!danger] Nunca poner una clave de API en el navegador
> El repositorio es **público** y el JavaScript del portal se descarga entero.
> Una clave de ElevenLabs o de Google en `assets/js/` queda expuesta a
> cualquiera, y se factura a quien la puso. Por eso la vía es **pregrabar**, no
> llamar al servicio en vivo.

Pregrabar tiene además tres ventajas sobre llamar en vivo: se paga una vez y no
por reproducción, funciona sin conexión una vez cacheado, y la calidad es la
máxima posible porque no hay prisa de tiempo real.

El paso a paso está en [[CIEHS-Portal-Educativo]] y en el propio panel.

---

## 5. Pendientes

- [ ] Pregrabar el banco de preguntas con voz de gama alta.
- [ ] Audio también en la Arena, que hoy solo tiene el quiz.
- [ ] Subtítulos en los vídeos que suban los equipos.

---

## Enlaces

- [[CIEHS]] — índice general.
- [[CIEHS-Arena-Juego]] — el juego al que sirve la voz.
- [[CIEHS-Metodologia-Pedagogica]] — articulación con el CNEB.
- [[CIEHS-Portal-Educativo]] — cómo está construido el portal.
