# tools/

## `limpiar-metadatos-jpeg.js`

Inspecciona y limpia JPEG **sin dependencias** (solo Node). Cubre el pendiente
«retirar metadatos de las fotografías antes de subirlas» de
`CIEHS-Privacidad-Menores.md`.

```bash
# Ver dimensiones y si trae EXIF o GPS
node tools/limpiar-metadatos-jpeg.js ver  "ruta/foto.jpeg"

# Escribir una copia sin metadatos
node tools/limpiar-metadatos-jpeg.js limpiar "ruta/foto.jpeg" assets/img/evidencias/nombre.jpg
```

Descarta todos los segmentos `APP1`–`APP15` y los de comentario, que es donde
viven Exif, GPS, XMP y el perfil ICC del dispositivo. No recomprime: la imagen
sale idéntica, solo sin cabeceras.

> Una foto de móvil puede llevar las coordenadas del laboratorio y, si se tomó
> en casa, del domicilio de un estudiante. WhatsApp ya las retira al reenviar,
> pero eso no se da por supuesto: se comprueba con `ver` y se limpia igual.

**No basta con esto para publicar.** Antes va la clasificación por rostro: si
se distingue la cara de un menor, la fotografía no entra hasta que la dirección
apruebe el protocolo de imagen.

## `guion-voz.js`

Genera el guion de locución del banco de preguntas, para pregrabar la voz con
un servicio de gama alta (ver `CIEHS-Voz-DUA.md`).

```bash
node tools/guion-voz.js          # guion-voz.md  — para leer y grabar
node tools/guion-voz.js --csv    # guion-voz.csv — para pegar en lote
node tools/guion-voz.js --json   # guion-voz.json
```

Produce **exactamente** el texto que el portal pronuncia, incluido el orden de
las opciones. No hay una segunda copia del texto: si el banco cambia, se vuelve
a ejecutar.

> El orden de las opciones lo decide `CIEHS_ORDEN_OPCIONES`, que vive en
> `assets/js/ciehs-preguntas.js` y usan tanto el portal como este generador. Si
> alguna vez se separan, el audio nombrará la opción equivocada.
