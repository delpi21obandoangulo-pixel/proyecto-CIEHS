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

    /* ====================== INICIAL · Ciclo II (3 a 5 años) ======================
       Pensado para quien todavia no lee con soltura: predominan los retos de
       escucha y las opciones de dos o tres palabras. Sin escribir ni calcular.
       El motor concede a este nivel mas tiempo por reto. */
    inicial: [
      { id:'ar-ini-1', tema:'invernadero', tipo:'escucha', dif:1,
        q:'¿Qué parte de la planta está debajo de todo y bebe el agua?',
        ops:[['La raíz',true],['La flor',false],['La hoja',false]],
        exp:'La raíz bebe el agua y sujeta la planta para que no se caiga.' },

      { id:'ar-ini-2', tema:'abismo', tipo:'opcion', dif:1,
        q:'¿Qué necesitan las plantas para vivir?',
        ops:[['Agua y luz',true],['Piedras',false],['Papel',false]],
        exp:'Agua, luz y aire: con eso la planta fabrica su propia comida.' },

      { id:'ar-ini-3', tema:'invernadero', tipo:'opcion', dif:1,
        q:'¿De qué color son las hojas?',
        ops:[['Verdes',true],['Moradas',false],['Negras',false]],
        exp:'Son verdes porque tienen clorofila, que atrapa la luz del sol.' },

      { id:'ar-ini-4', tema:'tormenta', tipo:'escucha', dif:1,
        q:'¿Qué nos da el sol?',
        ops:[['Luz y calor',true],['Nieve',false],['Piedras',false]],
        exp:'El sol da luz y calor, y con su luz crecen las plantas.' },

      { id:'ar-ini-5', tema:'abismo', tipo:'vf', dif:1,
        q:'El agua se debe cuidar.',
        correcta:true,
        exp:'Sí. Cerramos el caño y no la desperdiciamos, porque el agua es un tesoro.' },

      { id:'ar-ini-6', tema:'invernadero', tipo:'escucha', dif:1,
        q:'¿Qué sale primero de una semilla cuando empieza a crecer?',
        ops:[['Una raicita',true],['Una flor',false],['Un fruto',false]],
        exp:'Primero sale la raicita, que busca agua. Después crece el tallito.' },

      { id:'ar-ini-7', tema:'pociones', tipo:'opcion', dif:1,
        q:'¿En qué crecen nuestras plantas?',
        ops:[['En agua',true],['En arena',false],['En papel',false]],
        exp:'Crecen en agua con comida disuelta. Eso se llama hidroponía.' },

      { id:'ar-ini-8', tema:'invernadero', tipo:'opcion', dif:1,
        q:'¿Cuál de estas es una hoja?',
        ops:[['La parte plana y verde',true],['La parte de abajo',false],['La semilla',false]],
        exp:'La hoja es plana y verde, y toma la luz del sol.' },

      { id:'ar-ini-9', tema:'tormenta', tipo:'vf', dif:1,
        q:'Tirar basura al mar está bien.',
        correcta:false,
        exp:'No. La basura daña a los animales del mar y ensucia nuestra playa de Huanchaco.' },

      { id:'ar-ini-10', tema:'abismo', tipo:'escucha', dif:1,
        q:'¿Qué animalito del mar vive en Huanchaco y no vuela?',
        ops:[['El pingüino',true],['El elefante',false],['La jirafa',false]],
        exp:'El pingüino de Humboldt vive en nuestra costa y nada muy bien.' },

      { id:'ar-ini-11', tema:'invernadero', tipo:'opcion', dif:1,
        q:'¿Qué usamos para saber si la planta creció?',
        ops:[['Una regla',true],['Una cuchara',false],['Un zapato',false]],
        exp:'Con la regla medimos, y así sabemos cuánto creció esta semana.' },

      { id:'ar-ini-12', tema:'tormenta', tipo:'opcion', dif:1,
        q:'¿Qué hacemos con las botellas usadas?',
        ops:[['Las reciclamos',true],['Las tiramos al piso',false],['Las quemamos',false]],
        exp:'Reciclar es volver a usar. Así hacemos menos basura.' },

      { id:'ar-ini-13', tema:'invernadero', tipo:'escucha', dif:1,
        q:'¿Qué le pasa a una planta que nunca ve la luz?',
        ops:[['Se pone débil',true],['Crece más',false],['Se pone roja',false]],
        exp:'Sin luz la planta no puede hacer su comida y se debilita.' },

      { id:'ar-ini-14', tema:'abismo', tipo:'opcion', dif:1,
        q:'¿El agua del mar sirve para regar plantas?',
        ops:[['No, tiene mucha sal',true],['Sí, siempre',false],['Sí, si está fría',false]],
        exp:'La sal daña las raíces. Las plantas necesitan agua dulce.' },

      { id:'ar-ini-15', tema:'invernadero', tipo:'orden', dif:2,
        q:'Ordena: primero la semilla, después la plantita.',
        pasos:['Semilla','Raicita','Plantita','Hojas grandes'],
        exp:'Primero la semilla, luego la raicita, después la plantita y sus hojas.' },

      { id:'ar-ini-16', tema:'pociones', tipo:'escucha', dif:1,
        q:'¿Cómo se llama nuestro laboratorio de plantas?',
        ops:[['CIEHS',true],['El comedor',false],['El patio',false]],
        exp:'CIEHS es el laboratorio donde investigamos con plantas.' },

      { id:'ar-ini-17', tema:'taller', tipo:'opcion', dif:1,
        q:'¿Qué hace una bomba de agua?',
        ops:[['Mueve el agua',true],['Corta el pasto',false],['Da luz',false]],
        exp:'La bomba mueve el agua para que llegue a todas las raíces.' },

      { id:'ar-ini-18', tema:'invernadero', tipo:'vf', dif:1,
        q:'Todas las plantas son iguales.',
        correcta:false,
        exp:'No. La lechuga, la espinaca y la cebollita son distintas entre sí.' },

      { id:'ar-ini-19', tema:'tormenta', tipo:'escucha', dif:1,
        q:'¿Qué cae del cielo cuando llueve?',
        ops:[['Agua',true],['Arena',false],['Hojas',false]],
        exp:'Cae agua. El agua sube al cielo, forma nubes y vuelve como lluvia.' },

      { id:'ar-ini-20', tema:'invernadero', tipo:'opcion', dif:1,
        q:'¿Qué hortaliza de hojas verdes cultivamos?',
        ops:[['Lechuga',true],['Plátano',false],['Uva',false]],
        exp:'La lechuga es una de nuestras plantas favoritas del laboratorio.' },

      { id:'ar-ini-21', tema:'datos', tipo:'opcion', dif:1,
        q:'Si dibujo mi planta cada semana, puedo…',
        ops:[['Ver cómo cambió',true],['Comérmela',false],['Perderla',false]],
        exp:'Dibujar y guardar los dibujos nos deja comparar y ver el cambio.' },

      { id:'ar-ini-22', tema:'abismo', tipo:'vf', dif:1,
        q:'Las raíces también necesitan aire.',
        correcta:true,
        exp:'Sí. Por eso el agua se mueve y lleva burbujitas de aire a las raíces.' },

      { id:'ar-ini-23', tema:'invernadero', tipo:'escucha', dif:1,
        q:'¿Qué parte de la planta es larga y sostiene las hojas?',
        ops:[['El tallo',true],['La raíz',false],['La semilla',false]],
        exp:'El tallo sostiene las hojas y lleva el agua hacia arriba.' },

      { id:'ar-ini-24', tema:'tormenta', tipo:'opcion', dif:1,
        q:'Cuidar las plantas y el agua ayuda a…',
        ops:[['Cuidar el planeta',true],['Ensuciar el aire',false],['Gastar más',false]],
        exp:'Cuidar el planeta es de lo que trata la Acción por el Clima.' },

      { id:'ar-ini-25', tema:'pociones', tipo:'opcion', dif:1,
        q:'El agua de nuestro laboratorio lleva comida para las plantas. ¿Se ve?',
        ops:[['No, está mezclada',true],['Sí, son piedritas',false],['Sí, flota arriba',false]],
        exp:'Está disuelta: mezclada en el agua, por eso no se ve.' },

      { id:'ar-ini-26', tema:'datos', tipo:'escucha', dif:1,
        q:'Si tu planta tenía tres hojas y ahora tiene cinco, ¿creció o no?',
        ops:[['Creció',true],['No creció',false],['Se hizo más chica',false]],
        exp:'Contar las hojas es una forma de saber si la planta va creciendo.' },

      { id:'ar-ini-27', tema:'taller', tipo:'opcion', dif:1,
        q:'Si algo se rompe en el laboratorio, ¿qué hacemos?',
        ops:[['Avisamos a la profesora',true],['Lo escondemos',false],['Lo arreglamos solos',false]],
        exp:'Siempre avisamos: así se arregla bien y nadie se hace daño.' },

      { id:'ar-ini-28', tema:'invernadero', tipo:'orden', dif:2,
        q:'Ordena de más pequeño a más grande.',
        pasos:['Semilla','Brote','Planta pequeña','Planta grande'],
        exp:'Todo empieza en una semillita y termina en una planta lista para cosechar.' },

      { id:'ar-ini-29', tema:'abismo', tipo:'opcion', dif:1,
        q:'¿Dónde está Huanchaco?',
        ops:[['Junto al mar',true],['En la montaña nevada',false],['En el desierto de hielo',false]],
        exp:'Huanchaco está junto al mar, y por eso el agua dulce es poquita.' },

      { id:'ar-ini-30', tema:'tormenta', tipo:'vf', dif:1,
        q:'Podemos ayudar al planeta desde el colegio.',
        correcta:true,
        exp:'¡Claro que sí! Cuidando el agua, reciclando y cultivando nuestras plantas.' }
    ],

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
        exp:'La regla mide altura en centímetros; la balanza mide la biomasa en gramos.' },

      { id:'ar-pri-11', tema:'invernadero', tipo:'opcion', dif:1,
        q:'¿Qué parte de la planta sostiene las hojas y lleva el agua hacia arriba?',
        ops:[['El tallo',true],['La raíz',false],['La semilla',false]],
        exp:'El tallo es la vía por la que sube el agua desde la raíz hasta las hojas.' },

      { id:'ar-pri-12', tema:'tormenta', tipo:'vf', dif:1,
        q:'El sol da a las plantas la energía que necesitan para fabricar su alimento.',
        correcta:true,
        exp:'Verdadero. Con luz, agua y aire la planta fabrica su propio alimento en las hojas.' },

      { id:'ar-pri-13', tema:'abismo', tipo:'opcion', dif:2,
        q:'¿Por qué no se riegan las plantas con agua de mar?',
        ops:[['Porque tiene demasiada sal',true],['Porque está muy fría',false],['Porque tiene muchas olas',false]],
        exp:'La sal daña las raíces. En Huanchaco, tan cerca del mar, cuidar el agua dulce es clave.' },

      { id:'ar-pri-14', tema:'taller', tipo:'orden', dif:2,
        q:'Ordena el recorrido del agua en un módulo hidropónico.',
        pasos:['Depósito','Bomba','Canal de cultivo','Raíces','Regreso al depósito'],
        exp:'El agua hace un circuito cerrado: por eso se aprovecha una y otra vez.' },

      { id:'ar-pri-15', tema:'datos', tipo:'dial', dif:2,
        q:'Tu planta medía 8 cm y ahora mide 14 cm. Ajusta cuánto creció.',
        min:0, max:20, paso:1, inicio:0, objetivo:6, tolerancia:0, unidad:'cm',
        exp:'14 − 8 = 6 cm. Restar la medida anterior es como se calcula el crecimiento.' },

      { id:'ar-pri-16', tema:'invernadero', tipo:'escucha', dif:2,
        q:'¿Cuál de estas hortalizas cultivamos en el laboratorio del colegio?',
        ops:[['Espinaca',true],['Plátano',false],['Papa',false]],
        exp:'Cultivamos lechuga, espinaca, cebollita china y aromáticas.' },

      { id:'ar-pri-17', tema:'tormenta', tipo:'opcion', dif:2,
        q:'¿Qué significa que un recurso sea "renovable"?',
        ops:[['Que la naturaleza puede reponerlo',true],['Que es muy caro',false],['Que se acaba para siempre',false]],
        exp:'Renovable no significa infinito: el agua se renueva, pero si se gasta más rápido de lo que se repone, escasea.' },

      { id:'ar-pri-18', tema:'abismo', tipo:'vf', dif:2,
        q:'Las raíces de una planta necesitan aire además de agua.',
        correcta:true,
        exp:'Verdadero. Si el agua está estancada y sin oxígeno, las raíces se pudren.' },

      { id:'ar-pri-19', tema:'datos', tipo:'escribe', dif:2,
        q:'¿Cuántos equipos de investigación tiene el CIEHS? (escribe el número)',
        respuestas:['6','seis'],
        exp:'Seis equipos de indagación científica trabajan en el laboratorio.' },

      { id:'ar-pri-20', tema:'taller', tipo:'opcion', dif:2,
        q:'Si la bomba del módulo deja de funcionar, lo primero que se debe hacer es…',
        ops:[['Avisar al docente encargado',true],['Desarmarla uno mismo',false],['Echarle más agua',false]],
        exp:'El laboratorio tiene un procedimiento: avisar y registrar la incidencia en la bitácora.' },

      { id:'ar-pri-21', tema:'invernadero', tipo:'opcion', dif:2,
        q:'Si una planta tiene las hojas de abajo amarillas, lo más probable es que…',
        ops:[['Le falte alimento en el agua',true],['Tenga demasiada luz',false],['Esté muy contenta',false]],
        exp:'El amarilleo de las hojas viejas suele avisar de falta de nutrientes.' },

      { id:'ar-pri-22', tema:'tormenta', tipo:'orden', dif:2,
        q:'Ordena el ciclo del agua en la naturaleza.',
        pasos:['Evaporación','Condensación','Precipitación','Escorrentía'],
        exp:'El agua se evapora, forma nubes, cae como lluvia y vuelve a los ríos y al mar.' },

      { id:'ar-pri-23', tema:'datos', tipo:'opcion', dif:2,
        q:'Anotas la altura de tu planta cada lunes. Eso es…',
        ops:[['Un registro periódico',true],['Una adivinanza',false],['Un dibujo libre',false]],
        exp:'Medir siempre el mismo día y a la misma hora hace que los datos se puedan comparar.' },

      { id:'ar-pri-24', tema:'abismo', tipo:'dial', dif:2,
        q:'Un módulo usa 10 litros al día en suelo. Con hidroponía ahorra el 90 %. Ajusta cuántos litros usa ahora.',
        min:0, max:10, paso:0.5, inicio:10, objetivo:1, tolerancia:0.5, unidad:'litros',
        exp:'Ahorrar el 90 % de 10 L deja 1 L. Ese es el orden de magnitud del ahorro.' },

      { id:'ar-pri-25', tema:'pociones', tipo:'opcion', dif:2,
        q:'El agua del módulo lleva nutrientes disueltos. "Disuelto" significa que…',
        ops:[['Está mezclado y no se ve por separado',true],['Está en el fondo sin mezclar',false],['Flota encima',false]],
        exp:'Por eso el agua parece transparente aunque lleve el alimento de la planta.' },

      { id:'ar-pri-26', tema:'invernadero', tipo:'vf', dif:2,
        q:'Todas las plantas necesitan exactamente la misma cantidad de alimento.',
        correcta:false,
        exp:'Falso. Cada cultivo tiene su rango: la espinaca aguanta más sales que la lechuga.' },

      { id:'ar-pri-27', tema:'taller', tipo:'escucha', dif:2,
        q:'¿Cómo se llama el módulo donde las plantas flotan sobre el agua en una balsa?',
        ops:[['Raíz flotante',true],['Cultivo vertical',false],['Sustrato',false]],
        exp:'Es el MOD-DWC-02, con una bomba de aire que oxigena el agua todo el tiempo.' },

      { id:'ar-pri-28', tema:'tormenta', tipo:'opcion', dif:1,
        q:'¿Cuál de estas acciones ayuda más a cuidar el agua en casa?',
        ops:[['Cerrar el caño mientras te cepillas',true],['Dejar correr el agua para que se enfríe',false],['Lavar el patio con manguera a diario',false]],
        exp:'Los pequeños hábitos diarios suman: es el mismo principio del ahorro del módulo.' },

      { id:'ar-pri-29', tema:'datos', tipo:'opcion', dif:2,
        q:'Mides 5 plantas y obtienes 10, 12, 11, 13 y 14 cm. ¿Cuál es la más alta?',
        ops:[['14 cm',true],['10 cm',false],['12 cm',false]],
        exp:'Ordenar los datos permite ver de un vistazo el mayor, el menor y el rango.' },

      { id:'ar-pri-30', tema:'pociones', tipo:'escribe', dif:2,
        q:'¿Cómo se llama la técnica de cultivar plantas en agua, sin tierra?',
        respuestas:['hidroponia','hidroponía','cultivo hidroponico','hidroponico'],
        exp:'Hidroponía: de "hydro" (agua) y "ponos" (trabajo).' }
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
        exp:'Por eso INV-2026-02 mide longitud radicular y sobrevivencia en trasplante.' },

      { id:'ar-sec-11', tema:'invernadero', tipo:'opcion', dif:2,
        q:'¿Qué produce la fotosíntesis además de glucosa?',
        ops:[['Oxígeno',true],['Nitrógeno',false],['Metano',false]],
        exp:'CO₂ + agua + luz dan glucosa y oxígeno. Ese oxígeno es el que respiramos.' },

      { id:'ar-sec-12', tema:'pociones', tipo:'vf', dif:2,
        q:'Una solución con pH 7 es ácida.',
        correcta:false,
        exp:'Falso. pH 7 es neutro; por debajo es ácido y por encima, alcalino.' },

      { id:'ar-sec-13', tema:'abismo', tipo:'orden', dif:2,
        q:'Ordena de más ácido a más alcalino.',
        pasos:['pH 4','pH 5.5','pH 7','pH 8.5'],
        exp:'La escala va de 0 a 14. Los cultivos del CIEHS trabajan entre 5.5 y 6.8.' },

      { id:'ar-sec-14', tema:'datos', tipo:'dial', dif:2,
        q:'Tres réplicas dan 12, 14 y 16 cm de altura. Ajusta el valor de la media.',
        min:5, max:25, paso:1, inicio:5, objetivo:14, tolerancia:0, unidad:'cm',
        exp:'(12 + 14 + 16) / 3 = 14 cm. La media resume el conjunto en un solo valor.' },

      { id:'ar-sec-15', tema:'taller', tipo:'opcion', dif:2,
        q:'¿Qué instrumento mide la conductividad eléctrica de la solución?',
        ops:[['Un conductímetro',true],['Un pH-metro',false],['Una probeta',false]],
        exp:'El pH-metro mide acidez; el conductímetro, las sales disueltas.' },

      { id:'ar-sec-16', tema:'invernadero', tipo:'escribe', dif:2,
        q:'¿Cómo se llama el pigmento verde que capta la luz en las hojas?',
        respuestas:['clorofila','la clorofila'],
        exp:'La clorofila absorbe luz roja y azul y refleja la verde: por eso vemos verdes las hojas.' },

      { id:'ar-sec-17', tema:'tormenta', tipo:'opcion', dif:2,
        q:'El efecto invernadero natural de la Tierra…',
        ops:[['Es necesario para la vida, pero se ha intensificado',true],['Siempre ha sido perjudicial',false],['Lo inventó la industria',false]],
        exp:'Sin él la Tierra sería demasiado fría. El problema es su intensificación por gases de origen humano.' },

      { id:'ar-sec-18', tema:'datos', tipo:'vf', dif:2,
        q:'Repetir una medición una sola vez basta para considerarla fiable.',
        correcta:false,
        exp:'Falso. Sin réplicas no se puede distinguir el efecto real de la variación al azar.' },

      { id:'ar-sec-19', tema:'pociones', tipo:'opcion', dif:3,
        q:'Para bajar el pH de la solución nutritiva se usa normalmente…',
        ops:[['Una solución ácida diluida',true],['Sal de mesa',false],['Agua caliente',false]],
        exp:'Se corrige con ácido o base diluidos, siempre poco a poco y midiendo tras cada ajuste.' },

      { id:'ar-sec-20', tema:'abismo', tipo:'escucha', dif:2,
        q:'¿Qué le ocurre a la conductividad eléctrica si se evapora agua del depósito?',
        ops:[['Sube, porque quedan las mismas sales en menos agua',true],['Baja, porque hay menos líquido',false],['No cambia',false]],
        exp:'La evaporación concentra las sales. Por eso se repone agua, no solución completa.' },

      { id:'ar-sec-21', tema:'invernadero', tipo:'opcion', dif:2,
        q:'¿Qué macronutriente es el principal responsable del crecimiento de las hojas?',
        ops:[['Nitrógeno',true],['Calcio',false],['Hierro',false]],
        exp:'El nitrógeno forma parte de proteínas y clorofila: su falta amarillea la hoja.' },

      { id:'ar-sec-22', tema:'taller', tipo:'orden', dif:2,
        q:'Ordena los pasos para preparar la solución nutritiva.',
        pasos:['Medir el volumen de agua','Añadir los nutrientes y disolver','Medir la CE','Ajustar el pH','Registrar los valores'],
        exp:'Primero se disuelve, después se mide, y siempre se anota lo medido.' },

      { id:'ar-sec-23', tema:'datos', tipo:'opcion', dif:3,
        q:'Un gráfico de líneas es más adecuado que uno de barras cuando se quiere mostrar…',
        ops:[['Un cambio a lo largo del tiempo',true],['Partes de un total',false],['Categorías sin orden',false]],
        exp:'Las líneas sugieren continuidad; las barras comparan categorías independientes.' },

      { id:'ar-sec-24', tema:'tormenta', tipo:'escribe', dif:2,
        q:'¿Cuántos Objetivos de Desarrollo Sostenible tiene la Agenda 2030? (número)',
        respuestas:['17','diecisiete'],
        exp:'Diecisiete. El CIEHS se conecta principalmente con el 13, y también con el 2, 3, 4, 6, 12 y 15.' },

      { id:'ar-sec-25', tema:'pociones', tipo:'dial', dif:3,
        q:'Ajusta el pH al centro del rango de la cebollita china (6.0 – 7.0).',
        min:4, max:9, paso:0.1, inicio:4, objetivo:6.5, tolerancia:0.15, unidad:'pH',
        exp:'6.5 es el punto medio. La cebollita tolera un pH algo más alto que la lechuga.' },

      { id:'ar-sec-26', tema:'invernadero', tipo:'vf', dif:2,
        q:'La transpiración de la planta es una pérdida inútil de agua.',
        correcta:false,
        exp:'Falso. La transpiración crea la fuerza que sube el agua y los nutrientes desde la raíz.' },

      { id:'ar-sec-27', tema:'taller', tipo:'opcion', dif:3,
        q:'En el cultivo vertical, el principal reto técnico suele ser…',
        ops:[['Repartir la luz y el riego de forma uniforme',true],['Encontrar semillas pequeñas',false],['Evitar que las hojas sean verdes',false]],
        exp:'Los niveles superiores reciben más luz y los inferiores más agua: hay que compensarlo.' },

      { id:'ar-sec-28', tema:'datos', tipo:'opcion', dif:3,
        q:'¿Por qué en INV-2026-01 se fija el pH entre 5.8 y 6.2 en todos los tratamientos?',
        ops:[['Para que la única diferencia sea la concentración',true],['Porque es más barato',false],['Para que crezcan más rápido',false]],
        exp:'Es una variable de control: si cambiara junto a la concentración, no se sabría a qué se debe el efecto.' },

      { id:'ar-sec-29', tema:'abismo', tipo:'opcion', dif:2,
        q:'La temperatura de la solución influye en el oxígeno disuelto porque…',
        ops:[['El agua caliente retiene menos oxígeno',true],['El agua caliente retiene más oxígeno',false],['No hay relación',false]],
        exp:'Por eso en verano el riesgo de asfixia radicular aumenta en el módulo de raíz flotante.' },

      { id:'ar-sec-30', tema:'tormenta', tipo:'opcion', dif:2,
        q:'¿Qué caracteriza al clima de Huanchaco?',
        ops:[['Costero y árido, con poca lluvia',true],['Tropical y muy lluvioso',false],['Frío de montaña',false]],
        exp:'Ese contexto es la justificación científica del proyecto: poca agua dulce y suelos salinizados.' }
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
        exp:'Por eso se distingue de la biomasa seca, que se obtiene tras deshidratar la muestra.' },

      { id:'ar-pre-11', tema:'pociones', tipo:'dial', dif:3,
        q:'Necesitas 4 L de solución al 25 % partiendo de una al 100 %. Ajusta el volumen de concentrado.',
        min:0, max:6, paso:0.25, inicio:0, objetivo:1, tolerancia:0.25, unidad:'L de concentrado',
        exp:'C₁V₁ = C₂V₂ → 100·V₁ = 25·4 → V₁ = 1 L, y se completa con 3 L de agua.' },

      { id:'ar-pre-12', tema:'datos', tipo:'opcion', dif:3,
        q:'Datos: 8, 9, 10, 11 y 42 cm. ¿Qué medida representa peor al conjunto?',
        ops:[['La media, por culpa del 42',true],['La mediana',false],['El valor mínimo',false]],
        exp:'La media se arrastra hacia los valores extremos; la mediana (10) resiste mejor los atípicos.' },

      { id:'ar-pre-13', tema:'abismo', tipo:'opcion', dif:3,
        q:'Si el volumen del depósito baja de 40 a 34 L en un día, el consumo diario es…',
        ops:[['6 L',true],['34 L',false],['74 L',false]],
        exp:'La diferencia entre lecturas consecutivas da el consumo, clave para calcular el ahorro.' },

      { id:'ar-pre-14', tema:'invernadero', tipo:'vf', dif:3,
        q:'Una planta con más altura siempre tiene más biomasa.',
        correcta:false,
        exp:'Falso. Puede alargarse por falta de luz (etiolación) y tener menos masa. Por eso se miden ambas.' },

      { id:'ar-pre-15', tema:'taller', tipo:'orden', dif:3,
        q:'Ordena el protocolo de calibración de un pH-metro.',
        pasos:['Enjuagar el electrodo','Calibrar con solución pH 7','Calibrar con solución pH 4','Enjuagar de nuevo','Medir la muestra'],
        exp:'Se calibra con dos puntos que rodeen el rango de trabajo; sin calibrar, la lectura no vale.' },

      { id:'ar-pre-16', tema:'tormenta', tipo:'opcion', dif:3,
        q:'La huella hídrica de un alimento mide…',
        ops:[['El agua total usada para producirlo',true],['El agua que contiene al comerlo',false],['El agua que se evapora al cocinarlo',false]],
        exp:'Incluye riego, procesamiento y transporte. Reducirla es parte del argumento del CIEHS.' },

      { id:'ar-pre-17', tema:'pociones', tipo:'escribe', dif:3,
        q:'¿Cómo se llama la magnitud que expresa partes de soluto por millón de partes de solución?',
        respuestas:['ppm','partes por millon','partes por millón'],
        exp:'ppm. Se relaciona con la CE mediante un factor de conversión del conductímetro.' },

      { id:'ar-pre-18', tema:'datos', tipo:'dial', dif:3,
        q:'De 25 plántulas trasplantadas sobreviven 20. Ajusta el porcentaje de sobrevivencia.',
        min:0, max:100, paso:1, inicio:0, objetivo:80, tolerancia:0, unidad:'%',
        exp:'20/25 = 0.8 → 80 %. Es la variable dependiente de sobrevivencia de INV-2026-02.' },

      { id:'ar-pre-19', tema:'invernadero', tipo:'escucha', dif:3,
        q:'¿Cómo se llama el alargamiento anormal del tallo cuando la planta recibe poca luz?',
        ops:[['Etiolación',true],['Clorosis',false],['Necrosis',false]],
        exp:'La clorosis es amarilleo y la necrosis, muerte del tejido. La etiolación es estiramiento por falta de luz.' },

      { id:'ar-pre-20', tema:'abismo', tipo:'vf', dif:3,
        q:'Duplicar la CE de la solución duplica la velocidad de crecimiento.',
        correcta:false,
        exp:'Falso. Existe un óptimo: pasado ese punto aparece estrés osmótico y el crecimiento cae.' },

      { id:'ar-pre-21', tema:'taller', tipo:'opcion', dif:3,
        q:'Una bomba mueve 600 L/h. ¿Cuánto mueve en 15 minutos?',
        ops:[['150 L',true],['40 L',false],['9000 L',false]],
        exp:'15 min es un cuarto de hora: 600 / 4 = 150 L.' },

      { id:'ar-pre-22', tema:'datos', tipo:'opcion', dif:3,
        q:'En un experimento, la aleatorización sirve sobre todo para…',
        ops:[['Repartir al azar los sesgos desconocidos',true],['Ahorrar tiempo',false],['Reducir el número de tratamientos',false]],
        exp:'Los bloques controlan lo conocido; el azar reparte lo que no sabemos que influye.' },

      { id:'ar-pre-23', tema:'pociones', tipo:'opcion', dif:3,
        q:'Un fertilizante indica N-P-K 20-10-10. El primer número corresponde a…',
        ops:[['Nitrógeno',true],['Fósforo',false],['Potasio',false]],
        exp:'N de nitrógeno, P de fósforo y K de potasio, siempre en ese orden.' },

      { id:'ar-pre-24', tema:'tormenta', tipo:'orden', dif:3,
        q:'Ordena de menor a mayor escala geográfica.',
        pasos:['El módulo del laboratorio','El colegio','Huanchaco','La Libertad','El Perú'],
        exp:'Pensar en escalas ayuda a dimensionar el impacto real de una acción local.' },

      { id:'ar-pre-25', tema:'invernadero', tipo:'opcion', dif:3,
        q:'La relación entre superficie de raíz y absorción de nutrientes es…',
        ops:[['A más superficie radicular, mayor capacidad de absorción',true],['Inversa: menos raíz absorbe más',false],['No existe relación',false]],
        exp:'Por eso INV-2026-02 mide longitud y volumen radicular: más raíz es más capacidad.' },

      { id:'ar-pre-26', tema:'datos', tipo:'escribe', dif:3,
        q:'¿Cómo se llama el valor que más se repite en un conjunto de datos?',
        respuestas:['moda','la moda'],
        exp:'La moda. Junto a la media y la mediana forma las tres medidas de tendencia central.' },

      { id:'ar-pre-27', tema:'abismo', tipo:'opcion', dif:3,
        q:'Un módulo de 20 L al que se reponen 2 L diarios funciona 10 días. Si se duplica la evaporación…',
        ops:[['Hará falta reponer el doble para mantener el nivel',true],['El nivel subirá',false],['La CE bajará',false]],
        exp:'Más evaporación es más reposición y sales más concentradas: hay que vigilar la CE.' },

      { id:'ar-pre-28', tema:'taller', tipo:'vf', dif:3,
        q:'Un sensor sin calibrar puede dar lecturas coherentes pero equivocadas.',
        correcta:true,
        exp:'Verdadero. Precisión no es exactitud: puede repetir el mismo error una y otra vez.' },

      { id:'ar-pre-29', tema:'pociones', tipo:'opcion', dif:3,
        q:'La solubilidad de la mayoría de sales en agua, al subir la temperatura…',
        ops:[['Suele aumentar',true],['Siempre disminuye',false],['No cambia nunca',false]],
        exp:'Por eso conviene preparar la solución a temperatura estable y medir después.' },

      { id:'ar-pre-30', tema:'datos', tipo:'opcion', dif:3,
        q:'Presentar solo los datos que confirman la hipótesis es…',
        ops:[['Un sesgo que invalida la investigación',true],['Una buena estrategia de comunicación',false],['Lo normal en ciencia escolar',false]],
        exp:'Los resultados que contradicen la hipótesis también se publican: eso es integridad científica.' }
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
        exp:'Bloquear separa la variación ambiental conocida (luz, temperatura) del efecto del tratamiento.' },

      { id:'ar-uni-11', tema:'invernadero', tipo:'opcion', dif:3,
        q:'La ley del mínimo de Liebig sostiene que el crecimiento lo limita…',
        ops:[['El nutriente que está en menor proporción respecto a la necesidad',true],['El nutriente más abundante',false],['La suma de todos los nutrientes',false]],
        exp:'Añadir más de un nutriente que ya sobra no sirve de nada si otro es el limitante.' },

      { id:'ar-uni-12', tema:'datos', tipo:'opcion', dif:3,
        q:'La desviación estándar de una muestra informa sobre…',
        ops:[['La dispersión de los datos respecto a la media',true],['El valor central',false],['El tamaño de la muestra',false]],
        exp:'Dos grupos con la misma media pueden tener dispersiones muy distintas: la media sola engaña.' },

      { id:'ar-uni-13', tema:'pociones', tipo:'dial', dif:3,
        q:'Ajusta el pH de una solución con [H⁺] = 1×10⁻⁴ M.',
        min:0, max:14, paso:0.5, inicio:0, objetivo:4, tolerancia:0, unidad:'pH',
        exp:'pH = −log(10⁻⁴) = 4. Cada unidad de pH es un factor diez en concentración de protones.' },

      { id:'ar-uni-14', tema:'abismo', tipo:'opcion', dif:3,
        q:'El potencial hídrico del sustrato debe ser… para que la raíz absorba agua.',
        ops:[['Mayor que el de la raíz',true],['Menor que el de la raíz',false],['Exactamente igual',false]],
        exp:'El agua se mueve de mayor a menor potencial. Con CE alta el externo cae y la absorción se frena.' },

      { id:'ar-uni-15', tema:'taller', tipo:'orden', dif:3,
        q:'Ordena las fases de puesta en marcha de un módulo nuevo.',
        pasos:['Prueba de estanqueidad','Calibración de sensores','Llenado y ajuste de solución','Trasplante de plántulas','Registro de línea base'],
        exp:'Sin línea base registrada no hay contra qué comparar los datos posteriores.' },

      { id:'ar-uni-16', tema:'invernadero', tipo:'escribe', dif:3,
        q:'¿Cómo se llama la deficiencia que amarillea el tejido entre las nervaduras de la hoja?',
        respuestas:['clorosis','clorosis intervenal','clorosis internerval'],
        exp:'Clorosis intervenal, típica de la falta de hierro o magnesio en solución hidropónica.' },

      { id:'ar-uni-17', tema:'datos', tipo:'vf', dif:3,
        q:'Correlación entre dos variables implica que una causa la otra.',
        correcta:false,
        exp:'Falso. Puede haber una tercera variable, o coincidencia. La causalidad exige diseño experimental.' },

      { id:'ar-uni-18', tema:'tormenta', tipo:'opcion', dif:3,
        q:'La agricultura de precisión aplicada a un módulo escolar busca sobre todo…',
        ops:[['Aplicar exactamente lo que la planta necesita, cuando lo necesita',true],['Aumentar la superficie cultivada',false],['Sustituir al agricultor',false]],
        exp:'Menos insumo por unidad producida: es la misma lógica del ahorro hídrico del CIEHS.' },

      { id:'ar-uni-19', tema:'pociones', tipo:'opcion', dif:3,
        q:'Una solución tampón (buffer) sirve para…',
        ops:[['Resistir cambios bruscos de pH',true],['Aumentar la conductividad',false],['Eliminar los nutrientes',false]],
        exp:'En hidroponía el volumen es pequeño y el pH deriva rápido: por eso se mide con frecuencia.' },

      { id:'ar-uni-20', tema:'abismo', tipo:'dial', dif:3,
        q:'La CE del depósito es 1.6 y la del agua de reposición 0.4 mS/cm. Ajusta la CE aportada por los nutrientes.',
        min:0, max:3, paso:0.1, inicio:0, objetivo:1.2, tolerancia:0.05, unidad:'mS/cm',
        exp:'1.6 − 0.4 = 1.2 mS/cm. Descontar la CE del agua base evita sobrefertilizar.' },

      { id:'ar-uni-21', tema:'invernadero', tipo:'opcion', dif:3,
        q:'El punto de compensación lumínica de una planta es la intensidad de luz a la que…',
        ops:[['La fotosíntesis iguala a la respiración',true],['La planta deja de transpirar',false],['La raíz deja de crecer',false]],
        exp:'Por debajo de ese punto la planta consume más de lo que produce y pierde biomasa.' },

      { id:'ar-uni-22', tema:'datos', tipo:'opcion', dif:3,
        q:'Un error de tipo I en un contraste de hipótesis consiste en…',
        ops:[['Rechazar la hipótesis nula siendo verdadera',true],['No rechazarla siendo falsa',false],['Medir mal la variable',false]],
        exp:'El error tipo II es el contrario. α fija la probabilidad que aceptamos de cometer el tipo I.' },

      { id:'ar-uni-23', tema:'taller', tipo:'opcion', dif:3,
        q:'La resolución de un sensor es…',
        ops:[['El cambio más pequeño que es capaz de detectar',true],['Su margen de error total',false],['Su vida útil',false]],
        exp:'Un sensor con resolución 0.1 no puede distinguir una diferencia de 0.05, por muy exacto que sea.' },

      { id:'ar-uni-24', tema:'pociones', tipo:'escucha', dif:3,
        q:'¿Qué elemento forma parte de la molécula de clorofila y su falta produce clorosis intervenal?',
        ops:[['Magnesio',true],['Sodio',false],['Cloro',false]],
        exp:'El magnesio es el átomo central de la clorofila. Sin él, la hoja no puede fabricar el pigmento.' },

      { id:'ar-uni-25', tema:'tormenta', tipo:'vf', dif:3,
        q:'Un sistema hidropónico cerrado elimina por completo el riesgo de contaminar acuíferos.',
        correcta:false,
        exp:'Falso. Lo reduce mucho, pero la solución agotada debe gestionarse: verterla sin tratar sigue siendo un vertido.' },

      { id:'ar-uni-26', tema:'datos', tipo:'orden', dif:3,
        q:'Ordena de menor a mayor nivel de evidencia científica.',
        pasos:['Anécdota','Estudio observacional','Experimento controlado','Réplica independiente','Revisión sistemática'],
        exp:'Un resultado gana valor cuando otros lo reproducen, no cuando se repite más alto.' },

      { id:'ar-uni-27', tema:'invernadero', tipo:'opcion', dif:3,
        q:'El índice de área foliar (IAF) relaciona…',
        ops:[['Superficie de hoja con superficie de suelo ocupada',true],['Peso de hoja con peso de raíz',false],['Número de hojas con altura',false]],
        exp:'Es clave en cultivo vertical: más IAF capta más luz, pero también genera más sombra propia.' },

      { id:'ar-uni-28', tema:'abismo', tipo:'opcion', dif:3,
        q:'En recirculación, el desequilibrio nutricional aparece porque…',
        ops:[['La planta absorbe unos iones más rápido que otros',true],['El agua se vuelve ácida sola',false],['La bomba genera sales',false]],
        exp:'Por eso no basta reponer agua: hay que analizar y renovar la solución periódicamente.' },

      { id:'ar-uni-29', tema:'taller', tipo:'escribe', dif:3,
        q:'¿Cómo se llama el registro ordenado de mediciones y observaciones de un experimento?',
        respuestas:['bitacora','bitácora','cuaderno de campo','bitacora de laboratorio','libreta de laboratorio'],
        exp:'La bitácora es el documento primario: sin ella los datos no son verificables ni auditables.' },

      { id:'ar-uni-30', tema:'datos', tipo:'opcion', dif:3,
        q:'Con 3 tratamientos y 4 réplicas, los grados de libertad del error en un ANOVA de una vía son…',
        ops:[['9',true],['12',false],['2',false]],
        exp:'N − k = 12 − 3 = 9. Los del tratamiento son k − 1 = 2.' }
    ]
  };
})(window);
