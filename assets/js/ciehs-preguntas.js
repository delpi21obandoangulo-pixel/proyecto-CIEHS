/* ============================================================================
   CIEHS · banco de preguntas

   Antes vivian escritas a mano en el HTML: 5 por nivel, siempre las mismas y
   en el mismo orden, asi que se agotaban en una sola sesion de clase. Aqui el
   banco es dato, no maquetado, y el portal baraja una ronda distinta cada vez.

   Los datos cientificos (rangos de pH y CE, codigos de modulo, tratamientos de
   cada investigacion) coinciden con los que publica el resto del portal. Si
   cambian alli, hay que cambiarlos aqui.

   Formato de cada pregunta:
     id   identificador estable. NO cambiarlo: es la clave con la que se guarda
          el progreso del Pasaporte en el navegador del estudiante.
     cat  'ciencia' | 'agua' | 'clima' | 'cultivo' — determina que insignia
          desbloquea acertarla.
     q    enunciado.
     ops  opciones como [texto, esCorrecta].
     exp  explicacion que se muestra tras responder, acierte o falle.
   ========================================================================== */
(function (global) {
  'use strict';

  /* -------------------------------------------------------------------------
     Orden ESTABLE de las opciones.

     En el banco la respuesta correcta va siempre primero, asi que hay que
     barajarlas. Pero un barajado al azar rompe la locucion pregrabada: el
     audio diria "Opcion 1: CIEHS" mientras en pantalla la 1 es otra cosa, que
     es peor que no tener audio.

     La solucion es una permutacion DETERMINISTA a partir del id: siempre la
     misma para una pregunta dada, distinta entre preguntas y con la correcta
     repartida. La usan el portal y el generador del guion, y por eso vive
     aqui: dos copias acabarian discrepando.
     ------------------------------------------------------------------------- */
  function semilla(txt) {
    var h = 2166136261;                       // FNV-1a, corto y suficiente
    for (var i = 0; i < txt.length; i++) {
      h ^= txt.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  global.CIEHS_ORDEN_OPCIONES = function (id, ops) {
    var r = semilla(String(id));
    var a = ops.slice();
    for (var i = a.length - 1; i > 0; i--) {
      r = (Math.imul(r, 1103515245) + 12345) >>> 0;   // congruencial lineal
      var j = r % (i + 1);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  global.CIEHS_PREGUNTAS = {

    /* ===================== INICIAL · Ciclo II (3 a 5 años) =====================
       Lenguaje sensorial y concreto, sin unidades ni tecnicismos. */
    inicial: [
      { id:'inicial-1', cat:'ciencia', q:'¿Cómo se llama el laboratorio de plantas de nuestra institución educativa?',
        ops:[['CIEHS',true],['El patio',false],['La biblioteca',false]],
        exp:'CIEHS significa Centro de Investigación Escolar Hidropónico Sostenible.' },
      { id:'inicial-2', cat:'agua', q:'¿En qué crecen las plantas del CIEHS?',
        ops:[['En agua con nutrientes',true],['Solo en tierra',false],['En arena seca',false]],
        exp:'En hidroponía las raíces reciben agua con alimento disuelto, sin necesitar tierra.' },
      { id:'inicial-3', cat:'clima', q:'Cuidar el agua y las plantas ayuda a…',
        ops:[['Cuidar nuestro planeta',true],['Ensuciar el mar',false],['Gastar más agua',false]],
        exp:'Cuidar el agua y las plantas es parte de la Acción por el Clima, que cuida todo el planeta.' },
      { id:'inicial-4', cat:'cultivo', q:'¿Qué parte de la planta está debajo y bebe el agua?',
        ops:[['La raíz',true],['La flor',false],['La hoja',false]],
        exp:'La raíz es la parte que bebe el agua y sujeta la planta.' },
      { id:'inicial-5', cat:'cultivo', q:'¿De qué color son casi siempre las hojas de la lechuga?',
        ops:[['Verdes',true],['Azules',false],['Moradas con lunares',false]],
        exp:'Las hojas son verdes porque tienen clorofila, que usa la luz del sol.' },
      { id:'inicial-6', cat:'cultivo', q:'¿Qué necesita una semilla para empezar a crecer?',
        ops:[['Agua',true],['Piedras',false],['Oscuridad total para siempre',false]],
        exp:'La semilla necesita agua para despertar y comenzar a germinar.' },
      { id:'inicial-7', cat:'ciencia', q:'Cuando observamos una planta, ¿qué usamos?',
        ops:[['Nuestros sentidos: vista, tacto y olfato',true],['Solo la imaginación',false],['Nada, solo esperamos',false]],
        exp:'Observar es mirar con atención y también tocar y oler con cuidado.' },
      { id:'inicial-8', cat:'agua', q:'En el CIEHS, el agua que riega las plantas…',
        ops:[['Vuelve a usarse otra vez',true],['Se tira al suelo',false],['Se guarda un año',false]],
        exp:'El agua circula y regresa al depósito, así se aprovecha muchas veces.' },
      { id:'inicial-9', cat:'cultivo', q:'¿Qué le pasa a una planta si nunca recibe luz?',
        ops:[['Se pone débil y amarilla',true],['Crece más rápido',false],['Se vuelve azul',false]],
        exp:'Las plantas necesitan luz para fabricar su alimento; sin ella se debilitan.' },
      { id:'inicial-10', cat:'cultivo', q:'¿Cuál de estas plantas cultivamos en el CIEHS?',
        ops:[['Lechuga',true],['Manzano',false],['Cactus gigante',false]],
        exp:'En el CIEHS cultivamos lechuga, espinaca, cebollita china y aromáticas.' },
      { id:'inicial-11', cat:'ciencia', q:'Si quiero saber si mi planta creció, ¿qué hago?',
        ops:[['La mido y anoto lo que veo',true],['La arranco',false],['La escondo',false]],
        exp:'Medir y anotar es lo que hacen los científicos para saber si algo cambió.' },
      { id:'inicial-12', cat:'clima', q:'¿Cuál de estas cosas cuida el planeta?',
        ops:[['Cerrar el caño mientras me enjabono',true],['Dejar el caño abierto',false],['Tirar basura al mar',false]],
        exp:'Cerrar el caño ahorra agua, y el agua es un recurso que hay que cuidar.' },
      { id:'inicial-13', cat:'cultivo', q:'¿Qué parte de la planta suele ser la más alta?',
        ops:[['El tallo',true],['La raíz',false],['La semilla',false]],
        exp:'El tallo sostiene la planta y lleva el agua desde la raíz hasta las hojas.' },
      { id:'inicial-14', cat:'agua', q:'Huanchaco está junto al…',
        ops:[['Mar',true],['Desierto de nieve',false],['Bosque de pinos',false]],
        exp:'Huanchaco es un distrito costero: por eso el agua dulce es un recurso escaso.' },
      { id:'inicial-15', cat:'ciencia', q:'Antes de sembrar, en el CIEHS primero…',
        ops:[['Exploramos y hacemos preguntas',true],['Nos vamos a casa',false],['Rompemos las macetas',false]],
        exp:'La ruta del CIEHS empieza descubriendo y explorando, y luego preguntando.' },
      { id:'inicial-16', cat:'cultivo', q:'Las hojas de la planta sirven para…',
        ops:[['Recibir la luz del sol',true],['Sujetar la maceta',false],['Guardar piedritas',false]],
        exp:'En las hojas la planta usa la luz del sol para fabricar su alimento.' },
      { id:'inicial-17', cat:'agua', q:'¿Qué pasa si una planta recibe demasiada agua parada?',
        ops:[['Sus raíces se pueden pudrir',true],['Crece el doble',false],['No pasa nada',false]],
        exp:'Las raíces también necesitan aire; por eso el agua se mueve y se airea.' },
      { id:'inicial-18', cat:'clima', q:'Reciclar es…',
        ops:[['Volver a usar las cosas en vez de tirarlas',true],['Comprar cosas nuevas siempre',false],['Quemar la basura',false]],
        exp:'Reciclar reduce la basura y cuida el planeta, como dice nuestro mural.' },
      { id:'inicial-19', cat:'ciencia', q:'Un dibujo de lo que observo en la planta sirve para…',
        ops:[['Recordar cómo era y compararlo después',true],['Decorar la pared nada más',false],['Nada',false]],
        exp:'El dibujo de observación es el primer registro científico que aprendemos a hacer.' },
      { id:'inicial-20', cat:'cultivo', q:'¿Qué sale primero cuando germina una semilla?',
        ops:[['Una raicita',true],['Una flor',false],['Un fruto',false]],
        exp:'Primero aparece la raíz, que busca agua; después crece el tallito.' },
      { id:'inicial-21', cat:'clima', q:'El sol nos da…',
        ops:[['Luz y calor',true],['Lluvia',false],['Viento frío',false]],
        exp:'La luz del sol es la energía que las plantas usan para crecer.' },
      { id:'inicial-22', cat:'agua', q:'El agua del mar, ¿sirve para regar las plantas del huerto?',
        ops:[['No, porque tiene mucha sal',true],['Sí, es igual que la del caño',false],['Sí, pero solo los martes',false]],
        exp:'La sal daña las plantas. Por eso en la costa cuidamos tanto el agua dulce.' },
      { id:'inicial-23', cat:'ciencia', q:'Si mi planta creció más que la de mi compañero, eso es…',
        ops:[['Un resultado que puedo contar y comparar',true],['Un secreto',false],['Un error',false]],
        exp:'Comparar resultados es parte de investigar, y compartirlos es el último paso de nuestra ruta.' },
      { id:'inicial-24', cat:'cultivo', q:'¿Qué usamos para medir cuánto creció la planta?',
        ops:[['Una regla',true],['Un imán',false],['Una linterna',false]],
        exp:'Con la regla medimos la altura, y así sabemos cuánto creció cada semana.' }
    ],

    /* ================== PRIMARIA · Ciclos III a V (1.° a 6.°) ==================
       Medicion, registro y comparacion. Ya aparecen unidades sencillas. */
    primaria: [
      { id:'primaria-1', cat:'agua', q:'¿Cuánta agua ahorra la hidroponía frente al cultivo tradicional en suelo?',
        ops:[['Alrededor del 90 %',true],['Alrededor del 10 %',false],['No ahorra nada',false]],
        exp:'Al recircular la solución nutritiva, el CIEHS ahorra cerca del 90 % del agua.' },
      { id:'primaria-2', cat:'cultivo', q:'¿Qué significan las siglas NFT en el módulo MOD-NFT-01?',
        ops:[['Técnica de Película de Nutrientes',true],['Nuevo Filtro de Tierra',false],['Nutriente Fijo Total',false]],
        exp:'NFT es Nutrient Film Technique: una película delgada de solución que recorre el canal.' },
      { id:'primaria-3', cat:'ciencia', q:'Para saber si una planta crece, la mejor forma de saberlo es…',
        ops:[['Medirla cada semana y anotar los datos',true],['Mirarla una sola vez',false],['Preguntarle a un amigo',false]],
        exp:'El registro periódico permite comparar y ver el cambio en el tiempo.' },
      { id:'primaria-4', cat:'clima', q:'El ODS 13 de la Agenda 2030 trata sobre…',
        ops:[['Acción por el Clima',true],['Educación de calidad',false],['Ciudades sostenibles',false]],
        exp:'El ODS 13 es el eje movilizador del CIEHS: medidas urgentes frente al cambio climático.' },
      { id:'primaria-5', cat:'cultivo', q:'¿Qué instrumento usamos para medir la altura de la planta?',
        ops:[['Una regla o cinta métrica',true],['Un termómetro',false],['Una balanza',false]],
        exp:'La altura se mide en centímetros con regla; la balanza sirve para la biomasa.' },
      { id:'primaria-6', cat:'ciencia', q:'En un gráfico de barras del crecimiento semanal, ¿qué va normalmente en el eje horizontal?',
        ops:[['Las semanas',true],['Los centímetros',false],['El nombre de la institución educativa',false]],
        exp:'En el eje horizontal va el tiempo y en el vertical la medida que cambia.' },
      { id:'primaria-7', cat:'agua', q:'En el CIEHS, la solución nutritiva…',
        ops:[['Recircula y se vuelve a usar',true],['Se tira después de cada riego',false],['Solo se usa una vez al año',false]],
        exp:'Se bombea, riega las raíces y vuelve al depósito. Ahí está el ahorro de agua.' },
      { id:'primaria-8', cat:'cultivo', q:'¿Cuántos módulos hidropónicos activos tiene el CIEHS?',
        ops:[['Cuatro',true],['Uno',false],['Diez',false]],
        exp:'NFT, Raíz Flotante, Sustrato y Vertical: MOD-NFT-01 a MOD-VER-04.' },
      { id:'primaria-9', cat:'ciencia', q:'Si comparo semillas en algodón húmedo y en sustrato inerte, ¿qué estoy haciendo?',
        ops:[['Un experimento comparativo',true],['Un dibujo libre',false],['Una encuesta',false]],
        exp:'Comparar dos condiciones para ver cuál funciona mejor es experimentar.' },
      { id:'primaria-10', cat:'clima', q:'¿Por qué en Huanchaco es importante ahorrar agua?',
        ops:[['Porque es una zona costera con poca agua dulce',true],['Porque llueve todos los días',false],['Porque el agua es gratis',false]],
        exp:'Huanchaco tiene clima árido y estrés hídrico: el agua dulce es limitada.' },
      { id:'primaria-11', cat:'cultivo', q:'La cebollita china que cultivamos se llama científicamente…',
        ops:[['Allium fistulosum',true],['Lactuca sativa',false],['Spinacia oleracea',false]],
        exp:'Lactuca sativa es la lechuga y Spinacia oleracea la espinaca.' },
      { id:'primaria-12', cat:'agua', q:'Además de agua, las raíces necesitan…',
        ops:[['Oxígeno',true],['Sal marina',false],['Aceite',false]],
        exp:'Por eso el módulo de Raíz Flotante usa una bomba de aire que oxigena la solución.' },
      { id:'primaria-13', cat:'ciencia', q:'Una bitácora de laboratorio sirve para…',
        ops:[['Anotar de forma ordenada lo que observamos y medimos',true],['Dibujar lo que queramos',false],['Guardar semillas',false]],
        exp:'Sin registro no hay datos, y sin datos no se pueden sacar conclusiones.' },
      { id:'primaria-14', cat:'cultivo', q:'La biomasa fresca de una planta se mide con…',
        ops:[['Una balanza, en gramos',true],['Una regla, en centímetros',false],['Un reloj, en minutos',false]],
        exp:'La biomasa es masa: se pesa. La altura sí se mide con regla.' },
      { id:'primaria-15', cat:'clima', q:'¿Cuál de estas acciones reduce la basura de la institución educativa?',
        ops:[['Separar los residuos para reciclarlos',true],['Mezclarlo todo en un solo tacho',false],['Quemar los papeles',false]],
        exp:'Separar residuos permite reciclar y conecta con el ODS 12, consumo responsable.' },
      { id:'primaria-16', cat:'ciencia', q:'Si mido mi planta un día a las 8 y otro día a las 3, mis datos…',
        ops:[['Son menos comparables: conviene medir siempre igual',true],['Son igual de buenos',false],['Se duplican',false]],
        exp:'Mantener las condiciones constantes hace que los datos se puedan comparar.' },
      { id:'primaria-17', cat:'cultivo', q:'¿Qué es un almácigo?',
        ops:[['El lugar donde germinan las plántulas antes de trasplantarlas',true],['Una herramienta de metal',false],['Un tipo de abono',false]],
        exp:'En el almácigo la semilla germina y crece hasta poder pasar al módulo.' },
      { id:'primaria-18', cat:'agua', q:'El agua que se pierde por evaporación en el cultivo en suelo…',
        ops:[['Es mayor que en un sistema hidropónico cerrado',true],['Es la misma',false],['No existe',false]],
        exp:'En un sistema cerrado se pierde mucha menos agua, y por eso ahorra tanto.' },
      { id:'primaria-19', cat:'ciencia', q:'El número de hojas de una planta es un dato…',
        ops:[['Que se puede contar y anotar cada semana',true],['Imposible de medir',false],['Que no sirve para nada',false]],
        exp:'Altura, número de hojas y biomasa son las tres medidas del CIEHS.' },
      { id:'primaria-20', cat:'clima', q:'El ODS 6 se refiere a…',
        ops:[['Agua limpia y saneamiento',true],['Hambre cero',false],['Acción por el clima',false]],
        exp:'El CIEHS también se conecta con el ODS 6, porque cuida el uso del agua.' },
      { id:'primaria-21', cat:'cultivo', q:'El módulo MOD-VER-04 aprovecha sobre todo…',
        ops:[['El espacio hacia arriba',true],['El agua del mar',false],['La lluvia',false]],
        exp:'El cultivo vertical produce más plantas en menos superficie de suelo.' },
      { id:'primaria-22', cat:'agua', q:'Si el depósito de solución baja mucho de nivel, lo correcto es…',
        ops:[['Avisar y reponer siguiendo el procedimiento',true],['Echar agua de mar',false],['Apagar todo y no decir nada',false]],
        exp:'El nivel del depósito forma parte del mantenimiento del módulo y se registra.' },
      { id:'primaria-23', cat:'ciencia', q:'Cuando comunico mis resultados a la clase, estoy en el paso…',
        ops:[['Comparte',true],['Descubre',false],['Pregunta',false]],
        exp:'Comparte es el noveno y último paso de la ruta pedagógica del CIEHS.' },
      { id:'primaria-24', cat:'cultivo', q:'La espinaca que cultivamos crece mejor con un pH de…',
        ops:[['Entre 6.0 y 6.8',true],['Entre 2 y 3',false],['Entre 10 y 12',false]],
        exp:'Cada cultivo tiene su rango: la espinaca 6.0–6.8 y la lechuga 5.5–6.5.' }
    ],

    /* ============== SECUNDARIA · Ciclos VI a VII (1.° a 5.°) ==============
       Variables, diseno experimental y parametros del laboratorio. */
    secundaria: [
      { id:'secundaria-1', cat:'ciencia', q:'¿Qué mide la conductividad eléctrica (CE) de una solución nutritiva?',
        ops:[['La cantidad de sales disueltas',true],['La temperatura del agua',false],['La cantidad de luz recibida',false]],
        exp:'La CE indica cuántas sales hay disueltas y se expresa en mS/cm.' },
      { id:'secundaria-2', cat:'cultivo', q:'El rango de pH general recomendado para los cultivos del CIEHS es…',
        ops:[['5.5 – 6.5',true],['2.0 – 3.0',false],['8.5 – 9.5',false]],
        exp:'Fuera de ese rango la planta no absorbe bien los nutrientes, aunque estén presentes.' },
      { id:'secundaria-3', cat:'agua', q:'En un sistema NFT, la película de solución debe ser delgada porque…',
        ops:[['Así las raíces reciben nutrientes y oxígeno a la vez',true],['Ahorra electricidad en la bomba',false],['Evita que crezcan las hojas',false]],
        exp:'Si el canal se inunda, las raíces se quedan sin oxígeno y se asfixian.' },
      { id:'secundaria-4', cat:'ciencia', q:'En la investigación INV-2026-01, ¿cuál es la variable independiente?',
        ops:[['La concentración de solución nutritiva',true],['La altura de la planta',false],['El número de hojas',false]],
        exp:'INV-2026-01 manipula la concentración; altura y número de hojas son dependientes.' },
      { id:'secundaria-5', cat:'clima', q:'La hidroponía responde a dos limitantes de Huanchaco:',
        ops:[['Salinización de suelos y estrés hídrico',true],['Exceso de lluvia y frío',false],['Falta de luz y granizo',false]],
        exp:'Al prescindir del suelo y recircular el agua, responde a ambas restricciones.' },
      { id:'secundaria-6', cat:'ciencia', q:'DBCA significa…',
        ops:[['Diseño en Bloques Completamente al Azar',true],['Datos Básicos de Cultivo Anual',false],['Depósito Base de Circulación Automática',false]],
        exp:'Es el diseño de INV-2026-01: 3 tratamientos y 4 réplicas por grupo.' },
      { id:'secundaria-7', cat:'cultivo', q:'Los tratamientos de INV-2026-01 son…',
        ops:[['T1 = 50 %, T2 = 100 % y T3 = 150 %',true],['0, 10 y 20 ml/L',false],['pH 5, 6 y 7',false]],
        exp:'Las dosis de 0, 10 y 20 ml/L corresponden a INV-2026-02, el bioestimulante.' },
      { id:'secundaria-8', cat:'ciencia', q:'¿Para qué sirven las réplicas en un diseño experimental?',
        ops:[['Para distinguir el efecto real de la variación al azar',true],['Para tener más plantas bonitas',false],['Para gastar más solución',false]],
        exp:'Sin réplicas no se puede saber si la diferencia observada es real o casualidad.' },
      { id:'secundaria-9', cat:'agua', q:'Si la CE de la solución sube por encima del rango del cultivo, lo más probable es que…',
        ops:[['Haya exceso de sales y la planta sufra estrés osmótico',true],['Falten nutrientes',false],['El agua esté más limpia',false]],
        exp:'Con CE alta la planta gasta energía en absorber agua y puede deshidratarse.' },
      { id:'secundaria-10', cat:'cultivo', q:'El rango de CE de la espinaca en el CIEHS es…',
        ops:[['1.8 – 2.3 mS/cm',true],['0.1 – 0.3 mS/cm',false],['8 – 10 mS/cm',false]],
        exp:'La espinaca tolera más sales que la lechuga, cuyo rango es 1.2–1.8 mS/cm.' },
      { id:'secundaria-11', cat:'ciencia', q:'Las variables de control de un experimento son las que…',
        ops:[['Se mantienen constantes para no confundir los resultados',true],['Se miden al final',false],['Se cambian a propósito',false]],
        exp:'En INV-2026-01 son fotoperiodo, pH 5.8–6.2, temperatura y volumen de recirculación.' },
      { id:'secundaria-12', cat:'clima', q:'El CIEHS declara alineación con la EDS de la UNESCO. Eso significa que…',
        ops:[['Se inspira en sus enfoques, sin ser un programa oficial suyo',true],['Está certificado por la UNESCO',false],['La UNESCO dirige el laboratorio',false]],
        exp:'El portal lo dice de forma explícita: hay inspiración y alineación, no certificación.' },
      { id:'secundaria-13', cat:'cultivo', q:'El módulo MOD-DWC-02 se conoce en castellano como…',
        ops:[['Raíz Flotante',true],['Película de nutrientes',false],['Cultivo vertical',false]],
        exp:'Deep Water Culture: una balsa sobre el depósito, con aireación forzada constante.' },
      { id:'secundaria-14', cat:'ciencia', q:'La hipótesis de una investigación es…',
        ops:[['Una respuesta provisional que se puede poner a prueba',true],['La conclusión final',false],['Un dato medido',false]],
        exp:'Se formula antes de experimentar y los datos la apoyan o la refutan.' },
      { id:'secundaria-15', cat:'agua', q:'La aireación forzada en el módulo de Raíz Flotante sirve para…',
        ops:[['Mantener oxígeno disuelto disponible para las raíces',true],['Bajar el pH',false],['Calentar la solución',false]],
        exp:'Sin oxígeno disuelto la raíz sumergida se asfixia y aparecen pudriciones.' },
      { id:'secundaria-16', cat:'cultivo', q:'La biomasa fresca se expresa en…',
        ops:[['Gramos',true],['Centímetros',false],['mS/cm',false]],
        exp:'Es la variable dependiente central de INV-2026-01, junto a altura y número de hojas.' },
      { id:'secundaria-17', cat:'clima', q:'¿Qué ODS se relaciona más directamente con producir alimento en la propia escuela?',
        ops:[['ODS 2 · Hambre cero',true],['ODS 4 · Educación de calidad',false],['ODS 15 · Vida de ecosistemas terrestres',false]],
        exp:'El CIEHS conecta con varios ODS; el 2 apunta a la seguridad alimentaria.' },
      { id:'secundaria-18', cat:'ciencia', q:'En INV-2026-02, la variable independiente es…',
        ops:[['La dosis de bioestimulante: 0, 10 y 20 ml/L',true],['La longitud de la raíz',false],['El porcentaje de sobrevivencia',false]],
        exp:'Longitud radicular y sobrevivencia en trasplante son las variables dependientes.' },
      { id:'secundaria-19', cat:'agua', q:'Si el pH de la solución sube a 7.5, lo esperable es que…',
        ops:[['Se bloquee la absorción de algunos micronutrientes',true],['La planta crezca más rápido',false],['No cambie nada',false]],
        exp:'A pH alto el hierro y el manganeso precipitan: están presentes pero no disponibles.' },
      { id:'secundaria-20', cat:'cultivo', q:'El extracto de germinado de lenteja se usa en INV-2026-02 porque aporta…',
        ops:[['Fitohormonas naturales como las auxinas',true],['Sal marina',false],['Colorante verde',false]],
        exp:'Las auxinas estimulan el enraizamiento, que es lo que mide esa investigación.' },
      { id:'secundaria-21', cat:'ciencia', q:'Un grupo control en un experimento sirve para…',
        ops:[['Comparar contra el tratamiento y aislar su efecto',true],['Tener plantas de repuesto',false],['Duplicar los datos',false]],
        exp:'En INV-2026-02 el control es la dosis de 0 ml/L, sin aplicación.' },
      { id:'secundaria-22', cat:'clima', q:'Recircular la solución nutritiva reduce el consumo de agua en torno al…',
        ops:[['90 %',true],['5 %',false],['50 %',false]],
        exp:'Es el indicador que el CIEHS publica en su sección de Datos.' },
      { id:'secundaria-23', cat:'cultivo', q:'El sustrato inerte del módulo MOD-SUS-03 se llama inerte porque…',
        ops:[['No aporta nutrientes: solo da soporte físico',true],['Está muerto',false],['No deja pasar el agua',false]],
        exp:'Todos los nutrientes llegan en la solución, lo que permite controlarlos con precisión.' },
      { id:'secundaria-24', cat:'ciencia', q:'Si dos tratamientos dan resultados muy parecidos, la conclusión honesta es…',
        ops:[['Que con estos datos no se observa una diferencia clara',true],['Elegir el que más nos guste',false],['Repetir hasta que salga distinto',false]],
        exp:'Un resultado sin diferencia también es un resultado válido y hay que reportarlo.' }
    ]
  };
})(window);
