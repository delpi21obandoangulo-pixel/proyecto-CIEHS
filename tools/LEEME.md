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

## `fijar-clave-admin.js`

Fija la contraseña de la cuenta de administración del CIEHS por la **API de
GoTrue** (`auth.admin.updateUserById`), y comprueba después que sirve para
entrar de verdad.

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="<service_role de kumxtheybmqbfixatnok>"
$env:CIEHS_ADMIN_PASSWORD="<la contraseña nueva>"
node tools/fijar-clave-admin.js
Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY, Env:CIEHS_ADMIN_PASSWORD
```

Las dos variables van por **entorno y no por argumento**: un argumento queda en
el historial del terminal.

El script no se limita a fijar la contraseña. Después inicia sesión con la clave
publicable —el mismo camino exacto que recorre el modal— y comprueba
`is_admin()`. Dar por buena una contraseña sin comprobar que abre la puerta es
dar por hecho justo lo que hay que demostrar.

> Antes de tocar nada verifica que el UUID corresponde al correo esperado. Si no
> coincide, aborta sin escribir.
