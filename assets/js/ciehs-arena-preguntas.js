/* ============================================================================
   CIEHS · ARENA — banco de retos

   Distinto del quiz de la seccion Juega: aqui cada reto lleva ambientacion,
   temporizador y formato propio.

   Campos:
     id      identificador estable (clave del progreso guardado).
     nivel   'primaria' | 'secundaria' | 'preuniversitario' | 'universitario'
     tema    ambientacion que se monta detras del reto:
             'pociones'    laboratorio de alquimia — quimica y soluciones
             'abismo'      fondo acuatico — agua, pH, recirculacion
             'invernadero' cultivo — botanica y fisiologia vegetal
             'tormenta'    cielo cambiante — clima y ODS
             'datos'       sala de analisis — estadistica y diseno experimental
             'taller'      circuitos — sensores e ingenieria del modulo
     tipo    'opcion'   opciones (una correcta)
             'vf'       verdadero o falso, con menos tiempo
             'escucha'  el enunciado se lee en voz alta y NO se muestra
             'orden'    ordenar pasos arrastrando
             'dial'     ajustar un valor numerico con un control deslizante
             'escribe'  respuesta corta escrita
     dif     1 facil · 2 media · 3 dificil — determina el tiempo disponible
     exp     explicacion posterior

   Los datos cientificos coinciden con el resto del portal.
   ========================================================================== */
