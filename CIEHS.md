---
title: CIEHS · Índice
aliases: [CIEHS, Índice CIEHS, MOC CIEHS]
tags: [ciehs, moc, indice]
institucion: I.E. N.° 80033 “José Olaya Balandra” — Huanchaco, La Libertad, Perú
produccion: https://ciehs.vercel.app
estado: en produccion
actualizado: 2026-09-04
---

# CIEHS · Índice

Nodo central de la documentación del **Centro de Investigación Escolar
Hidropónico Sostenible**. Cada nota de abajo es autónoma; esta solo dice dónde
está cada cosa.

> [!abstract] En una línea
> Portal del laboratorio de hidroponía escolar de la I.E. N.° 80033 “José Olaya
> Balandra”, en Huanchaco. Doce secciones más privacidad, datos servidos desde
> Supabase y códigos QR que unen el laboratorio físico con el digital.
> **Lema:** «Cultivamos Ciencia, Cosechamos Futuro».

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

---

## Estado actual

| Área | Estado |
|---|---|
| Alojamiento | Vercel, proyecto propio, cabeceras de seguridad activas |
| Enrutado | 13 rutas con URL propia, historial y enlaces compartibles |
| Códigos QR | 9 reales, verificados con un lector independiente |
| Base de datos | Esquema `ciehs` conectado, 7 tablas, RLS probado por rol |
| Panel | Supabase Auth + comprobación de administrador |
| Identidad | Escudo institucional oficial en uso |
| Privacidad | Página publicada, **pendiente de aprobación por dirección** |
| Arena | 5 niveles, 150 retos, 2 expediciones diarias |

---

## Lo que falta, por orden de importancia

1. **Aprobar el protocolo de imagen** antes de publicar la primera fotografía de
   un estudiante → [[CIEHS-Privacidad-Menores]]
2. **Equipos reales** en lugar de los seis nombres ficticios.
3. **Fotografías del laboratorio** y de los cuatro módulos.
4. **Archivos descargables** para docentes: los filtros funcionan, no hay PDF.
5. **Interfaz de edición** de investigaciones y recursos en el panel.
6. **Marcador entre clases** de la Arena: hoy el récord es solo local → [[CIEHS-Arena-Juego]]
7. **Despliegue automático** desde GitHub.
8. Resolver la contradicción de licencia (MIT vs. «todos los derechos
   reservados») → [[CIEHS-Auditoria-Seguridad-Auth]]

---

## Referencia rápida

- **Producción:** https://ciehs.vercel.app
- **Módulos:** `MOD-NFT-01` (NFT) · `MOD-DWC-02` (Raíz Flotante) ·
  `MOD-SUS-03` (Sustrato) · `MOD-VER-04` (Vertical)
- **Investigaciones:** `INV-2026-01` (concentración de solución nutritiva en
  lechuga) · `INV-2026-02` (bioestimulante de lenteja en enraizamiento)
- **Cifras:** 120 estudiantes 3.°–5.° · 6 equipos · 4 módulos · 20 kg de cosecha
  acumulada · 90 % de ahorro hídrico
- **Contacto:** ciehs.olaya@gmail.com · Área de Ciencia y Tecnología (CyT)
