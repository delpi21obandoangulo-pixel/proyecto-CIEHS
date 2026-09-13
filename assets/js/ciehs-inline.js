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
   · Todo texto guardado se pinta con textContent, NUNCA con innerHTML. Es la
     unica barrera que impide que esta tabla se convierta en un XSS almacenado
     servido a cualquier visitante si el codigo de administracion se filtrase.
     Si algun dia hace falta negrita, se resuelve con lista blanca de etiquetas,
     no quitando esta linea.
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
      // volver si el administrador se arrepiente.
      if (!(clave in estado.originales)) estado.originales[clave] = nodo.textContent;
      if (Object.prototype.hasOwnProperty.call(estado.textos, clave)) {
        // textContent y no innerHTML: ver la nota de seguridad de la cabecera.
        nodo.textContent = estado.textos[clave];
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
      var antes = nodo.textContent;
      nodo.setAttribute('contenteditable', 'plaintext-only');
      // plaintext-only no esta en todos los navegadores; donde no lo esta, el
      // atributo cae a "true" y el pegado podria traer HTML. Se limpia en el
      // propio pegado, mas abajo.
      if (!nodo.isContentEditable) nodo.setAttribute('contenteditable', 'true');
      nodo.classList.add('is-editando');
      nodo.removeAttribute('role');
      nodo.focus();

      var barra = doc.createElement('span');
      barra.className = 'ed-barra ed-barra--texto';
      barra.setAttribute('contenteditable', 'false');

      var guardar = boton('ed-btn ed-btn--ok', 'Guardar este texto', 'Guardar');
      var cancelar = boton('ed-btn', 'Descartar los cambios', 'Cancelar');
      var restaurar = boton('ed-btn ed-btn--sutil', 'Volver al texto original del portal', 'Restaurar');
      barra.appendChild(guardar);
      barra.appendChild(cancelar);
      barra.appendChild(restaurar);

      // Lo guardado se repinta con textContent (ver la nota de seguridad de la
      // cabecera), asi que un parrafo que traia negritas las pierde al
      // guardarse. No se impide -son justo los parrafos que mas se corrigen-,
      // pero se avisa ANTES de pulsar, no despues de haberlo perdido.
      if (nodo.querySelector('b, i, em, strong, a, span')) {
        var aviso = doc.createElement('span');
        aviso.className = 'ed-aviso';
        aviso.textContent = 'Al guardar, este texto perderá sus negritas y cursivas.';
        barra.appendChild(aviso);
      }

      nodo.parentNode.insertBefore(barra, nodo.nextSibling);

      function cerrar() {
        nodo.removeAttribute('contenteditable');
        nodo.classList.remove('is-editando');
        nodo.setAttribute('role', 'button');
        if (barra.parentNode) barra.parentNode.removeChild(barra);
      }

      guardar.addEventListener('click', function () {
        var valor = nodo.textContent.trim();
        guardar.disabled = true;
        D.guardarTexto(clave, valor).then(function () {
          estado.textos[clave] = valor;
          cerrar();
          anunciar('Texto publicado para todo el portal.');
        }).catch(function (e) {
          guardar.disabled = false;
          anunciar('No se pudo guardar: ' + fallo(e), true);
        });
      });

      cancelar.addEventListener('click', function () {
        nodo.textContent = antes;
        cerrar();
      });

      restaurar.addEventListener('click', function () {
        restaurar.disabled = true;
        D.borrarTexto(clave).then(function () {
          delete estado.textos[clave];
          nodo.textContent = estado.originales[clave];
          cerrar();
          anunciar('Texto devuelto al original del portal.');
        }).catch(function (e) {
          restaurar.disabled = false;
          anunciar('No se pudo restaurar: ' + fallo(e), true);
        });
      });

      // Escape cancela, Ctrl/Cmd+Enter guarda: lo que espera cualquiera que
      // haya editado algo alguna vez.
      nodo.addEventListener('keydown', function esc(ev) {
        if (ev.key === 'Escape') { ev.preventDefault(); cancelar.click(); nodo.removeEventListener('keydown', esc); }
        if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); guardar.click(); }
      });
    }

    // Pegado siempre en plano, tambien donde plaintext-only no exista.
    nodo.addEventListener('paste', function (ev) {
      if (!nodo.isContentEditable) return;
      ev.preventDefault();
      var t = (ev.clipboardData || global.clipboardData).getData('text/plain');
      doc.execCommand('insertText', false, t);
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
      if (ev.target.closest && ev.target.closest('#adminModal')) {
        global.setTimeout(revisarSesion, 400);
      }
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
