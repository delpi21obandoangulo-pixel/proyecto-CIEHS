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
   fotografia, y la publicacion se borra desde su propia tarjeta. El panel
   modal sigue existiendo para lo que es genuinamente un formulario (dar de
   alta una investigacion, registrar una lectura), no para editar lo que ya se
   esta viendo.

   COMO FUNCIONA
   -------------
   Todo se gobierna por atributos en el HTML, no por una lista de selectores
   aqui dentro. Un pintor que quiera ser editable solo tiene que rotular:

     data-edit="clave"                 texto editable, guardado en ciehs.textos
     data-edit-img="clave"             imagen reemplazable, en ciehs.imagenes
     data-ciehs-tipo + data-ciehs-id   fila borrable de su tabla
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

    function abrir() {
      if (nodo.isContentEditable) return;
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

  function montarImagen(nodo) {
    if (nodo._edMontado) return;
    nodo._edMontado = true;
    var clave = nodo.getAttribute('data-edit-img');
    var img = nodo.tagName === 'IMG' ? nodo : $('img', nodo);
    if (!img) return;

    var caja = nodo.tagName === 'IMG' ? nodo.parentNode : nodo;
    if (caja && getComputedStyle(caja).position === 'static') caja.classList.add('ed-anclaje');

    var barra = doc.createElement('div');
    barra.className = 'ed-barra ed-barra--img';

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

    var reemplazar = boton('ed-btn ed-btn--ok', 'Reemplazar esta fotografía', 'Reemplazar');
    var quitar = boton('ed-btn ed-btn--peligro', 'Quitar esta fotografía y volver a la del portal', 'Quitar');

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
      D.subirEvidencia(archivo, ruta)
        .then(function () { return D.guardarImagen(clave, ruta, img.alt || null); })
        .then(function (fila) {
          estado.imagenes[clave] = fila;
          aplicarImagenes();
          anunciar('Fotografía reemplazada en todo el portal.');
        })
        .catch(function (e) { anunciar('No se pudo subir: ' + fallo(e), true); })
        .then(function () {
          reemplazar.disabled = false;
          reemplazar.textContent = 'Reemplazar';
          entrada.value = '';
        });
    });

    quitar.addEventListener('click', function () {
      if (!global.confirm('¿Quitar esta fotografía? El portal volverá a mostrar la imagen que trae por defecto.')) return;
      quitar.disabled = true;
      D.borrarImagen(clave).then(function () {
        delete estado.imagenes[clave];
        anunciar('Fotografía retirada. Recarga para ver la imagen por defecto.');
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
    movimiento: { que: 'este movimiento',    fn: function (n) { return D.eliminarMovimiento(n.id); } }
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
          anunciar('Reto corregido.');
        }).catch(function (er) {
          ok.disabled = false;
          anunciar('No se pudo guardar: ' + fallo(er), true);
        });
      });
    });
  }

  /* ------------------------------------------------------ montaje global - */

  // Los atributos de interaccion viven solo mientras dura el modo edicion.
  function marcarEditables(activo) {
    $$('.ed-texto').forEach(function (nodo) {
      if (activo) {
        nodo.setAttribute('tabindex', '0');
        nodo.setAttribute('role', 'button');
        nodo.setAttribute('aria-label',
          'Editar este texto (' + nodo.getAttribute('data-edit') + ')');
      } else {
        nodo.removeAttribute('tabindex');
        nodo.removeAttribute('role');
        nodo.removeAttribute('aria-label');
      }
    });
  }

  function montarTodo() {
    $$('[data-edit]').forEach(montarTexto);
    $$('[data-edit-img]').forEach(montarImagen);
    $$('[data-ciehs-tipo][data-ciehs-id], [data-ciehs-tipo][data-ruta]').forEach(montarBorrable);
    $$('[data-modulo]').forEach(montarModulo);
    $$('[data-arena-id]').forEach(montarArena);
    marcarEditables(estado.editando);
  }

  /* ---------------------------------------------------------- interruptor - */

  var palanca = null;

  function pintarPalanca() {
    if (!palanca) return;
    palanca.setAttribute('aria-pressed', estado.editando ? 'true' : 'false');
    palanca.classList.toggle('is-on', estado.editando);
    $('.ed-palanca-txt', palanca).textContent = estado.editando ? 'Edición activa' : 'Editar portal';
  }

  function alternar(forzar) {
    estado.editando = forzar === undefined ? !estado.editando : !!forzar;
    doc.body.classList.toggle('ciehs-editando', estado.editando);
    if (estado.editando) montarTodo();
    else marcarEditables(false);
    pintarPalanca();
    anunciar(estado.editando
      ? 'Modo edición activo: pulsa sobre cualquier texto o fotografía marcada para cambiarla.'
      : 'Modo edición desactivado.');
  }

  function crearPalanca() {
    if (palanca) return;
    palanca = doc.createElement('button');
    palanca.type = 'button';
    palanca.className = 'ed-palanca';
    palanca.setAttribute('aria-pressed', 'false');
    var punto = doc.createElement('span');
    punto.className = 'ed-palanca-dot';
    punto.setAttribute('aria-hidden', 'true');
    var txt = doc.createElement('span');
    txt.className = 'ed-palanca-txt';
    txt.textContent = 'Editar portal';
    palanca.appendChild(punto);
    palanca.appendChild(txt);
    doc.body.appendChild(palanca);
    palanca.addEventListener('click', function () { alternar(); });
    pintarPalanca();
  }

  function quitarPalanca() {
    alternar(false);
    if (palanca && palanca.parentNode) palanca.parentNode.removeChild(palanca);
    palanca = null;
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
    if (esAdminAhora()) { crearPalanca(); observar(); }
    else if (palanca) { quitarPalanca(); }
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
    recargar: cargar,
    revisar: revisarSesion,
    editando: function () { return estado.editando; }
  };

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();

})(window, document);
