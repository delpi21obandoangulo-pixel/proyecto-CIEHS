/* ============================================================================
   CIEHS · Navegación v2 — Fase 1 del rediseño (2026-09-29)

   Qué hace este archivo:
     1. Mega-menú de escritorio: las cuatro familias del menú visibles en la
        cabecera; un solo panel que se transforma de una a otra (tamaño,
        posición y flecha con muelle), como el de Stripe.
     2. Menú móvil: el cajón de siempre, con iconos y entrada escalonada, y que
        por fin se cierra al cambiar de página por la URL.
     3. Buscador ⌘K: secciones, títulos dentro de cada sección y acciones.
     4. Detalles vivos: aurora de fondo que sigue al cursor, brillo en el botón
        principal y aviso de bienvenida flotante que se recuerda al cerrarlo.

   Fuente de verdad: el <nav id="menuPanel"> del HTML. Las familias, rutas y
   descripciones se LEEN de ahí, así que el menú de escritorio, el móvil y el
   buscador no pueden desincronizarse. La navegación pasa siempre por
   window.CIEHS.navigate (el router de ciehs-app.js), así que las URL #/ruta
   —las de los QR impresos— no cambian.

   CSP: nada de estilos en atributos. Todo lo dinámico va por CSSOM
   (style.setProperty), que la política permite. Plan: CIEHS-Plan-Rediseno.md
   ========================================================================== */