(function (global) {
  'use strict';

  global.CIEHS_ARENA = {

    /* ============================ PRIMARIA ============================ */
    primaria: [
      { id:'ar-pri-1', tema:'invernadero', tipo:'opcion', dif:1,
        q:'¿Qué parte de la planta absorbe el agua con nutrientes?',
        ops:[['La raíz',true],['La flor',false],['El fruto',false]],
        exp:'La raíz absorbe agua y nutrientes; el tallo los transporta hacia las hojas.' },

      { id:'ar-pri-2', tema:'abismo', tipo:'vf', dif:1,
        q:'En hidroponía las plantas necesitan tierra para crecer.',
        correcta:false,
        exp:'Falso. Las raíces reciben los nutrientes disueltos en el agua, sin suelo.' },

      { id:'ar-pri-3', tema:'pociones', tipo:'dial', dif:2,
        q:'Ajusta el pH al valor central del rango de la lechuga (5.5 – 6.5).',
        min:4, max:8, paso:0.1, inicio:7.4, objetivo:6.0, tolerancia:0.2, unidad:'pH',
        exp:'El punto medio es 6.0. Fuera de 5.5–6.5 la lechuga absorbe peor los nutrientes.' },

      { id:'ar-pri-4', tema:'tormenta', tipo:'opcion', dif:1,
        q:'¿Qué Objetivo de Desarrollo Sostenible es el eje del CIEHS?',
        ops:[['ODS 13 · Acción por el Clima',true],['ODS 1 · Fin de la pobreza',false],['ODS 9 · Industria',false]],
        exp:'El reto Acción por el Clima es el eje movilizador de todo el CIEHS.' },

      { id:'ar-pri-5', tema:'invernadero', tipo:'orden', dif:2,
        q:'Ordena el ciclo de una planta del CIEHS, del principio al final.',
        pasos:['Semilla','Germinación','Almácigo','Trasplante al módulo','Cosecha'],
        exp:'La semilla germina, crece en almácigo, se trasplanta al módulo y por fin se cosecha.' },

      { id:'ar-pri-6', tema:'abismo', tipo:'escucha', dif:2,
        q:'¿Aproximadamente cuánta agua ahorra la hidroponía frente al cultivo en suelo?',
        ops:[['Cerca del 90 %',true],['Cerca del 10 %',false],['No ahorra agua',false]],
        exp:'Recircular la solución en lugar de perderla en el suelo ahorra cerca del 90 %.' },

      { id:'ar-pri-7', tema:'taller', tipo:'opcion', dif:2,
        q:'¿Para qué sirve la bomba de aire en el módulo de Raíz Flotante?',
        ops:[['Para dar oxígeno a las raíces sumergidas',true],['Para calentar el agua',false],['Para iluminar las hojas',false]],
        exp:'Las raíces también respiran: sin oxígeno disuelto se pudren.' },

      { id:'ar-pri-8', tema:'datos', tipo:'escribe', dif:2,
        q:'¿Cuántos módulos hidropónicos activos tiene el CIEHS? (escribe el número)',
        respuestas:['4','cuatro'],
        exp:'Cuatro: NFT, Raíz Flotante, Sustrato y Vertical.' },

      { id:'ar-pri-9', tema:'tormenta', tipo:'vf', dif:1,
        q:'Separar los residuos ayuda a reducir la basura del colegio.',
        correcta:true,
        exp:'Verdadero. Separar permite reciclar y conecta con el ODS 12.' },

      { id:'ar-pri-10', tema:'invernadero', tipo:'opcion', dif:2,
        q:'¿Con qué instrumento medimos la altura de la planta cada semana?',
        ops:[['Una regla',true],['Una balanza',false],['Un termómetro',false]],
        exp:'La regla mide altura en centímetros; la balanza mide la biomasa en gramos.' }
    ],

    /* =========================== SECUNDARIA =========================== */
    secundaria: [
      { id:'ar-sec-1', tema:'pociones', tipo:'opcion', dif:2,
        q:'¿Qué indica la conductividad eléctrica (CE) de una solución nutritiva?',
        ops:[['La concentración de sales disueltas',true],['El pH de la solución',false],['La temperatura del agua',false]],
        exp:'La CE se mide en mS/cm y estima cuántas sales hay disueltas.' },

      { id:'ar-sec-2', tema:'datos', tipo:'opcion', dif:2,
        q:'En INV-2026-01 se manipula la concentración de solución. Esa es la variable…',
        ops:[['Independiente',true],['Dependiente',false],['De control',false]],
        exp:'La independiente es la que el investigador manipula; la biomasa es la dependiente.' },

      { id:'ar-sec-3', tema:'abismo', tipo:'dial', dif:2,
        q:'Ajusta la CE al centro del rango de la espinaca (1.8 – 2.3 mS/cm).',
        min:0.5, max:3.5, paso:0.05, inicio:0.8, objetivo:2.05, tolerancia:0.1, unidad:'mS/cm',
        exp:'El punto medio es 2.05 mS/cm. La espinaca tolera más sales que la lechuga.' },

      { id:'ar-sec-4', tema:'invernadero', tipo:'escucha', dif:3,
        q:'Si el pH de la solución sube a siete coma cinco, ¿qué le ocurre al hierro?',
        ops:[['Precipita y deja de estar disponible',true],['Se absorbe mejor',false],['Se convierte en nitrógeno',false]],
        exp:'A pH alto el hierro precipita: está presente en la solución pero la planta no lo puede tomar.' },

      { id:'ar-sec-5', tema:'datos', tipo:'orden', dif:2,
        q:'Ordena los pasos del método que sigue el CIEHS.',
        pasos:['Observar el fenómeno','Formular la pregunta','Plantear la hipótesis','Diseñar el experimento','Analizar los datos','Comunicar resultados'],
        exp:'Sin pregunta no hay hipótesis, y sin diseño los datos no responden nada.' },

      { id:'ar-sec-6', tema:'taller', tipo:'vf', dif:2,
        q:'En un sistema NFT el canal debe estar completamente inundado.',
        correcta:false,
        exp:'Falso. La película debe ser delgada para que la raíz reciba nutrientes y oxígeno a la vez.' },

      { id:'ar-sec-7', tema:'pociones', tipo:'escribe', dif:3,
        q:'¿En qué unidad se expresa la conductividad eléctrica en el CIEHS?',
        respuestas:['ms/cm','milisiemens por centimetro','milisiemens/cm','ms cm'],
        exp:'mS/cm: milisiemens por centímetro.' },

      { id:'ar-sec-8', tema:'tormenta', tipo:'opcion', dif:2,
        q:'¿Qué dos limitantes agronómicas de Huanchaco responde la hidroponía?',
        ops:[['Salinización de suelos y estrés hídrico',true],['Exceso de lluvia y heladas',false],['Plagas y granizo',false]],
        exp:'Prescinde del suelo salinizado y recircula el agua, escasa en la costa árida.' },

      { id:'ar-sec-9', tema:'datos', tipo:'opcion', dif:3,
        q:'En DBCA con 3 tratamientos y 4 réplicas, ¿cuántas unidades experimentales hay?',
        ops:[['12',true],['7',false],['34',false]],
        exp:'3 tratamientos × 4 réplicas = 12 unidades experimentales.' },

      { id:'ar-sec-10', tema:'invernadero', tipo:'opcion', dif:2,
        q:'El bioestimulante de INV-2026-02 aporta auxinas. ¿Qué estimulan?',
        ops:[['El enraizamiento',true],['La floración inmediata',false],['El color de la hoja',false]],
        exp:'Por eso INV-2026-02 mide longitud radicular y sobrevivencia en trasplante.' }
    ],

    /* ======================== PREUNIVERSITARIO ======================== */
    preuniversitario: [
      { id:'ar-pre-1', tema:'pociones', tipo:'dial', dif:3,
        q:'Tienes 10 L de solución a 100 %. Ajusta el volumen de agua a añadir para llevarla al 50 %.',
        min:0, max:20, paso:0.5, inicio:0, objetivo:10, tolerancia:0.5, unidad:'L de agua',
        exp:'Diluir a la mitad significa duplicar el volumen: 10 L de solución + 10 L de agua = 20 L al 50 %.' },

      { id:'ar-pre-2', tema:'datos', tipo:'opcion', dif:3,
        q:'Un tratamiento da 120 g de biomasa y el control 100 g. ¿Cuál es el incremento porcentual?',
        ops:[['20 %',true],['12 %',false],['80 %',false]],
        exp:'(120 − 100) / 100 × 100 = 20 %. Siempre se divide entre el valor de referencia.' },

      { id:'ar-pre-3', tema:'abismo', tipo:'opcion', dif:3,
        q:'El pH es una escala logarítmica. Una solución de pH 5 frente a otra de pH 7 es…',
        ops:[['100 veces más ácida',true],['2 veces más ácida',false],['Igual de ácida',false]],
        exp:'Cada unidad de pH es un factor de 10 en la concentración de H⁺. Dos unidades = 10² = 100.' },

      { id:'ar-pre-4', tema:'invernadero', tipo:'escucha', dif:3,
        q:'¿Cómo se llama el proceso por el que la planta pierde agua a través de los estomas?',
        ops:[['Transpiración',true],['Fotosíntesis',false],['Germinación',false]],
        exp:'La transpiración mueve el agua desde la raíz y explica el consumo diario del módulo.' },

      { id:'ar-pre-5', tema:'datos', tipo:'orden', dif:3,
        q:'Ordena de menor a mayor control experimental.',
        pasos:['Observación casual','Observación sistemática','Estudio comparativo','Experimento con control','Experimento con réplicas y azar'],
        exp:'Cada paso reduce la posibilidad de que el resultado se deba al azar o a un sesgo.' },

      { id:'ar-pre-6', tema:'taller', tipo:'escribe', dif:3,
        q:'Nombra el módulo del CIEHS cuyo código es MOD-DWC-02.',
        respuestas:['raiz flotante','raíz flotante','dwc','deep water culture'],
        exp:'MOD-DWC-02 es Raíz Flotante, el nombre en castellano de Deep Water Culture.' },

      { id:'ar-pre-7', tema:'pociones', tipo:'vf', dif:3,
        q:'Añadir más fertilizante siempre aumenta el crecimiento de la planta.',
        correcta:false,
        exp:'Falso. Pasado el óptimo, el exceso de sales causa estrés osmótico y frena el crecimiento. Es la hipótesis de INV-2026-01.' },

      { id:'ar-pre-8', tema:'tormenta', tipo:'opcion', dif:2,
        q:'Reducir el consumo de agua en un 90 % contribuye principalmente a…',
        ops:[['ODS 6 · Agua limpia y saneamiento',true],['ODS 4 · Educación de calidad',false],['ODS 16 · Paz y justicia',false]],
        exp:'El CIEHS toca varios ODS: el 13 como eje y el 6 por el uso eficiente del agua.' },

      { id:'ar-pre-9', tema:'datos', tipo:'dial', dif:3,
        q:'Cuatro réplicas dan 95, 105, 100 y 100 g. Ajusta el valor de la media.',
        min:80, max:120, paso:1, inicio:80, objetivo:100, tolerancia:0, unidad:'g',
        exp:'(95 + 105 + 100 + 100) / 4 = 100 g. La media resume, pero conviene mirar también la dispersión.' },

      { id:'ar-pre-10', tema:'invernadero', tipo:'opcion', dif:3,
        q:'¿Qué mide realmente la biomasa fresca?',
        ops:[['La masa de la planta con su contenido de agua',true],['El volumen de la raíz',false],['La altura del tallo',false]],
        exp:'Por eso se distingue de la biomasa seca, que se obtiene tras deshidratar la muestra.' }
    ],

    /* =========================== UNIVERSITARIO =========================== */
    universitario: [
      { id:'ar-uni-1', tema:'pociones', tipo:'opcion', dif:3,
        q:'Una solución con CE de 2.0 mS/cm tiene aproximadamente cuántos ppm de sales (factor 640)?',
        ops:[['1280 ppm',true],['320 ppm',false],['64 ppm',false]],
        exp:'CE × 640 = ppm. 2.0 × 640 = 1280 ppm. El factor varía según el conductímetro (500, 640 o 700).' },

      { id:'ar-uni-2', tema:'datos', tipo:'opcion', dif:3,
        q:'En un ANOVA de un DBCA, un valor p de 0.03 con α = 0.05 significa que…',
        ops:[['Se rechaza la hipótesis nula: hay diferencia significativa',true],['Se acepta la hipótesis nula',false],['El experimento está mal diseñado',false]],
        exp:'p < α lleva a rechazar la nula. No prueba la hipótesis alterna: solo hace improbable el azar.' },

      { id:'ar-uni-3', tema:'abismo', tipo:'dial', dif:3,
        q:'Ajusta la concentración de H⁺ expresada como pH para una solución de 1×10⁻⁶ M.',
        min:0, max:14, paso:0.5, inicio:0, objetivo:6, tolerancia:0, unidad:'pH',
        exp:'pH = −log[H⁺] = −log(10⁻⁶) = 6.' },

      { id:'ar-uni-4', tema:'invernadero', tipo:'escucha', dif:3,
        q:'¿Qué nutriente móvil muestra su deficiencia primero en las hojas viejas?',
        ops:[['Nitrógeno',true],['Calcio',false],['Boro',false]],
        exp:'El nitrógeno es móvil: la planta lo retira de hojas viejas para nutrir las nuevas. El calcio es inmóvil y falla primero en las jóvenes.' },

      { id:'ar-uni-5', tema:'taller', tipo:'opcion', dif:3,
        q:'En NFT, una pendiente insuficiente del canal provoca sobre todo…',
        ops:[['Encharcamiento y caída del oxígeno disuelto',true],['Exceso de luz en la raíz',false],['Aumento del pH a 9',false]],
        exp:'La pendiente típica es 1–3 %. Sin ella la película se estanca y la raíz se asfixia.' },

      { id:'ar-uni-6', tema:'datos', tipo:'orden', dif:3,
        q:'Ordena las etapas del análisis de datos de una investigación escolar.',
        pasos:['Depuración de datos','Estadística descriptiva','Prueba de supuestos','Contraste de hipótesis','Interpretación y discusión'],
        exp:'Contrastar sin comprobar supuestos (normalidad, homocedasticidad) invalida la conclusión.' },

      { id:'ar-uni-7', tema:'pociones', tipo:'escribe', dif:3,
        q:'¿Cómo se llama el efecto por el que un exceso de sales impide a la raíz absorber agua?',
        respuestas:['estres osmotico','estrés osmótico','osmotico','osmosis inversa fisiologica'],
        exp:'Con CE alta el potencial osmótico externo supera al de la raíz y el agua deja de entrar.' },

      { id:'ar-uni-8', tema:'tormenta', tipo:'vf', dif:3,
        q:'Un resultado no significativo demuestra que el tratamiento no tiene ningún efecto.',
        correcta:false,
        exp:'Falso. Ausencia de evidencia no es evidencia de ausencia: puede faltar potencia estadística.' },

      { id:'ar-uni-9', tema:'invernadero', tipo:'opcion', dif:3,
        q:'La relación entre biomasa fresca y biomasa seca informa principalmente sobre…',
        ops:[['El contenido hídrico del tejido',true],['La cantidad de nitrógeno',false],['El pH interno',false]],
        exp:'Un cociente alto indica tejido muy hidratado; secar la muestra permite comparar materia real.' },

      { id:'ar-uni-10', tema:'datos', tipo:'opcion', dif:3,
        q:'¿Por qué el DBCA agrupa las unidades en bloques antes de aleatorizar?',
        ops:[['Para controlar la variación conocida dentro de cada bloque',true],['Para reducir el número de plantas',false],['Para acelerar la cosecha',false]],
        exp:'Bloquear separa la variación ambiental conocida (luz, temperatura) del efecto del tratamiento.' }
    ]
  };
})(window);
