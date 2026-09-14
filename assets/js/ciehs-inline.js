/* ============================================================================
   CIEHS · Edicion in-place (modo administrador)

   QUE SUSTITUYE
   -------------
   Habia un panel de administracion aislado: un modal con doce pestañas que
   repetia, en formularios, contenido que ya estaba en la pagina. Dos
   inventarios de lo mismo, con el defecto clasico de esa arquitectura: para
   corregir una frase habia que adivinar en que pestaña vivia, y al guardarla no
   se veia el resultado hasta cerrar el modal.

   Aqui el administrador ve EL PORTAL, igual que un estudiante. Al activar el
   modo edicion aparecen controles superpuestos sobre lo que de verdad se puede
   cambiar: el texto se edita donde esta, la fotografia se reemplaza sobre la
   fotografia, y la publicacion se edita y se borra desde su propia tarjeta.

   El modal de doce pestañas YA NO EXISTE (2026-09-13). De el queda la puerta:
   teclear el codigo. Los formularios de alta viven en el cajon -.ed-cajon- y
   cada uno se abre desde la seccion a la que pertenece, con su data-alta.

   COMO FUNCIONA
   -------------
   Todo se gobierna por atributos en el HTML, no por una lista de selectores
   aqui dentro. Un pintor que quiera ser editable solo tiene que rotular:

     data-edit="clave"                 texto editable, guardado en ciehs.textos
     data-edit-aviso="..."             pide la venia antes de abrir ese texto
     data-edit-img="clave"             imagen reemplazable, en ciehs.imagenes
     data-edit-fondo="clave"           fondo CSS reemplazable, en ciehs.imagenes
     data-ciehs-tipo + data-ciehs-id   ficha con lapiz y papelera
     data-alta="bitacora"              boton que abre ese formulario en el cajon
     data-modulo="MOD-DWC-01"          modulo con cultivo y rangos editables
     data-arena-id="ar-ini-10"         reto de la arena corregible

   Asi el dia que se añada una seccion no hay que tocar este archivo.

   DOS CAMINOS SEPARADOS
   ---------------------
   1. APLICAR (todos los visitantes, siempre): lo guardado en la base se pinta
      sobre el HTML estatico. Si la base no responde, se queda el HTML: la
      misma mejora progresiva que en el resto del portal.
   2. EDITAR (solo con codigo de administracion activo): los controles.

   SEGURIDAD
   ---------
   · Todo texto guardado se pinta reconstruyendolo contra una LISTA BLANCA de
     etiquetas (b, strong, i, em, br) y sin copiar ni un atributo — ver
     sanearAFragmento. NUNCA se asigna innerHTML con contenido que venga de la
     base: lo que acaba en la pagina son nodos creados aqui. Esa es la barrera
     que impide que esta tabla se convierta en un XSS almacenado servido a
     cualquier visitante si el codigo de administracion se filtrase.

     Hasta 2026-09-13 la barrera era pintar con textContent. Se cambio porque el
     portal tiene 154 parrafos con negrita dentro y editarlos los devolvia en
     plano; la cabecera de entonces ya dejaba dicho que la salida era la lista
     blanca y no relajar la regla. El filtrado se aplica DOS veces, al guardar y
     al pintar: que el valor se saneara al escribirlo no basta, porque la fila
     pudo llegar a la tabla por otra via.

     <a> queda deliberadamente FUERA de la lista. Sin enlaces, un codigo de
     administracion filtrado no permite convertir un parrafo del portal en un
     cebo hacia otro sitio.
   · Las claves se validan contra el mismo patron que el CHECK del servidor
     antes de usarse en un selector.
   · Quien manda de verdad es RLS: sin la cabecera con el codigo correcto,
     is_admin() devuelve false y el servidor rechaza toda escritura, active o no
     el navegador estos controles. Esconder un boton nunca es un control de
     acceso; esto es interfaz, no autorizacion.
   · Los archivos se validan por tipo y tamaño antes de subir, para que un error
     de seleccion no consuma la cuota del plan gratuito.
   ========================================================================== */
