<div align="center">

# 🌱 CIEHS
### Centro de Indagación Escolar Hidropónica y Sostenibilidad

**I.E. N.° 80033 "José Olaya Balandra"** · Huanchaco, La Libertad, Perú 🇵🇪

*"Cultivamos Ciencia, Cosechamos Futuro"*

[![ODS 13](https://img.shields.io/badge/ODS-13%20Acci%C3%B3n%20por%20el%20Clima-2E7D32?style=for-the-badge&logo=leaflet&logoColor=white)](https://www.un.org/sustainabledevelopment/es/climate-change/)
[![Eureka 2026](https://img.shields.io/badge/Eureka-2026-F59E0B?style=for-the-badge&logo=starship&logoColor=white)](#)
[![Estado del sitio](https://img.shields.io/website?url=https%3A%2F%2Fciehs.vercel.app&up_message=en%20l%C3%ADnea&down_message=fuera%20de%20l%C3%ADnea&style=for-the-badge&label=vercel)](https://ciehs.vercel.app)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)

**[🔗 Ver sitio en vivo](https://ciehs.vercel.app)**

</div>

---

## 📖 Resumen del proyecto

CIEHS es el portal educativo digital del laboratorio de hidroponía escolar de la **I.E. N.° 80033 "José Olaya Balandra"**, en el distrito costero de **Huanchaco**. El proyecto nace como respuesta a un problema científico concreto del territorio y se convierte en un espacio de indagación permanente para los tres niveles de la institución.

### 🌊 Contexto Huanchaco: la justificación científica

Huanchaco enfrenta dos limitantes agronómicas propias de la franja costera del norte peruano:

- **Salinidad de suelos** — la cercanía al litoral y el uso histórico de aguas subterráneas salinizan los sustratos tradicionales, restringiendo qué cultivos pueden desarrollarse en tierra.
- **Estrés hídrico costero** — la escasez y variabilidad de agua dulce, agravada por el cambio climático, exige sistemas de riego de alta eficiencia.

La **hidroponía escolar** responde directamente a ambas restricciones: al prescindir del suelo como sustrato y recircular la solución nutritiva, el sistema reduce el impacto de la salinidad y disminuye drásticamente el consumo de agua frente al cultivo tradicional. El CIEHS convierte esa respuesta técnica en una experiencia de aprendizaje situada, alineada con el **ODS 13 (Acción por el Clima)**.

### 🔬 Enfoque metodológico: indagación científica escolar

El portal organiza el trabajo pedagógico bajo el enfoque de **indagación científica**, adaptado a cada nivel:

| Nivel | Enfoque de indagación |
|---|---|
| **Inicial** | Exploración sensorial y observación guiada del ciclo de vida de las plantas. |
| **Primaria** | Formulación de preguntas, registro de datos y experimentación guiada. |
| **Secundaria** | Diseño experimental, control de variables y análisis de resultados con datos reales del laboratorio. |

---

## 🏗️ Arquitectura tecnológica y módulos

### Módulos reales de producción

El laboratorio hidropónico opera con **15 módulos** físicos, **todos de raíz flotante** (*Deep Water Culture*, DWC), cada uno documentado y trazado dentro del portal:

| Código | Sistema | Estado |
|---|---|---|
| `MOD-DWC-01` … `MOD-DWC-14` | Raíz flotante (*Deep Water Culture*) | Activos |
| `MOD-DWC-15` | Raíz flotante — almácigo y rotación de cultivos | Activo |
| `PROY-NFT` | Técnica de Película de Nutrientes (*Nutrient Film Technique*) | **Proyección a futuro — no instalado** |
| `PROY-VER` | Cultivo vertical en columnas | **Proyección a futuro — no instalado** |

> [!IMPORTANT]
> Los quince módulos **operan actualmente sin bomba de aire**: la oxigenación se
> consigue por difusión en la superficie y agitación manual en cada control. La
> aireación forzada está **planificada como mejora a futuro**, no disponible hoy.
> El portal lo declara explícitamente para que cualquier resultado publicado sea
> reproducible.

### 🥬 Especies cultivadas

Lechuga crespa · Lechuga americana · Espinaca · Cebolla china · Albahaca · Acelga.

### 👥 Comunidad y equipos

**280 estudiantes de 1.° a 5.° de secundaria**, organizados en **10 equipos de gestión**: Indagación · Cultivo y manejo hidropónico · Monitoreo y registro · Cosecha y acondicionamiento · Producción y comunicación · Ventas y atención · Tesorería y registro de ventas · Inventario · Impacto ambiental · Coordinación.

### 🧠 Enfoque pedagógico rector

**Habilidades de Pensamiento de Orden Superior (HPOS)** y competencias científicas del CNEB: el trabajo se diseña para que el estudiante **analice, evalúe y cree**, no para que recuerde. El cultivo es el fenómeno de estudio; el estudiante es el protagonista y el docente pregunta y acompaña.

### 🛠️ Herramientas del portal

- **📓 Carpeta de campo digital** — repositorio donde estudiantes y docentes publican artículos, informes científicos, fotografías y evidencias experimentales, con moderación docente previa.
- **🌱 Bitácora agronómica administrable** — fecha de siembra, semana en curso, pH, CE, fase y cosecha de cada lote, registrados desde el panel y publicados en la sección Trazabilidad.
- **🎓 Espacio docente y curricular** — recursos reproducibles en el aula (audio-cuento, guías de laboratorio, fichas, rúbricas) con carga desde el panel de administración y filtros por nivel, área y tipo.
- **🤝 Comunidad, pedidos y transparencia** — reservas de cosecha, caja de comentarios moderada y panel público de ingresos y egresos.
- **🧪 Simulador de cultivo** — modela el efecto del agua, el pH y la luz sobre un módulo de raíz flotante.
- **📱 Trazabilidad QR** — ocho estaciones QR reales, generadas en el navegador, con explicación ampliada de qué encontrará quien las escanee (mural, hidroponía, investigaciones, comunidad…). Descargables en SVG e imprimibles en hoja.
- **💧 Calculadora hídrica** — estima el consumo y ahorro de agua frente al cultivo convencional en suelo.
- **🎮 Pasaporte CIEHS** — banco de preguntas barajado en cada ronda que prioriza lo aún no acertado, con cuatro insignias que funcionan como mapa de comprensión, no como premio.
- **🔐 Panel CMS (administración)** — siete pestañas: portada, lecturas, investigaciones, bitácora, carpeta de campo, recursos y comunidad.
  > **Acceso:** solicitar las credenciales al coordinador del CIEHS. No se publican en este repositorio.
  >
  > ⚠️ **Limitación conocida.** El panel valida el acceso en el navegador y guarda en `localStorage`, así que
  > los cambios **solo son visibles en el equipo donde se editan** y el control de acceso no es una barrera
  > real. Ambas cosas se resuelven al conectar un backend con autenticación; hasta entonces, no debe tratarse
  > como un CMS publicado ni usarse para información sensible.

### Stack

```
HTML5  +  CSS3  +  JavaScript (vanilla)
Generación de códigos QR: qrcode-generator (MIT), servida desde el propio dominio
Persistencia local vía localStorage (panel CMS)
Despliegue estático en Vercel, con cabeceras de seguridad en vercel.json
```

---

## 🚀 Accesos y despliegue

### 🌐 Sitio en vivo

**[https://ciehs.vercel.app](https://ciehs.vercel.app)**

### 💻 Ejecutar en local

El proyecto es un sitio estático de una sola página — no requiere build ni dependencias.

```bash
# 1. Clonar el repositorio
git clone https://github.com/<tu-usuario>/<tu-repositorio>.git
cd proyecto-CIEHS

# 2. Abrir directamente en el navegador
#    (Windows)
start index.html
#    (macOS)
open index.html
#    (Linux)
xdg-open index.html
```

O sirviéndolo con un servidor local simple:

```bash
npx serve .
# ó
python -m http.server 8080
```

Luego visita `http://localhost:8080`.

### ☁️ Redesplegar en Vercel

El proyecto vive en su propio proyecto de Vercel, aislado de cualquier otro.

```bash
npm install -g vercel
vercel deploy --prod
```

Las cabeceras de seguridad (CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy` y `Permissions-Policy`) se definen en `vercel.json` y se aplican
en cada despliegue.

---

## 📄 Licencia

**Todos los derechos reservados** — © 2026 I.E. N.° 80033 "José Olaya Balandra".

Una versión anterior de este README distribuía el proyecto bajo **MIT**. Era
incorrecto: no existe archivo `LICENSE`, la sección remitía a sí misma y el pie
del portal decía justo lo contrario. Se retira en lugar de completarse, porque
**abrir la obra es una decisión de la institución, no una corrección de
documentación**.

> Una licencia abierta sobre todo el repositorio alcanzaría también a las
> fotografías del laboratorio, y eso rompería la promesa de
> [`CIEHS-Privacidad-Menores`](CIEHS-Privacidad-Menores.md): que una
> autorización de imagen es **revocable en cualquier momento**. Lo que se
> licencia de forma irrevocable no se puede retirar después.

Las opciones, con su recomendación, están en
[`pendientes-coordinacion/07-licencia.md`](pendientes-coordinacion/07-licencia.md).

---

<div align="center">

Hecho con 🌱 por y para la comunidad educativa de la **I.E. N.° 80033 "José Olaya Balandra"** — Huanchaco, Perú

</div>
