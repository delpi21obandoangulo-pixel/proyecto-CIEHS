---
title: CIEHS · Plan de rediseño por etapas
tags: [ciehs, diseno, plan, investigaciones]
actualizado: 2026-09-29
---

# Plan de rediseño del CIEHS

## 1. Qué estamos construyendo

El CIEHS **no es una web institucional**, aunque lo parezca. Es un
**laboratorio escolar de ciencia abierta**: 280 estudiantes hacen preguntas,
diseñan experimentos en 15 módulos reales, miden, suben evidencias y publican
resultados que cualquiera puede ver.

Tiene cuatro públicos y cada uno viene a una cosa:

| Quién | A qué viene | Lo que necesita |
|---|---|---|
| **Estudiante** | Registrar lo que midió, subir su foto o informe, jugar | Un solo botón «Aportar» que no le haga pensar |
| **Docente** | Recursos, rúbricas, revisar y aprobar aportes | Encontrar rápido y moderar sin fricción |
| **Jurado / visitante** (Eureka 2026) | Entender el proyecto y comprobar que los datos son reales | Una historia clara y datos verificables |
| **Comunidad** | Comprar cosecha, ver en qué se gasta el dinero | Tienda y transparencia sin rodeos |

## 2. Los mejores referentes y lo que tomamos de cada uno

| Referente | Qué hace mejor que nadie | Qué nos llevamos |
|---|---|---|
| **iNaturalist** | Subir una observación: un botón, arrastrar la foto, la comunidad verifica | El flujo de «Aportar» en un asistente de 4 pasos, con estado *En revisión → Publicado* |
| **OSF (Open Science Framework) / protocols.io** | Cada proyecto con su página: resumen, diseño, datos, archivos, registro | Página propia por investigación con pestañas |
| **GLOBE Program (NASA)** | Escolares de todo el mundo registrando mediciones que se grafican solas | La medición como dato estructurado que se ve en un gráfico al momento |
| **Our World in Data** | Gráficos claros, con fuente y descargables | El estilo de los gráficos de la sección Datos |
| **Linear / Vercel / Stripe** | Navegación impecable, buscador ⌘K, menús que se transforman, microinteracciones | Cabecera, mega-menú, paleta de comandos y sistema de movimiento |
| **Duolingo / Khan Academy** | Progreso visible y motivación sin infantilizar | La Arena y el Pasaporte |
| **Apple Education / Patagonia** | Contar con fotografía real y buen ritmo tipográfico | La portada como historia: del problema (salinidad) a la solución |

**Lo que haremos mejor que ellos:** ninguno junta las cuatro cosas —
investigación verificable, aprendizaje, comunidad y transparencia— en un solo
sitio pensado para un colegio público con conexión intermitente, móvil primero y
con protección de menores desde el diseño (caras pixeladas en el dispositivo,
solo inicial del apellido).

## 3. Diagnóstico del estado actual

- **Fondo:** una foto de lechugas desenfocada detrás de todo; cada tarjeta es un
  vidrio semitransparente encima. El resultado es un verde lechoso que lo
  empasta todo y hace que nada destaque.
- **Tipografía:** cinco familias (Space Grotesk, Inter, Cinzel, Instrument Serif,
  JetBrains Mono) y antetítulos en mayúsculas espaciadas con monoespaciada: es
  lo que da el aire «años 80».
- **Navegación:** un cajón lateral con 14 botones de texto; al navegar por URL
  se queda abierto; no hay búsqueda.
- **Investigaciones:** en una sola página larga hay **cinco** formas de añadir
  cosas (nueva investigación, resultados, formulario de resultado, entrada de
  campo, aportes con 5 iconos). Nadie sabe cuál usar.
- **Animaciones:** todas iguales (aparece-y-sube) y lentas; bloques blancos
  mientras se revelan.

## 4. Plan por etapas

### Fase 1 · Cimientos: sistema de diseño, navegación y movimiento ✅ (2026-09-29)
1. **Sistema de diseño v2** (`assets/css/ciehs-v2.css`): paleta «invernadero»
   (papel cálido, tinta verde muy oscura, esmeralda, agua, sol), dos familias
   tipográficas (Geist + Instrument Serif para acentos, Geist Mono para códigos),
   escala tipográfica fluida, espaciado, radios, sombras y curvas de movimiento.
2. **Fondo limpio y vivo:** fuera la foto desenfocada. Papel claro con aurora
   que se mueve lentamente y reacciona al cursor, más grano fino.
