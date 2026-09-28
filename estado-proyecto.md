# Estado del proyecto — CIEHS

> Documentación principal: `README.md`, `CIEHS.md` y las notas `CIEHS-*.md` de esta carpeta (espejo en Obsidian: `kunturmasha/ciehs`).
> Este archivo existe para la bitácora de sesiones (regla 6 de `~/.claude/CLAUDE.md`).

## Bitácora de sesiones
- **2026-09-28** — Rendimiento (excepción de aislamiento 1.7 autorizada con doble PIN desde la sesión del Panel de Webs; solo front-end, 0 filas de BD tocadas). Diagnóstico PageSpeed móvil 54 (Lighthouse local 37): LCP 10,4 s por la foto de fondo de la portada y hojas/fuentes que bloqueaban el pintado. Cambios: foto del hero en WebP 600/900 px (`invernadero-dwc-600|900.webp`, el JPG queda de respaldo) con `preload` y `fetchpriority=high`; fuentes de Google inyectadas desde `arranque.js` (ya no bloquean; `<noscript>` de respaldo); todos los scripts del final con `defer` (mismo orden); `aria-label` en el botón del menú; contraste del copyright; `sw.js` v23 con la nueva foto en precarga. Probado en local: arranque «listo», rutas y fuentes OK, sin errores.
