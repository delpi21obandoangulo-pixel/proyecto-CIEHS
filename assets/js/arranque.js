/* ============================================================================
   CIEHS · arranque y red de seguridad

   El portal es una SPA: catorce de sus dieciséis secciones nacen con el atributo
   `hidden` y es ciehs-app.js quien las muestra según la ruta. Eso significa que
   si ese archivo NO llega a ejecutarse —conexión caída a media descarga, un
   bloqueador, una caché corrupta, un error temprano— el visitante se queda con
   la portada, el menú no responde y **el portal no dice absolutamente nada**.
   Parece que funciona. Solo que no lleva a ninguna parte.

   Este archivo es la red de seguridad. Es diminuto y va PRIMERO, en <head> y sin
   defer, para que la marca esté puesta antes del primer pintado y no haya un
   parpadeo de sección revelada.

   Tres estados en <html data-js>:

     (sin atributo)  ni siquiera este archivo corrió — JS desactivado o
                     bloqueado. El CSS revela las secciones: el portal se lee
                     como una sola página larga. Degradado, pero entero.
     "cargando"      este archivo corrió; se espera a la aplicación.
     "listo"         ciehs-app.js arrancó y toma el mando.

   Si tras el plazo seguimos en "cargando", la aplicación no llegó: se retira la
   marca —con lo que el CSS revela todo— y se avisa con un aviso visible.

   Por qué no basta con <noscript>: <noscript> solo se activa cuando el usuario
   tiene JavaScript desactivado. NO se activa cuando el script existe pero falla
   al descargarse o revienta, que es el caso frecuente en una conexión escolar.
   Ese caso lo cubre el vigilante de abajo.
   ========================================================================== */
(function () {
  'use strict';

  var raiz = document.documentElement;
  raiz.setAttribute('data-js', 'cargando');

  // Margen amplio a propósito: en la conexión del laboratorio la primera carga
  // puede tardar. Vale más esperar de sobra que acusar de rota una página que
  // solo iba lenta.
  var PLAZO_MS = 12000;

  function rendirse() {
    if (raiz.getAttribute('data-js') === 'listo') return;

    // Sin la marca, el CSS revela las secciones ocultas y el portal pasa a ser
    // una sola página larga: se puede leer todo, aunque sin navegación.
    raiz.removeAttribute('data-js');

    if (document.getElementById('avisoSinJs')) return;

    var aviso = document.createElement('div');
    aviso.id = 'avisoSinJs';
    aviso.className = 'aviso-sinjs';
    aviso.setAttribute('role', 'alert');

    var texto = document.createElement('p');
    texto.appendChild(document.createTextNode(
      'No se pudo cargar la parte interactiva del portal, así que el menú no ' +
      'responde. Abajo tienes todas las secciones seguidas, una tras otra.'
    ));

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'aviso-sinjs-btn';
    boton.appendChild(document.createTextNode('Reintentar'));
    boton.addEventListener('click', function () { location.reload(); });

    aviso.appendChild(texto);
    aviso.appendChild(boton);

    // Arriba del todo, no al final: apendido al <body> quedaba por debajo del
    // pie de pagina y no lo veia nadie. Es la misma posicion que ocupa el aviso
    // de <noscript>, para que los dos casos se lean igual.
    if (document.body) document.body.insertBefore(aviso, document.body.firstChild);
  }

  var vigilante = setTimeout(rendirse, PLAZO_MS);

  /* La aplicación llama a esto cuando ya ha tomado el mando. Se expone en
     CIEHS_ARRANQUE y no en CIEHS porque ese objeto lo crean los módulos de la
     aplicación, que es justo lo que aquí no se puede dar por hecho. */
  window.CIEHS_ARRANQUE = {
    listo: function () {
      clearTimeout(vigilante);
      raiz.setAttribute('data-js', 'listo');
      var a = document.getElementById('avisoSinJs');
      if (a && a.parentNode) a.parentNode.removeChild(a);
    }
  };

  /* Un error de sintaxis en cualquiera de los scripts del portal impide que la
     aplicación arranque pero no dispara nada visible. Aquí se adelanta el
     desenlace en vez de esperar los doce segundos completos. */
  window.addEventListener('error', function (e) {
    var f = e && e.filename ? String(e.filename) : '';
    if (f.indexOf('/assets/js/') > -1) setTimeout(rendirse, 400);
  });
})();