3. **Cabecera nueva** (`assets/js/ciehs-nav.js`): las cuatro familias visibles
   en escritorio, cada una con un **mega-menú** que se transforma de una a otra
   (estilo Stripe), iconos y descripciones. En móvil, una hoja a pantalla
   completa con entrada escalonada. Se cierra siempre al cambiar de página.
4. **Buscador ⌘K:** busca secciones, títulos dentro de cada sección y acciones
   («Subir un aporte», «Añadir una medición», «Hacer un pedido»…).
5. **Sistema de movimiento:** transición entre páginas, entradas escalonadas con
   desenfoque, botones con rebote elástico y brillo que sigue al cursor,
   `prefers-reduced-motion` respetado.
6. **Aviso de bienvenida:** de franja amarilla a una notificación flotante que
   se recuerda al cerrarla.

### Fase 2 · Investigaciones como proyectos de ciencia abierta ✅ (2026-09-29)
> Hecho en el front, sin tocar la base. Pendiente para la fase 5: columna
> `investigation_code` en `ciehs.aportes` (hoy el vínculo va como prefijo
> `[INV-…]` en la descripción) y bandeja única de moderación docente.
- Listado de investigaciones con tarjetas limpias: estado, avance, nº de
  mediciones y evidencias, último dato.
- **Página por investigación** con pestañas: *Resumen · Diseño experimental ·
  Datos · Evidencias · Bitácora*.
- **Un único botón «Aportar»** (siempre visible) que abre un asistente:
  1. ¿Qué traes? — *Medición · Foto o vídeo · Documento · Nota de bitácora*
  2. ¿De qué investigación y módulo?
  3. El contenido — arrastrar y soltar con vista previa y pixelado de caras
  4. Quién firma y revisión final → «Enviado: lo revisa tu docente»
- «Mis aportes»: el estudiante ve si su envío está en revisión o publicado.
- Moderación docente en una bandeja única en lugar de tres paneles.

### Fase 3 · Portada y narrativa ✅ (2026-09-29)
> Hecho: burbujas vivas en el hero (canvas, reaccionan al cursor), botones
> «Ver las investigaciones» y «Aportar mi trabajo», relato con scroll en 4
> pasos con visual fijo (suelo salino → raíz flotante → agua usada → 280
> puntos = 280 estudiantes) y «Por dónde empezar». Pendiente: cifras vivas
> dentro del relato (hoy son las del README).
- Hero nuevo con fondo generativo de agua y raíces (canvas/WebGL, con respaldo).
- Relato con scroll: *el problema (salinidad y agua) → la solución (DWC) → los
  datos → la gente*.
- Cifras vivas desde la base de datos y galería con fotografía a pantalla.

### Fase 4 · Resto de secciones ✅ en parte (2026-09-29)
> Hecho: plano interactivo del invernadero con filtro por cultivo y ficha
> (rango de pH y CE, «Registrar pH o CE»), descarga de módulos y resultados
> en CSV, y la misma gramática visual (tarjetas, pestañas, filtros, tablas,
> Arena) en todo el portal; la monoespaciada queda solo para códigos.
> Pendiente: gráficos nuevos de Datos al estilo OWID y rediseño a fondo de
> Docentes, Comunidad/Tienda, Equipos y Mural.
- **Módulos:** plano interactivo del invernadero con los 15 módulos.
- **Datos:** gráficos al estilo Our World in Data, con fuente y descarga CSV.
- **Juega, Docentes, Comunidad/Tienda, Equipos, Mural:** misma gramática visual.

### Fase 5 · Ingeniería y rendimiento 🟡 empezada (2026-09-29)
> Hecho: 18 pruebas automáticas con Playwright (`npm test`, escritorio y
> móvil, sin tocar la base), mural y galería en WebP con `srcset` (el mural
> pasa de 708 KB a 156–328 KB), README al día. Pendiente: todo lo de abajo.
- Pasar a módulos con Vite: partir `index.html` (4.155 líneas) y
  `ciehs-app.js` (6.101), una sola utilidad `esc()`, archivos con hash y caché
  larga.
- Supabase solo donde hace falta; imágenes restantes en WebP/AVIF.
- Pruebas automáticas (Playwright): rutas, filtro de HTML, subida de aportes.
- Meta: PageSpeed móvil ≥ 90, accesibilidad 100.

## 5. Reglas que no se rompen en ninguna fase
- Las 14 rutas `#/…` no cambian: hay códigos QR impresos que apuntan a ellas.
- Los atributos `data-edit` se conservan: son los textos editables del panel.
- CSP estricta: nada de estilos ni scripts en línea (estilos dinámicos por CSSOM).
- Protección de menores tal como está (pixelado local, inicial del apellido).
- Todo lo que se mueve respeta `prefers-reduced-motion`.