(function(){
  'use strict';

  var CIEHS = window.CIEHS || {};
  if(!CIEHS.navigate) return;           // sin router no hay nada que mejorar

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var puntoFino = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ------------------------------------------------------------ iconos */
  var SVG_A = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var P = {
    inicio:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    metodologia:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    equipos:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14.8c2 .7 3.2 2.5 3.6 5.2"/>',
    mural:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    investigaciones:'<path d="M9 3h6"/><path d="M10 3v6.5L4.5 19A1.5 1.5 0 0 0 5.8 21h12.4a1.5 1.5 0 0 0 1.3-2L14 9.5V3"/><path d="M7 15h10"/>',
    modulos:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    trazabilidad:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
    datos:'<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7.5" y="11" width="3" height="6" rx="1"/><rect x="13" y="7" width="3" height="10" rx="1"/>',
    juega:'<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="15.5" cy="11.5" r=".9"/><circle cx="17.8" cy="13.8" r=".9"/>',
    docentes:'<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c2.5 2.5 9.5 2.5 12 0v-5"/><path d="M22 9v6"/>',
    comunidad:'<path d="M3 10h18l-1.6 8.4A2 2 0 0 1 17.4 20H6.6a2 2 0 0 1-2-1.6z"/><path d="m8 10 3-6M16 10l-3-6"/><path d="M9 14v2M15 14v2M12 14v2"/>',
    eureka:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M16 5h3v1.5A3.5 3.5 0 0 1 15.8 10M8 5H5v1.5A3.5 3.5 0 0 0 8.2 10"/><path d="M12 13v4M8.5 20h7M9.5 17h5"/>',
    contacto:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
    privacidad:'<path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6z"/><path d="m9.5 12 1.8 1.8L15 10"/>',
    buscar:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bajar:'<path d="m6 9 6 6 6-6"/>',
    flecha:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    subir:'<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    medir:'<path d="M4 20V4M4 20h16"/><path d="m7 14 3-3 3 2 5-6"/>',
    carpeta:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    titulo:'<path d="M5 9h14M5 15h14M10 3 8 21M16 3l-2 18"/>',
    llave:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>'
  };
  function svg(nombre){ return SVG_A + (P[nombre] || P.titulo) + '</svg>'; }

  /* Color por familia: el icono de cada apartado lleva el tono de su grupo,
     así el color significa «a qué parte del portal pertenece». */
  var TONOS = [
    { bg:'#e7f6ee', ink:'#06603f', lado:'verde' },
    { bg:'#e6f1f8', ink:'#075a86', lado:'azul'  },
    { bg:'#fcf0de', ink:'#8a4306', lado:'sol'   },
    { bg:'#eceee9', ink:'#2b3a32', lado:'tinta' }
  ];
  var LADOS = [
    { tit:'Cultivamos ciencia', txt:'Un laboratorio de hidroponía escolar hecho por 280 estudiantes en Huanchaco.', cta:'Ver el laboratorio', ruta:'inicio', ancla:'evidencias' },
    { tit:'Ciencia que se comprueba', txt:'Preguntas, hipótesis y datos reales de los quince módulos de raíz flotante.', cta:'Aportar', ruta:'investigaciones', aportar:true },
    { tit:'Aprende jugando', txt:'Retos, la Arena y el Pasaporte del investigador, para todos los niveles.', cta:'Entrar a jugar', ruta:'juega' },
    { tit:'¿Nos visitas?', txt:'Lunes a viernes, de 1:00 a 6:00 p. m. Escríbenos a ciehs.olaya@gmail.com', cta:'Escríbenos', ruta:'contacto' }
  ];

  function colorear(el, g){
    var t = TONOS[g] || TONOS[0];
    el.style.setProperty('--c-bg', t.bg);
    el.style.setProperty('--c-ink', t.ink);
  }
  function icono(ruta, g){
    var s = document.createElement('span');
    s.className = 'mega-ico';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = svg(ruta);
    colorear(s, g);
    return s;
  }

  /* Ir a una ruta y, si se pide, a un punto dentro de ella. El router hace
     scroll arriba al renderizar; el ancla se aplica justo después. */
  function ir(ruta, ancla){
    CIEHS.navigate(ruta);
    if(!ancla) return;
    setTimeout(function(){
      var el = typeof ancla === 'string' ? document.getElementById(ancla) : ancla;
      if(el && el.scrollIntoView) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block:'start' });
    }, 90);
  }

  /* ------------------------------------------------------------ leer el menú */
  var panelMovil = document.getElementById('menuPanel');
  if(!panelMovil) return;
  var FAMILIAS = [].map.call(panelMovil.querySelectorAll('.menu-grupo'), function(sec, g){
    var h = sec.querySelector('h2');
    var sub = sec.querySelector('.menu-grupo-sub');
    return {
      g: g,
      nombre: h ? h.textContent.trim() : '',
      sub: sub ? sub.textContent.trim() : '',
      items: [].map.call(sec.querySelectorAll('button[data-route]'), function(b){
        var t = b.querySelector('b'), d = b.querySelector('span');
        return { ruta: b.getAttribute('data-route'), nombre: t ? t.textContent.trim() : '', desc: d ? d.textContent.trim() : '', boton: b };
      })
    };
  });
  var FAMILIA_DE = {};
  FAMILIAS.forEach(function(f){ f.items.forEach(function(it){ FAMILIA_DE[it.ruta] = f.g; }); });

  /* ------------------------------------------------------------ menú móvil */
  var k = 0;
  FAMILIAS.forEach(function(f){
    var sec = panelMovil.querySelectorAll('.menu-grupo')[f.g];
    [].forEach.call(sec.children, function(hijo){ hijo.style.setProperty('--k', k++); });
    f.items.forEach(function(it){
      var b = it.boton;
      var tit = b.querySelector('b'), desc = b.querySelector('span');
      var txt = document.createElement('span');
      txt.className = 'menu-txt';
      if(tit) txt.appendChild(tit);
      if(desc){ desc.className = 'menu-sub'; txt.appendChild(desc); }
      b.appendChild(icono(it.ruta, f.g));
      b.appendChild(txt);
    });
  });
  var toggle = document.getElementById('navToggle');
  function cerrarMovil(){
    if(toggle && toggle.getAttribute('aria-expanded') === 'true') toggle.click();
  }

  /* ------------------------------------------------------------ mega-menú */
  var header = document.querySelector('header.site');
  var navEl = header && header.querySelector('.nav');
  var navRight = navEl && navEl.querySelector('.nav-right');
  var familiasEl, mega, caja, flecha, triggers = [], paneles = [];
  var abierta = -1, tCerrar = null, tAbrir = null;

  if(navEl && navRight){
    familiasEl = document.createElement('div');
    familiasEl.className = 'nav-familias';
    var pill = document.createElement('span');
    pill.className = 'nav-fam-pill';
    pill.setAttribute('aria-hidden', 'true');
    familiasEl.appendChild(pill);

    mega = document.createElement('div');
    mega.className = 'mega';
    mega.id = 'megaMenu';
    caja = document.createElement('div');
    caja.className = 'mega-caja';
    flecha = document.createElement('span');
    flecha.className = 'mega-flecha';
    mega.appendChild(flecha);
    mega.appendChild(caja);

    FAMILIAS.forEach(function(f){
      var t = document.createElement('button');
      t.type = 'button';
      t.className = 'nav-fam';
      t.setAttribute('aria-expanded', 'false');
      t.setAttribute('aria-controls', 'megaPanel' + f.g);
      t.appendChild(document.createTextNode(f.nombre));
      t.insertAdjacentHTML('beforeend', svg('bajar'));
      familiasEl.appendChild(t);
      triggers.push(t);

      var p = document.createElement('div');
      p.className = 'mega-panel';
      p.id = 'megaPanel' + f.g;
      p.setAttribute('role', 'region');
      p.setAttribute('aria-label', f.nombre);

      var lista = document.createElement('div');
      lista.className = 'mega-items';
      f.items.forEach(function(it){
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'mega-item';
        b.setAttribute('data-ir', it.ruta);
        b.appendChild(icono(it.ruta, f.g));
        var tx = document.createElement('span');
        var bb = document.createElement('b'); bb.textContent = it.nombre;
        var dd = document.createElement('span'); dd.className = 'mega-desc'; dd.textContent = it.desc;
        tx.appendChild(bb); tx.appendChild(dd);
        b.appendChild(tx);
        b.addEventListener('click', function(){ cerrarMega(false); ir(it.ruta); });
        lista.appendChild(b);
      });
      p.appendChild(lista);

      var L = LADOS[f.g] || LADOS[0];
      var lado = document.createElement('div');
      lado.className = 'mega-lado';
      lado.setAttribute('data-tono', (TONOS[f.g] || TONOS[0]).lado);
      var lt = document.createElement('p'); lt.className = 'mega-lado-tit'; lt.textContent = L.tit;
      var lp = document.createElement('p'); lp.textContent = f.sub ? f.sub + ' ' + L.txt : L.txt;
      var arriba = document.createElement('div');
      arriba.appendChild(lt); arriba.appendChild(lp);
      var cta = document.createElement('button');
      cta.type = 'button'; cta.className = 'mega-lado-cta';
      cta.appendChild(document.createTextNode(L.cta));
      cta.insertAdjacentHTML('beforeend', svg('flecha'));
      cta.addEventListener('click', function(){
        cerrarMega(false);
        if(L.aportar && CIEHS.abrirAportar){ ir(L.ruta); CIEHS.abrirAportar(); return; }
        ir(L.ruta, L.ancla);
      });
      lado.appendChild(arriba); lado.appendChild(cta);
      p.appendChild(lado);

      caja.appendChild(p);
      paneles.push(p);

      // Apertura: al pasar el ratón (con una pizca de intención) o al pulsar.
      t.addEventListener('pointerenter', function(e){
        if(e.pointerType !== 'mouse') return;
        clearTimeout(tCerrar);
        clearTimeout(tAbrir);
        moverPill(t);
        if(abierta === -1) tAbrir = setTimeout(function(){ abrirMega(f.g); }, 70);
        else abrirMega(f.g);
      });
      t.addEventListener('click', function(){
        if(abierta === f.g) cerrarMega(false); else abrirMega(f.g);
      });
      t.addEventListener('keydown', function(e){
        if(e.key === 'ArrowDown'){
          e.preventDefault();
          abrirMega(f.g);
          var primero = paneles[f.g].querySelector('button');
          if(primero) setTimeout(function(){ primero.focus(); }, 30);
        }else if(e.key === 'ArrowRight' || e.key === 'ArrowLeft'){
          e.preventDefault();
          var n = (f.g + (e.key === 'ArrowRight' ? 1 : -1) + triggers.length) % triggers.length;
          triggers[n].focus();
          moverPill(triggers[n]);
          if(abierta !== -1) abrirMega(n);
        }
      });
    });

    navEl.insertBefore(familiasEl, navRight);
    document.body.appendChild(mega);

    familiasEl.addEventListener('pointerleave', function(e){
      if(e.pointerType !== 'mouse') return;
      clearTimeout(tAbrir);
      programarCierre();
    });
    mega.addEventListener('pointerenter', function(){ clearTimeout(tCerrar); });
    mega.addEventListener('pointerleave', function(e){ if(e.pointerType === 'mouse') programarCierre(); });
    mega.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){ cerrarMega(true); return; }
      if(e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      var bs = [].slice.call(paneles[abierta].querySelectorAll('button'));
      var i = bs.indexOf(document.activeElement);
      var n = e.key === 'ArrowDown' ? Math.min(i + 1, bs.length - 1) : i - 1;
      if(n < 0){ triggers[abierta].focus(); return; }
      bs[n].focus();
    });
    // Tabular fuera del panel lo cierra: un desplegable abierto que ya no
    // tiene el foco solo estorba.
    mega.addEventListener('focusout', function(e){
      if(e.relatedTarget && !mega.contains(e.relatedTarget) && triggers.indexOf(e.relatedTarget) === -1) cerrarMega(false);
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && abierta !== -1) cerrarMega(true);
    });
    document.addEventListener('pointerdown', function(e){
      if(abierta === -1) return;
      if(mega.contains(e.target) || familiasEl.contains(e.target)) return;
      cerrarMega(false);
    });
    window.addEventListener('resize', function(){ if(abierta !== -1) cerrarMega(false); });
  }

  function moverPill(t){
    if(!familiasEl) return;
    familiasEl.style.setProperty('--px', t.offsetLeft + 'px');
    familiasEl.style.setProperty('--pw', t.offsetWidth + 'px');
    familiasEl.classList.add('has-pill');
  }
  function programarCierre(){
    clearTimeout(tCerrar);
    tCerrar = setTimeout(function(){ cerrarMega(false); }, 200);
  }

  function abrirMega(g){
    if(!mega || g === abierta) return;
    clearTimeout(tCerrar);
    var desde = abierta;
    var t = triggers[g], p = paneles[g];
    var rt = t.getBoundingClientRect();
    var rh = header.getBoundingClientRect();
    var w = p.offsetWidth, h = p.offsetHeight;
    var vw = document.documentElement.clientWidth;
    var centro = rt.left + rt.width / 2;
    var x = Math.max(16, Math.min(centro - w / 2, vw - w - 16));

    if(desde === -1){
      // Primera apertura: sin animar tamaño ni posición, solo aparece.
      mega.classList.add('is-entrando');
      mega.classList.remove('is-abierto');
    }
    mega.style.setProperty('top', (rh.bottom + 6) + 'px');
    mega.style.setProperty('--mw', w + 'px');
    mega.style.setProperty('--mh', h + 'px');
    mega.style.setProperty('--mx', x + 'px');
    mega.style.setProperty('--fx', (centro - x) + 'px');
    mega.style.setProperty('--mo', (centro - x) + 'px');

    paneles.forEach(function(pp, i){
      pp.style.setProperty('--dir', i < g ? -1 : 1);
      pp.classList.toggle('is-activo', i === g);
    });
    triggers.forEach(function(tt, i){ tt.setAttribute('aria-expanded', i === g ? 'true' : 'false'); });
    moverPill(t);
    abierta = g;

    if(desde === -1){
      void mega.offsetWidth;            // fija el estado inicial antes de animar
      mega.classList.add('is-abierto');
      requestAnimationFrame(function(){ mega.classList.remove('is-entrando'); });
    }
  }

  function cerrarMega(devolverFoco){
    if(!mega || abierta === -1) return;
    var t = triggers[abierta];
    abierta = -1;
    mega.classList.remove('is-abierto');
    paneles.forEach(function(pp){ pp.classList.remove('is-activo'); });
    triggers.forEach(function(tt){ tt.setAttribute('aria-expanded', 'false'); });
    familiasEl.classList.remove('has-pill');
    if(devolverFoco && t) t.focus();
  }

  /* Estado de la ruta: qué familia y qué apartado están activos. */
  function marcarRuta(){
    var r = CIEHS.currentRoute ? CIEHS.currentRoute() : '';
    var g = FAMILIA_DE[r];
    triggers.forEach(function(t, i){ t.classList.toggle('is-ruta-activa', i === g); });
    if(mega) [].forEach.call(mega.querySelectorAll('.mega-item'), function(b){
      var act = b.getAttribute('data-ir') === r;
      b.classList.toggle('is-active', act);
      if(act) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }
  window.addEventListener('hashchange', function(){
    cerrarMega(false);
    cerrarMovil();
    cerrarCmdk();
    setTimeout(marcarRuta, 0);
  });
  marcarRuta();

  /* ------------------------------------------------------------ buscador ⌘K */
  var esMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  var botonBuscar = document.createElement('button');
  botonBuscar.type = 'button';
  botonBuscar.className = 'nav-buscar';
  botonBuscar.setAttribute('aria-label', 'Buscar en el portal');
  botonBuscar.setAttribute('aria-haspopup', 'dialog');
  botonBuscar.innerHTML = svg('buscar') + '<span class="nav-buscar-txt">Buscar</span><kbd>' + (esMac ? '⌘' : 'Ctrl') + ' K</kbd>';
  if(navRight) navRight.insertBefore(botonBuscar, navRight.firstChild);

  var ACCIONES = [
    { t:'Aportar: subir una foto, vídeo o informe', d:'Pasa por revisión docente antes de publicarse', ico:'subir', g:1, ruta:'investigaciones', aportar:'' },
    { t:'Añadir una medición a una investigación', d:'Se grafica sola, comparada con su tratamiento', ico:'medir', g:1, ruta:'investigaciones', aportar:'medicion' },
    { t:'Registrar pH, CE o temperatura de un módulo', d:'Aparece en la gráfica de Trazabilidad', ico:'modulos', g:1, ruta:'trazabilidad', aportar:'modulo' },
    { t:'Ver la carpeta de campo', d:'Artículos, informes, fotos y bitácoras', ico:'carpeta', g:1, ruta:'investigaciones', ancla:'carpeta-campo' },
    { t:'Hacer un pedido de cosecha', d:'Comunidad y pedidos', ico:'comunidad', g:2, ruta:'comunidad' },
    { t:'Jugar en la Arena', d:'Retos y Pasaporte del investigador', ico:'juega', g:2, ruta:'juega' },
    { t:'Descargar recursos para el aula', d:'Espacio docente', ico:'docentes', g:2, ruta:'docentes' },
    { t:'Escribir al CIEHS', d:'Contacto y visitas', ico:'contacto', g:3, ruta:'contacto' },
    { t:'Entrar a administración', d:'Solo coordinación', ico:'llave', g:3, admin:true }
  ];

  var cmdk = null, velo = null, entrada = null, lista = null, opciones = [], sel = 0, focoPrevio = null, indice = null;

  function norm(s){
    return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  /* El índice de títulos se construye al abrir por primera vez, cuando el
     contenido editable ya se ha aplicado sobre el HTML. */
  function construirIndice(){
    var out = [];
    FAMILIAS.forEach(function(f){
      f.items.forEach(function(it){
        out.push({ tipo:'Secciones', t:it.nombre, d:it.desc, ico:it.ruta, g:f.g, ruta:it.ruta });
      });
    });
    ACCIONES.forEach(function(a){ out.push({ tipo:'Acciones', t:a.t, d:a.d, ico:a.ico, g:a.g, ruta:a.ruta, ancla:a.ancla, admin:a.admin, aportar:a.aportar }); });
    var vistos = {};
    [].forEach.call(document.querySelectorAll('main [data-page] h2, main [data-page] h3'), function(h){
      var sec = h.closest('[data-page]');
      var ruta = sec.getAttribute('data-page');
      if(h.closest('form, .ed-cajon, [aria-hidden="true"]')) return;
      var texto = (h.textContent || '').replace(/\s+/g, ' ').trim();
      if(texto.length < 4) return;
      if(texto.length > 110) texto = texto.slice(0, 107) + '…';
      var clave = ruta + '|' + norm(texto);
      if(vistos[clave]) return;
      vistos[clave] = 1;
      out.push({ tipo:'En las páginas', t:texto, d:(CIEHS.routeLabel ? CIEHS.routeLabel(ruta) : ruta), ico:'titulo', g:FAMILIA_DE[ruta] || 0, ruta:ruta, ancla:h });
    });
    out.forEach(function(o){ o.n = norm(o.t); o.nd = norm(o.d); });
    return out;
  }

  /* Puntuación sencilla y predecible: empieza por > empieza palabra >
     contiene > letras en orden. Acentos y mayúsculas no cuentan. */
  function puntuar(o, q){
    if(!q) return o.tipo === 'En las páginas' ? -1 : 1;
    var i = o.n.indexOf(q);
    if(i === 0) return 100;
    if(i > 0) return (o.n.charAt(i - 1) === ' ' ? 80 : 60) - Math.min(i, 20) / 2;
    if(o.nd.indexOf(q) !== -1) return 35;
    var palabras = q.split(' ').filter(Boolean);
    if(palabras.length > 1 && palabras.every(function(p){ return o.n.indexOf(p) !== -1 || o.nd.indexOf(p) !== -1; })) return 30;
    var j = 0;
    for(var c = 0; c < o.n.length && j < q.length; c++) if(o.n.charAt(c) === q.charAt(j)) j++;
    return j === q.length && q.length > 2 ? 10 : -1;
  }

  function resaltar(el, texto, q){
    el.textContent = '';
    var i = q ? norm(texto).indexOf(q) : -1;
    if(i < 0){ el.textContent = texto; return; }
    el.appendChild(document.createTextNode(texto.slice(0, i)));
    var m = document.createElement('mark'); m.textContent = texto.slice(i, i + q.length);
    el.appendChild(m);
    el.appendChild(document.createTextNode(texto.slice(i + q.length)));
  }

  function pintar(){
    var q = norm(entrada.value.trim()).replace(/\s+/g, ' ');
    var res = indice.map(function(o){ return { o:o, s:puntuar(o, q) }; })
      .filter(function(r){ return r.s >= 0; })
      .sort(function(a, b){ return b.s - a.s; });
    var ORDEN = q ? null : ['Acciones', 'Secciones'];
    lista.textContent = '';
    opciones = [];
    var grupos = {};
    res.slice(0, q ? 40 : 60).forEach(function(r){
      (grupos[r.o.tipo] = grupos[r.o.tipo] || []).push(r.o);
    });
    var orden = ORDEN || Object.keys(grupos);
    orden.forEach(function(tipo){
      if(!grupos[tipo]) return;
      var cab = document.createElement('div');
      cab.className = 'cmdk-grupo';
      cab.setAttribute('role', 'presentation');
      cab.textContent = tipo;
      lista.appendChild(cab);
      grupos[tipo].slice(0, q ? 12 : 20).forEach(function(o){
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'cmdk-op';
        b.id = 'cmdkOp' + opciones.length;
        b.setAttribute('role', 'option');
        b.setAttribute('tabindex', '-1');
        b.appendChild(icono(o.ico, o.g));
        var tx = document.createElement('span'); tx.className = 'cmdk-op-txt';
        var bb = document.createElement('b'); resaltar(bb, o.t, q);
        var dd = document.createElement('span'); dd.textContent = o.d;
        tx.appendChild(bb); tx.appendChild(dd);
        b.appendChild(tx);
        var go = document.createElement('span'); go.className = 'cmdk-op-ir'; go.textContent = 'Ir ↵';
        b.appendChild(go);
        var n = opciones.length;
        b.addEventListener('mousemove', function(){ if(sel !== n) seleccionar(n, false); });
        b.addEventListener('click', function(){ ejecutar(o); });
        lista.appendChild(b);
        opciones.push({ el:b, o:o });
      });
    });
    if(!opciones.length){
      var v = document.createElement('p');
      v.className = 'cmdk-vacio';
      v.textContent = 'Nada coincide con «' + entrada.value.trim() + '». Prueba con otra palabra: pH, lechuga, pedido, Eureka…';
      lista.appendChild(v);
    }
    seleccionar(0, true);
  }

  function seleccionar(n, scroll){
    if(!opciones.length){ entrada.removeAttribute('aria-activedescendant'); return; }
    sel = Math.max(0, Math.min(n, opciones.length - 1));
    opciones.forEach(function(op, i){ op.el.setAttribute('aria-selected', i === sel ? 'true' : 'false'); });
    entrada.setAttribute('aria-activedescendant', opciones[sel].el.id);
    if(scroll !== false) opciones[sel].el.scrollIntoView({ block:'nearest' });
  }

  function ejecutar(o){
    cerrarCmdk(false);
    if(o.admin){
      var a = document.querySelector('.js-abrir-admin');
      if(a) a.click();
      return;
    }
    if(o.aportar != null && CIEHS.abrirAportar){
      if(o.ruta === 'investigaciones') CIEHS.navigate('investigaciones');
      CIEHS.abrirAportar(o.aportar || null);
      return;
    }
    ir(o.ruta, o.ancla);
  }

  function crearCmdk(){
    velo = document.createElement('div');
    velo.className = 'cmdk-velo';
    velo.hidden = true;
    velo.addEventListener('click', function(){ cerrarCmdk(true); });

    cmdk = document.createElement('div');
    cmdk.className = 'cmdk';
    cmdk.hidden = true;
    cmdk.setAttribute('role', 'dialog');
    cmdk.setAttribute('aria-modal', 'true');
    cmdk.setAttribute('aria-label', 'Buscar en el portal');

    var cab = document.createElement('div');
    cab.className = 'cmdk-cab';
    cab.innerHTML = svg('buscar');
    entrada = document.createElement('input');
    entrada.type = 'search';
    entrada.setAttribute('role', 'combobox');
    entrada.setAttribute('aria-expanded', 'true');
    entrada.setAttribute('aria-controls', 'cmdkLista');
    entrada.setAttribute('aria-autocomplete', 'list');
    entrada.setAttribute('aria-label', 'Qué buscas');
    entrada.setAttribute('autocomplete', 'off');
    entrada.setAttribute('spellcheck', 'false');
    entrada.placeholder = 'Busca una sección, un tema o qué quieres hacer…';
    cab.appendChild(entrada);
    var esc = document.createElement('kbd'); esc.textContent = 'Esc';
    cab.appendChild(esc);

    lista = document.createElement('div');
    lista.className = 'cmdk-lista';
    lista.id = 'cmdkLista';
    lista.setAttribute('role', 'listbox');
    lista.setAttribute('aria-label', 'Resultados');

    var pie = document.createElement('div');
    pie.className = 'cmdk-pie';
    pie.innerHTML = '<span><kbd>↑</kbd> <kbd>↓</kbd> moverse</span><span><kbd>↵</kbd> abrir</span><span><kbd>Esc</kbd> cerrar</span>';

    cmdk.appendChild(cab); cmdk.appendChild(lista); cmdk.appendChild(pie);
    document.body.appendChild(velo);
    document.body.appendChild(cmdk);

    entrada.addEventListener('input', pintar);
    entrada.addEventListener('keydown', function(e){
      if(e.key === 'ArrowDown'){ e.preventDefault(); seleccionar(sel + 1); }
      else if(e.key === 'ArrowUp'){ e.preventDefault(); seleccionar(sel - 1); }
      else if(e.key === 'Enter'){ e.preventDefault(); if(opciones[sel]) ejecutar(opciones[sel].o); }
      else if(e.key === 'Escape'){ e.preventDefault(); cerrarCmdk(true); }
      else if(e.key === 'Tab'){ e.preventDefault(); }    // el foco vive en la caja
    });
  }

  function abrirCmdk(){
    if(!cmdk) crearCmdk();
    if(!cmdk.hidden) return;
    cerrarMega(false);
    cerrarMovil();
    indice = construirIndice();
    focoPrevio = document.activeElement;
    velo.hidden = false; cmdk.hidden = false;
    entrada.value = '';
    pintar();
    document.documentElement.classList.add('cmdk-abierto');
    requestAnimationFrame(function(){
      velo.classList.add('is-abierto');
      cmdk.classList.add('is-abierto');
    });
    entrada.focus();
  }

  function cerrarCmdk(devolverFoco){
    if(!cmdk || cmdk.hidden) return;
    velo.classList.remove('is-abierto');
    cmdk.classList.remove('is-abierto');
    document.documentElement.classList.remove('cmdk-abierto');
    setTimeout(function(){ if(!cmdk.classList.contains('is-abierto')){ cmdk.hidden = true; velo.hidden = true; } }, 260);
    if(devolverFoco && focoPrevio && focoPrevio.focus) focoPrevio.focus();
  }

  botonBuscar.addEventListener('click', abrirCmdk);
  document.addEventListener('keydown', function(e){
    var escribiendo = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable);
    if((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)){
      e.preventDefault();
      if(cmdk && !cmdk.hidden) cerrarCmdk(true); else abrirCmdk();
    }else if(e.key === '/' && !escribiendo && !e.metaKey && !e.ctrlKey && !e.altKey){
      e.preventDefault();
      abrirCmdk();
    }
  });

  /* ------------------------------------------------------------ aurora viva
     La tercera mancha de color sigue al cursor con inercia. Se interpola en
     un bucle rAF que se detiene solo cuando llega: sin ratón, cero coste. */
  var aura = document.querySelector('.mesh-aura');
  if(aura && !reduceMotion){
    var ax = window.innerWidth * 0.6, ay = window.innerHeight * 0.7, tx = ax, ty = ay, corriendo = false;
    function paso(){
      ax += (tx - ax) * 0.06; ay += (ty - ay) * 0.06;
      aura.style.setProperty('--ax', ax.toFixed(1) + 'px');
      aura.style.setProperty('--ay', ay.toFixed(1) + 'px');
      if(Math.abs(tx - ax) + Math.abs(ty - ay) > 0.5) requestAnimationFrame(paso);
      else corriendo = false;
    }
    window.addEventListener('pointermove', function(e){
      if(e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      if(!corriendo){ corriendo = true; requestAnimationFrame(paso); }
    }, { passive:true });
  }

  /* ------------------------------------------------------------ brillo del botón */
  if(puntoFino.matches && !reduceMotion){
    document.addEventListener('pointermove', function(e){
      var b = e.target && e.target.closest && e.target.closest('.btn-primary');
      if(!b) return;
      var r = b.getBoundingClientRect();
      b.style.setProperty('--bx', (e.clientX - r.left) + 'px');
      b.style.setProperty('--by', (e.clientY - r.top) + 'px');
    }, { passive:true });
  }

  /* ------------------------------------------------------------ aviso flotante
     Vive dentro de la cabecera en el HTML, pero la cabecera tiene
     backdrop-filter y eso convierte a sus hijos «fixed» en relativos a ella.
     Se saca al <body>. Si el visitante lo cerró, no se le vuelve a mostrar
     mientras el texto sea el mismo. */
  var aviso = document.getElementById('avisoBanner');
  var avisoTxt = document.getElementById('avisoBannerText');
  var avisoX = document.getElementById('avisoCloseBtn');
  var CLAVE = 'ciehs.aviso.cerrado';
  function leer(){ try{ return localStorage.getItem(CLAVE); }catch(e){ return null; } }
  if(aviso && avisoTxt){
    document.body.appendChild(aviso);
    var revisar = function(){
      if(!aviso.hidden && leer() === avisoTxt.textContent.trim()) aviso.hidden = true;
    };
    revisar();
    new MutationObserver(revisar).observe(aviso, { attributes:true, attributeFilter:['hidden'] });
    if(avisoX) avisoX.addEventListener('click', function(){
      try{ localStorage.setItem(CLAVE, avisoTxt.textContent.trim()); }catch(e){}
    });
  }

  CIEHS.abrirBuscador = abrirCmdk;
})();