(function (global, doc) {
  'use strict';

  var D = global.CIEHSData;
  if (!D) return;

  var CLAVE_OK = /^[a-z0-9][a-z0-9._-]{1,80}$/;
  var TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  // 6 MB y no mas porque es el techo real del bucket ciehs-evidencias
  // (file_size_limit en db/14). Pedir 8 aqui solo servia para que el servidor
  // rechazara la subida despues de gastar la espera, con un error en ingles.
  var MAX_IMAGEN = 6 * 1024 * 1024;

  var estado = {
    editando: false,
    textos: {},      // clave -> valor guardado
    imagenes: {},    // clave -> { storage_path, alt }
    arena: [],       // correcciones de retos
    originales: {}   // clave -> texto que traia el HTML, para poder restaurar
  };

  /* ------------------------------------------------------------ utilidades */

  function $(sel, raiz) { return (raiz || doc).querySelector(sel); }
  function $$(sel, raiz) { return [].slice.call((raiz || doc).querySelectorAll(sel)); }

  function claveValida(c) { return CLAVE_OK.test(String(c || '')); }

  /* ------------------------------------------------- texto con formato ----

     Hasta aqui lo guardado se pintaba con textContent y punto. Era la barrera
     que impedia que esta tabla se convirtiera en un XSS almacenado, y sigue
     siendo obligatorio que exista una barrera — pero tenia un precio que solo
     se veia de cerca: el portal tiene 154 parrafos con negrita dentro, y editar
     uno lo devolvia en texto plano. Con 27 textos rotulados era una molestia;
     rotulado el portal entero, seria la razon por la que nadie usaria esto.

     La cabecera de este archivo ya dejo escrito el camino: «se resuelve con
     lista blanca de etiquetas, no quitando esta linea». Es lo que hay aqui.

     COMO NO SE HACE
     ---------------
     No se limpia con expresiones regulares sobre la cadena. Un HTML mal formado
     se reinterpreta al asignarlo, y toda limpieza por regex acaba teniendo un
     caso que se le escapa.

     COMO SE HACE
     ------------
     Se parsea en un documento INERTE (DOMParser): ahi ni se ejecutan scripts,
     ni se cargan imagenes, ni corre un onerror. Sobre ese arbol muerto se
     reconstruye uno nuevo nodo a nodo, creando SOLO los elementos de la lista
     blanca y SIN copiar ni un atributo. Lo que no esta en la lista no se
     convierte en nada: no hay "quitar lo peligroso", hay "copiar lo permitido".

     Por eso no se asigna innerHTML con contenido ajeno en ningun punto: lo que
     acaba en la pagina son nodos creados aqui con createElement y createTextNode.

     Sin atributos no hay onclick, ni href de javascript:, ni style. Y como <a>
     NO esta en la lista, tampoco hay enlaces: un administrador con el codigo
     filtrado no puede convertir un parrafo en un cebo hacia otro sitio. */

  // Lo unico que se conserva. Deliberadamente corto: es formato de enfasis, no
  // maquetacion. Ampliarlo es una decision de seguridad, no de estilo.
  var ETIQUETAS_RICAS = { B: 1, STRONG: 1, I: 1, EM: 1, BR: 1 };

  // De estos no se conserva ni el contenido. Desenvolver un <script> dejaria su
  // codigo como texto visible en mitad del parrafo: inofensivo, pero absurdo.
  var ETIQUETAS_MUDAS = {
    SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, TITLE: 1, TEXTAREA: 1,
    IFRAME: 1, OBJECT: 1, EMBED: 1, SVG: 1, MATH: 1, HEAD: 1
  };

  // Un texto de enfasis no anida diez niveles. El tope corta de raiz cualquier
  // arbol absurdo que llegue de la base sin tener que razonar sobre su forma.
  var PROFUNDIDAD_MAX = 6;

  function copiarSaneado(origen, destino, profundidad) {
    var hijos = origen.childNodes;
    for (var i = 0; i < hijos.length; i++) {
      var n = hijos[i];

      if (n.nodeType === 3) {                       // texto
        destino.appendChild(doc.createTextNode(n.nodeValue));
        continue;
      }
      if (n.nodeType !== 1) continue;               // comentarios y demas, fuera

      var etiqueta = n.tagName;
      if (ETIQUETAS_MUDAS[etiqueta]) continue;      // ni el elemento ni su contenido

      if (ETIQUETAS_RICAS[etiqueta] && profundidad < PROFUNDIDAD_MAX) {
        // Elemento NUEVO, creado aqui: no se clona el de origen ni se copia un
        // solo atributo. Es la diferencia entre copiar lo permitido y quitar lo
        // peligroso.
        var limpio = doc.createElement(etiqueta);
        if (etiqueta !== 'BR') copiarSaneado(n, limpio, profundidad + 1);
        destino.appendChild(limpio);
      } else {
        // Fuera de la lista: se tira el elemento y se conserva lo que decia,
        // que es lo que el administrador queria escribir.
        copiarSaneado(n, destino, profundidad);
      }
    }
  }

  // Devuelve un fragmento listo para colgar del DOM.
  function sanearAFragmento(html) {
    var frag = doc.createDocumentFragment();
    var texto = String(html == null ? '' : html);
    if (!texto) return frag;
    try {
      var inerte = new global.DOMParser().parseFromString(texto, 'text/html');
      copiarSaneado(inerte.body, frag, 0);
    } catch (e) {
      // Sin DOMParser no se adivina: se degrada a texto plano, que es seguro.
      frag.appendChild(doc.createTextNode(texto));
    }
    return frag;
  }

  // Devuelve la cadena ya saneada, que es lo que viaja a la base. Se obtiene
  // del fragmento ya limpio, nunca del original.
  function sanearACadena(html) {
    var caja = doc.createElement('div');
    caja.appendChild(sanearAFragmento(html));
    return caja.innerHTML;
  }

  // Sustituye el contenido de un nodo por la version saneada de `html`.
  function pintarRico(nodo, html) {
    while (nodo.firstChild) nodo.removeChild(nodo.firstChild);
    nodo.appendChild(sanearAFragmento(html));
  }

  // Region viva unica para anunciar el resultado de cada accion. Sin esto, a
  // quien navega con lector de pantalla un guardado correcto le resulta
  // indistinguible de un clic que no hizo nada.
  var pregon = null;
  function anunciar(texto, esError) {
    if (!pregon) {
      pregon = doc.createElement('p');
      pregon.className = 'ed-pregon';
      pregon.setAttribute('role', 'status');
      pregon.setAttribute('aria-live', 'polite');
      doc.body.appendChild(pregon);
    }
    pregon.classList.toggle('is-error', !!esError);
    pregon.textContent = texto;
    pregon.classList.add('is-visible');
    global.clearTimeout(pregon._t);
    pregon._t = global.setTimeout(function () {
      pregon.classList.remove('is-visible');
    }, esError ? 6000 : 3000);
  }

  function fallo(e) {
    var m = (e && e.message) || 'error desconocido';
    if (/relation .*(textos|imagenes|arena_preguntas)/i.test(m) || /PGRST205/.test(m)) {
      return 'Falta aplicar db/16_contenido_editable.sql en la base del CIEHS.';
    }
    if (/permission denied|PGRST301|JWT/i.test(m)) {
      return 'La base rechazó el cambio: vuelve a entrar con el código.';
    }
    return m;
  }

  /* ------------------------------------------------- foco en un dialogo ---

     Declarar aria-modal="true" es una PROMESA: dice al lector de pantalla que
     mientras esto este abierto no hay nada mas en la pagina. Si el tabulador
     se sale igualmente, la promesa se incumple y es peor que no haberla hecho:
     quien navega con teclado acaba recorriendo el portal de detras sin saber
     que el dialogo sigue abierto, y sin forma de volver.

     Auditado el 2026-09-13: el cajon y la ficha de venia declaraban aria-modal
     y dejaban 41 elementos tabulables fuera. Esto lo cierra.

     Devuelve la funcion que lo suelta todo y DEVUELVE EL FOCO a donde estaba.
     Sin eso, al cerrar el foco se queda en un boton que ya no existe y el
     teclado vuelve al principio del documento: quien pulso «+ Nuevo lote» en
     Trazabilidad aparecia al inicio de la pagina. */
  var FOCOABLES = 'a[href], button:not([disabled]), input:not([disabled]), ' +
                  'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function atraparFoco(caja) {
    var devolverA = doc.activeElement;

    function visibles() {
      return $$(FOCOABLES, caja).filter(function (n) { return n.offsetParent !== null; });
    }

    function alTabular(ev) {
      if (ev.key !== 'Tab') return;
      var lista = visibles();
      if (!lista.length) { ev.preventDefault(); return; }
      var primero = lista[0], ultimo = lista[lista.length - 1];
      // Si el foco se escapo del dialogo -por un clic fuera, por ejemplo- se
      // trae de vuelta en cuanto se tabula.
      if (!caja.contains(doc.activeElement)) { ev.preventDefault(); primero.focus(); return; }
      if (ev.shiftKey && doc.activeElement === primero) { ev.preventDefault(); ultimo.focus(); }
      else if (!ev.shiftKey && doc.activeElement === ultimo) { ev.preventDefault(); primero.focus(); }
    }

    doc.addEventListener('keydown', alTabular, true);

    return function soltar() {
      doc.removeEventListener('keydown', alTabular, true);
      // Solo se devuelve el foco si aquel elemento sigue en la pagina y se
      // puede enfocar; si no, se deja donde este en vez de tirarlo al body.
      if (devolverA && doc.contains(devolverA) && typeof devolverA.focus === 'function') {
        try { devolverA.focus(); } catch (e) { /* elemento ya inservible */ }
      }
    };
  }

  function boton(clase, etiqueta, texto) {
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = clase;
    b.setAttribute('aria-label', etiqueta);
    b.title = etiqueta;
    b.textContent = texto;
    return b;
  }

  /* =========================================================================
     1. APLICAR — lo que ve TODO el mundo
     ========================================================================= */

  function aplicarTextos() {
    $$('[data-edit]').forEach(function (nodo) {
      var clave = nodo.getAttribute('data-edit');
      if (!claveValida(clave)) return;
      // El texto que traia el HTML es el respaldo: se guarda la PRIMERA vez que
      // se ve el nodo, antes de pisarlo, porque es a lo que hay que poder
      // volver si el administrador se arrepiente. Se guarda el HTML, no el
      // texto pelado, o restaurar un parrafo lo devolveria sin sus negritas —
      // que es justo el defecto que esta version viene a quitar.
      if (!(clave in estado.originales)) estado.originales[clave] = nodo.innerHTML;
      if (Object.prototype.hasOwnProperty.call(estado.textos, clave)) {
        // pintarRico y no innerHTML: lo que llega de la base se reconstruye
        // nodo a nodo contra la lista blanca. Que el valor se saneara al
        // guardarlo no basta — la fila pudo escribirse por otra via.
        pintarRico(nodo, estado.textos[clave]);
      }
    });
  }

  function aplicarImagenes() {
    $$('[data-edit-img]').forEach(function (nodo) {
      var clave = nodo.getAttribute('data-edit-img');
      if (!claveValida(clave)) return;
      var fila = estado.imagenes[clave];
      if (!fila || !fila.storage_path) return;
      var url = D.urlEvidencia(fila.storage_path);
      if (!url) return;
      var img = nodo.tagName === 'IMG' ? nodo : $('img', nodo);
      if (!img) return;
      img.src = url;
      if (fila.alt) img.alt = fila.alt;
      // La imagen guardada puede tener otra proporcion que la del HTML: se
      // sueltan las dimensiones fijas o el navegador la deformaria.
      img.removeAttribute('width');
      img.removeAttribute('height');
    });
    aplicarFondos();
  }

  /* ------------------------------------------------------------- fondos --
     El fondo del hero no es una etiqueta <img>: es un background-image que
     vive en el CSS. Era la ultima pieza del portal que no se podia cambiar sin
     tocar el repositorio, y encima es la primera imagen que ve cualquiera.

     Se guarda en la misma tabla que las demas (ciehs.imagenes): es un hueco de
     imagen fijo, que es exactamente para lo que se creo.

     SOBRE LA CSP, que aqui es lo que decide como se hace esto
     --------------------------------------------------------
     La politica de produccion lleva `style-src-attr 'none'` y `style-src
     'self'`. Comprobado con esa misma politica, no de memoria:

       · element.style.backgroundImage = ...   FUNCIONA. style-src-attr gobierna
         el atributo style= del marcado, no la propiedad del CSSOM.
       · <style> creado por JS + sheet.insertRule()   NO FUNCIONA: la hoja ni
         llega a crearse -sheet sale null- porque style-src 'self' no admite una
         hoja en linea sin nonce.

     Es justo al reves de lo que parece a primera vista, y por eso se comprobo.
     La URL de la imagen apunta al bucket de Supabase, que img-src ya permite. */

  function aplicarFondos() {
    $$('[data-edit-fondo]').forEach(function (nodo) {
      var clave = nodo.getAttribute('data-edit-fondo');
      if (!claveValida(clave)) return;
      var fila = estado.imagenes[clave];
      if (!fila || !fila.storage_path) {
        // Sin fila guardada se suelta lo que hubiera puesto una sesion anterior
        // y vuelve a mandar el CSS, que es el respaldo.
        nodo.style.backgroundImage = '';
        return;
      }
      var url = D.urlEvidencia(fila.storage_path);
      if (!url) return;
      // Las comillas importan: una ruta con parentesis o espacios rompe el
      // url() sin ellas, y lo que llega de Storage no se controla desde aqui.
      nodo.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
    });
  }

  // Las correcciones de la arena no se aplican aqui: se dejan disponibles para
  // que ciehs-arena.js las funda con su banco al construir cada ronda. Este
  // archivo no conoce la forma interna de un reto, y no tiene por que.
  function publicarArena() {
    global.CIEHS = global.CIEHS || {};
    global.CIEHS.arenaCorrecciones = estado.arena.slice();
    if (typeof global.CIEHS.recomponerArena === 'function') {
      try { global.CIEHS.recomponerArena(); } catch (e) { /* la arena puede no estar montada */ }
    }
  }

  function cargar() {
    return D.cargarEditable().then(function (r) {
      estado.textos = r.textos || {};
      estado.imagenes = r.imagenes || {};
      estado.arena = r.arena || [];
      aplicarTextos();
      aplicarImagenes();
      publicarArena();
      return r;
    }).catch(function () {
      // Silencio deliberado: sin estas tablas el portal se lee igual.
      return null;
    });
  }

  /* =========================================================================
     2. EDITAR — solo con codigo de administracion activo
     ========================================================================= */

  function esAdminAhora() { return !!(D.codigoActivo && D.codigoActivo()); }

  /* ---------------------------------------------------------- textos ----- */

  function montarTexto(nodo) {
    if (nodo._edMontado) return;
    nodo._edMontado = true;
    var clave = nodo.getAttribute('data-edit');

    // role y tabindex NO se fijan aqui. Se ponen y se quitan con el modo
    // edicion (ver marcarEditables). Si se dejaran puestos, al apagar la
    // edicion un <h4> seguiria anunciandose como boton y no como encabezado, y
    // cada parrafo rotulado seria una parada de tabulacion falsa: el
    // administrador se quedaria con un portal peor que el del estudiante, que
    // es justo lo contrario de lo que persigue la edicion in-place.
    nodo.classList.add('ed-texto');

    /* Hay textos que comprometen algo si se cambian a la ligera: el parrafo que
       declara que los datos son oficiales de la I.E., la pagina de privacidad
       entera, el protocolo de imagen de menores, el descargo frente a la
       UNESCO. Siguen siendo editables —es lo acordado, y no hacerlo obligaria a
       tocar el repositorio para corregir una errata—, pero no a ciegas: quien
       los abra lee primero QUE compromete el cambio.

       No se usa confirm(): un dialogo nativo bloquea la pagina entera, no se
       puede leer con calma y se contesta por inercia. */
    function pedirVenia(aviso, seguir) {
      /* Va suelta del flujo, centrada y fija. Anclarla al parrafo —como hacen
         las fichas de modulo y de arena— la dejaba cortada: basta con que un
         ancestro tenga backdrop-filter para crear un contexto de apilamiento
         nuevo, y entonces el z-index de la ficha ya no vale contra lo que viene
         despues. Ademas esto no es un formulario pegado a un dato: es una
         decision, y una decision se toma mirandola de frente. */
      var velo = doc.createElement('div');
      velo.className = 'ed-venia-velo';

      var ficha = doc.createElement('div');
      ficha.className = 'ed-ficha ed-ficha--venia';
      ficha.setAttribute('role', 'alertdialog');
      ficha.setAttribute('aria-modal', 'true');

      var tit = doc.createElement('p');
      tit.className = 'ed-ficha-tit';
      tit.textContent = 'Texto con consecuencias';
      var cuerpo = doc.createElement('p');
      cuerpo.className = 'ed-venia-texto';
      cuerpo.textContent = aviso;
      ficha.setAttribute('aria-label', 'Texto con consecuencias. ' + aviso);

      var pie = doc.createElement('div');
      pie.className = 'ed-ficha-pie';
      var si = boton('ed-btn ed-btn--ok', 'Editar este texto de todos modos', 'Editar igualmente');
      var no = boton('ed-btn', 'Dejarlo como está', 'Cancelar');
      pie.appendChild(si);
      pie.appendChild(no);

      ficha.appendChild(tit);
      ficha.appendChild(cuerpo);
      ficha.appendChild(pie);
      doc.body.appendChild(velo);
      doc.body.appendChild(ficha);
      var soltarFoco = atraparFoco(ficha);
      no.focus();

      function cerrarVenia() {
        if (ficha.parentNode) ficha.parentNode.removeChild(ficha);
        if (velo.parentNode) velo.parentNode.removeChild(velo);
        doc.removeEventListener('keydown', escapar, true);
        soltarFoco();
      }
      function escapar(ev) { if (ev.key === 'Escape') { ev.preventDefault(); cerrarVenia(); } }
      doc.addEventListener('keydown', escapar, true);

      // cerrarVenia() ya devuelve el foco a donde estaba (atraparFoco).
      velo.addEventListener('click', cerrarVenia);
      no.addEventListener('click', cerrarVenia);
      si.addEventListener('click', function () {
        cerrarVenia();
        // Una vez dada la venia, no se vuelve a pedir para ESTE nodo hasta
        // recargar. Repetirla en cada correccion seria una puerta que se cierra
        // sola y que se acaba abriendo sin leer, que es lo contrario de lo que
        // busca el aviso.
        nodo._edAvisado = true;
        seguir();
      });
    }

    function abrir() {
      if (nodo.isContentEditable) return;
      if (doc.querySelector('.ed-ficha--venia')) return;   // ya hay una pidiendo venia
      var laVenia = nodo.getAttribute('data-edit-aviso');
      if (laVenia && !nodo._edAvisado) { pedirVenia(laVenia, abrirDeVerdad); return; }
      abrirDeVerdad();
    }

    function abrirDeVerdad() {
      var antes = nodo.innerHTML;
      // Antes era plaintext-only: no habia otra opcion, porque lo guardado se
      // repintaba en plano. Ahora el formato sobrevive, asi que el campo lo
      // admite; lo que entra se filtra igual por la lista blanca al guardar.
      nodo.setAttribute('contenteditable', 'true');
      nodo.classList.add('is-editando');
      nodo.removeAttribute('role');
      nodo.focus();

      var barra = doc.createElement('span');
      barra.className = 'ed-barra ed-barra--texto';
      barra.setAttribute('contenteditable', 'false');

      // Negrita y cursiva son lo unico que la lista blanca conserva, asi que es
      // lo unico que se ofrece: un boton que promete mas de lo que el guardado
      // respeta seria peor que no tenerlo.
      var negrita = boton('ed-btn ed-btn--marca', 'Poner en negrita lo seleccionado (Ctrl+B)', 'N');
      var cursiva = boton('ed-btn ed-btn--marca ed-btn--cursiva', 'Poner en cursiva lo seleccionado (Ctrl+I)', 'C');
      var guardar = boton('ed-btn ed-btn--ok', 'Guardar este texto', 'Guardar');
      var cancelar = boton('ed-btn', 'Descartar los cambios', 'Cancelar');
      var restaurar = boton('ed-btn ed-btn--sutil', 'Volver al texto original del portal', 'Restaurar');
      barra.appendChild(negrita);
      barra.appendChild(cursiva);
      barra.appendChild(guardar);
      barra.appendChild(cancelar);
      barra.appendChild(restaurar);

      // El foco esta dentro del nodo editable; si el boton se lo lleva, la
      // seleccion se pierde y execCommand no tiene sobre que actuar.
      function marcar(orden) {
        return function (ev) {
          ev.preventDefault();
          try { doc.execCommand(orden, false, null); } catch (e) { /* navegador sin soporte */ }
          nodo.focus();
        };
      }
      negrita.addEventListener('mousedown', marcar('bold'));
      cursiva.addEventListener('mousedown', marcar('italic'));
      // El teclado no dispara mousedown: sin esto, los dos botones quedaban
      // fuera del alcance de quien no usa raton.
      negrita.addEventListener('click', marcar('bold'));
      cursiva.addEventListener('click', marcar('italic'));

      nodo.parentNode.insertBefore(barra, nodo.nextSibling);

      function cerrar() {
        nodo.removeAttribute('contenteditable');
        nodo.classList.remove('is-editando');
        nodo.setAttribute('role', 'button');
        if (barra.parentNode) barra.parentNode.removeChild(barra);
        // Quitar los atajos es obligatorio, no higiene. Cada apertura añadia
        // los suyos, con SU copia de `antes` y SUS botones ya desprendidos del
        // documento: tras guardar y volver a abrir, un Escape devolvia el texto
        // a un valor de dos ediciones atras.
        nodo.removeEventListener('keydown', atajos);
      }

      function atajos(ev) {
        if (ev.key === 'Escape') { ev.preventDefault(); cancelar.click(); }
        if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); guardar.click(); }
      }

      guardar.addEventListener('click', function () {
        // Lo que sale del campo pasa por la lista blanca ANTES de ir a la base,
        // no solo al pintarse. Asi la fila guardada ya esta limpia y el valor
        // que viaja es exactamente el que se vera.
        var valor = sanearACadena(nodo.innerHTML).trim();
        if (!valor) { anunciar('El texto no puede quedar vacío.', true); return; }
        // El CHECK del servidor corta en 4000 y devolveria un error en ingles
        // sobre una restriccion que aqui nadie ha visto. Mejor decirlo antes.
        if (valor.length > 4000) {
          anunciar('El texto pasa de 4000 caracteres: acórtalo antes de guardar.', true);
          return;
        }
        guardar.disabled = true;
        D.guardarTexto(clave, valor).then(function () {
          estado.textos[clave] = valor;
          // Se repinta con lo saneado y no se deja lo que quedo en el campo:
          // si el navegador metio un <font> o un <div>, lo que ve el
          // administrador debe ser ya lo que vera el visitante.
          pintarRico(nodo, valor);
          cerrar();
          apuntarCambio();
          anunciar('Texto publicado para todo el portal.');
        }).catch(function (e) {
          guardar.disabled = false;
          anunciar('No se pudo guardar: ' + fallo(e), true);
        });
      });

      cancelar.addEventListener('click', function () {
        pintarRico(nodo, antes);
        cerrar();
      });

      restaurar.addEventListener('click', function () {
        restaurar.disabled = true;
        D.borrarTexto(clave).then(function () {
          delete estado.textos[clave];
          pintarRico(nodo, estado.originales[clave]);
          cerrar();
          apuntarCambio();
          anunciar('Texto devuelto al original del portal.');
        }).catch(function (e) {
          restaurar.disabled = false;
          anunciar('No se pudo restaurar: ' + fallo(e), true);
        });
      });

      // Escape cancela, Ctrl/Cmd+Enter guarda: lo que espera cualquiera que
      // haya editado algo alguna vez. Se retiran en cerrar().
      nodo.addEventListener('keydown', atajos);
    }

    // El pegado nunca entra crudo. Antes se forzaba a texto plano porque era la
    // unica forma segura; ahora pasa por la misma lista blanca que todo lo
    // demas, asi que pegar un parrafo de un documento conserva sus negritas y
    // deja fuera el resto —tablas, estilos, enlaces— sin perder el contenido.
    nodo.addEventListener('paste', function (ev) {
      if (!nodo.isContentEditable) return;
      ev.preventDefault();
      var datos = ev.clipboardData || global.clipboardData;
      if (!datos) return;

      var html = datos.getData('text/html');
      if (!html) {
        doc.execCommand('insertText', false, datos.getData('text/plain'));
        return;
      }

      var frag = sanearAFragmento(html);
      var sel = global.getSelection && global.getSelection();
      if (!sel || !sel.rangeCount) { nodo.appendChild(frag); return; }

      var rango = sel.getRangeAt(0);
      rango.deleteContents();
      // Se deja el cursor DESPUES de lo pegado. Sin esto queda delante y seguir
      // escribiendo mete el texto nuevo por detras de lo que acabas de pegar.
      var ultimo = frag.lastChild;
      rango.insertNode(frag);
      if (ultimo) {
        rango.setStartAfter(ultimo);
        rango.collapse(true);
        sel.removeAllRanges();
        sel.addRange(rango);
      }
    });

    nodo.addEventListener('click', function (ev) {
      if (!estado.editando) return;
      ev.preventDefault();
      ev.stopPropagation();
      abrir();
    });
    nodo.addEventListener('keydown', function (ev) {
      if (!estado.editando || nodo.isContentEditable) return;
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrir(); }
    });
  }

  /* --------------------------------------------------------- imagenes ---- */

  function validarImagen(archivo) {
    if (!archivo) return 'No se eligió ningún archivo.';
    if (TIPOS_IMAGEN.indexOf(archivo.type) < 0) {
      return 'Solo se admiten imágenes JPG, PNG, WebP o AVIF.';
    }
    if (archivo.size > MAX_IMAGEN) {
      return 'La imagen pesa ' + (archivo.size / 1048576).toFixed(1) + ' MB; el máximo es 6 MB.';
    }
    return null;
  }

  // Nombre de objeto estable y sin sorpresas: la clave del hueco, la fecha y la
  // extension. El nombre original del archivo no se usa porque suele traer
  // tildes, espacios y, en las fotos de un movil, hasta la fecha y el lugar.
  function rutaPara(clave, archivo) {
    var ext = (archivo.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    return 'inline/' + clave + '-' + Date.now() + '.' + ext;
  }

  /* Sirve a los dos casos: una etiqueta <img> y un fondo CSS. Cambian tres
     cosas —de donde sale la clave, si hay <img> al que tocarle el alt, y donde
     se cuelga la barra— y el resto (validar el archivo, subirlo, guardar la
     fila, quitarla) es identico. Duplicar la funcion habria significado
     arreglar dos veces cada fallo que apareciera en la subida. */
  function montarImagen(nodo) {
    if (nodo._edMontado) return;
    nodo._edMontado = true;

    var esFondo = nodo.hasAttribute('data-edit-fondo');
    var clave = nodo.getAttribute(esFondo ? 'data-edit-fondo' : 'data-edit-img');
    var img = esFondo ? null : (nodo.tagName === 'IMG' ? nodo : $('img', nodo));
    if (!esFondo && !img) return;

    // El hero ocupa la pantalla entera y su fondo esta detras de varias capas:
    // una barra anclada a el quedaria debajo del velo y del titulo. Se cuelga
    // del contenedor que el propio nodo señale, o de la seccion que lo aloja.
    var caja = esFondo
      ? (nodo.closest('[data-page]') || nodo.parentNode)
      : (nodo.tagName === 'IMG' ? nodo.parentNode : nodo);
    if (caja && getComputedStyle(caja).position === 'static') caja.classList.add('ed-anclaje');

    var barra = doc.createElement('div');
    barra.className = 'ed-barra ed-barra--img' + (esFondo ? ' ed-barra--fondo' : '');

    var entrada = doc.createElement('input');
    entrada.type = 'file';
    entrada.accept = TIPOS_IMAGEN.join(',');
    entrada.className = 'u-visually-hidden';
    entrada.id = 'ed-file-' + clave;
    // El control real es el boton de al lado, que lo dispara. El campo queda
    // fuera del recorrido de tabulacion y con nombre propio: u-visually-hidden
    // oculta a la vista pero NO al lector de pantalla, asi que sin esto era una
    // parada de tabulacion que no anunciaba nada.
    entrada.tabIndex = -1;
    entrada.setAttribute('aria-label', 'Archivo de imagen para reemplazar (' + clave + ')');

    var que = esFondo ? 'el fondo de esta sección' : 'esta fotografía';
    var reemplazar = boton('ed-btn ed-btn--ok', 'Reemplazar ' + que, 'Reemplazar');
    var quitar = boton('ed-btn ed-btn--peligro', 'Quitar ' + que + ' y volver a la que trae el portal', 'Quitar');

    barra.appendChild(entrada);
    barra.appendChild(reemplazar);
    barra.appendChild(quitar);
    caja.appendChild(barra);

    reemplazar.addEventListener('click', function () { entrada.click(); });

    entrada.addEventListener('change', function () {
      var archivo = entrada.files && entrada.files[0];
      var mal = validarImagen(archivo);
      if (mal) { anunciar(mal, true); entrada.value = ''; return; }
      reemplazar.disabled = true;
      reemplazar.textContent = 'Subiendo…';
      var ruta = rutaPara(clave, archivo);
      // Lo que hubiera antes queda huerfano en cuanto se guarde la fila
      // nueva: se anota ahora para poder retirarlo despues.
      var rutaAnterior = (estado.imagenes[clave] || {}).storage_path;
      D.subirEvidencia(archivo, ruta)
        .then(function () { return D.guardarImagen(clave, ruta, img ? (img.alt || null) : null); })
        .then(function (fila) {
          estado.imagenes[clave] = fila;
          aplicarImagenes();
          apuntarCambio();
          anunciar(esFondo
            ? 'Fondo cambiado en todo el portal.'
            : 'Fotografía reemplazada en todo el portal.');
          // Ya esta guardada la nueva: la anterior sobra. Se retira sin
          // esperar ni avisar — si falla, lo unico que queda es un archivo
          // de mas, y eso no es motivo para asustar a quien acaba de
          // publicar correctamente.
          if (rutaAnterior && rutaAnterior !== ruta) {
            D.borrarArchivoEvidencia(rutaAnterior);
          }
        })
        .catch(function (e) { anunciar('No se pudo subir: ' + fallo(e), true); })
        .then(function () {
          reemplazar.disabled = false;
          reemplazar.textContent = 'Reemplazar';
          entrada.value = '';
        });
    });

    quitar.addEventListener('click', function () {
      if (!global.confirm('¿Quitar ' + que + '? El portal volverá a mostrar la imagen que trae por defecto.')) return;
      quitar.disabled = true;
      // Se pasa la ruta para que se borre tambien el archivo del bucket.
      var rutaVieja = (estado.imagenes[clave] || {}).storage_path;
      D.borrarImagen(clave, rutaVieja).then(function (r) {
        delete estado.imagenes[clave];
        apuntarCambio();
        // El fondo vuelve solo: se suelta la propiedad y manda otra vez el
        // CSS. Con un <img> no se puede -su src ya se piso- y por eso ahi
        // hay que pedir una recarga.
        var base = esFondo
          ? 'Fondo devuelto al del portal.'
          : 'Fotografía retirada. Recarga para ver la imagen por defecto.';
        if (esFondo) aplicarFondos();
        // Si el archivo no se pudo retirar del bucket se DICE. Callarlo daria
        // por limpio algo que sigue ocupando cuota, y nadie volveria a mirar.
        if (rutaVieja && r && r.archivo === false) {
          anunciar(base + ' El archivo sigue en el almacén: hay que retirarlo a mano.', true);
        } else {
          anunciar(base);
        }
      }).catch(function (e) {
        anunciar('No se pudo quitar: ' + fallo(e), true);
      }).then(function () { quitar.disabled = false; });
    });
  }

  /* ------------------------------------------------ borrar publicaciones -- */

  // Un solo inventario de lo que se puede borrar y como. Cada entrada dice
  // ademas QUE se borra, en castellano, porque ese texto es el que lee el
  // administrador en la confirmacion: "¿Eliminar este comentario?" evita el
  // clic equivocado mucho mejor que "¿Eliminar el elemento?".
  var BORRABLES = {
    aporte:     { que: 'este aporte',        fn: function (n) { return D.eliminarAporte(n.id, n.ruta); } },
    evidencia:  { que: 'esta fotografía',    fn: function (n) { return D.eliminarEvidencia(n.ruta); } },
    comentario: { que: 'este comentario',    fn: function (n) { return D.eliminarComentario(n.id); } },
    recurso:    { que: 'este recurso',       fn: function (n) { return D.eliminarRecurso(n.id); } },
    registro:   { que: 'esta medición',      fn: function (n) { return D.eliminarRegistro(n.id); } },
    resultado:  { que: 'este resultado',     fn: function (n) { return D.eliminarResultado(n.id); } },
    nota:       { que: 'esta nota de campo', fn: function (n) { return D.eliminarNota(n.id); } },
    lote:       { que: 'este lote',          fn: function (n) { return D.eliminarLote(n.id); } },
    producto:   { que: 'este producto',      fn: function (n) { return D.eliminarProducto(n.id); } },
    movimiento: { que: 'este movimiento',    fn: function (n) { return D.eliminarMovimiento(n.id); } },
    // Se retira por CODIGO, no por id numerico: code es la clave de
    // investigations. Y se avisa de que arrastra los resultados, porque
    // resultados cuelga de la investigacion y desaparece con ella.
    investigacion: { que: 'esta investigación y sus resultados', fn: function (n) { return D.eliminarInvestigacion(n.id); } }
  };

  function montarBorrable(nodo) {
    if (nodo._edMontado) return;
    var tipo = nodo.getAttribute('data-ciehs-tipo');
    var def = BORRABLES[tipo];
    if (!def) return;
    nodo._edMontado = true;

    var b = boton('ed-borrar', 'Eliminar ' + def.que, '×');

    // Una fila de tabla no admite position:relative de forma fiable en todos
    // los navegadores, asi que el boton se ancla a su ultima celda en lugar de
    // a la fila. Es la diferencia entre un boton en su esquina y un boton
    // flotando sobre la esquina superior izquierda de la tabla entera.
    var anfitrion = nodo;
    if (nodo.tagName === 'TR') {
      anfitrion = nodo.lastElementChild || nodo;
    }
    if (getComputedStyle(anfitrion).position === 'static') anfitrion.classList.add('ed-anclaje');
    anfitrion.appendChild(b);

    /* Borrar no era suficiente. Para cambiar el precio de un producto o la
       fecha de un lote habia que ir al panel y buscar la fila en una lista,
       que es exactamente el camino que la edicion in-place vino a quitar.

       El lapiz abre el formulario de ESA fila, ya relleno. No se reescribe
       ningun formulario: se reutiliza el que ya existe, igual que hace el
       boton «Editar» de la lista del panel. Solo aparece si app.js dice que
       ese tipo tiene editor, asi que un tipo sin formulario no enseña un
       lapiz que no lleva a ninguna parte. */
    if (global.CIEHS && global.CIEHS.puedeEditarFicha && global.CIEHS.puedeEditarFicha(tipo)) {
      var lapiz = boton('ed-lapiz ed-lapiz--ficha', 'Editar ' + def.que, '✎');
      anfitrion.appendChild(lapiz);
      lapiz.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var clave = nodo.getAttribute('data-ciehs-id');
        lapiz.disabled = true;
        global.CIEHS.editarFicha(tipo, clave).then(function (ok) {
          lapiz.disabled = false;
          if (!ok) anunciar('No se pudo abrir el formulario de esta ficha.', true);
        }).catch(function (e) {
          lapiz.disabled = false;
          anunciar('No se pudo abrir: ' + fallo(e), true);
        });
      });
    }

    b.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!global.confirm('¿Eliminar ' + def.que + '? No se puede deshacer.')) return;
      b.disabled = true;
      def.fn({
        id: nodo.getAttribute('data-ciehs-id'),
        ruta: nodo.getAttribute('data-ruta') || nodo.getAttribute('data-ciehs-ruta')
      }).then(function () {
        // Se retira de la vista al instante y ademas se recarga: lo primero es
        // la respuesta inmediata que espera quien acaba de pulsar, lo segundo
        // garantiza que lo que queda en pantalla es lo que hay en la base.
        nodo.classList.add('ed-borrado');
        global.setTimeout(function () { if (nodo.parentNode) nodo.parentNode.removeChild(nodo); }, 220);
        apuntarCambio();
          anunciar('Eliminado.');
        if (global.CIEHS && global.CIEHS.refrescarDatos) global.CIEHS.refrescarDatos();
      }).catch(function (e) {
        b.disabled = false;
        anunciar('No se pudo eliminar: ' + fallo(e), true);
      });
    });
  }

  /* ------------------------------------------------- modulos (dist.) ----- */

  var CAMPOS_MODULO = [
    { k: 'crop',  et: 'Cultivo',   tipo: 'text',   attr: 'cultivo' },
    { k: 'phMin', et: 'pH mínimo', tipo: 'number', attr: 'phmin', paso: '0.1' },
    { k: 'phMax', et: 'pH máximo', tipo: 'number', attr: 'phmax', paso: '0.1' },
    { k: 'ceMin', et: 'CE mínima', tipo: 'number', attr: 'cemin', paso: '0.1' },
    { k: 'ceMax', et: 'CE máxima', tipo: 'number', attr: 'cemax', paso: '0.1' }
  ];

  function montarModulo(nodo) {
    if (nodo._edMontado) return;
    nodo._edMontado = true;
    var code = nodo.getAttribute('data-modulo');
    if (getComputedStyle(nodo).position === 'static') nodo.classList.add('ed-anclaje');

    var b = boton('ed-lapiz', 'Editar el cultivo y los rangos de ' + code, '✎');
    nodo.appendChild(b);

    b.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if ($('.ed-ficha', nodo)) return;

      var ficha = doc.createElement('form');
      ficha.className = 'ed-ficha';
      var h = doc.createElement('p');
      h.className = 'ed-ficha-tit';
      h.textContent = code;
      ficha.appendChild(h);

      var entradas = {};
      CAMPOS_MODULO.forEach(function (c) {
        var lab = doc.createElement('label');
        var sp = doc.createElement('span');
        sp.textContent = c.et;
        var inp = doc.createElement('input');
        inp.type = c.tipo;
        if (c.paso) inp.step = c.paso;
        inp.value = nodo.getAttribute('data-' + c.attr) || '';
        lab.appendChild(sp);
        lab.appendChild(inp);
        ficha.appendChild(lab);
        entradas[c.k] = inp;
      });

      var acciones = doc.createElement('div');
      acciones.className = 'ed-ficha-pie';
      var ok = boton('ed-btn ed-btn--ok', 'Guardar el módulo', 'Guardar');
      ok.type = 'submit';
      var no = boton('ed-btn', 'Cerrar sin guardar', 'Cancelar');
      acciones.appendChild(ok);
      acciones.appendChild(no);
      ficha.appendChild(acciones);
      nodo.appendChild(ficha);
      entradas.crop.focus();

      no.addEventListener('click', function () { ficha.remove(); });

      ficha.addEventListener('submit', function (e2) {
        e2.preventDefault();
        var cambios = { code: code };
        CAMPOS_MODULO.forEach(function (c) { cambios[c.k] = entradas[c.k].value.trim(); });
        if (Number(cambios.phMin) > Number(cambios.phMax)) {
          anunciar('El pH mínimo no puede ser mayor que el máximo.', true); return;
        }
        if (Number(cambios.ceMin) > Number(cambios.ceMax)) {
          anunciar('La CE mínima no puede ser mayor que la máxima.', true); return;
        }
        ok.disabled = true;
        D.guardarModulo(cambios).then(function () {
          ficha.remove();
          anunciar(code + ' actualizado.');
          if (global.CIEHS && global.CIEHS.refrescarDatos) global.CIEHS.refrescarDatos();
        }).catch(function (er) {
          ok.disabled = false;
          anunciar('No se pudo guardar: ' + fallo(er), true);
        });
      });
    });
  }

  /* ---------------------------------------------------- retos de arena --- */

  // Se edita el enunciado y la explicacion, que es el 90 % de las correcciones
  // reales (una errata, una frase que confunde). Cambiar el TIPO de reto o el
  // numero de opciones es rehacerlo, y eso sigue siendo trabajo de codigo: una
  // interfaz que lo permitiera invitaria a dejar un reto sin respuesta correcta.
  function montarArena(nodo) {
    if (nodo._edMontado) return;
    nodo._edMontado = true;
    var id = nodo.getAttribute('data-arena-id');
    if (getComputedStyle(nodo).position === 'static') nodo.classList.add('ed-anclaje');

    var b = boton('ed-lapiz', 'Corregir el reto ' + id, '✎');
    nodo.appendChild(b);

    b.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if ($('.ed-ficha', nodo)) return;

      var ficha = doc.createElement('form');
      ficha.className = 'ed-ficha ed-ficha--ancha';
      var h = doc.createElement('p');
      h.className = 'ed-ficha-tit';
      h.textContent = 'Reto ' + id;
      ficha.appendChild(h);

      function campo(etiqueta, valor, filas) {
        var lab = doc.createElement('label');
        var sp = doc.createElement('span');
        sp.textContent = etiqueta;
        var ta = doc.createElement('textarea');
        ta.rows = filas;
        ta.value = valor || '';
        ta.maxLength = 600;
        lab.appendChild(sp);
        lab.appendChild(ta);
        ficha.appendChild(lab);
        return ta;
      }

      var actual = nodo.getAttribute('data-arena-q') || '';
      var explic = nodo.getAttribute('data-arena-exp') || '';
      var taQ = campo('Enunciado', actual, 3);
      var taE = campo('Explicación al acertar', explic, 3);

      var acciones = doc.createElement('div');
      acciones.className = 'ed-ficha-pie';
      var ok = boton('ed-btn ed-btn--ok', 'Guardar la corrección', 'Guardar');
      ok.type = 'submit';
      var quitar = boton('ed-btn ed-btn--sutil', 'Deshacer la corrección y volver al reto original', 'Restaurar');
      var no = boton('ed-btn', 'Cerrar sin guardar', 'Cancelar');
      acciones.appendChild(ok);
      acciones.appendChild(quitar);
      acciones.appendChild(no);
      ficha.appendChild(acciones);
      nodo.appendChild(ficha);
      taQ.focus();

      no.addEventListener('click', function () { ficha.remove(); });

      quitar.addEventListener('click', function () {
        quitar.disabled = true;
        D.borrarArenaPregunta(id).then(function () {
          estado.arena = estado.arena.filter(function (a) { return a.id !== id; });
          publicarArena();
          ficha.remove();
          // El reto original vuelve en la siguiente ronda; el atributo se deja
          // como esta porque este nodo desaparece al pasar de reto.
          apuntarCambio();
          anunciar('Reto devuelto a su versión original.');
        }).catch(function (e) {
          quitar.disabled = false;
          anunciar('No se pudo restaurar: ' + fallo(e), true);
        });
      });

      ficha.addEventListener('submit', function (e2) {
        e2.preventDefault();
        var q = taQ.value.trim();
        if (!q) { anunciar('El enunciado no puede quedar vacío.', true); return; }
        var payload = { q: q, exp: taE.value.trim() };
        ok.disabled = true;
        D.guardarArenaPregunta(id, payload, false).then(function (fila) {
          estado.arena = estado.arena.filter(function (a) { return a.id !== id; });
          estado.arena.push(fila);
          publicarArena();
          // Los atributos son la fuente de la que se rellena esta ficha. Sin
          // refrescarlos, reabrir el lapiz mostraba el enunciado viejo y daba
          // la impresion de que el guardado no habia funcionado.
          nodo.setAttribute('data-arena-q', payload.q);
          nodo.setAttribute('data-arena-exp', payload.exp);
          ficha.remove();
          apuntarCambio();
          anunciar('Reto corregido.');
        }).catch(function (er) {
          ok.disabled = false;
          anunciar('No se pudo guardar: ' + fallo(er), true);
        });
      });
    });
  }

  /* ------------------------------------------------------ montaje global - */

  /* Los atributos de interaccion viven solo mientras dura el modo edicion, y
     desde 2026-09-13 solo dentro del bloque abierto: ver 3 bis. Poner
     tabindex en los 583 textos del portal convertia la tabulacion en un
     campo de minas y llenaba la pantalla de contornos. */
  function marcarEditables(activo, raiz) {
    $$('.ed-texto', raiz || doc).forEach(function (nodo) {
      if (activo) {
        nodo.setAttribute('tabindex', '0');
        nodo.setAttribute('role', 'button');
        /* Antes esto leia la clave entera. Con 27 textos rotulados pasaba; con
           el portal entero rotulado, un lector de pantalla dictaria
           «metodologia punto peai guion card punto reciben guion cosecha…» en
           cada parada de tabulacion. La clave es para el codigo, no para quien
           escucha: aqui basta con decir que se puede editar, y avisar si lo que
           hay debajo tiene consecuencias. */
        nodo.setAttribute('aria-label', nodo.hasAttribute('data-edit-aviso')
          ? 'Editar este texto. Atención: cambiarlo tiene consecuencias.'
          : 'Editar este texto');
      } else {
        nodo.removeAttribute('tabindex');
        nodo.removeAttribute('role');
        nodo.removeAttribute('aria-label');
      }
    });
  }

  /* -------------------------------------------- los botones de alta ----- */

  /* Cada seccion trae en el HTML el boton que abre SU formulario
     (data-alta="bitacora" junto a la bitacora, y asi). Aqui solo se enchufan:
     el sitio donde aparecen lo decide el documento, como el resto de rotulos.

     Antes esto era una barra de doce pestañas dentro de un modal: para dar de
     alta un lote habia que abrir el panel, encontrar «Bitacora» entre doce
     nombres y pulsar «+ Nuevo lote». Ahora el boton esta al lado de la bitacora
     y no hay nada que elegir. */
  function montarAlta(nodo) {
    if (nodo._edMontado) return;
    nodo._edMontado = true;
    var panel = nodo.getAttribute('data-alta');
    nodo.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (!global.CIEHS || typeof global.CIEHS.abrirCajon !== 'function') {
        anunciar('El formulario todavía no está disponible.', true);
        return;
      }
      global.CIEHS.abrirCajon(panel);
    });
  }

  /* =======================================================================
     3 BIS. EL BLOQUE ABIERTO - administrar no es ver el portal desarmado

     Hasta ahora, entrar en administracion pintaba un contorno discontinuo
     sobre CADA texto rotulado. Con 27 rotulos aquello se leia; con 583 el
     portal se convertia en un plano de despiece y no habia manera de juzgar
     como queda una pagina mientras se edita.

     Ahora el modo administracion no marca nada por si solo. Cada bloque
     -una seccion, una tarjeta, el pie- lleva UN lapiz, y solo al pulsarlo se
     abre ese bloque: dentro aparecen los contornos y las paradas de
     tabulacion, y fuera el portal sigue viendose como lo ve un visitante.
     Solo hay un bloque abierto a la vez.
     ======================================================================= */

  /* QUE CUENTA COMO BLOQUE

     Primero se probo con una lista de contenedores -section, article, .card-.
     Medido sobre el portal, fallaba: en /investigaciones el unico bloque era
     la seccion entera, 7260 px y 24 editables, con su lapiz perdido arriba
     del todo. Eso no es un bloque, es la pagina.

     Tampoco vale una lista de las clases reales -.carpeta-block, .aportes,
     .ciencia-block...-: hay una distinta por pagina y la lista se quedaria
     corta a la primera seccion nueva.

     La regla es estructural y no mide alturas, porque las rutas ocultas miden
     cero y el montaje ocurre sobre el documento entero:

       1. Si el texto vive dentro de una tarjeta, la tarjeta ES el bloque.
       2. Si no, se sube hasta el elemento que sea hijo directo del
          contenedor de la seccion: el .wrap de una pagina tiene por hijos
          justo los bloques de contenido de esa pagina.

     Medido: 583 editables en 147 bloques, mediana de 3 por bloque, el mayor
     con 27 y ninguno suelto. Ademas NINGUN data-edit vive dentro de una ficha
     -[data-ciehs-tipo], [data-modulo], [data-arena-id]-, asi que el lapiz de
     bloque y el de ficha nunca se pisan: son cosas distintas en sitios
     distintos. */
  var SEL_TARJETA   = 'article, .card, .priv-bloque';
  var SEL_CONTENEDOR = 'section, main, footer, [data-page], .wrap, .menu-panel';
  var bloqueAbierto = null;

  function bloqueDe(nodo) {
    var tarjeta = nodo.closest(SEL_TARJETA);
    if (tarjeta) return tarjeta;
    var n = nodo.parentElement;
    while (n && n !== doc.body) {
      var padre = n.parentElement;
      if (!padre) break;
      if (padre.matches(SEL_CONTENEDOR)) return n;
      n = padre;
    }
    return nodo.closest('section, footer') || nodo.parentElement;
  }

  function lapizDe(bloque) {
    if (!bloque) return null;
    var hijos = bloque.children;
    for (var i = 0; i < hijos.length; i++) {
      if (hijos[i].classList.contains('ed-lapiz-bloque')) return hijos[i];
    }
    return null;
  }

  function montarBloque(bloque) {
    if (bloque._edBloque) return;
    bloque._edBloque = true;
    bloque.classList.add('ed-bloque');
    if (getComputedStyle(bloque).position === 'static') bloque.classList.add('ed-anclaje');

    var lapiz = boton('ed-lapiz-bloque', 'Editar este bloque', '\u270E');
    lapiz.setAttribute('aria-expanded', 'false');
    // El lapiz va absoluto: dentro de un grid o un flex, un hijo mas en el
    // flujo correria la maquetacion del bloque que dice venir a editar.
    lapiz.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      abrirBloque(bloque === bloqueAbierto ? null : bloque);
    });
    bloque.appendChild(lapiz);
  }

  function pintarLapiz(bloque, abierto) {
    var lapiz = lapizDe(bloque);
    if (!lapiz) return;
    lapiz.textContent = abierto ? '\u2713' : '\u270E';
    var et = abierto ? 'Cerrar este bloque' : 'Editar este bloque';
    lapiz.setAttribute('aria-label', et);
    lapiz.title = et;
    lapiz.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  }

  function abrirBloque(bloque) {
    if (bloqueAbierto) {
      bloqueAbierto.classList.remove('ed-bloque--abierto');
      marcarEditables(false, bloqueAbierto);
      pintarLapiz(bloqueAbierto, false);
    }
    bloqueAbierto = bloque || null;
    if (!bloqueAbierto) { anunciar('Bloque cerrado.'); return; }
    bloqueAbierto.classList.add('ed-bloque--abierto');
    marcarEditables(true, bloqueAbierto);
    pintarLapiz(bloqueAbierto, true);
    anunciar('Bloque abierto: ya puedes pulsar sobre sus textos e imagenes. Escape lo cierra.');
  }

  /* Escape cierra el bloque, pero NO si acaba de cerrar un editor de texto o
     un aviso: esos ya llaman a preventDefault, y cerrar las dos cosas de una
     tecla haria perder el sitio donde se estaba trabajando. */
  doc.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape' || ev.defaultPrevented || !bloqueAbierto) return;
    var lapiz = lapizDe(bloqueAbierto);
    abrirBloque(null);
    if (lapiz) lapiz.focus();   // el foco vuelve a donde se abrio, no al vacio
  });

  function montarBloques() {
    var vistos = [];
    $$('[data-edit], [data-edit-img], [data-edit-fondo]').forEach(function (nodo) {
      var b = bloqueDe(nodo);
      if (b && vistos.indexOf(b) < 0) vistos.push(b);
    });
    vistos.forEach(montarBloque);
  }

  function montarTodo() {
    $$('[data-alta]').forEach(montarAlta);
    $$('[data-edit]').forEach(montarTexto);
    $$('[data-edit-img]').forEach(montarImagen);
    $$('[data-edit-fondo]').forEach(montarImagen);
    $$('[data-ciehs-tipo][data-ciehs-id], [data-ciehs-tipo][data-ruta]').forEach(montarBorrable);
    $$('[data-modulo]').forEach(montarModulo);
    $$('[data-arena-id]').forEach(montarArena);
    montarBloques();
    /* Ya NO se marca el portal entero: lo marca abrirBloque, y solo el bloque
       que se abra. Si habia uno abierto y un repintado lo ha sustituido, se
       pierde la referencia y se cierra: mejor eso que dejar medio bloque
       marcado sobre nodos que ya no estan en el documento. */
    if (bloqueAbierto && !doc.contains(bloqueAbierto)) abrirBloque(null);
    else if (bloqueAbierto) marcarEditables(true, bloqueAbierto);
  }

  /* =========================================================================
     3. LA BARRA — administrar no es abrir un menu, es estar en el portal

     Antes esto era una palanca flotante en una esquina: entrabas con el codigo,
     se abria un modal con doce pestañas, y ademas habia que encontrar y pulsar
     un boton suelto para que el portal se dejara editar. Tres pasos para lo que
     es un solo estado.

     Ahora el codigo correcto ES el estado: el portal entra en administracion y
     lo dice una barra fija arriba, por encima de la cabecera. Mientras esa
     barra este, lo que se ve es el portal de verdad -el mismo que ve un
     estudiante- con sus controles encima.

     «Ver como visitante» apaga los controles sin cerrar la sesion, que es lo
     que se necesita cada dos por tres para comprobar como queda algo. «Salir»
     si cierra: tira el codigo y devuelve el portal a su estado publico.
     ========================================================================= */

  var barraAdmin = null;
  var cambios = 0;

  function pintarBarra() {
    if (!barraAdmin) return;
    var ver = $('.ed-admin-ver', barraAdmin);
    ver.setAttribute('aria-pressed', estado.editando ? 'false' : 'true');
    ver.textContent = estado.editando ? 'Ver como visitante' : 'Volver a editar';
    $('.ed-admin-estado', barraAdmin).textContent = estado.editando
      ? 'Modo administración'
      : 'Administración en pausa';
    var cuenta = $('.ed-admin-cuenta', barraAdmin);
    cuenta.hidden = cambios === 0;
    cuenta.textContent = cambios === 1 ? '1 cambio publicado' : cambios + ' cambios publicados';
    // Estos textos cambian de largo -y el contador aparece al primer guardado-,
    // asi que la barra puede pasar a dos lineas. Se vuelve a medir aqui o la
    // cabecera se quedaria con el hueco de la altura anterior.
    medirBarra();
  }

  /* La cabecera del portal es sticky a top:0 y hay que bajarla justo lo que
     mide la barra. No vale una constante: la barra crece a dos lineas en movil
     y con el texto del sistema en grande, y una cifra fija dejaria la cabecera
     montada encima o con un hueco. Se mide y se publica como variable CSS. */
  function medirBarra() {
    if (!barraAdmin) return;
    var alto = barraAdmin.getBoundingClientRect().height;
    doc.documentElement.style.setProperty('--ed-admin-alto', Math.round(alto) + 'px');
  }

  var midiendo = null;
  global.addEventListener('resize', function () {
    if (!barraAdmin) return;
    global.clearTimeout(midiendo);
    midiendo = global.setTimeout(medirBarra, 120);
  });

  // Lo llaman los guardados y los borrados. El contador no persiste a proposito:
  // cuenta lo hecho en ESTA sesion, que es lo que uno quiere saber antes de
  // marcharse, no un historico -para eso esta la columna actualizado-.
  function apuntarCambio() { cambios++; pintarBarra(); }

  function alternar(forzar) {
    estado.editando = forzar === undefined ? !estado.editando : !!forzar;
    doc.body.classList.toggle('ciehs-editando', estado.editando);
    if (estado.editando) montarTodo();
    else { abrirBloque(null); marcarEditables(false); }
    pintarBarra();
    anunciar(estado.editando
      ? 'Modo administración activo: cada bloque tiene un lápiz; púlsalo para abrirlo y editarlo.'
      : 'Controles ocultos: el portal se ve como lo ve un visitante.');
  }

  function crearBarra() {
    if (barraAdmin) return;

    barraAdmin = doc.createElement('div');
    barraAdmin.className = 'ed-admin';
    // role=region y no banner: ya hay un banner en la pagina -la cabecera-, y
    // dos landmarks del mismo tipo sin distinguir es peor que uno bien puesto.
    barraAdmin.setAttribute('role', 'region');
    barraAdmin.setAttribute('aria-label', 'Barra de administración del portal');

    var izq = doc.createElement('div');
    izq.className = 'ed-admin-izq';
    var punto = doc.createElement('span');
    punto.className = 'ed-admin-dot';
    punto.setAttribute('aria-hidden', 'true');
    var texto = doc.createElement('b');
    texto.className = 'ed-admin-estado';
    texto.textContent = 'Modo administración';
    var pista = doc.createElement('span');
    pista.className = 'ed-admin-pista';
    // Tiene que decir el primer paso REAL. Antes decia «pulsa sobre cualquier
    // texto», que era cierto cuando el portal entero salia marcado; ahora hay
    // que abrir el bloque primero y, sin esta pista, no hay forma de adivinarlo.
    pista.textContent = 'Pulsa el lápiz de un bloque para abrirlo y editarlo.';
    var cuenta = doc.createElement('span');
    cuenta.className = 'ed-admin-cuenta';
    cuenta.hidden = true;
    izq.appendChild(punto);
    izq.appendChild(texto);
    izq.appendChild(pista);
    izq.appendChild(cuenta);

    var der = doc.createElement('div');
    der.className = 'ed-admin-der';
    var ver = boton('ed-admin-btn ed-admin-ver', 'Ocultar los controles y ver el portal como un visitante', 'Ver como visitante');
    ver.setAttribute('aria-pressed', 'false');
    // El boton «Formularios» era provisional y ya cumplio: cada formulario se
    // abre desde su seccion. Queda solo la portada, que no tiene una seccion
    // propia donde poner un boton -es el hero, y no hay donde anclarlo sin
    // taparlo-.
    if (global.CIEHS && typeof global.CIEHS.abrirPortada === 'function') {
      var portada = boton('ed-admin-btn', 'Editar el título, el lema y los indicadores de la portada', 'Portada');
      portada.addEventListener('click', function () { global.CIEHS.abrirPortada(); });
      der.appendChild(portada);
    }
    var salir = boton('ed-admin-btn ed-admin-btn--salir', 'Cerrar la sesión de administración', 'Salir');
    der.appendChild(ver);
    der.appendChild(salir);

    barraAdmin.appendChild(izq);
    barraAdmin.appendChild(der);
    // Delante de todo: la cabecera es sticky y la barra tiene que quedar por
    // encima de ella, no flotando sobre el contenido.
    doc.body.insertBefore(barraAdmin, doc.body.firstChild);
    doc.body.classList.add('ciehs-admin');
    medirBarra();

    ver.addEventListener('click', function () { alternar(); });
    salir.addEventListener('click', function () {
      var hechos = cambios;
      D.salir();
      quitarBarra();
      anunciar(hechos
        ? 'Sesión de administración cerrada. ' + hechos + (hechos === 1 ? ' cambio queda publicado.' : ' cambios quedan publicados.')
        : 'Sesión de administración cerrada.');
    });

    pintarBarra();
  }

  function quitarBarra() {
    alternar(false);
    if (barraAdmin && barraAdmin.parentNode) barraAdmin.parentNode.removeChild(barraAdmin);
    barraAdmin = null;
    cambios = 0;
    doc.body.classList.remove('ciehs-admin');
    /* Los lapices y las papeleras que ya se montaron se quedan en el DOM, y es
       deliberado. Comprobado al salir: cero visibles, cero alcanzables con el
       tabulador y ningun [data-edit] conserva su role="button" —el portal queda
       identico al publico, tambien para un lector de pantalla—.

       Retirarlos de verdad obligaria a desmontar los oyentes que montarTexto
       colgo de cada nodo, y sin guardar sus referencias lo unico que se puede
       hacer es borrar el nodo y reiniciar la marca _edMontado. Eso duplicaria
       los oyentes al volver a entrar, y entonces un solo clic abriria el editor
       dos veces. Se cambia el dia que haga falta desmontar de verdad; hoy seria
       arriesgar un fallo real para limpiar nodos que nadie puede alcanzar. */
  }

  /* Cada vez que un pintor repinta su seccion aparecen nodos nuevos sin
     controles. En lugar de pedir a cada pintor que avise, se observa el DOM:
     asi la edicion in-place no obliga a modificar quince funciones distintas ni
     se rompe cuando mañana se añada la decimosexta. */
  var observador = null;
  function observar() {
    if (observador || !global.MutationObserver) return;
    var pendiente = null;
    observador = new MutationObserver(function () {
      if (!estado.editando) return;
      global.clearTimeout(pendiente);
      pendiente = global.setTimeout(montarTodo, 80);
    });
    observador.observe(doc.body, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------------- arranque - */

  function revisarSesion() {
    if (esAdminAhora()) {
      var estrenando = !barraAdmin;
      crearBarra();
      observar();
      // El codigo correcto es el estado: se entra editando. Antes habia que
      // acertar ademas con una palanca suelta en una esquina, que es el paso
      // que hacia que esto pareciera un menu mas y no el portal.
      // Solo al estrenar la barra: si el administrador pidio «ver como
      // visitante», volver el foco a la ventana no debe deshacerselo.
      if (estrenando) alternar(true);
    } else if (barraAdmin) {
      // La sesion caduca por inactividad en ciehs-data.js. Cuando eso pasa hay
      // que decirlo: si la barra desapareciera sin mas, el siguiente guardado
      // fallaria con un 401 y pareceria que el codigo estaba mal.
      quitarBarra();
      anunciar('La sesión de administración caducó por inactividad. Vuelve a entrar con el código.', true);
    }
  }

  function arrancar() {
    cargar().then(revisarSesion);
    // El codigo se teclea en el modal, que vive en otro modulo. En vez de
    // acoplarlos, se comprueba al volver el foco y tras cada clic en el modal:
    // barato, y sin que este archivo tenga que conocer al panel.
    doc.addEventListener('click', function (ev) {
      if (!ev.target.closest || !ev.target.closest('#adminModal')) return;
      // Entrar con codigo implica una ida y vuelta a la base y luego un
      // refresco del portal. Un unico sondeo a los 400 ms acertaba con buena
      // conexion y fallaba justo donde importa, que es la del laboratorio: la
      // palanca no aparecia hasta el siguiente clic. Se sondea unas cuantas
      // veces y se para en cuanto hay codigo.
      var intentos = 0;
      var t = global.setInterval(function () {
        intentos++;
        revisarSesion();
        if (esAdminAhora() || intentos >= 10) global.clearInterval(t);
      }, 400);
    });
    global.addEventListener('focus', revisarSesion);
  }

  global.CIEHS = global.CIEHS || {};
  global.CIEHS.inline = {
    // El cajon de formularios vive en app.js y declara aria-modal igual que
    // los dialogos de aqui: comparte la trampa en vez de tener otra propia.
    atraparFoco: atraparFoco,
    recargar: cargar,
    revisar: revisarSesion,
    editando: function () { return estado.editando; }
  };

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();

})(window, document);
