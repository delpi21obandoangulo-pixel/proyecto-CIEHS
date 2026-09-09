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
