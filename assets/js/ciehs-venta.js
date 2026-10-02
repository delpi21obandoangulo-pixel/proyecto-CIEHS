/* ============================================================================
   CIEHS · Venta de lechuga (2026-10-02)

   La novedad del portal: la primera venta de lechuga hidropónica del CIEHS.
   Este archivo hace cuatro cosas:

   1. PORTADA — la sección #venta (justo debajo del hero): video promocional
      grande, precios en vivo desde la base y un botón «Reservar».
      El video se publica dejando el archivo en /assets/video/venta-lechuga.mp4
      (y su portada en /assets/video/venta-lechuga.jpg). Mientras no exista, se
      ve la foto de la cosecha con el rótulo «Video promocional · muy pronto».

   2. RESERVA EN UN MINUTO — una hoja con: cuántas lechugas (botones grandes −/+),
      quién reserva (estudiante, padre/madre, docente, comunidad), nombre y
      teléfono. Usa el mismo alta de siempre (CIEHSData.crearPedido: tablas
      ciehs.orders + ciehs.pedido_lineas, sin lectura pública). El rol y el grado
      viajan en `notes` con formato fijo para poder contarlos después:
        «[Venta] Rol: Padre o madre · Grado: 3.° B · Recojo: …»
      Si la base frena por exceso de pedidos en un minuto (db/09: 12/min), se
      reintenta solo, con cuenta atrás, sin que la persona tenga que hacer nada.

   3. FOTOS DE PRODUCTO — en el formulario de producto de la administración, un
      botón para SUBIR la foto (antes había que escribir la ruta a mano, y se
      acababa pegando un enlace blob: de WhatsApp Web que no sirve). La imagen
      se reescala y se recodifica en el navegador (adiós metadatos/GPS).
      Una foto guardada inválida (blob:, data:) se sustituye por la de cosecha.

   4. PANEL DE LA VENTA (solo coordinación) — reservas en tiempo casi real
      (se refresca cada 30 s): totales, unidades e ingreso estimado por
      producto, por quién reserva y por día; lista con nombre, contacto,
      cantidades y estado (confirmar / entregado / anular), y descarga CSV.
      Los datos personales solo se leen con el código de administración (RLS).
   ========================================================================== */
