/* ============================================================================
   CIEHS · Investigaciones v2 — Fase 2 del rediseño (2026-09-29)

   El problema que resuelve: en la página de Investigaciones había CINCO
   maneras de añadir algo (nueva investigación, resultados, formulario de
   medición, entrada de campo y cinco iconos de aporte) y ninguna decía cuál
   usar. Un estudiante no sabía por dónde empezar.

   Lo que hace, tomando lo mejor de iNaturalist y OSF:
     1. Cada investigación es un PROYECTO: tarjeta resumida en la lista y, al
        abrirla, una vista propia con pestañas — Resumen · Diseño experimental
        · Resultados · Evidencias. URL compartible: #/investigaciones?inv=CÓDIGO
        (la ruta sigue siendo «investigaciones»: los QR impresos no cambian).
     2. UN SOLO botón «Aportar» que abre un asistente de tres pasos:
        ¿Qué traes? → ¿De qué investigación? → Complétalo. Al terminar dice
        qué pasa ahora (lo revisa tu docente) y lo apunta en «Tus envíos».

   Lo que NO hace: reescribir la lógica de envío. Los tres formularios que ya
   existían (#resForm, #campoForm, #aporteForm) —con su validación, su pixelado
   de caras en el dispositivo, su cuarentena y su firma con inicial— se MUEVEN
   dentro del asistente mientras está abierto y vuelven a su sitio al cerrarlo.
   Mover un nodo del DOM conserva sus escuchadores: el código probado sigue
   siendo el que envía.

   Vínculo aporte ↔ investigación sin tocar la base: la tabla ciehs.aportes no
   tiene columna de investigación, así que el código se antepone a la
   descripción como «[INV-2026-01] …» y aquí se lee y se pinta como etiqueta.
   Cuando se añada la columna (fase 5), solo cambia leerInv().

   En modo administración no se reorganiza nada visible: las fichas se ven
   completas para poder editarlas en su sitio.
   ========================================================================== */
