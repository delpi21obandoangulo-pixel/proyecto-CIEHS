---
title: CIEHS · Índice
aliases: [CIEHS, Índice CIEHS, MOC CIEHS]
tags: [ciehs, moc, indice]
institucion: I.E. N.° 80033 “José Olaya Balandra” — Huanchaco, La Libertad, Perú
produccion: https://ciehs.vercel.app
estado: en produccion
actualizado: 2026-09-09
---

# CIEHS · Índice

Nodo central de la documentación del **Centro de Investigación Escolar
Hidropónico Sostenible**. Cada nota de abajo es autónoma; esta solo dice dónde
está cada cosa.

> [!abstract] En una línea
> Portal del laboratorio de hidroponía escolar de la I.E. N.° 80033 “José Olaya
> Balandra”, en Huanchaco. **280 estudiantes de 1.° a 5.° de secundaria**, diez
> equipos de gestión y **quince módulos de raíz flotante (DWC)** que hoy operan
> **sin bomba de aire**. Trece secciones más privacidad, datos servidos desde
> Supabase y códigos QR que unen el laboratorio físico con el digital.
> **Lema:** «Cultivamos Ciencia, Cosechamos Futuro».
> **Enfoque rector:** Habilidades de Pensamiento de Orden Superior (HPOS).

---

## Mapa de notas

| Nota | Qué responde |
|---|---|
| [[CIEHS-Portal-Educativo]] | Cómo está construido: rutas, QR, alojamiento, cacheo, mejora progresiva |
| [[CIEHS-Backend-Supabase]] | Dónde viven los datos: esquema `ciehs`, tablas, RLS, capa de datos |
| [[CIEHS-Auditoria-Seguridad-Auth]] | Qué se rompió, qué se arregló y qué sigue abierto |
| [[CIEHS-Metodologia-Pedagogica]] | Ruta de 9 pasos y articulación con el CNEB |
| [[CIEHS-Identidad-Visual]] | Escudo, sello, mural, paleta e iconos |
| [[CIEHS-Privacidad-Menores]] | Qué se publica de los estudiantes y qué nunca |
| [[CIEHS-Arena-Juego]] | El modo de juego: niveles, expediciones, animación y voz |
| [[CIEHS-Voz-DUA]] | Voz, simuladores PhET y Diseño Universal del Aprendizaje |
| [[CIEHS-Tienda-Escolar]] | Catálogo, reservas de cosecha y transparencia en porcentaje |
| [[CIEHS-Pentest-2026-09]] | Auto-evaluación de ciberseguridad: 14 ataques, resultado |

---

## Estado actual

| Área | Estado |
|---|---|
| Alojamiento | Vercel, proyecto propio, cabeceras de seguridad activas |
| Despliegue | Manual y directo (`vercel --prod`). **Automático por push pendiente**: falta instalar la GitHub App → [[CIEHS-Portal-Educativo]] §4 |
| Repositorio | `proyecto-CIEHS` en GitHub, **público**, sincronizado con producción |
| Enrutado | 14 rutas con URL propia, agrupadas en **4 familias** tras un menú de tres rayas |
| Códigos QR | 9 reales, verificados con un lector independiente |
| Base de datos | Esquema `ciehs` conectado, **18 tablas**, RLS probado por rol · 2 buckets |
| Panel | Supabase Auth + comprobación de administrador · **12 pestañas** |
| Identidad | Escudo institucional + **logo propio del CIEHS** derivado del mural · blanco por capas |
| Portada | Hero con **fondo animado de brisa** + galería «El CIEHS en acción», administrable desde el panel |
| Infraestructura | **15 módulos DWC activos sin bomba de aire**; NFT y vertical solo como proyección |
| Privacidad | **Rostros tapados en origen**: toda imagen se pixela en el navegador antes de subirse |
| Seguridad | CSP sin `unsafe-inline` (scripts ni estilos) · pentest sin hallazgos explotables en el CIEHS |
| Investigación | Carpeta de campo digital, aportes en cuarentena y **resultados por tratamiento con gráfica automática** |
| Tienda | **6 especies publicadas** con estado de lote · carrito, reserva y transparencia en porcentaje · respaldo estático sin conexión |
| Arena | 5 niveles, 150 retos, 2 expediciones diarias |
| DUA | Voz en **todos** los juegos · 4 simuladores PhET en español · los tres principios documentados |

---

## Lo que falta, por orden de importancia

1. **Subir las quince fotografías con estudiantes** desde el panel, tapando
   las caras con el editor. Están clasificadas y sin metadatos
   → [[CIEHS-Privacidad-Menores]]
2. **Archivos descargables**: la carpeta de campo y el espacio docente ya tienen
   panel de carga; faltan los archivos reales (empezando por el audio-cuento
   «El viaje de una gota de agua»).
3. **Primeras entradas de la carpeta de campo** y de la bitácora agronómica
   (los seis lotes existen, sin fechas ni mediciones todavía).
4. **Bombas de aire** para los quince módulos: primera mejora planificada.
5. **Marcador entre clases** de la Arena: hoy el récord es solo local → [[CIEHS-Arena-Juego]]
6. **Despliegue automático** desde GitHub: solo falta instalar la Vercel GitHub
   App desde el navegador; el resto ya está configurado → [[CIEHS-Portal-Educativo]]
7. Resolver la contradicción de licencia (MIT vs. «todos los derechos
   reservados») → [[CIEHS-Auditoria-Seguridad-Auth]]

---

## Referencia rápida

- **Producción:** https://ciehs.vercel.app
- **Módulos:** `MOD-DWC-01` … `MOD-DWC-15`, todos raíz flotante y **sin bomba de
  aire**. El 15 es almácigo y rotación. `PROY-NFT` y `PROY-VER` son proyecciones
  a futuro, no infraestructura instalada.
- **Especies:** lechuga crespa · lechuga americana · espinaca · cebolla china ·
  albahaca · acelga
- **Equipos de gestión (10):** Indagación · Cultivo y manejo hidropónico ·
  Monitoreo y registro · Cosecha y acondicionamiento · Producción y comunicación ·
  Ventas y atención · Tesorería y registro de ventas · Inventario ·
  Impacto ambiental · Coordinación
- **Investigaciones:** `INV-2026-01` (concentración de solución nutritiva en
  lechuga) · `INV-2026-02` (bioestimulante de lenteja en enraizamiento)
- **Cifras:** 280 estudiantes 1.°–5.° de secundaria · 10 equipos · 15 módulos DWC ·
  20 kg de cosecha acumulada · 90 % de ahorro hídrico
- **Horario:** lunes a viernes, 1:00 p. m. – 6:00 p. m.
- **Contacto:** ciehs.olaya@gmail.com · Área de Ciencia y Tecnología (CyT)