(function(){
  'use strict';

  var CIEHS = window.CIEHS || {};
  var D = window.CIEHSData;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FOTO_RESPALDO = '/assets/img/evidencias/cosecha-empaque-900.webp';
  var VIDEO = '/assets/video/venta-lechuga.mp4';
  var ROLES = ['Estudiante', 'Padre o madre', 'Docente', 'Comunidad'];

  function $(id){ return document.getElementById(id); }
  function h(tag, cls, txt){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(txt != null) e.textContent = txt;
    return e;
  }
  function soles(n){ return 'S/ ' + Number(n || 0).toFixed(2); }
  function snap(){ return (CIEHS.snapshot && CIEHS.snapshot()) || null; }

  /* Una ruta de foto sirve si es del bucket o https. «blob:» y «data:» son
     enlaces temporales de otra pestaña (WhatsApp Web…) y nunca cargan. */
  function fotoValida(r){ return !!r && !/^(blob:|data:)/i.test(r) && !/whatsapp\.com/i.test(r); }
  function urlFoto(p){
    if(p && fotoValida(p.foto_path) && D && D.urlEvidencia) return D.urlEvidencia(p.foto_path);
    return FOTO_RESPALDO;
  }
  // Cualquier foto de producto que no cargue (en la tienda o aquí) cae a la de
  // cosecha en lugar de quedarse como icono roto.
  document.addEventListener('error', function(e){
    var img = e.target;
    if(!img || img.tagName !== 'IMG' || img.getAttribute('data-respaldo')) return;
    if(!img.closest('.prod-foto, .venta-prod, .vr-prod')) return;
    img.setAttribute('data-respaldo', '1');
    img.src = FOTO_RESPALDO;
  }, true);

  function enVenta(){
    var s = snap();
    var l = ((s && s.productos) || []).filter(function(p){ return p.published !== false && p.estado === 'disponible'; });
    // Primero las lechugas: son la venta de hoy.
    l.sort(function(a, b){ return (/lechuga/i.test(b.nombre) ? 1 : 0) - (/lechuga/i.test(a.nombre) ? 1 : 0); });
    return l;
  }

  /* ======================================================================
     1. LA SECCIÓN DE LA PORTADA
     ====================================================================== */
  var seccion = $('venta');
  var gridPrecios = $('ventaProductos');
  var marco = seccion && seccion.querySelector('.venta-video');

  if(marco){
    var video = marco.querySelector('video');
    // ¿Ya se subió el video? Si no, se queda la portada de respaldo.
    if(video && window.fetch){
      fetch(VIDEO, { method:'HEAD' }).then(function(r){
        var tipo = r.headers.get('content-type') || '';
        if(r.ok && /video/i.test(tipo)){
          marco.classList.add('con-video');
          var src = document.createElement('source');
          src.src = VIDEO; src.type = 'video/mp4';
          video.appendChild(src);
          video.load();
          fetch('/assets/video/venta-lechuga.jpg', { method:'HEAD' }).then(function(r2){
            if(r2.ok && /image/i.test(r2.headers.get('content-type') || '')) video.poster = '/assets/video/venta-lechuga.jpg';
          }).catch(function(){});
        }
      }).catch(function(){});
    }
  }

  function pintarPrecios(){
    if(!gridPrecios) return;
    var l = enVenta();
    gridPrecios.textContent = '';
    if(!l.length){
      gridPrecios.appendChild(h('p', 'venta-sinstock', 'Las reservas se abren en cuanto la cosecha esté lista.'));
      return;
    }
    l.forEach(function(p){
      var c = h('div', 'venta-prod');
      var img = h('img'); img.src = urlFoto(p); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      var tx = h('div');
      tx.appendChild(h('b', null, p.nombre));
      tx.appendChild(h('span', null, (p.precio_pen != null && Number(p.precio_pen) > 0 ? soles(p.precio_pen) : 'Precio por confirmar') + ' / ' + (p.unidad || 'unidad')));
      c.appendChild(img); c.appendChild(tx);
      gridPrecios.appendChild(c);
    });
    pintarMisReservas();
  }

  /* «Ya reservaste» — solo en este dispositivo y sin nombres: los equipos del
     laboratorio son compartidos. */
  var CLAVE = 'ciehs.reservas';
  function misReservas(){ try{ return JSON.parse(localStorage.getItem(CLAVE) || '[]') || []; }catch(e){ return []; } }
  function guardarReserva(r){
    var l = misReservas(); l.unshift(r);
    try{ localStorage.setItem(CLAVE, JSON.stringify(l.slice(0, 10))); }catch(e){}
  }
  function pintarMisReservas(){
    var cont = $('ventaMias');
    if(!cont) return;
    var l = misReservas();
    cont.hidden = !l.length;
    if(!l.length) return;
    var u = l.reduce(function(s, r){ return s + (r.unidades || 0); }, 0);
    cont.textContent = 'Desde este dispositivo ya reservaste ' + u + (u === 1 ? ' unidad' : ' unidades')
      + ' (' + l.length + (l.length === 1 ? ' reserva' : ' reservas') + '). Código de la última: ' + l[0].codigo + '.';
  }

  /* ======================================================================
     2. LA RESERVA EN UN MINUTO
     ====================================================================== */
  var velo = h('div', 'apt-velo vr-velo'); velo.hidden = true;
  var hoja = h('div', 'apt vr'); hoja.hidden = true;
  hoja.setAttribute('role', 'dialog');
  hoja.setAttribute('aria-modal', 'true');
  hoja.setAttribute('aria-labelledby', 'vrTit');
  hoja.innerHTML =
    '<header class="apt-cab"><div class="apt-cab-tx"><p class="apt-paso-txt">Venta de lechuga del CIEHS</p>'
  + '<h2 class="apt-tit" id="vrTit">Reserva tus lechugas</h2></div>'
  + '<button type="button" class="apt-cerrar" data-vr-cerrar aria-label="Cerrar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>'
  + '<div class="apt-cuerpo">'
  +   '<form class="vr-form" novalidate>'
  +     '<p class="vr-et">1. ¿Cuántas quieres?</p><div class="vr-prods"></div>'
  +     '<p class="vr-et">2. ¿Quién reserva?</p><div class="vr-roles" role="radiogroup" aria-label="Quién reserva"></div>'
  +     '<p class="vr-et">3. Tus datos para entregártelas</p>'
  +     '<div class="vr-campos">'
  +       '<label class="form-field"><span>Nombre y apellido</span><input type="text" name="nombre" maxlength="80" autocomplete="name" required placeholder="Ej.: Rosa Paredes"></label>'
  +       '<label class="form-field"><span>Celular o WhatsApp</span><input type="tel" name="contacto" maxlength="40" inputmode="tel" autocomplete="tel" required placeholder="9XX XXX XXX"></label>'
  +       '<label class="form-field vr-grado"><span>Grado y sección <small>(del estudiante)</small></span><input type="text" name="grado" maxlength="20" placeholder="3.° B"></label>'
  +       '<label class="form-field"><span>¿Cuándo la recoges? <small>(opcional)</small></span><input type="text" name="recojo" maxlength="80" placeholder="Hoy a la salida, mañana en el recreo…"></label>'
  +     '</div>'
  +     '<p class="vr-hp" aria-hidden="true"><label>No llenar<input type="text" name="web" tabindex="-1" autocomplete="off"></label></p>'
  +     '<p class="vr-priv">Tus datos solo los ve la coordinación del CIEHS para entregarte el pedido. Nunca se publican.</p>'
  +     '<div class="vr-enviar"><button type="submit" class="btn btn-primary">Reservar</button><p class="vr-estado" role="status" aria-live="polite"></p></div>'
  +   '</form>'
  +   '<div class="vr-ok" hidden></div>'
  + '</div>';
  document.body.appendChild(velo);
  document.body.appendChild(hoja);

  var form = hoja.querySelector('.vr-form');
  var cajaProds = hoja.querySelector('.vr-prods');
  var cajaRoles = hoja.querySelector('.vr-roles');
  var boton = hoja.querySelector('.vr-enviar .btn');
  var estadoEl = hoja.querySelector('.vr-estado');
  var okEl = hoja.querySelector('.vr-ok');
  var campoGrado = hoja.querySelector('.vr-grado');
  var cant = {}, rol = '', enviando = false, focoPrevio = null;

  ROLES.forEach(function(r, i){
    var b = h('button', 'vr-rol', r);
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', 'false');
    b.addEventListener('click', function(){ elegirRol(r); });
    cajaRoles.appendChild(b);
  });
  function elegirRol(r){
    rol = r;
    [].forEach.call(cajaRoles.children, function(b){ b.setAttribute('aria-checked', b.textContent === r ? 'true' : 'false'); });
    campoGrado.hidden = !(r === 'Estudiante' || r === 'Padre o madre');
  }

  function pintarProductos(){
    var l = enVenta();
    cajaProds.textContent = '';
    if(!l.length){
      cajaProds.appendChild(h('p', 'vr-vacio', 'Ahora mismo no hay productos disponibles para reservar.'));
      return;
    }
    l.forEach(function(p){
      if(cant[p.id] == null) cant[p.id] = 0;
      var fila = h('div', 'vr-prod');
      var img = h('img'); img.src = urlFoto(p); img.alt = ''; img.decoding = 'async';
      var tx = h('div', 'vr-prod-tx');
      tx.appendChild(h('b', null, p.nombre));
      tx.appendChild(h('span', null, (p.precio_pen != null && Number(p.precio_pen) > 0 ? soles(p.precio_pen) : 'Precio por confirmar') + ' / ' + (p.unidad || 'unidad')));
      var paso = h('div', 'vr-paso');
      var menos = h('button', null, '−'); menos.type = 'button'; menos.setAttribute('aria-label', 'Una menos de ' + p.nombre);
      var num = h('output', 'tabular', String(cant[p.id]));
      var mas = h('button', null, '+'); mas.type = 'button'; mas.setAttribute('aria-label', 'Una más de ' + p.nombre);
      menos.addEventListener('click', function(){ cambiar(p.id, -1, num, fila); });
      mas.addEventListener('click', function(){ cambiar(p.id, 1, num, fila); });
      paso.appendChild(menos); paso.appendChild(num); paso.appendChild(mas);
      fila.appendChild(img); fila.appendChild(tx); fila.appendChild(paso);
      fila.classList.toggle('is-sel', cant[p.id] > 0);
      cajaProds.appendChild(fila);
    });
    actualizarTotal();
  }
  function cambiar(id, d, num, fila){
    cant[id] = Math.max(0, Math.min(50, (cant[id] || 0) + d));
    num.textContent = String(cant[id]);
    fila.classList.toggle('is-sel', cant[id] > 0);
    if(!reduceMotion){ num.classList.remove('salta'); void num.offsetWidth; num.classList.add('salta'); }
    actualizarTotal();
  }
  function lineas(){
    return enVenta().filter(function(p){ return cant[p.id] > 0; }).map(function(p){
      return { id:p.id, nombre:p.nombre, unidad:p.unidad, precio:p.precio_pen, cantidad:cant[p.id] };
    });
  }
  function actualizarTotal(){
    var l = lineas();
    var u = l.reduce(function(s, x){ return s + x.cantidad; }, 0);
    var t = l.reduce(function(s, x){ return s + (x.precio ? Number(x.precio) * x.cantidad : 0); }, 0);
    boton.textContent = u ? 'Reservar ' + u + (u === 1 ? ' unidad' : ' unidades') + (t ? ' · ' + soles(t) : '') : 'Elige cuántas quieres';
    boton.disabled = !u || enviando;
  }

  function aviso(t, error){ estadoEl.textContent = t || ''; estadoEl.classList.toggle('error', !!error); }

  /* El freno de la base (12 altas por minuto entre TODOS) puede saltar si
     media escuela reserva a la vez. Se reintenta solo con espera creciente. */
  var ESPERAS = [8, 15, 25, 40, 60];
  function enviarConReintento(datos, intento){
    return D.crearPedido(datos).catch(function(e){
      var m = (e && e.message) || '';
      if(/demasiadas solicitudes/i.test(m) && intento < ESPERAS.length){
        var s = ESPERAS[intento];
        return new Promise(function(res){
          var t = setInterval(function(){
            aviso('Hay mucha gente reservando ahora mismo. Reintentamos solos en ' + s + ' s… no cierres esta ventana.');
            if(--s <= 0){ clearInterval(t); res(); }
          }, 1000);
        }).then(function(){ aviso('Reintentando…'); return enviarConReintento(datos, intento + 1); });
      }
      throw e;
    });
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if(enviando) return;
    var f = form.elements;
    if(f.web.value){ mostrarOk('000000', [], 0, ''); return; }          // robot
    if(!D || !D.listo){ aviso('No hay conexión con la base del CIEHS. Revisa tu internet y vuelve a intentarlo.', true); return; }
    var l = lineas();
    if(!l.length){ aviso('Elige cuántas lechugas quieres.', true); return; }
    if(!rol){ aviso('Dinos quién reserva: estudiante, padre o madre, docente o comunidad.', true); cajaRoles.firstChild.focus(); return; }
    var nombre = f.nombre.value.trim(), contacto = f.contacto.value.trim();
    if(nombre.length < 2){ aviso('Escribe tu nombre para poder entregarte el pedido.', true); f.nombre.focus(); return; }
    if(contacto.replace(/\D/g, '').length < 6 && contacto.indexOf('@') < 0){ aviso('Deja un celular (o correo) para confirmarte la entrega.', true); f.contacto.focus(); return; }
    var grado = campoGrado.hidden ? '' : f.grado.value.trim();
    var recojo = f.recojo.value.trim();
    var nota = ('[Venta] Rol: ' + rol + (grado ? ' · Grado: ' + grado : '') + (recojo ? ' · Recojo: ' + recojo : '')).slice(0, 480);

    enviando = true; actualizarTotal(); aviso('Reservando…');
    enviarConReintento({ nombre:nombre, contacto:contacto, nota:nota, lineas:l }, 0).then(function(id){
      var codigo = String(id || '').replace(/-/g, '').slice(0, 6).toUpperCase();
      var u = l.reduce(function(s, x){ return s + x.cantidad; }, 0);
      var t = l.reduce(function(s, x){ return s + (x.precio ? Number(x.precio) * x.cantidad : 0); }, 0);
      guardarReserva({ codigo:codigo, unidades:u, total:t, f:Date.now(), lineas:l.map(function(x){ return x.cantidad + '× ' + x.nombre; }) });
      mostrarOk(codigo, l, t, contacto);
      pintarMisReservas();
    }).catch(function(err){
      aviso('No se pudo reservar: ' + ((err && err.message) || 'error desconocido') + '. Inténtalo de nuevo en un momento.', true);
    }).then(function(){ enviando = false; actualizarTotal(); });
  });

  function mostrarOk(codigo, l, total, contacto){
    form.hidden = true;
    okEl.hidden = false;
    okEl.textContent = '';
    var ico = h('span', 'apt-ok-ico');
    ico.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
    var caja = h('div', 'apt-ok');
    caja.appendChild(ico);
    caja.appendChild(h('h3', null, '¡Reserva hecha!'));
    var cod = h('p', 'vr-codigo'); cod.appendChild(document.createTextNode('Tu código: ')); cod.appendChild(h('b', 'mono', codigo));
    caja.appendChild(cod);
    var ul = h('ul', 'vr-resumen');
    l.forEach(function(x){
      var li = h('li');
      li.appendChild(h('span', null, x.cantidad + ' × ' + x.nombre));
      li.appendChild(h('b', 'tabular', x.precio ? soles(Number(x.precio) * x.cantidad) : '—'));
      ul.appendChild(li);
    });
    if(total){ var tot = h('li', 'vr-tot'); tot.appendChild(h('span', null, 'Total')); tot.appendChild(h('b', 'tabular', soles(total))); ul.appendChild(tot); }
    caja.appendChild(ul);
    caja.appendChild(h('p', null, 'La coordinación del CIEHS confirmará tu reserva' + (contacto ? ' al ' + contacto : '') + '. Guarda el código para recogerla.'));
    var acc = h('div', 'apt-ok-acc');
    var otra = h('button', 'btn btn-primary', 'Hacer otra reserva'); otra.type = 'button';
    otra.addEventListener('click', reiniciar);
    var wa = h('a', 'btn btn-ghost', 'Avisar por WhatsApp');
    wa.href = 'https://wa.me/?text=' + encodeURIComponent('¡Ya reservé mis lechugas hidropónicas del CIEHS! Reserva las tuyas aquí: https://ciehs.vercel.app/#/inicio');
    wa.target = '_blank'; wa.rel = 'noopener noreferrer';
    acc.appendChild(otra); acc.appendChild(wa);
    caja.appendChild(acc);
    okEl.appendChild(caja);
    setTimeout(function(){ otra.focus(); }, 60);
  }

  function reiniciar(){
    cant = {}; form.reset(); form.hidden = false; okEl.hidden = true; aviso('');
    pintarProductos();
  }

  function abrir(){
    focoPrevio = document.activeElement;
    if(!okEl.hidden) reiniciar(); else pintarProductos();
    if(!rol) elegirRol(''); campoGrado.hidden = !(rol === 'Estudiante' || rol === 'Padre o madre');
    velo.hidden = false; hoja.hidden = false;
    document.documentElement.classList.add('apt-abierto');
    requestAnimationFrame(function(){ velo.classList.add('is-abierto'); hoja.classList.add('is-abierto'); });
    setTimeout(function(){ var b = cajaProds.querySelector('.vr-paso button:last-child'); if(b) b.focus({ preventScroll:true }); }, 120);
  }
  function cerrar(){
    if(hoja.hidden) return;
    velo.classList.remove('is-abierto'); hoja.classList.remove('is-abierto');
    document.documentElement.classList.remove('apt-abierto');
    setTimeout(function(){ if(!hoja.classList.contains('is-abierto')){ hoja.hidden = true; velo.hidden = true; } }, 320);
    if(focoPrevio && focoPrevio.focus) focoPrevio.focus({ preventScroll:true });
  }
  velo.addEventListener('click', cerrar);
  hoja.querySelector('[data-vr-cerrar]').addEventListener('click', cerrar);
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !hoja.hidden && !enviando) cerrar(); });
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-reservar]');
    if(!b) return;
    e.preventDefault();
    abrir();
  });

  /* ======================================================================
     3. SUBIR LA FOTO DEL PRODUCTO (administración)
     ====================================================================== */
  var campoFoto = $('proFoto');
  if(campoFoto){
    var zona = h('div', 'pro-subir');
    var vista = h('img', 'pro-vista'); vista.alt = ''; vista.hidden = true;
    var lbl = h('label', 'btn btn-ghost pro-subir-btn');
    lbl.appendChild(document.createTextNode('Subir foto desde el dispositivo'));
    var inp = h('input'); inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp'; inp.className = 'sr-only-input';
    lbl.appendChild(inp);
    var est = h('p', 'pro-subir-estado');
    est.setAttribute('role', 'status');
    zona.appendChild(vista); zona.appendChild(lbl); zona.appendChild(est);
    var etiqueta = campoFoto.closest('label');
    (etiqueta || campoFoto).insertAdjacentElement('afterend', zona);
    function previsualizar(){
      var v = campoFoto.value.trim();
      if(fotoValida(v) && D && D.urlEvidencia){ vista.src = D.urlEvidencia(v); vista.hidden = false; }
      else { vista.hidden = true; if(v) est.textContent = 'Esa ruta no es una foto válida (parece un enlace temporal). Sube la foto con el botón.'; }
    }
    campoFoto.addEventListener('input', previsualizar);
    new MutationObserver(previsualizar).observe(campoFoto, { attributes:true, attributeFilter:['value'] });
    // El editor rellena el campo por .value: se vigila también al abrir el formulario.
    var formPro = $('proForm');
    if(formPro) new MutationObserver(function(){ if(!formPro.hidden){ est.textContent = ''; previsualizar(); } }).observe(formPro, { attributes:true, attributeFilter:['hidden'] });

    inp.addEventListener('change', function(){
      var f = inp.files && inp.files[0];
      if(!f) return;
      if(!D || !D.subirEvidencia){ est.textContent = 'Sin conexión con la base.'; return; }
      est.textContent = 'Preparando la foto…';
      reducir(f, 1400).then(function(blob){
        var nombre = ($('proNombre') && $('proNombre').value || 'producto').toLowerCase()
          .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'producto';
        var ruta = 'productos/' + nombre + '-' + Date.now().toString(36) + '.jpg';
        var archivo = new File([blob], ruta.split('/').pop(), { type:'image/jpeg' });
        est.textContent = 'Subiendo ' + Math.round(blob.size / 1024) + ' KB…';
        return D.subirEvidencia(archivo, ruta);
      }).then(function(ruta){
        campoFoto.value = ruta;
        previsualizar();
        est.textContent = 'Foto subida. Pulsa «Guardar» para que salga en la tienda.';
      }).catch(function(e){
        est.textContent = 'No se pudo subir: ' + ((e && e.message) || 'error') + '. ¿Entraste con el código de administración?';
      });
      inp.value = '';
    });
  }

  /* Reescala y recodifica a JPEG en el navegador: pesa menos y se pierden los
     metadatos (GPS incluido) del archivo original. */
  function reducir(file, max){
    return new Promise(function(res, rej){
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function(){
        var k = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function(b){ b ? res(b) : rej(new Error('no se pudo convertir la imagen')); }, 'image/jpeg', 0.85);
      };
      img.onerror = function(){ URL.revokeObjectURL(url); rej(new Error('ese archivo no es una imagen')); };
      img.src = url;
    });
  }

  /* ======================================================================
     4. PANEL DE LA VENTA (solo coordinación)
     ====================================================================== */
  var panel = $('ventaPanel');
  var temporizador = null;
  function esAdmin(){ return document.body.classList.contains('ciehs-admin') || (D && D.esAdmin && D.esAdmin()); }

  function leerNota(n){
    n = n || '';
    function campo(k){ var m = new RegExp(k + ':\\s*([^·]+)').exec(n); return m ? m[1].trim() : ''; }
    return { venta: /^\[Venta\]/.test(n), rol: campo('Rol') || 'Sin indicar', grado: campo('Grado'), recojo: campo('Recojo') };
  }

  function cargarPanel(){
    if(!panel || !D || !D.listarPedidos) return;
    if(!esAdmin()){ panel.hidden = true; return; }
    panel.hidden = false;
    var cuerpo = panel.querySelector('.vp-cuerpo');
    Promise.all([D.listarPedidos(), D.lineasPorPedido()]).then(function(par){
      pintarPanel(cuerpo, par[0] || [], par[1] || {});
    }).catch(function(e){
      cuerpo.textContent = 'No se pudieron leer las reservas: ' + ((e && e.message) || 'error') + '.';
    });
  }

  function pintarPanel(cuerpo, pedidos, lineasDe){
    var validos = pedidos.filter(function(p){ return p.status !== 'anulado'; });
    var porProd = {}, porRol = {}, porDia = {}, unidades = 0, ingreso = 0;
    validos.forEach(function(p){
      var ls = lineasDe[p.id] || [];
      var nota = leerNota(p.notes);
      porRol[nota.rol] = (porRol[nota.rol] || 0) + 1;
      var dia = (p.created_at || '').slice(0, 10);
      porDia[dia] = (porDia[dia] || 0) + ls.reduce(function(s, l){ return s + l.cantidad; }, 0);
      ls.forEach(function(l){
        var k = l.nombre;
        porProd[k] = porProd[k] || { u:0, s:0 };
        porProd[k].u += l.cantidad;
        porProd[k].s += (l.precio_pen ? Number(l.precio_pen) * l.cantidad : 0);
        unidades += l.cantidad;
        ingreso += (l.precio_pen ? Number(l.precio_pen) * l.cantidad : 0);
      });
    });
    var cuenta = function(st){ return pedidos.filter(function(p){ return p.status === st; }).length; };

    cuerpo.textContent = '';
    var kpis = h('div', 'vp-kpis');
    [['Reservas', validos.length], ['Unidades', unidades], ['Ingreso estimado', soles(ingreso)],
     ['Pendientes', cuenta('pendiente')], ['Confirmadas', cuenta('confirmado')], ['Entregadas', cuenta('entregado')]]
      .forEach(function(k){ var d = h('div', 'vp-kpi'); d.appendChild(h('b', 'tabular', String(k[1]))); d.appendChild(h('span', null, k[0])); kpis.appendChild(d); });
    cuerpo.appendChild(kpis);

    var rej = h('div', 'vp-rejilla');
    rej.appendChild(barras('Por producto (unidades)', Object.keys(porProd).map(function(k){ return [k, porProd[k].u, soles(porProd[k].s)]; })));
    rej.appendChild(barras('Quién reserva', Object.keys(porRol).map(function(k){ return [k, porRol[k]]; })));
    rej.appendChild(barras('Unidades por día', Object.keys(porDia).sort().slice(-10).map(function(k){
      var d = new Date(k + 'T12:00:00'); return [isNaN(d) ? k : d.toLocaleDateString('es-PE', { weekday:'short', day:'numeric', month:'short' }), porDia[k]];
    })));
    cuerpo.appendChild(rej);

    var cab = h('div', 'vp-lista-cab');
    cab.appendChild(h('p', 'vp-sub', 'Reservas (' + pedidos.length + ')'));
    var csv = h('button', 'btn btn-ghost', 'Descargar CSV'); csv.type = 'button';
    csv.addEventListener('click', function(){ descargarCsv(pedidos, lineasDe); });
    cab.appendChild(csv);
    cuerpo.appendChild(cab);

    var tabla = h('div', 'vp-tabla');
    pedidos.forEach(function(p){
      var ls = lineasDe[p.id] || [];
      var n = leerNota(p.notes);
      var fila = h('div', 'vp-fila is-' + p.status);
      var d = new Date(p.created_at);
      var c1 = h('div', 'vp-quien');
      c1.appendChild(h('b', null, p.requester_name));
      c1.appendChild(h('span', null, p.contact));
      c1.appendChild(h('small', null, n.rol + (n.grado ? ' · ' + n.grado : '') + (n.recojo ? ' · recoge: ' + n.recojo : '')));
      var c2 = h('div', 'vp-que');
      c2.appendChild(h('span', null, ls.map(function(l){ return l.cantidad + '× ' + l.nombre; }).join(', ') || (p.crop || '—')));
      var t = ls.reduce(function(s, l){ return s + (l.precio_pen ? Number(l.precio_pen) * l.cantidad : 0); }, 0);
      c2.appendChild(h('small', null, (t ? soles(t) + ' · ' : '') + (isNaN(d) ? '' : d.toLocaleString('es-PE', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })) + ' · ' + String(p.id).replace(/-/g, '').slice(0, 6).toUpperCase()));
      var c3 = h('div', 'vp-estado');
      [['pendiente', 'Pendiente'], ['confirmado', 'Confirmar'], ['entregado', 'Entregado'], ['anulado', 'Anular']].forEach(function(e){
        var b = h('button', 'vp-est' + (p.status === e[0] ? ' is-on' : ''), e[1]); b.type = 'button';
        b.setAttribute('aria-pressed', p.status === e[0] ? 'true' : 'false');
        b.addEventListener('click', function(){
          if(p.status === e[0]) return;
          if(e[0] === 'anulado' && !confirm('¿Anular la reserva de ' + p.requester_name + '?')) return;
          b.disabled = true;
          D.cambiarEstadoPedido(p.id, e[0]).then(cargarPanel).catch(function(err){ alert('No se pudo cambiar: ' + (err && err.message)); b.disabled = false; });
        });
        c3.appendChild(b);
      });
      fila.appendChild(c1); fila.appendChild(c2); fila.appendChild(c3);
      tabla.appendChild(fila);
    });
    if(!pedidos.length) tabla.appendChild(h('p', 'vp-vacio', 'Todavía no hay reservas. Aparecerán aquí solas en cuanto lleguen.'));
    cuerpo.appendChild(tabla);
    var hora = h('p', 'vp-hora', 'Actualizado a las ' + new Date().toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) + ' · se refresca solo cada 30 s');
    cuerpo.appendChild(hora);
  }

  function barras(titulo, datos){
    var caja = h('div', 'vp-bloque');
    caja.appendChild(h('p', 'vp-sub', titulo));
    var max = Math.max.apply(null, datos.map(function(d){ return d[1]; }).concat([1]));
    if(!datos.length) caja.appendChild(h('p', 'vp-vacio', 'Sin datos todavía.'));
    datos.sort(function(a, b){ return b[1] - a[1]; }).forEach(function(d){
      var f = h('div', 'vp-barra');
      f.appendChild(h('span', null, d[0]));
      var b = h('i'); var r = h('i'); r.style.setProperty('--w', (d[1] / max * 100).toFixed(1) + '%'); b.appendChild(r);
      f.appendChild(b);
      f.appendChild(h('b', 'tabular', String(d[1]) + (d[2] ? ' · ' + d[2] : '')));
      caja.appendChild(f);
    });
    return caja;
  }

  function descargarCsv(pedidos, lineasDe){
    function c(v){ v = v == null ? '' : String(v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
    var filas = [['codigo','fecha','nombre','contacto','rol','grado','recojo','producto','cantidad','precio_unit','subtotal','estado']];
    pedidos.forEach(function(p){
      var n = leerNota(p.notes);
      var ls = lineasDe[p.id] || [{}];
      ls.forEach(function(l){
        filas.push([String(p.id).replace(/-/g, '').slice(0, 6).toUpperCase(), p.created_at, p.requester_name, p.contact, n.rol, n.grado, n.recojo,
          l.nombre || p.crop || '', l.cantidad || '', l.precio_pen || '', l.precio_pen && l.cantidad ? (Number(l.precio_pen) * l.cantidad).toFixed(2) : '', p.status]);
      });
    });
    var blob = new Blob(['﻿' + filas.map(function(f){ return f.map(c).join(','); }).join('\r\n')], { type:'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ciehs-reservas-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
  }

  if(panel){
    var recargar = panel.querySelector('[data-vp-recargar]');
    if(recargar) recargar.addEventListener('click', cargarPanel);
    // Entra o sale el modo administración → se muestra u oculta el panel.
    new MutationObserver(function(){
      cargarPanel();
      clearInterval(temporizador);
      if(esAdmin()) temporizador = setInterval(function(){ if(!document.hidden && !panel.hidden) cargarPanel(); }, 30000);
    }).observe(document.body, { attributes:true, attributeFilter:['class'] });
  }

  /* Repintar cuando llegan los datos de la base. */
  var previo = CIEHS.refrescarTienda;
  CIEHS.refrescarTienda = function(){
    if(previo) previo.apply(this, arguments);
    pintarPrecios();
    if(!hoja.hidden && form.hidden === false) pintarProductos();
  };
  pintarPrecios();
  CIEHS.abrirReserva = abrir;
})();
