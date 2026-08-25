<div align="center">

# 🌱 CIEHS
### Centro de Indagación Escolar Hidropónica y Sostenibilidad

**I.E. N.° 80033 "José Olaya Balandra"** · Huanchaco, La Libertad, Perú 🇵🇪

*"Cultivamos Ciencia, Cosechamos Futuro"*

[![ODS 13](https://img.shields.io/badge/ODS-13%20Acci%C3%B3n%20por%20el%20Clima-2E7D32?style=for-the-badge&logo=leaflet&logoColor=white)](https://www.un.org/sustainabledevelopment/es/climate-change/)
[![Eureka 2026](https://img.shields.io/badge/Eureka-2026-F59E0B?style=for-the-badge&logo=starship&logoColor=white)](#)
[![Surge Status](https://img.shields.io/website?url=https%3A%2F%2Fciehs-olaya.surge.sh&up_message=en%20l%C3%ADnea&down_message=fuera%20de%20l%C3%ADnea&style=for-the-badge&label=surge)](https://ciehs-olaya.surge.sh)
[![Licencia MIT](https://img.shields.io/badge/Licencia-MIT-0EA5E9?style=for-the-badge)](#-licencia)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)

**[🔗 Ver sitio en vivo](https://ciehs-olaya.surge.sh)**

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

El laboratorio hidropónico opera con **4 módulos** físicos, cada uno documentado y trazado dentro del portal:

| Código | Sistema |
|---|---|
| `MOD-NFT-01` | Técnica de Película de Nutrientes (*Nutrient Film Technique*) |
| `MOD-DWC-02` | Cultivo en Aguas Profundas (*Deep Water Culture*) |
| `MOD-SUS-03` | Sustrato / Sistema Sustentable |
| `MOD-VER-04` | Cultivo Vertical |

### 🥬 Diversificación de cultivos

- Lechuga crespa
- Espinaca
- Cebollita china
- Aromáticas

### 🛠️ Herramientas del portal

- **🧪 Simulador hidropónico** — modela el comportamiento de los sistemas NFT, DWC, sustrato y vertical de forma interactiva.
- **📱 Trazabilidad QR** — cada cultivo puede rastrearse desde la siembra hasta la cosecha mediante códigos QR de acceso.
- **💧 Calculadora hídrica** — estima el consumo y ahorro de agua frente al cultivo convencional en suelo.
- **🔐 Panel CMS (administración)** — panel de administración protegido por PIN para editar portada, indicadores y avisos institucionales.
  > PIN de acceso: `2026`

### Stack

```
HTML5  +  CSS3  +  JavaScript (vanilla)
Persistencia local vía localStorage (panel CMS)
Despliegue estático vía Surge.sh
```

---

## 🚀 Accesos y despliegue

### 🌐 Sitio en vivo

**[https://ciehs-olaya.surge.sh](https://ciehs-olaya.surge.sh)**

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

### ☁️ Redesplegar en Surge

```bash
npm install -g surge
surge . ciehs-olaya.surge.sh
```

---

## 📄 Licencia

Distribuido bajo licencia **MIT**. Ver el encabezado de este repositorio para más detalles.

---

<div align="center">

Hecho con 🌱 por y para la comunidad educativa de la **I.E. N.° 80033 "José Olaya Balandra"** — Huanchaco, Perú

</div>