(function(){
  'use strict';

  var CIEHS = window.CIEHS || {};
  var seccion = document.getElementById('investigaciones');
  var grid = document.getElementById('invGrid');
  if(!seccion || !grid || !CIEHS.navigate) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MARCA = /^\s*\[(INV-[A-Za-z0-9-]+)\]\s*/i;

  function $(id){ return document.getElementById(id); }
  function h(tag, cls, txt){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(txt != null) e.textContent = txt;
    return e;
  }
  var SVG_A = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var P = {
    medir:'<path d="M4 20V4M4 20h16"/><path d="m7 14 3-3 3 2 5-6"/>',
    modulo:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    foto:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="12" cy="12" r="3.2"/><path d="M8 5l1.2-2h5.6L16 5"/>',
    video:'<rect x="3" y="6" width="12" height="12" rx="2.5"/><path d="M15 11l6-3.5v9L15 13z"/>',
    informe:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    proyecto:'<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5M8 10.5h5M10.5 8v5"/>',
    audio:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>',
    mas:'<path d="M12 5v14M5 12h14"/>',
    cerrar:'<path d="M6 6l12 12M18 6 6 18"/>',
    atras:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
    flecha:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    ok:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    lab:'<path d="M9 3h6"/><path d="M10 3v6.5L4.5 19A1.5 1.5 0 0 0 5.8 21h12.4a1.5 1.5 0 0 0 1.3-2L14 9.5V3"/><path d="M7 15h10"/>',
    reloj:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'
  };
  function svg(n){ return SVG_A + (P[n] || P.mas) + '</svg>'; }

  function snap(){ return (CIEHS.snapshot && CIEHS.snapshot()) || null; }
  function leerInv(texto){ var m = MARCA.exec(texto || ''); return m ? m[1] : ''; }
  function sinMarca(texto){ return String(texto || '').replace(MARCA, ''); }

  /* ======================================================================
     1. TIPOS DE APORTE
     ====================================================================== */
  var TIPOS = [
    { id:'medicion', grupo:'Datos', tit:'Una medición', desc:'Biomasa, altura, hojas… de un tratamiento', ico:'medir',
      form:'resForm', estado:'resStatus', ok:/^Añadido/, inv:'obligatoria', titulo:'resVar' },
    { id:'modulo', grupo:'Datos', tit:'Un registro de módulo', desc:'pH, CE y temperatura de uno de los 15 módulos', ico:'modulo',
      form:'campoForm', estado:'campoStatus', ok:/^Registrado/, inv:'no' },
    { id:'foto', grupo:'Archivos', tit:'Fotografía', desc:'JPG, PNG o WebP · las caras se tapan aquí', ico:'foto',
      form:'aporteForm', estado:'aporteStatus', ok:/^Subido/, inv:'opcional', kind:'foto', titulo:'aporteTitulo' },
    { id:'video', grupo:'Archivos', tit:'Vídeo', desc:'MP4 o WebM, hasta 25 MB', ico:'video',
      form:'aporteForm', estado:'aporteStatus', ok:/^Subido/, inv:'opcional', kind:'video', titulo:'aporteTitulo' },
    { id:'informe', grupo:'Archivos', tit:'Informe de investigación', desc:'PDF con tus resultados', ico:'informe',
      form:'aporteForm', estado:'aporteStatus', ok:/^Subido/, inv:'opcional', kind:'investigacion', titulo:'aporteTitulo' },
    { id:'proyecto', grupo:'Archivos', tit:'Proyecto CIEHS', desc:'PDF del proyecto de tu equipo', ico:'proyecto',
      form:'aporteForm', estado:'aporteStatus', ok:/^Subido/, inv:'opcional', kind:'articulo', titulo:'aporteTitulo' },
    { id:'audio', grupo:'Archivos', tit:'Audio', desc:'MP3 u OGG: una entrevista, un audio-cuento', ico:'audio',
      form:'aporteForm', estado:'aporteStatus', ok:/^Subido/, inv:'opcional', kind:'audio', titulo:'aporteTitulo' }
  ];
  function tipo(id){ for(var i = 0; i < TIPOS.length; i++) if(TIPOS[i].id === id) return TIPOS[i]; return null; }

  /* Las investigaciones: de la base si respondió; si no, de las fichas
     estáticas del HTML, que siempre están. */
  function investigaciones(){
    var s = snap();
    var inv = (s && s.investigaciones) || [];
    // En la base el título lleva *cursiva* estilo Markdown y a veces comillas
    // de sobra: en una lista de texto plano se quitan.
    if(inv.length) return inv.map(function(i){
      var t = (i.title || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim().replace(/^["“]+|["”]+$/g, '');
      return { code:i.code, title:t, status:i.status };
    });
    return [].map.call(grid.querySelectorAll('[data-inv-code]'), function(a){
      var t = a.querySelector('h3');
      return { code:a.getAttribute('data-inv-code'), title:t ? t.textContent.replace(/\s+/g, ' ').trim() : '' };
    });
  }

  /* ======================================================================
     2. «TUS ENVÍOS» — solo en este dispositivo
     Los equipos del laboratorio son compartidos, así que se guarda lo justo
     (tipo, título, investigación, fecha), nunca nombres, y se puede borrar.
     ====================================================================== */
  var CLAVE = 'ciehs.envios';
  function leerEnvios(){ try{ return JSON.parse(localStorage.getItem(CLAVE) || '[]') || []; }catch(e){ return []; } }
  function guardarEnvio(e){
    var l = leerEnvios();
    l.unshift(e);
    try{ localStorage.setItem(CLAVE, JSON.stringify(l.slice(0, 12))); }catch(err){}
    pintarEnvios();
  }
  function borrarEnvios(){ try{ localStorage.removeItem(CLAVE); }catch(e){} pintarEnvios(); }

  /* ======================================================================
     3. BARRA DE ACCIONES DE LA PÁGINA
     ====================================================================== */
  seccion.classList.add('inv-v2');
  var cabecera = seccion.querySelector('.section-head');
  var barra = h('div', 'inv-barra');
  var btnAportar = h('button', 'btn btn-primary inv-aportar');
  btnAportar.type = 'button';
  btnAportar.innerHTML = svg('mas') + '<span>Aportar</span>';
  btnAportar.addEventListener('click', function(){ abrir(); });
  var ayuda = h('p', 'inv-barra-ayuda', 'Una medición, una foto, un informe… todo entra por aquí y lo revisa tu docente antes de publicarse.');
  barra.appendChild(btnAportar);
  barra.appendChild(ayuda);
  if(cabecera) cabecera.parentNode.insertBefore(barra, cabecera.nextSibling);

  // Botón flotante en el móvil: el «Aportar» siempre a mano.
  var fab = h('button', 'inv-fab');
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Aportar a una investigación');
  fab.innerHTML = svg('mas') + '<span>Aportar</span>';
  fab.addEventListener('click', function(){ abrir(); });
  document.body.appendChild(fab);

  // «Tus envíos»
  var envios = h('div', 'inv-envios');
  envios.hidden = true;
  barra.parentNode.insertBefore(envios, barra.nextSibling);

  function pintarEnvios(){
    var l = leerEnvios();
    envios.hidden = !l.length;
    envios.textContent = '';
    if(!l.length) return;
    var cab = h('div', 'inv-envios-cab');
    cab.appendChild(h('p', 'inv-envios-tit', 'Tus envíos desde este dispositivo'));
    var borrar = h('button', 'inv-envios-borrar', 'Borrar lista');
    borrar.type = 'button';
    borrar.addEventListener('click', borrarEnvios);
    cab.appendChild(borrar);
    envios.appendChild(cab);
    var publicados = ((snap() && snap().aportes) || []).map(function(a){ return (a.title || '').trim().toLowerCase(); });
    var ul = h('ul', 'inv-envios-lista');
    l.forEach(function(e){
      var t = tipo(e.t) || TIPOS[0];
      var pub = e.titulo && publicados.indexOf(e.titulo.trim().toLowerCase()) !== -1;
      var li = h('li', 'inv-envio');
      var ico = h('span', 'inv-envio-ico'); ico.innerHTML = svg(t.ico);
      var tx = h('span', 'inv-envio-txt');
      tx.appendChild(h('b', null, e.titulo || t.tit));
      var d = new Date(e.f);
      tx.appendChild(h('span', null, t.tit + (e.inv ? ' · ' + e.inv : '') + ' · ' + (isNaN(d) ? '' : d.toLocaleDateString('es-PE', { day:'numeric', month:'short' }))));
      var est = h('span', 'inv-envio-estado ' + (pub ? 'is-pub' : 'is-rev'), pub ? 'Publicado' : 'En revisión');
      li.appendChild(ico); li.appendChild(tx); li.appendChild(est);
      ul.appendChild(li);
    });
    envios.appendChild(ul);
  }

  /* ======================================================================
     4. FICHAS → PROYECTOS CON PESTAÑAS
     ====================================================================== */
  var PESTANAS = [
    { id:'resumen',    tit:'Resumen' },
    { id:'diseno',     tit:'Diseño experimental' },
    { id:'resultados', tit:'Resultados' },
    { id:'evidencias', tit:'Evidencias' }
  ];

  function rotulo(p){
    var b = p.querySelector('b');
    return b ? b.textContent.replace(/[:\s]+$/, '').trim().toLowerCase() : '';
  }

  function contarResultados(code){
    var s = snap();
    return ((s && s.resultados) || []).filter(function(r){ return r.investigation_code === code; }).length;
  }
  function evidenciasDe(code){
    var s = snap();
    var c = String(code || '').toUpperCase();
    return ((s && s.aportes) || []).filter(function(a){ return leerInv(a.description).toUpperCase() === c; });
  }

  function transformar(art){
    if(art.getAttribute('data-inv-v2')) return;
    art.setAttribute('data-inv-v2', '1');
    art.classList.add('inv-proy');
    var code = art.getAttribute('data-inv-code');
    var hijos = [].slice.call(art.children);

    var panes = {};
    PESTANAS.forEach(function(p){
      var d = h('div', 'inv-pane');
      d.setAttribute('data-pane', p.id);
      d.setAttribute('role', 'tabpanel');
      d.id = 'invPane-' + code + '-' + p.id;
      d.setAttribute('aria-labelledby', 'invTab-' + code + '-' + p.id);
      panes[p.id] = d;
    });

    var pregunta = null, estadoHip = '';
    hijos.forEach(function(c){
      if(c.classList.contains('top-row') || c.tagName === 'H3') return;
      if(c.classList.contains('hyp')){
        var r = rotulo(c);
        if(r === 'pregunta'){ pregunta = c; panes.resumen.appendChild(c); }
        else if(r === 'hipótesis' || r === 'hipotesis') panes.resumen.appendChild(c);
        else panes.diseno.appendChild(c);
        return;
      }
      if(c.classList.contains('var-list')){ panes.diseno.insertBefore(c, panes.diseno.firstChild); return; }
      if(c.classList.contains('meta')){ panes.diseno.appendChild(c); return; }
      panes.resultados.appendChild(c);
    });
    var est = panes.resultados.querySelector('.res-estado');
    if(est) estadoHip = est.textContent.trim();

    // En la lista: la pregunta, en corto.
    var corto = h('p', 'inv-corto', pregunta ? pregunta.textContent.replace(/^\s*Pregunta:\s*/i, '') : '');

    // Cifras del proyecto.
    var n = contarResultados(code), ev = evidenciasDe(code).length;
    var stats = h('div', 'inv-stats');
    function stat(ico, txt, cls){
      var s = h('span', 'inv-stat' + (cls ? ' ' + cls : ''));
      s.innerHTML = svg(ico);
      s.appendChild(document.createTextNode(txt));
      stats.appendChild(s);
    }
    stat('medir', n ? n + (n === 1 ? ' medición' : ' mediciones') : 'Sin mediciones aún', n ? 'is-si' : '');
    stat('foto', ev ? ev + (ev === 1 ? ' evidencia' : ' evidencias') : 'Sin evidencias aún', ev ? 'is-si' : '');
    if(estadoHip) stat('ok', estadoHip, 'is-hip');

    // Ir al detalle (toda la tarjeta es pulsable en la lista).
    var abrirBtn = h('button', 'inv-abrir');
    abrirBtn.type = 'button';
    abrirBtn.innerHTML = '<span>Ver el proyecto</span>' + svg('flecha');
    abrirBtn.setAttribute('aria-label', 'Ver el proyecto ' + code);
    abrirBtn.addEventListener('click', function(){ irA(code); });

    // Volver (solo en el detalle).
    var volver = h('button', 'inv-volver');
    volver.type = 'button';
    volver.innerHTML = svg('atras') + '<span>Todas las investigaciones</span>';
    volver.addEventListener('click', function(){ irA(''); });

    // Pestañas.
    var tabs = h('div', 'inv-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Secciones del proyecto');
    var indicador = h('span', 'inv-tab-ind');
    indicador.setAttribute('aria-hidden', 'true');
    tabs.appendChild(indicador);
    PESTANAS.forEach(function(p, i){
      var t = h('button', 'inv-tab', p.tit);
      t.type = 'button';
      t.id = 'invTab-' + code + '-' + p.id;
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-controls', panes[p.id].id);
      t.setAttribute('data-tab', p.id);
      t.addEventListener('click', function(){ elegirPestana(art, p.id, true); });
      t.addEventListener('keydown', function(e){
        if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        var k = (i + (e.key === 'ArrowRight' ? 1 : -1) + PESTANAS.length) % PESTANAS.length;
        elegirPestana(art, PESTANAS[k].id, true);
        art.querySelector('[data-tab="' + PESTANAS[k].id + '"]').focus();
      });
      tabs.appendChild(t);
    });

    // Acciones dentro de Resultados y Evidencias.
    var accRes = accion('Añadir una medición', 'medir', function(){ abrir('medicion', code); });
    panes.resultados.insertBefore(accRes, panes.resultados.firstChild);
    pintarEvidencias(panes.evidencias, code);

    var top = art.querySelector('.top-row');
    art.insertBefore(volver, art.firstChild);
    var titulo = art.querySelector('h3');
    var ref = titulo ? titulo.nextSibling : null;
    [corto, stats, tabs, panes.resumen, panes.diseno, panes.resultados, panes.evidencias, abrirBtn].forEach(function(e){
      art.insertBefore(e, ref);
    });
    if(top && titulo && titulo.previousSibling !== top) art.insertBefore(top, titulo);
    elegirPestana(art, 'resumen', false);
  }

  function accion(txt, ico, fn){
    var d = h('div', 'inv-accion');
    var b = h('button', 'btn btn-ghost');
    b.type = 'button';
    b.innerHTML = svg(ico) + '<span></span>';
    b.querySelector('span').textContent = txt;
    b.addEventListener('click', fn);
    d.appendChild(b);
    return d;
  }

  function pintarEvidencias(pane, code){
    pane.textContent = '';
    pane.appendChild(accion('Aportar una evidencia', 'foto', function(){ abrir(null, code); }));
    var l = evidenciasDe(code);
    if(!l.length){
      var v = h('div', 'inv-vacio');
      v.innerHTML = svg('foto');
      v.appendChild(h('b', null, 'Todavía no hay evidencias publicadas'));
      v.appendChild(h('p', null, 'Las fotos, vídeos e informes que los equipos suban para esta investigación aparecerán aquí cuando la coordinación los apruebe.'));
      pane.appendChild(v);
      return;
    }
    var ICO = { foto:'foto', video:'video', articulo:'proyecto', investigacion:'informe', audio:'audio' };
    var ul = h('ul', 'inv-evid');
    l.forEach(function(a){
      var li = h('li', 'inv-evid-item');
      var ico = h('span', 'inv-evid-ico'); ico.innerHTML = svg(ICO[a.kind] || 'informe');
      var tx = h('span', 'inv-evid-txt');
      tx.appendChild(h('b', null, a.title || ''));
      var desc = sinMarca(a.description);
      if(desc) tx.appendChild(h('span', null, desc));
      var quien = [a.equipo, a.grado].filter(Boolean).join(' · ');
      if(quien) tx.appendChild(h('small', null, quien));
      var ir = h('span', 'inv-evid-ir', '…');
      li.appendChild(ico); li.appendChild(tx); li.appendChild(ir);
      ul.appendChild(li);
      var D = window.CIEHSData;
      if(D && D.urlAporte) D.urlAporte(a.storage_path).then(function(url){
        var enlace = h('a', 'inv-evid-ir', 'Abrir');
        enlace.href = url; enlace.target = '_blank'; enlace.rel = 'noopener noreferrer';
        ir.replaceWith(enlace);
      }).catch(function(){ ir.textContent = 'No disponible'; });
    });
    pane.appendChild(ul);
  }

  function elegirPestana(art, id, animar){
    var tabs = art.querySelectorAll('.inv-tab');
    [].forEach.call(tabs, function(t){
      var s = t.getAttribute('data-tab') === id;
      t.setAttribute('aria-selected', s ? 'true' : 'false');
      t.setAttribute('tabindex', s ? '0' : '-1');
      if(s) moverIndicador(art, t);
    });
    [].forEach.call(art.querySelectorAll('.inv-pane'), function(p){
      var s = p.getAttribute('data-pane') === id;
      p.hidden = !s;
      if(s && animar && !reduceMotion){
        p.classList.remove('is-entrando'); void p.offsetWidth; p.classList.add('is-entrando');
      }
    });
    if(id === 'resultados' && CIEHS.dibujarBarras) CIEHS.dibujarBarras();
  }
  function moverIndicador(art, t){
    var ind = art.querySelector('.inv-tab-ind');
    if(!ind || !t.offsetWidth) return;
    ind.style.setProperty('--x', t.offsetLeft + 'px');
    ind.style.setProperty('--w', t.offsetWidth + 'px');
  }

  function transformarTodo(){
    [].forEach.call(grid.querySelectorAll('article.research-card'), transformar);
    aplicarDetalle();
  }

  /* ---------------------------------------------------- lista ↔ detalle */
  function invDeHash(){
    var m = /[?&]inv=([^&]+)/.exec(location.hash || '');
    if(!m) return '';
    try{ return decodeURIComponent(m[1]); }catch(e){ return ''; }
  }
  function irA(code){
    location.hash = code ? '#/investigaciones?inv=' + encodeURIComponent(code) : '#/investigaciones';
  }
  function aplicarDetalle(){
    var code = (CIEHS.currentRoute && CIEHS.currentRoute() === 'investigaciones') ? invDeHash() : '';
    // Sin distinguir mayúsculas: en la base hay códigos como «inv-2026-03».
    var art = null;
    if(code) [].some.call(grid.querySelectorAll('.inv-proy'), function(a){
      if((a.getAttribute('data-inv-code') || '').toUpperCase() === code.toUpperCase()){ art = a; return true; }
    });
    var abierto = !!art;
    seccion.classList.toggle('inv-en-detalle', abierto);
    grid.classList.toggle('is-detalle', abierto);
    [].forEach.call(grid.querySelectorAll('.inv-proy'), function(a){
      var mia = a === art;
      a.classList.toggle('is-abierta', mia);
      var ab = a.querySelector('.inv-abrir');
      if(ab) ab.setAttribute('tabindex', abierto ? '-1' : '0');
    });
    if(art){
      var t = art.querySelector('.inv-tab[aria-selected="true"]');
      requestAnimationFrame(function(){
        if(t) moverIndicador(art, t);
        var tit = art.querySelector('h3');
        if(tit){ tit.setAttribute('tabindex', '-1'); tit.focus({ preventScroll:true }); }
      });
      document.title = (art.getAttribute('data-inv-code') || '') + ' · Investigaciones · CIEHS';
    }
  }

  new MutationObserver(function(){ transformarTodo(); }).observe(grid, { childList:true });
  window.addEventListener('hashchange', function(){ setTimeout(aplicarDetalle, 0); });
  window.addEventListener('resize', function(){
    var a = grid.querySelector('.inv-proy.is-abierta');
    var t = a && a.querySelector('.inv-tab[aria-selected="true"]');
    if(t) moverIndicador(a, t);
  });
  transformarTodo();

  /* Evidencias y cifras se recalculan cuando llegan los aportes aprobados. */
  function refrescarDatos(){
    [].forEach.call(grid.querySelectorAll('.inv-proy'), function(a){
      var code = a.getAttribute('data-inv-code');
      var pane = a.querySelector('[data-pane="evidencias"]');
      if(pane) pintarEvidencias(pane, code);
    });
    pintarEnvios();
  }
  var refrescarAportesOrig = CIEHS.refrescarAportes;
  if(refrescarAportesOrig){
    CIEHS.refrescarAportes = function(){ refrescarAportesOrig.apply(this, arguments); refrescarDatos(); limpiarMarcasPublicadas(); };
  }

  /* En la lista general de aportes publicados, la marca [INV-…] se pinta
     como etiqueta en lugar de verse como texto. */
  function limpiarMarcasPublicadas(){
    var pubs = $('aportePublicados');
    if(!pubs) return;
    [].forEach.call(pubs.querySelectorAll('.aporte-txt > span:not([class])'), function(s){
      var code = leerInv(s.textContent);
      if(!code) return;
      s.textContent = sinMarca(s.textContent);
      var chip = h('button', 'inv-chip-enlace', code);
      chip.type = 'button';
      chip.addEventListener('click', function(){ irA(code); });
      s.parentNode.insertBefore(chip, s);
    });
  }
  var pubsEl = $('aportePublicados');
  if(pubsEl) new MutationObserver(limpiarMarcasPublicadas).observe(pubsEl, { childList:true });

  /* ======================================================================
     5. EL ASISTENTE «APORTAR»
     ====================================================================== */
  var velo = h('div', 'apt-velo'); velo.hidden = true;
  var apt = h('div', 'apt'); apt.hidden = true;
  apt.setAttribute('role', 'dialog');
  apt.setAttribute('aria-modal', 'true');
  apt.setAttribute('aria-labelledby', 'aptTit');

  var cab = h('header', 'apt-cab');
  var cabTx = h('div', 'apt-cab-tx');
  var pasoTxt = h('p', 'apt-paso-txt');
  var tit = h('h2', 'apt-tit'); tit.id = 'aptTit';
  cabTx.appendChild(pasoTxt); cabTx.appendChild(tit);
  var cerrarBtn = h('button', 'apt-cerrar');
  cerrarBtn.type = 'button';
  cerrarBtn.setAttribute('aria-label', 'Cerrar');
  cerrarBtn.innerHTML = svg('cerrar');
  cerrarBtn.addEventListener('click', function(){ cerrar(); });
  cab.appendChild(cabTx); cab.appendChild(cerrarBtn);

  var progreso = h('div', 'apt-progreso');
  progreso.setAttribute('aria-hidden', 'true');
  var progresoBarra = h('i');
  progreso.appendChild(progresoBarra);

  var cuerpo = h('div', 'apt-cuerpo');
  var pasos = {};
  [1, 2, 3, 4].forEach(function(n){
    var s = h('section', 'apt-paso');
    s.setAttribute('data-paso', n);
    s.hidden = true;
    pasos[n] = s;
    cuerpo.appendChild(s);
  });

  var pie = h('footer', 'apt-pie');
  var atras = h('button', 'apt-atras');
  atras.type = 'button';
  atras.innerHTML = svg('atras') + '<span>Atrás</span>';
  atras.addEventListener('click', function(){ volverPaso(); });
  var pieNota = h('p', 'apt-pie-nota');
  pieNota.innerHTML = svg('reloj') + '<span>Nada se publica sin que lo revise un docente.</span>';
  pie.appendChild(atras); pie.appendChild(pieNota);

  apt.appendChild(cab); apt.appendChild(progreso); apt.appendChild(cuerpo); apt.appendChild(pie);
  document.body.appendChild(velo);
  document.body.appendChild(apt);
  velo.addEventListener('click', function(){ cerrar(); });

  /* ---- paso 1: ¿qué traes? ---- */
  (function(){
    var grupos = {};
    TIPOS.forEach(function(t){ (grupos[t.grupo] = grupos[t.grupo] || []).push(t); });
    Object.keys(grupos).forEach(function(g){
      pasos[1].appendChild(h('p', 'apt-grupo', g === 'Datos' ? 'Datos que mediste' : 'Archivos'));
      var rej = h('div', 'apt-tipos');
      grupos[g].forEach(function(t, i){
        var b = h('button', 'apt-tipo');
        b.type = 'button';
        b.setAttribute('data-tipo', t.id);
        b.style.setProperty('--k', i);
        var ico = h('span', 'apt-tipo-ico'); ico.innerHTML = svg(t.ico);
        var tx = h('span', 'apt-tipo-tx');
        tx.appendChild(h('b', null, t.tit));
        tx.appendChild(h('span', null, t.desc));
        b.appendChild(ico); b.appendChild(tx);
        b.addEventListener('click', function(){ elegirTipo(t.id); });
        rej.appendChild(b);
      });
      pasos[1].appendChild(rej);
    });
  })();

  var estado = { paso:1, tipo:null, inv:'', pendiente:null };
  var devolver = [];          // [{nodo, marcador}] para devolver los formularios
  var obs = null, focoPrevio = null;

  function elegirTipo(id){
    estado.tipo = tipo(id);
    if(estado.tipo.inv === 'no') irPaso(3);
    else if(estado.inv && estado.tipo.inv !== 'no' && estado.preInv) irPaso(3);
    else irPaso(2);
  }

  /* ---- paso 2: ¿de qué investigación? ---- */
  function pintarPaso2(){
    var p = pasos[2];
    p.textContent = '';
    var t = estado.tipo;
    p.appendChild(h('p', 'apt-intro', t.inv === 'obligatoria'
      ? 'Cada medición se grafica comparada con los tratamientos de su investigación.'
      : 'Si tu archivo es de una investigación concreta, aparecerá en su pestaña «Evidencias».'));
    var lista = h('div', 'apt-invs');
    var ops = investigaciones().map(function(i){ return { code:i.code, title:i.title }; });
    if(t.inv === 'opcional') ops.push({ code:'', title:'Del laboratorio en general', general:true });
    ops.forEach(function(o, i){
      var b = h('button', 'apt-inv' + (o.general ? ' is-general' : ''));
      b.type = 'button';
      b.style.setProperty('--k', i);
      var ico = h('span', 'apt-tipo-ico'); ico.innerHTML = svg(o.general ? 'lab' : 'medir');
      var tx = h('span', 'apt-tipo-tx');
      if(o.code) tx.appendChild(h('small', 'mono', o.code));
      tx.appendChild(h('b', null, o.title));
      b.appendChild(ico); b.appendChild(tx);
      if(estado.inv === o.code && (o.code || estado.invElegida)) b.classList.add('is-sel');
      b.addEventListener('click', function(){
        estado.inv = o.code; estado.invElegida = true;
        irPaso(3);
      });
      lista.appendChild(b);
    });
    p.appendChild(lista);
  }

  /* ---- paso 3: el formulario de verdad, prestado ---- */
  function prestar(id){
    var nodo = $(id);
    if(!nodo) return null;
    var marcador = document.createComment('apt:' + id);
    nodo.parentNode.insertBefore(marcador, nodo);
    devolver.push({ nodo:nodo, marcador:marcador, oculto:nodo.hidden });
    return nodo;
  }
  function devolverTodo(){
    devolver.forEach(function(d){
      if(d.marcador.parentNode){ d.marcador.parentNode.insertBefore(d.nodo, d.marcador); d.marcador.remove(); }
      d.nodo.hidden = d.oculto;
    });
    devolver = [];
  }

  function pintarPaso3(){
    var p = pasos[3];
    devolverTodo();
    p.textContent = '';
    var t = estado.tipo;
    var resumen = h('div', 'apt-resumen');
    var chipT = h('span', 'apt-chip'); chipT.innerHTML = svg(t.ico); chipT.appendChild(document.createTextNode(t.tit));
    resumen.appendChild(chipT);
    if(t.inv !== 'no'){
      resumen.appendChild(h('span', 'apt-chip is-inv', estado.inv || 'Laboratorio en general'));
    }
    p.appendChild(resumen);

    var form = prestar(t.form);
    if(!form){ p.appendChild(h('p', 'apt-intro', 'Este formulario no está disponible ahora mismo.')); return; }
    if(t.kind){
      var icono = document.querySelector('.aporte-icono[data-kind="' + t.kind + '"]');
      if(icono) icono.click();       // configura tipo, formatos y límite
    }
    if(t.id === 'medicion'){
      if(CIEHS.refrescarFormResultados) CIEHS.refrescarFormResultados();
      var sel = $('resInv');
      if(sel && estado.inv) sel.value = estado.inv;
    }
    form.hidden = false;
    form.classList.add('apt-form');
    p.appendChild(form);
    var estadoEl = $(t.estado);
    if(estadoEl) estadoEl.textContent = '';
    vigilar(estadoEl);
    setTimeout(function(){
      var primero = form.querySelector('input:not([type=hidden]):not([disabled]), select, textarea');
      if(primero) primero.focus({ preventScroll:true });
    }, 80);
  }

  /* Antes de que el formulario envíe: se apunta qué se envía y, en los
     archivos, se antepone la investigación a la descripción. Va en fase de
     captura sobre el asistente, así que corre ANTES que el envío original. */
  apt.addEventListener('submit', function(e){
    var t = estado.tipo;
    if(!t) return;
    var titEl = t.titulo ? $(t.titulo) : null;
    estado.pendiente = { t:t.id, titulo:titEl ? titEl.value.trim() : '', inv:t.inv === 'no' ? '' : estado.inv, f:Date.now() };
    if(t.form === 'aporteForm'){
      var desc = $('aporteDesc');
      if(desc){
        var limpio = sinMarca(desc.value);
        desc.value = estado.inv ? ('[' + estado.inv + '] ' + limpio.slice(0, 780)) : limpio;
      }
    }
    if(t.id === 'modulo'){
      var mod = $('campoModulo');
      if(mod) estado.pendiente.titulo = 'Módulo ' + (mod.value || '');
    }
  }, true);

  function vigilar(el){
    if(obs) obs.disconnect();
    if(!el) return;
    obs = new MutationObserver(function(){
      var txt = (el.textContent || '').trim();
      var t = estado.tipo;
      if(!t || !txt) return;
      if(el.classList.contains('error')){
        // Si falló, la marca no debe quedarse a la vista en la descripción.
        var desc = $('aporteDesc');
        if(desc && t.form === 'aporteForm') desc.value = sinMarca(desc.value);
        return;
      }
      if(t.ok.test(txt) && estado.paso === 3){
        if(estado.pendiente) guardarEnvio(estado.pendiente);
        estado.pendiente = null;
        irPaso(4, txt);
      }
    });
    obs.observe(el, { childList:true, characterData:true, subtree:true, attributes:true, attributeFilter:['class'] });
  }

  /* ---- paso 4: listo ---- */
  function pintarPaso4(mensaje){
    var p = pasos[4];
    p.textContent = '';
    var t = estado.tipo;
    var ok = h('div', 'apt-ok');
    var circ = h('span', 'apt-ok-ico'); circ.innerHTML = svg('ok');
    ok.appendChild(circ);
    ok.appendChild(h('h3', null, '¡Enviado!'));
    ok.appendChild(h('p', null, mensaje || 'Tu aporte está en revisión.'));
    p.appendChild(ok);

    var ruta = h('ol', 'apt-ruta');
    [['Lo enviaste', 'Ahora mismo'], ['Lo revisa tu docente', 'Comprueba el dato o el archivo'], ['Se publica', t.id === 'modulo' ? 'En la gráfica de Trazabilidad' : (estado.inv ? 'En ' + estado.inv : 'En la carpeta de campo')]]
      .forEach(function(r, i){
        var li = h('li', i === 0 ? 'is-hecho' : '');
        li.appendChild(h('b', null, r[0]));
        li.appendChild(h('span', null, r[1]));
        ruta.appendChild(li);
      });
    p.appendChild(ruta);

    var acc = h('div', 'apt-ok-acc');
    var otra = h('button', 'btn btn-primary', 'Aportar otra cosa');
    otra.type = 'button';
    otra.addEventListener('click', function(){ estado.tipo = null; irPaso(1); });
    var listo = h('button', 'btn btn-ghost', estado.inv ? 'Ver ' + estado.inv : 'Cerrar');
    listo.type = 'button';
    listo.addEventListener('click', function(){
      var code = estado.inv;
      cerrar();
      if(code) irA(code);
    });
    acc.appendChild(otra); acc.appendChild(listo);
    p.appendChild(acc);
    setTimeout(function(){ otra.focus(); }, 60);
  }

  /* ---- navegación entre pasos ---- */
  var TITULOS = { 1:'¿Qué quieres aportar?', 2:'¿De qué investigación es?', 3:'Complétalo', 4:'Listo' };
  function irPaso(n, extra){
    var desde = estado.paso;
    if(n !== 3) devolverTodo();
    if(n === 2) pintarPaso2();
    if(n === 3) pintarPaso3();
    if(n === 4) pintarPaso4(extra);
    estado.paso = n;
    [1, 2, 3, 4].forEach(function(k){
      var s = pasos[k];
      s.hidden = k !== n;
      s.classList.remove('is-avanza', 'is-retrocede');
      if(k === n && !reduceMotion){ void s.offsetWidth; s.classList.add(n >= desde ? 'is-avanza' : 'is-retrocede'); }
    });
    var total = (estado.tipo && estado.tipo.inv === 'no') ? 2 : 3;
    var visible = n === 4 ? total : (estado.tipo && estado.tipo.inv === 'no' && n === 3 ? 2 : n);
    pasoTxt.textContent = n === 4 ? 'Enviado' : 'Paso ' + visible + ' de ' + total;
    tit.textContent = n === 3 && estado.tipo ? estado.tipo.tit : TITULOS[n];
    progresoBarra.style.setProperty('--p', n === 4 ? 1 : visible / (total + 0.5));
    atras.hidden = n === 1 || n === 4;
    pieNota.hidden = n === 4;
    cuerpo.scrollTop = 0;
    if(n === 1 || n === 2){
      setTimeout(function(){
        var b = pasos[n].querySelector('.is-sel') || pasos[n].querySelector('button');
        if(b) b.focus({ preventScroll:true });
      }, 60);
    }
  }
  function volverPaso(){
    if(estado.paso === 3) irPaso(estado.tipo && estado.tipo.inv === 'no' ? 1 : 2);
    else if(estado.paso === 2) irPaso(1);
  }

  function abrir(tipoId, invCode){
    estado = { paso:1, tipo:null, inv:invCode || '', invElegida:!!invCode, preInv:!!invCode, pendiente:null, desde:Date.now() };
    focoPrevio = document.activeElement;
    velo.hidden = false; apt.hidden = false;
    document.documentElement.classList.add('apt-abierto');
    requestAnimationFrame(function(){ velo.classList.add('is-abierto'); apt.classList.add('is-abierto'); });
    if(tipoId){
      estado.tipo = tipo(tipoId);
      if(estado.tipo.inv === 'no' || invCode) irPaso(3); else irPaso(2);
    } else {
      irPaso(1);
    }
  }
  function cerrar(){
    if(apt.hidden) return;
    if(obs) obs.disconnect();
    devolverTodo();
    velo.classList.remove('is-abierto'); apt.classList.remove('is-abierto');
    document.documentElement.classList.remove('apt-abierto');
    setTimeout(function(){ if(!apt.classList.contains('is-abierto')){ apt.hidden = true; velo.hidden = true; } }, 320);
    if(focoPrevio && focoPrevio.focus) focoPrevio.focus({ preventScroll:true });
  }

  document.addEventListener('keydown', function(e){
    if(apt.hidden) return;
    if(e.key === 'Escape'){
      // Con el editor de rostros o un campo a medias, Esc no debe tirar el
      // trabajo por accidente: solo cierra desde los pasos de elección.
      if(estado.paso !== 3) cerrar();
      return;
    }
    if(e.key !== 'Tab') return;
    var f = [].filter.call(apt.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]'), function(x){
      return !x.disabled && !x.closest('[hidden]') && x.offsetParent !== null;
    });
    if(!f.length) return;
    if(e.shiftKey && document.activeElement === f[0]){ e.preventDefault(); f[f.length - 1].focus(); }
    else if(!e.shiftKey && document.activeElement === f[f.length - 1]){ e.preventDefault(); f[0].focus(); }
  });
  // Cambiar de página cierra el asistente, salvo el cambio que lo trajo hasta
  // aquí (abrirlo desde el buscador navega a Investigaciones a la vez).
  window.addEventListener('hashchange', function(){
    if(estado.paso !== 3 && Date.now() - (estado.desde || 0) > 700) cerrar();
  });

  // Cualquier botón del portal con data-aportar abre el asistente (portada,
  // «Explora»…). data-aportar="medicion" lo abre ya en ese tipo.
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-aportar]');
    if(!b) return;
    e.preventDefault();
    abrir(b.getAttribute('data-aportar') || null);
  });

  pintarEnvios();
  CIEHS.abrirAportar = abrir;
  CIEHS.irInvestigacion = irA;
})();
