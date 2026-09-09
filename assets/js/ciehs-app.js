/* ============================================================================
   CIEHS · lógica del portal

   Estos bloques vivían como <script> inline dentro de index.html. Se extrajeron
   a un archivo propio por una razón concreta de seguridad: mientras hubiera
   JavaScript en línea, la Content-Security-Policy estaba obligada a permitir
   'unsafe-inline' en script-src, lo que deja abierta toda una clase de XSS.
   Con el código fuera, la política pasa a script-src 'self'.

   El orden importa y es el mismo que tenían en el HTML: cada bloque es una
   función autoejecutada independiente, pero algunos consumen lo que otros
   dejan en window.CIEHS.

   Se carga al final del <body>, así que el DOM ya existe cuando se ejecuta.
   ========================================================================== */

/* ===========================================================================
   1. bloque 1
   =========================================================================== */
(function(){
  // ===== router: una URL por sección, historial real y enlaces compartibles =====
  // Cada sección se refleja en location.hash como "#/ruta". El prefijo "#/"
  // (en lugar de un "#seccion" pelado) es deliberado: varias secciones tienen
  // un id que coincide con el nombre de su ruta, y un fragmento pelado haría
  // que el navegador saltara por scroll a ese elemento antes de que el router
  // pudiera actuar. Con "#/" ningún id coincide y el control es solo nuestro.
  var ROUTES = ['inicio','metodologia','investigaciones','equipos','modulos','trazabilidad','datos','juega','docentes','comunidad','mural','eureka','contacto','privacidad'];
  var ROUTE_LABELS = {
    inicio:'Inicio',
    metodologia:'Metodología', investigaciones:'Investigaciones', equipos:'Equipos',
    modulos:'Módulos', trazabilidad:'Trazabilidad', datos:'Datos',
    juega:'Juega y aprende', docentes:'Espacio docente y curricular', comunidad:'Comunidad, pedidos y transparencia',
    mural:'Nuestro Mural', eureka:'Rumbo a Eureka 2026', contacto:'Contacto',
    privacidad:'Privacidad y uso de imagen'
  };
  var pageEls = document.querySelectorAll('[data-page]');
  var routeEls = document.querySelectorAll('[data-route]');
  var currentRoute = null;

  function normalize(route){
    if(typeof route !== 'string') return 'inicio';
    route = route.trim().toLowerCase();
    return ROUTES.indexOf(route) === -1 ? 'inicio' : route;
  }

  // Tolerante con lo que llegue en la barra de direcciones: "#/modulos",
  // "#modulos", "#/modulos?utm=qr" y "#/MODULOS" resuelven todos a "modulos".
  // Devuelve además si el fragmento nombraba una ruta real, para saber cuándo
  // hay que reescribir la URL y cuándo conviene dejarla tal cual.
  function parseHash(){
    var raw = window.location.hash || '';
    raw = raw.replace(/^#\/?/, '').split('?')[0].split('&')[0];
    try{ raw = decodeURIComponent(raw); }catch(e){}
    var token = raw.trim().toLowerCase();
    var known = ROUTES.indexOf(token) !== -1;
    return { route: known ? token : 'inicio', known: known };
  }

  function hashFor(route){ return '#/' + normalize(route); }

  // Solo reescribimos la URL cuando el fragmento no nombra una ruta real
  // ("/", "#", "#inicio", "#/no-existe" -> "#/inicio"). Una ruta válida se
  // deja intacta aunque venga con mayúsculas o con parámetros de campaña,
  // que es lo que permitirá medir después qué QR del laboratorio se escanea.
  function canonicalize(parsed){
    if(parsed.known) return;
    if(window.location.hash === hashFor(parsed.route)) return;
    try{ history.replaceState(null, '', hashFor(parsed.route)); }catch(e){}
  }

  function render(route, opts){
    opts = opts || {};
    route = normalize(route);
    currentRoute = route;
    pageEls.forEach(function(el){ el.hidden = el.getAttribute('data-page') !== route; });
    routeEls.forEach(function(el){
      var active = el.getAttribute('data-route') === route;
      el.classList.toggle('is-active', active);
      // aria-current="page" solo tiene sentido en la navegacion principal.
      // Antes lo recibian los 13 elementos que apuntan a inicio (la marca mas
      // un breadcrumb "<- Inicio" por seccion) y un lector de pantalla
      // anunciaba trece veces "pagina actual".
      var isNav = el.closest('.nav, #mobileNav');
      if(active && isNav){ el.setAttribute('aria-current','page'); }
      else { el.removeAttribute('aria-current'); }
    });
    document.title = route === 'inicio'
      ? 'CIEHS · Centro de Investigación Escolar Hidropónico Sostenible'
      : ROUTE_LABELS[route] + ' · CIEHS — I.E. 80033 José Olaya Balandra';
    if(opts.moveFocus){
      window.scrollTo(0,0);
      var heading = document.querySelector('[data-page="'+route+'"] h1, [data-page="'+route+'"] h2');
      if(heading){
        heading.setAttribute('tabindex','-1');
        heading.focus({ preventScroll:true });
      }
    }
  }

  // Navegación iniciada por el usuario: escribimos la URL y dejamos que el
  // evento hashchange haga el render. Así un clic en el menú y una pulsación
  // de Atrás/Adelante recorren exactamente el mismo camino de código.
  function navigate(route){
    route = normalize(route);
    var target = hashFor(route);
    if(window.location.hash === target){
      render(route, { moveFocus:true });
    }else{
      window.location.hash = target;
    }
  }

  window.addEventListener('hashchange', function(){
    var parsed = parseHash();
    canonicalize(parsed);
    render(parsed.route, { moveFocus:true });
  });

  routeEls.forEach(function(el){
    el.addEventListener('click', function(){ navigate(el.getAttribute('data-route')); });
  });

  // Primera pintura: respeta el enlace profundo compartido o escaneado por QR
  // y canonicaliza la URL — "/", "#", "#inicio" o una ruta inventada terminan
  // todos en "#/inicio", de modo que lo que el visitante copie siempre sirva.
  var initial = parseHash();
  canonicalize(initial);
  render(initial.route, { moveFocus:false });

  // Punto de entrada para el resto de scripts y para los QR por sección.
  window.CIEHS = window.CIEHS || {};
  window.CIEHS.navigate = navigate;
  window.CIEHS.routes = ROUTES.slice();
  window.CIEHS.routeLabel = function(r){ return ROUTE_LABELS[normalize(r)]; };
  window.CIEHS.urlFor = function(r){
    return window.location.origin + window.location.pathname + hashFor(r);
  };
  window.CIEHS.currentRoute = function(){ return currentRoute; };

  // mobile nav
  var toggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');
  if(toggle && mobileNav){
    toggle.addEventListener('click', function(){
      var open = mobileNav.style.display === 'flex';
      mobileNav.style.display = open ? 'none' : 'flex';
      toggle.setAttribute('aria-expanded', String(!open));
    });
    mobileNav.querySelectorAll('button').forEach(function(b){
      b.addEventListener('click', function(){ mobileNav.style.display = 'none'; toggle.setAttribute('aria-expanded','false'); });
    });
  }

  // contact form -> opens the visitor's mail client with the message prefilled
  // (no backend, no stored/demo state — plain local handler)
  var contactForm = document.getElementById('contactForm');
  if(contactForm){
    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      var statusEl = document.getElementById('cf-status');
      if(!contactForm.checkValidity()){
        contactForm.reportValidity();
        if(statusEl){ statusEl.classList.add('error'); statusEl.textContent = 'Completa todos los campos antes de enviar.'; }
        return;
      }
      var nombre = document.getElementById('cf-nombre').value.trim();
      var correo = document.getElementById('cf-correo').value.trim();
      var asunto = document.getElementById('cf-asunto').value.trim();
      var mensaje = document.getElementById('cf-mensaje').value.trim();
      var subject = encodeURIComponent('[CIEHS] ' + asunto);
      var body = encodeURIComponent('Nombre: ' + nombre + '\nCorreo: ' + correo + '\n\n' + mensaje);
      if(statusEl){ statusEl.classList.remove('error'); statusEl.textContent = 'Abriendo tu cliente de correo…'; }
      window.location.href = 'mailto:ciehs.olaya@gmail.com?subject=' + subject + '&body=' + body;
    });
  }

  // table toggles
  document.querySelectorAll('.table-toggle').forEach(function(btn){
    btn.addEventListener('click', function(){
      var el = document.getElementById(btn.getAttribute('data-toggle'));
      if(!el) return;
      var showing = el.style.display !== 'none';
      el.style.display = showing ? 'none' : 'block';
      btn.textContent = showing ? 'Ver como tabla' : 'Ocultar tabla';
    });
  });

})();

/* ===========================================================================
   2. JUEGA: retos + Pasaporte CIEHS
   =========================================================================== */
(function(){
  var STORAGE_KEY = 'ciehs_pasaporte_v1';
  var state = { correct:{}, badges:{} };
  try{
    var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if(saved && saved.correct && saved.badges){ state = saved; }
  }catch(e){}

  var juegaPage = document.getElementById('page-juega');
  var levelTabs = juegaPage ? juegaPage.querySelectorAll('.level-tab') : [];
  var levelSets = juegaPage ? juegaPage.querySelectorAll('.quiz-set') : [];
  if(!levelTabs.length) return; // page not present

  levelTabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      levelTabs.forEach(function(t){ t.classList.toggle('is-active', t === tab); });
      var lvl = tab.getAttribute('data-level');
      levelSets.forEach(function(set){ set.hidden = set.getAttribute('data-level-set') !== lvl; });
    });
  });

  /* ---------------------------------------------------------------------
     El banco vive en /assets/js/ciehs-preguntas.js y aqui se baraja una
     ronda distinta cada vez. Antes las preguntas estaban escritas a mano en
     el HTML, siempre las mismas y en el mismo orden: se agotaban en una sola
     sesion de clase.
     --------------------------------------------------------------------- */
  var BANCO = window.CIEHS_PREGUNTAS || { inicial:[], primaria:[], secundaria:[] };
  var POR_RONDA = 8;
  var scoreEl = document.getElementById('quizScore');
  var rondaTxt = document.getElementById('quizRondaTxt');
  var rondaBtn = document.getElementById('quizRondaBtn');

  var totalQ = ['inicial','primaria','secundaria']
    .reduce(function(n, k){ return n + (BANCO[k] || []).length; }, 0);

  function barajar(arr){
    var a = arr.slice();
    for(var i = a.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function esc(t){
    return String(t == null ? '' : t)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // Primero lo que aun no se ha acertado, para que el estudiante avance en vez
  // de repetir lo que ya sabe. Si ya acerto casi todo, se completa la ronda con
  // preguntas antiguas marcadas como repaso.
  function elegirRonda(nivel){
    var banco = BANCO[nivel] || [];
    var pendientes = barajar(banco.filter(function(p){ return !state.correct[p.id]; }));
    var acertadas  = barajar(banco.filter(function(p){ return  state.correct[p.id]; }));
    return pendientes.concat(acertadas).slice(0, POR_RONDA);
  }

  function pintarNivel(nivel){
    var cont = juegaPage.querySelector('[data-level-set="' + nivel + '"]');
    if(!cont) return;
    var ronda = elegirRonda(nivel);
    cont.innerHTML = ronda.map(function(p){
      var repaso = !!state.correct[p.id];
      var opciones = barajar(p.ops).map(function(o){
        return '<button type="button" class="quiz-opt" data-correct="' + (o[1] ? 'true' : 'false') + '">'
             + esc(o[0]) + '</button>';
      }).join('');
      return '<div class="quiz-q' + (repaso ? ' ya-acertada' : '') + '" data-qid="' + esc(p.id)
           + '" data-category="' + esc(p.cat) + '" data-explain="' + esc(p.exp) + '">'
           + (repaso ? '<span class="quiz-repaso">Repaso · ya acertada</span>' : '')
           + '<p class="quiz-q-text">' + esc(p.q) + '</p>'
           + '<div class="quiz-opts">' + opciones + '</div>'
           + '<p class="quiz-feedback" hidden></p>'
           + '</div>';
    }).join('');
    conectarPreguntas(cont);
  }

  function pintarTodo(){
    ['inicial','primaria','secundaria'].forEach(pintarNivel);
    actualizarRonda();
  }

  function actualizarRonda(){
    if(!rondaTxt) return;
    var hechas = Object.keys(state.correct).length;
    var quedan = totalQ - hechas;
    rondaTxt.textContent = quedan > 0
      ? POR_RONDA + ' preguntas por nivel en cada ronda · te quedan ' + quedan + ' sin acertar de ' + totalQ
      : 'Has acertado las ' + totalQ + ' preguntas del banco. Las rondas siguen sirviendo como repaso.';
  }

  if(rondaBtn) rondaBtn.addEventListener('click', pintarTodo);

  function persist(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){} }

  function updateScore(){
    if(scoreEl) scoreEl.textContent = Object.keys(state.correct).length + ' / ' + totalQ;
  }

  function computeCienciaBadge(){
    var hasInicial=false, hasPrimaria=false, hasSecundaria=false;
    Object.keys(state.correct).forEach(function(qid){
      if(qid.indexOf('inicial-') === 0) hasInicial = true;
      if(qid.indexOf('primaria-') === 0) hasPrimaria = true;
      if(qid.indexOf('secundaria-') === 0) hasSecundaria = true;
    });
    return hasInicial && hasPrimaria && hasSecundaria;
  }

  function updateBadges(){
    document.querySelectorAll('.badge-card').forEach(function(card){
      var key = card.getAttribute('data-badge');
      var unlocked = !!state.badges[key];
      card.classList.toggle('is-unlocked', unlocked);
      var stateEl = card.querySelector('.badge-state');
      if(stateEl) stateEl.textContent = unlocked ? 'Desbloqueada' : 'Bloqueada';
    });
  }

  function markAnswered(q, opts, chosen, feedback){
    q.classList.add('is-answered');
    var isCorrect = chosen.getAttribute('data-correct') === 'true';
    opts.forEach(function(o){
      if(o.getAttribute('data-correct') === 'true') o.classList.add('correct');
      else if(o === chosen) o.classList.add('incorrect');
      o.disabled = true;
    });
    if(feedback){
      feedback.hidden = false;
      feedback.textContent = (isCorrect ? '✓ ' : '✗ ') + q.getAttribute('data-explain');
      feedback.classList.toggle('is-correct', isCorrect);
    }
    if(isCorrect){
      var qid = q.getAttribute('data-qid');
      state.correct[qid] = true;
      var cat = q.getAttribute('data-category');
      if(cat === 'agua') state.badges.agua = true;
      if(cat === 'clima') state.badges.clima = true;
      if(cat === 'cultivo') state.badges.cultivo = true;
      state.badges.ciencia = computeCienciaBadge();
    }
    // actualizarRonda tambien: el contador de "te quedan N sin acertar" se
    // calculaba solo al repintar la ronda, asi que se quedaba congelado
    // mientras el estudiante iba respondiendo.
    persist(); updateScore(); updateBadges(); actualizarRonda();
  }

  function conectarPreguntas(raiz){
    raiz.querySelectorAll('.quiz-q').forEach(function(q){
      var opts = [].slice.call(q.querySelectorAll('.quiz-opt'));
      var feedback = q.querySelector('.quiz-feedback');
      opts.forEach(function(o){
        o.addEventListener('click', function(){
          if(q.classList.contains('is-answered')) return;
          markAnswered(q, opts, o, feedback);
        });
      });
    });
  }

  pintarTodo();
  updateScore();
  updateBadges();

  var resetBtn = document.getElementById('quizReset');
  if(resetBtn){
    resetBtn.addEventListener('click', function(){
      state = { correct:{}, badges:{} };
      persist();
      pintarTodo();          // ronda nueva y limpia, en vez de reabrir la anterior
      updateScore();
      updateBadges();
    });
  }
})();

/* ===========================================================================
   3. RECURSOS DOCENTES: filtros
   =========================================================================== */
(function(){
  var groups = document.querySelectorAll('.res-filter-chips');
  var resGrid = document.getElementById('resGrid');
  // El catalogo se vuelve a consultar en cada filtrado: cuando la base
  // responde, la rejilla se repinta entera y una lista cacheada al arrancar
  // apuntaria a tarjetas que ya no estan en el documento.
  function tarjetas(){ return resGrid ? [].slice.call(resGrid.querySelectorAll(".res-card")) : []; }
  if(!groups.length || !resGrid) return;

  var countEl = document.getElementById('resCount');
  var emptyEl = document.getElementById('resEmpty');
  var active = { nivel:'todos', area:'todos', tipo:'todos' };

  groups.forEach(function(group){
    var key = group.getAttribute('data-filter');
    var chips = group.querySelectorAll('.res-chip');
    chips.forEach(function(chip){
      chip.addEventListener('click', function(){
        chips.forEach(function(c){ c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        active[key] = chip.getAttribute('data-value');
        applyFilters();
      });
    });
  });

  function applyFilters(){
    var visible = 0;
    tarjetas().forEach(function(card){
      var matches =
        (active.nivel === 'todos' || card.getAttribute('data-nivel') === active.nivel) &&
        (active.area === 'todos' || card.getAttribute('data-area') === active.area) &&
        (active.tipo === 'todos' || card.getAttribute('data-tipo') === active.tipo);
      card.hidden = !matches;
      if(matches) visible++;
    });
    if(countEl) countEl.textContent = visible + (visible === 1 ? ' recurso' : ' recursos');
    if(emptyEl) emptyEl.hidden = visible !== 0;
  }

  applyFilters();

  // Gancho para la capa de datos: al repintar la rejilla desde la base hay que
  // volver a aplicar el filtro activo, o las tarjetas nuevas saldrían todas.
  window.CIEHS = window.CIEHS || {};
  window.CIEHS.refiltrarRecursos = applyFilters;
})();

/* ===========================================================================
   4. MURAL: hotspots interactivos
   =========================================================================== */
(function(){
  var hotspots = document.querySelectorAll('.hotspot');
  if(!hotspots.length) return; // page not present

  var navBtns = document.querySelectorAll('.mural-nav button');
  var eyebrowEl = document.getElementById('muralEyebrow');
  var titleEl = document.getElementById('muralTitle');
  var bodyEl = document.getElementById('muralBody');

  var CONTENT = {
    agua: {
      label: '1 · Ciclo del agua',
      title: 'El ciclo del agua en hidroponía',
      html: '<p>En <b>raíz flotante</b>, el agua no se infiltra ni se evapora en la tierra: queda encerrada en el contenedor del módulo, con la raíz sumergida bebiendo de ella. Solo se repone lo que la planta consume y lo poco que se evapora en superficie. Por eso los <b>quince módulos DWC</b> del CIEHS logran cerca del <b>90&nbsp;% de ahorro hídrico</b> frente al cultivo tradicional en suelo.</p>'
        + '<p>El equipo de Monitoreo mide cada 5 días el <b>pH</b> (si el agua está ácida o alcalina, porque de eso depende que la raíz pueda absorber los nutrientes) y la <b>conductividad eléctrica, CE</b> (cuánta sal nutritiva queda disuelta). Toda esa lectura acaba publicada en la bitácora agronómica de este portal.</p>'
        + '<p>Nuestros módulos funcionan hoy <b>sin bomba de aire</b>: el oxígeno entra por la superficie y por la agitación manual en cada control. Instalar aireación forzada es la primera mejora planificada del laboratorio.</p>'
    },
    fito: {
      label: '2 · Fitohormonas',
      title: 'Fitohormonas y bioestimulantes',
      html: '<p>Las fitohormonas son sustancias naturales de las plantas —como las auxinas— que regulan su crecimiento y enraizamiento. INV-2026-02 estudia un <b>bioestimulante orgánico a base de germinados de lenteja</b>, rico en auxinas naturales, para favorecer el enraizamiento de plántulas hidropónicas.</p>'
    },
    ods: {
      label: '3 · Los 17 ODS',
      title: 'Los 17 Objetivos de Desarrollo Sostenible',
      html: '<p>La Agenda 2030 de Naciones Unidas define 17 ODS. El CIEHS se conecta especialmente con los ODS 2, 3, 4, 6, 12, 13 y 15 — con el <b>ODS 13 (Acción por el Clima)</b> como eje central de su indagación.</p>',
      showOds: true
    },
    identidad: {
      label: '4 · Nuestra identidad',
      title: 'I.E. N.° 80033 "José Olaya Balandra"',
      html: '<p>El CIEHS es el laboratorio de investigación escolar de la I.E. N.° 80033 <b>"José Olaya Balandra"</b>, en Huanchaco, La Libertad — con el lema <i>"Cultivamos Ciencia, Cosechamos Futuro"</i>. Lo sostienen <b>280 estudiantes de 1.° a 5.° de secundaria</b> repartidos en diez equipos de gestión.</p>'
        + '<p>El caballito de totora y el pingüino de Humboldt que aparecen en el mural no son adorno: son el recordatorio de que el problema que estudiamos —agua escasa, suelos salinizados, plástico en la playa— ocurre exactamente aquí.</p>'
    }
  };

  function buildOdsGrid(){
    var html = '<div class="ods17">';
    for(var i = 1; i <= 17; i++){
      html += '<div class="ods-tile' + (i === 13 ? ' is-focus' : '') + '">' + i + '</div>';
    }
    return html + '</div>';
  }

  function activate(key){
    var data = CONTENT[key];
    if(!data) return;
    hotspots.forEach(function(h){ h.classList.toggle('is-active', h.getAttribute('data-hotspot') === key); });
    navBtns.forEach(function(b){ b.classList.toggle('is-active', b.getAttribute('data-hotspot') === key); });
    if(eyebrowEl) eyebrowEl.textContent = data.label;
    if(titleEl) titleEl.textContent = data.title;
    if(bodyEl) bodyEl.innerHTML = data.html + (data.showOds ? buildOdsGrid() : '');
  }

  hotspots.forEach(function(h){
    h.addEventListener('click', function(){ activate(h.getAttribute('data-hotspot')); });
  });
  navBtns.forEach(function(b){
    b.addEventListener('click', function(){ activate(b.getAttribute('data-hotspot')); });
  });
})();

/* ===========================================================================
   5. PORTAL CONECTADO A SUPABASE (esquema ciehs)
   =========================================================================== */
(function(){
  var D = window.CIEHSData;

  var el = function(id){ return document.getElementById(id); };
  var avisoBanner = el('avisoBanner');
  var avisoText   = el('avisoBannerText');
  var avisoClose  = el('avisoCloseBtn');
  var syncLabel   = el('datosSyncLabel');
  var teleEstado  = el('telemetriaEstado');
  var teleLista   = el('telemetriaLista');

  var datos = null;      // ultimo snapshot cargado de la base
  var modulosPorId = {};

  /* ------------------------------------------------------------------
     Mejora progresiva: si la base no responde, el HTML que ya vino con
     la pagina se queda tal cual. El portal nunca depende de la red para
     poder leerse, que es lo que hace falta en el laboratorio.
     ------------------------------------------------------------------ */

  function fmtFecha(d){
    return d.toLocaleString('es-PE', {
      day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'
    });
  }

  function esc(t){
    return String(t == null ? '' : t)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ---------------------- portada, KPIs y aviso ---------------------- */

  function pintarConfig(c){
    if(!c) return;
    if(c.hero_title){
      var t = el('heroTitleMain');
      if(t) t.textContent = c.hero_title;
    }
    if(c.hero_subtitle){
      var sEl = el('heroSub');
      if(sEl) sEl.textContent = c.hero_subtitle;
    }
    if(c.kpi_ahorro_pct !== null && c.kpi_ahorro_pct !== undefined){
      document.querySelectorAll('.js-kpi-ahorro').forEach(function(x){
        x.innerHTML = esc(c.kpi_ahorro_pct) + '<small>%</small>';
      });
      document.querySelectorAll('.js-kpi-ahorro-neg').forEach(function(x){
        x.innerHTML = '-' + esc(c.kpi_ahorro_pct) + '<small>%</small>';
      });
    }
    if(c.kpi_cosecha_kg !== null && c.kpi_cosecha_kg !== undefined){
      var kg = Number(c.kpi_cosecha_kg);
      var txt = isNaN(kg) ? esc(c.kpi_cosecha_kg) : String(kg % 1 === 0 ? kg.toFixed(0) : kg);
      document.querySelectorAll('.js-kpi-cosecha').forEach(function(x){
        x.innerHTML = txt + '<small>&nbsp;kg</small>';
      });
    }
    pintarAviso(c);
    // Los KPI acaban de cambiar de valor: se vuelven a contar para que el
    // visitante vea que el dato es nuevo, no un numero que ya estaba ahi.
    if(window.CIEHS && window.CIEHS.recontar) window.CIEHS.recontar();
  }

  function avisoDescartado(){
    try{ return sessionStorage.getItem('ciehs_aviso_dismissed') === '1'; }catch(e){ return false; }
  }

  function pintarAviso(c){
    if(!avisoBanner || !avisoText) return;
    var hay = c && c.aviso_active && c.aviso;
    if(hay && !avisoDescartado()){
      avisoText.textContent = c.aviso;
      avisoBanner.hidden = false;
    }else{
      avisoBanner.hidden = true;
    }
  }

  if(avisoClose && avisoBanner){
    avisoClose.addEventListener('click', function(){
      avisoBanner.hidden = true;
      try{ sessionStorage.setItem('ciehs_aviso_dismissed','1'); }catch(e){}
    });
  }

  /* ------------------------- rangos por modulo ------------------------ */

  // El eje del grafico de pH va de 5.0 a 7.0 y el de CE de 1.0 a 2.5;
  // convertimos el rango de cada modulo a porcentaje sobre esa misma escala.
  // Un rango de 6 debe leerse "6.0": en una escala de pH la decima importa
  // y la base la guarda, aunque JSON la entregue como numero pelado.
  function dec1(v){ var n = Number(v); return isNaN(n) ? esc(v) : n.toFixed(1); }

  function barra(min, max, ejeMin, ejeMax){
    var span = ejeMax - ejeMin;
    var izq = Math.max(0, Math.min(100, ((min - ejeMin) / span) * 100));
    var anc = Math.max(1.5, Math.min(100 - izq, ((max - min) / span) * 100));
    return { left: izq, width: anc };
  }

  function pintarRangosPh(modulos){
    var cont = el('phModulosChart');
    if(!cont || !modulos.length) return;
    var filas = modulos.filter(function(m){ return m.ph_min != null && m.ph_max != null; });
    if(!filas.length) return;
    cont.innerHTML = filas.map(function(m){
      var b = barra(Number(m.ph_min), Number(m.ph_max), 5, 7);
      return '<div class="range-row">'
        + '<span class="range-label mono">' + esc(m.code) + '</span>'
        + '<div class="range-track"><div class="range-fill" data-left="' + b.left.toFixed(1) + '" data-width="' + b.width.toFixed(1) + '"></div></div>'
        + '<span class="range-value mono">' + dec1(m.ph_min) + '–' + dec1(m.ph_max) + '</span>'
        + '</div>';
    }).join('');
    // La posicion de cada barra se aplica por CSSOM y no como atributo style:
    // la CSP prohibe los atributos style, tambien los que llegan por innerHTML.
    cont.querySelectorAll('.range-fill[data-left]').forEach(function(f){
      f.style.left = f.getAttribute('data-left') + '%';
      f.style.width = f.getAttribute('data-width') + '%';
    });
    // Filas recien creadas: la capa de diseno las numera y las vuelve a dibujar
    // desde cero. Sin esto los rangos que vienen de la base aparecerian ya
    // completos, sin la animacion que si tienen los del HTML estatico.
    if(window.CIEHS && window.CIEHS.dibujarBarras) window.CIEHS.dibujarBarras();
  }

  /* --------------------------- telemetria ---------------------------- */

  function fuera(valor, min, max){
    if(valor == null || min == null || max == null) return false;
    return Number(valor) < Number(min) || Number(valor) > Number(max);
  }

  function pintarTelemetria(){
    if(!teleLista || !teleEstado) return;

    if(!D || !D.conectado){
      teleEstado.textContent = 'sin conexión';
      teleLista.innerHTML = '<p class="tele-empty">No se pudo consultar el registro de lecturas. '
        + 'Se muestran los rangos de referencia que trae el portal.</p>';
      return;
    }

    var lecturas = (datos && datos.lecturas) || [];
    if(!lecturas.length){
      teleEstado.textContent = '0 lecturas';
      // Estado vacio honesto: no se inventan mediciones que nadie ha tomado.
      teleLista.innerHTML = '<p class="tele-empty">Todavía no hay lecturas registradas. '
        + 'En cuanto el equipo anote la primera medición de pH y CE desde el panel de administración, '
        + 'aparecerá aquí con su fecha.</p>';
      return;
    }

    var ultimas = D.ultimaLecturaPorModulo(lecturas);
    var ids = Object.keys(ultimas);
    teleEstado.textContent = lecturas.length === 1 ? '1 lectura registrada' : lecturas.length + ' lecturas registradas';
    teleLista.innerHTML = ids.map(function(id){
      var l = ultimas[id];
      var m = modulosPorId[id] || {};
      var d = new Date(l.measured_at);
      var phFuera = fuera(l.ph, m.ph_min, m.ph_max);
      var ceFuera = fuera(l.ce, m.ce_min, m.ce_max);
      return '<div class="tele-row">'
        + '<span class="m">' + esc(m.code || '—') + '</span>'
        + '<span class="f">' + esc(isNaN(d.getTime()) ? '—' : fmtFecha(d)) + '</span>'
        + '<span class="v' + (phFuera ? ' fuera' : '') + '">' + (l.ph == null ? '—' : 'pH ' + esc(l.ph)) + '</span>'
        + '<span class="v' + (ceFuera ? ' fuera' : '') + '">' + (l.ce == null ? '—' : esc(l.ce) + ' <small>mS/cm</small>') + '</span>'
        + '</div>';
    }).join('');
  }

  function pintarSync(){
    if(!syncLabel) return;
    if(!D || !D.conectado){
      syncLabel.textContent = 'Sin conexión · valores de referencia publicados';
      return;
    }
    var f = D.ultimaSincronizacion(datos);
    syncLabel.textContent = f
      ? 'Última sincronización: ' + fmtFecha(f)
      : 'Sin lecturas registradas todavía';
  }

  /* ------------------------------ QR --------------------------------- */

  function pintarQR(qr){
    if(!qr || !qr.length) return;
    qr.forEach(function(q){
      var tarjeta = document.querySelector('[data-qr-card="' + q.target_route + '"]');
      if(!tarjeta) return;
      var h = tarjeta.querySelector('h4');
      var p = tarjeta.querySelector('p');
      if(h && q.title) h.textContent = q.title;
      if(p && q.description){
        p.textContent = q.description + (q.location_hint ? ' — ' + q.location_hint : '');
      }
    });
  }

  /* -------------------------- investigaciones ------------------------- */

  // La ficha se reconstruye entera desde la base, no solo el titulo: asi la
  // coordinacion puede corregir una hipotesis o publicar una investigacion
  // nueva sin tocar el codigo. Si la base no responde, el HTML que ya vino con
  // la pagina se queda intacto y la seccion sigue siendo legible.
  // Los nombres cientificos van en cursiva por convencion. El texto de la base
  // se escapa SIEMPRE primero y solo despues se convierte *asi* en <em>, de modo
  // que un asterisco no puede colar marcado: cuando llega aqui, cualquier < o &
  // ya es una entidad inofensiva.
  function enfasis(texto){
    return esc(texto).replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  function fichaInvestigacion(i){
    function fila(dt, dd){
      if(!dd) return '';
      return '<div><dt>' + esc(dt) + '</dt><dd>' + esc(dd) + '</dd></div>';
    }
    function parrafo(etiqueta, texto){
      if(!texto) return '';
      return '<p class="hyp"><b>' + esc(etiqueta) + ':</b> ' + enfasis(texto) + '</p>';
    }
    var chips = (i.tags || []).map(function(t, n){
      return '<span class="chip' + (n ? ' mono' : '') + '">' + enfasis(t) + '</span>';
    }).join('');

    return '<article class="card research-card" data-inv-code="' + esc(i.code) + '">'
      + '<div class="top-row"><span class="code mono">' + esc(i.code) + '</span>'
      + '<span class="chip status-curso">' + esc(i.status) + '</span></div>'
      + '<h3>' + enfasis(i.title) + '</h3>'
      + parrafo('Pregunta', i.question)
      + parrafo('Hipótesis', i.hypothesis)
      + '<dl class="var-list">'
      + fila('Variable independiente', i.var_independent)
      + fila('Variable dependiente', i.var_dependent)
      + fila('Variables de control', i.var_control)
      + '</dl>'
      + parrafo('Metodología', i.method)
      + (chips ? '<div class="meta">' + chips + '</div>' : '')
      + '</article>';
  }

  function pintarInvestigaciones(inv){
    var grid = el('invGrid');
    var origen = el('invOrigen');
    if(!grid) return;

    if(!inv || !inv.length){
      // Sin filas publicadas se conserva el HTML de respaldo: dejar la seccion
      // vacia seria peor que mostrar el contenido que ya trae la pagina.
      if(origen){
        origen.className = 'inv-origen local';
        origen.innerHTML = '<span class="punto"></span>Mostrando la ficha publicada en el portal · sin conexión con la base';
      }
      return;
    }

    grid.innerHTML = inv.map(fichaInvestigacion).join('');
    if(origen){
      var fecha = inv.map(function(x){ return x.updated_at; }).filter(Boolean).sort().pop();
      var d = fecha ? new Date(fecha) : null;
      origen.className = 'inv-origen';
      origen.innerHTML = '<span class="punto"></span>'
        + inv.length + (inv.length === 1 ? ' investigación publicada' : ' investigaciones publicadas')
        + (d && !isNaN(d.getTime()) ? ' · actualizado ' + fmtFecha(d) : '');
    }
  }

  /* ------------------------------ carga ------------------------------- */

  // Deja las cuatro secciones que arrancan con esqueleto en su estado "sin
  // base": cada pintor ya sabe explicar por que no hay nada. Sin esto el
  // esqueleto se quedaria brillando para siempre.
  function rendirseConLasSeccionesDeRed(){
    pintarCarpeta(); pintarBitacora(); pintarTransparencia(); pintarComentarios();
  }

  function refrescar(){
    if(!D || !D.listo){ rendirseConLasSeccionesDeRed(); return Promise.resolve(); }
    return D.cargarPortal().then(function(res){
      if(!res) {
        pintarSync(); pintarTelemetria();
        rendirseConLasSeccionesDeRed();
        return;
      }
      datos = res;
      modulosPorId = {};
      res.modulos.forEach(function(m){ modulosPorId[m.id] = m; });
      pintarConfig(res.config);
      pintarRangosPh(res.modulos);
      pintarQR(res.qr);
      pintarInvestigaciones(res.investigaciones);
      pintarTelemetria();
      pintarSync();
      llenarSelectorModulos(res.modulos);
      pintarCarpeta();
      pintarBitacora();
      pintarRecursos();
      pintarTransparencia();
      pintarComentarios();
      if(window.CIEHS && window.CIEHS.escalonar) window.CIEHS.escalonar();
    })["catch"](function(err){
      // Un rechazo (red caida, CORS, token invalido) tiene que terminar igual
      // que una respuesta vacia: con un mensaje, no con un esqueleto eterno.
      if(window.console && console.warn) console.warn("CIEHS: no se pudo cargar el portal", err);
      pintarSync(); pintarTelemetria();
      rendirseConLasSeccionesDeRed();
    });
  }
  /* ================= SECCIONES 2026: carpeta, bitácora, comunidad ==========
     Todas siguen la misma regla que el resto del portal: si la base responde,
     mandan sus datos; si no responde, se queda el HTML estático que ya vino con
     la página y el visitante ve un mensaje explícito en lugar de una lista
     vacía sin explicación. */

  function fmtDia(v){
    if(!v) return '—';
    var d = new Date(v + (String(v).length === 10 ? 'T12:00:00' : ''));
    if(isNaN(d.getTime())) return esc(v);
    return d.toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric' });
  }
  function num(v, dec){
    if(v == null || v === '') return '—';
    var n = Number(v);
    return isNaN(n) ? esc(v) : n.toFixed(dec == null ? 1 : dec);
  }
  function soles(v){
    var n = Number(v || 0);
    return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits:2, maximumFractionDigits:2 });
  }

  /* ---------------------- carpeta de campo digital -------------------- */

  var carpetaGrid   = el('carpetaGrid');
  var carpetaEstado = el('carpetaEstado');
  var carpetaFiltro = 'todos';

  var ETIQUETA_TIPO = {
    articulo:'Artículo', informe:'Informe científico', foto:'Fotografía',
    evidencia:'Evidencia experimental', bitacora:'Bitácora'
  };

  function pintarCarpeta(){
    if(!carpetaGrid) return;
    var filas = (datos && datos.carpeta) || [];
    if(carpetaFiltro !== 'todos'){
      filas = filas.filter(function(f){ return f.kind === carpetaFiltro; });
    }
    if(!filas.length){
      carpetaGrid.innerHTML = '';
      if(carpetaEstado){
        carpetaEstado.hidden = false;
        carpetaEstado.textContent = (datos && datos.carpeta && datos.carpeta.length)
          ? 'No hay entradas de ese tipo todavía.'
          : (D && D.conectado
              ? 'La carpeta de campo está abierta y todavía sin entradas publicadas. Las primeras las suben los equipos al cerrar el ciclo en curso.'
              : 'No se pudo conectar con la base del CIEHS, así que la carpeta de campo no se puede mostrar ahora mismo.');
      }
      return;
    }
    if(carpetaEstado) carpetaEstado.hidden = true;
    carpetaGrid.innerHTML = filas.map(function(f){
      var media = f.media_url
        ? '<a class="carpeta-link" href="' + esc(f.media_url) + '" target="_blank" rel="noopener noreferrer">Ver el archivo adjunto</a>'
        : '';
      return '<article class="card carpeta-card" data-kind="' + esc(f.kind) + '">'
        + '<div class="top-row"><span class="code mono">' + esc(f.code) + '</span>'
        + '<span class="chip">' + esc(ETIQUETA_TIPO[f.kind] || f.kind) + '</span></div>'
        + '<h3>' + esc(f.title) + '</h3>'
        + (f.summary ? '<p class="carpeta-sum">' + esc(f.summary) + '</p>' : '')
        + (f.body ? '<p class="carpeta-body">' + esc(f.body) + '</p>' : '')
        + media
        + '<div class="meta">'
        +   (f.author_label ? '<span class="chip">' + esc(f.author_label) + '</span>' : '')
        +   (f.team ? '<span class="chip">' + esc(f.team) + '</span>' : '')
        +   '<span class="chip mono">' + fmtDia(f.published_on || f.updated_at) + '</span>'
        + '</div>'
        + '</article>';
    }).join('');
  }

  document.querySelectorAll('[data-carpeta-filtro]').forEach(function(b){
    b.addEventListener('click', function(){
      carpetaFiltro = b.getAttribute('data-carpeta-filtro');
      document.querySelectorAll('[data-carpeta-filtro]').forEach(function(o){
        o.classList.toggle('is-active', o === b);
      });
      pintarCarpeta();
    });
  });

  /* ---------------------- bitácora agronómica ------------------------- */

  var bitCuerpo  = el('bitacoraCuerpo');
  var bitEstado  = el('bitacoraEstado');
  var bitSelect  = el('bitacoraCultivo');

  function pintarBitacora(){
    if(!bitCuerpo) return;
    var filas = (datos && datos.bitacora) || [];

    // El selector se llena con los cultivos que realmente hay registrados, no
    // con una lista fija: si mañana se siembra otra especie, aparece sola.
    if(bitSelect && bitSelect.options.length <= 1 && filas.length){
      var vistos = {};
      filas.forEach(function(f){
        if(f.crop && !vistos[f.crop]){
          vistos[f.crop] = true;
          var o = document.createElement('option');
          o.value = f.crop; o.textContent = f.crop;
          bitSelect.appendChild(o);
        }
      });
    }
    var filtro = bitSelect ? bitSelect.value : 'todos';
    if(filtro && filtro !== 'todos'){
      filas = filas.filter(function(f){ return f.crop === filtro; });
    }

    if(!filas.length){
      bitCuerpo.innerHTML = '';
      if(bitEstado){
        bitEstado.hidden = false;
        bitEstado.textContent = D && D.conectado
          ? 'Todavía no hay lotes registrados para ese filtro.'
          : 'No se pudo conectar con la base del CIEHS: la bitácora no se puede mostrar ahora mismo.';
      }
      return;
    }
    if(bitEstado) bitEstado.hidden = true;
    bitCuerpo.innerHTML = filas.map(function(f){
      var cosecha = f.harvest_on
        ? fmtDia(f.harvest_on) + (f.harvest_kg ? ' · ' + num(f.harvest_kg, 2) + ' kg' : '')
        : '—';
      return '<tr>'
        + '<td class="mono">' + esc(f.lote) + '</td>'
        + '<td>' + esc(f.crop) + (f.scientific ? '<br><em class="bit-cientifico">' + esc(f.scientific) + '</em>' : '') + '</td>'
        + '<td class="mono">' + esc(f.module_code || '—') + '</td>'
        + '<td>' + fmtDia(f.sown_on) + '</td>'
        + '<td class="tabular">' + (f.week == null ? '—' : esc(f.week)) + '</td>'
        + '<td class="tabular">' + num(f.ph) + '</td>'
        + '<td class="tabular">' + num(f.ce, 2) + '</td>'
        + '<td>' + esc(f.phase || '—') + '</td>'
        + '<td>' + cosecha + '</td>'
        + '</tr>';
    }).join('');
  }

  if(bitSelect) bitSelect.addEventListener("change", function(){
    pintarBitacora();
    if(window.CIEHS && window.CIEHS.escalonar) window.CIEHS.escalonar();
  });

  /* -------------------- espacio docente: recursos --------------------- */

  var destacadosGrid = el('destacadosGrid');
  var resGrid        = el('resGrid');
  var resCount       = el('resCount');

  var FORMATO_ETIQUETA = {
    pdf:'PDF', audio:'Audio', video:'Vídeo', imagen:'Imagen', doc:'Documento', enlace:'Enlace'
  };
  var NIVEL_ETIQUETA = { inicial:'Inicial', primaria:'Primaria', secundaria:'Secundaria', todos:'Todos los niveles' };
  var AREA_ETIQUETA = {
    cyt:'Ciencia y Tecnología', mate:'Matemática', comu:'Comunicación', cs:'Ciencias Sociales',
    arte:'Arte y Cultura', ept:'Educación para el Trabajo', digital:'Competencias Digitales'
  };

  function botonRecurso(r){
    if(!r.file_url){
      return '<button type="button" class="res-btn" disabled title="Disponible cuando el administrador cargue el archivo">Ver / Descargar</button>';
    }
    var texto = r.file_kind === 'audio' ? 'Escuchar / Descargar' : 'Ver / Descargar';
    return '<a class="res-btn is-ready" href="' + esc(r.file_url) + '" target="_blank" rel="noopener noreferrer">' + texto + '</a>';
  }

  function pintarRecursos(){
    var filas = (datos && datos.recursos) || [];
    if(!filas.length) return;   // se queda el catálogo de ejemplo del HTML

    if(destacadosGrid){
      var destacados = filas.filter(function(r){ return r.featured; });
      if(destacados.length){
        destacadosGrid.innerHTML = destacados.map(function(r){
          var reproductor = (r.file_kind === 'audio' && r.file_url)
            ? '<audio class="destacado-audio" controls preload="none" src="' + esc(r.file_url) + '">'
              + 'Tu navegador no puede reproducir este audio. '
              + '<a href="' + esc(r.file_url) + '">Descárgalo aquí</a>.</audio>'
            : '<div class="destacado-player">' + botonRecurso(r) + '</div>';
          return '<article class="card destacado-card">'
            + '<div class="destacado-top">'
            +   '<span class="destacado-kind">' + esc(FORMATO_ETIQUETA[r.file_kind] || r.kind || 'Recurso') + '</span>'
            +   '<span class="destacado-dur mono">' + esc(r.duration || NIVEL_ETIQUETA[r.level] || '') + '</span>'
            + '</div>'
            + '<h3>' + esc(r.title) + '</h3>'
            + (r.description ? '<p>' + esc(r.description) + '</p>' : '')
            + reproductor
            + '<div class="meta"><span class="chip">' + esc(NIVEL_ETIQUETA[r.level] || r.level || '') + '</span>'
            +   (r.area ? '<span class="chip">' + esc(AREA_ETIQUETA[r.area] || r.area) + '</span>' : '')
            + '</div>'
            + '</article>';
        }).join('');
      }
    }

    if(resGrid){
      resGrid.innerHTML = filas.map(function(r){
        return '<article class="card res-card" data-nivel="' + esc(r.level || 'todos') + '"'
          + ' data-area="' + esc(r.area || '') + '" data-tipo="' + esc(r.kind || '') + '">'
          + '<div class="top-row"><span class="chip">' + esc(r.kind || 'Recurso') + '</span></div>'
          + '<h3>' + esc(r.title) + '</h3>'
          + (r.description ? '<p>' + esc(r.description) + '</p>' : '')
          + '<div class="meta"><span class="chip">' + esc(NIVEL_ETIQUETA[r.level] || r.level || '') + '</span>'
          +   (r.area ? '<span class="chip">' + esc(AREA_ETIQUETA[r.area] || r.area) + '</span>' : '')
          + '</div>'
          + botonRecurso(r)
          + '</article>';
      }).join('');
      if(resCount) resCount.textContent = filas.length + (filas.length === 1 ? ' recurso' : ' recursos');
      if(window.CIEHS && typeof window.CIEHS.refiltrarRecursos === 'function'){
        window.CIEHS.refiltrarRecursos();
      }
    }
  }

  /* ------------------------- transparencia ---------------------------- */

  var transpCuerpo = el('transpCuerpo');
  var transpEstado = el('transpEstado');

  function pintarTransparencia(){
    if(!transpCuerpo) return;
    var filas = (datos && datos.caja) || [];
    var ingresos = 0, egresos = 0;
    filas.forEach(function(f){
      var n = Number(f.amount_pen || 0);
      if(f.kind === 'ingreso') ingresos += n; else egresos += n;
    });
    var ti = el('transpIngresos'), te = el('transpEgresos'), ts = el('transpSaldo');
    if(ti) ti.textContent = soles(ingresos);
    if(te) te.textContent = soles(egresos);
    if(ts) ts.textContent = soles(ingresos - egresos);

    if(!filas.length){
      transpCuerpo.innerHTML = '';
      if(transpEstado){
        transpEstado.hidden = false;
        transpEstado.textContent = D && D.conectado
          ? 'Todavía no hay movimientos publicados. El equipo de Tesorería registra aquí cada venta y cada compra de insumos.'
          : 'No se pudo conectar con la base del CIEHS: el registro de caja no se puede mostrar ahora mismo.';
      }
      return;
    }
    if(transpEstado) transpEstado.hidden = true;
    transpCuerpo.innerHTML = filas.map(function(f){
      return '<tr class="transp-fila ' + esc(f.kind) + '">'
        + '<td>' + fmtDia(f.occurred_on) + '</td>'
        + '<td>' + esc(f.concept) + (f.note ? '<br><span class="transp-nota">' + esc(f.note) + '</span>' : '') + '</td>'
        + '<td><span class="chip ' + (f.kind === 'ingreso' ? 'status-activo' : 'status-plan') + '">'
        +   (f.kind === 'ingreso' ? 'Ingreso' : 'Egreso') + '</span></td>'
        + '<td class="tabular transp-monto">' + (f.kind === 'egreso' ? '−' : '') + num(f.amount_pen, 2) + '</td>'
        + '</tr>';
    }).join('');
  }

  /* --------------------- comentarios de la comunidad ------------------- */

  var comentariosLista  = el('comentariosLista');
  var comentariosEstado = el('comentariosEstado');
  var ROL_ETIQUETA = { estudiante:'Estudiante', docente:'Docente', familia:'Familia', visitante:'Visitante' };

  function pintarComentarios(){
    if(!comentariosLista) return;
    var filas = (datos && datos.comentarios) || [];
    if(!filas.length){
      comentariosLista.innerHTML = '';
      if(comentariosEstado){
        comentariosEstado.hidden = false;
        comentariosEstado.textContent = D && D.conectado
          ? 'Todavía no hay comentarios publicados. El tuyo puede ser el primero — pasará antes por la coordinación.'
          : 'No se pudo conectar con la base del CIEHS: los comentarios no se pueden mostrar ahora mismo.';
      }
      return;
    }
    if(comentariosEstado) comentariosEstado.hidden = true;
    comentariosLista.innerHTML = filas.map(function(c){
      return '<article class="comentario">'
        + '<div class="comentario-head">'
        +   '<b>' + esc(c.display_name) + '</b>'
        +   '<span class="chip">' + esc(ROL_ETIQUETA[c.role] || 'Visitante') + '</span>'
        +   '<span class="comentario-fecha mono">' + fmtDia(c.created_at) + '</span>'
        + '</div>'
        + '<p class="comentario-msg">' + esc(c.message) + '</p>'
        + (c.reply ? '<p class="comentario-reply"><b>Respuesta del CIEHS:</b> ' + esc(c.reply) + '</p>' : '')
        + '</article>';
    }).join('');
  }

  /* ------------------ formularios públicos: pedido y comentario -------- */

  function conectarEnvio(form, trampaId, statusId, envio, exito){
    if(!form) return;
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      var status = el(statusId);
      var trampa = el(trampaId);
      // Campo trampa: invisible para una persona, irresistible para un bot.
      // Si viene relleno, se finge el envío y no se escribe nada.
      if(trampa && trampa.value){ if(status) status.textContent = exito; form.reset(); return; }
      if(!D || !D.listo){
        if(status){ status.classList.add('error'); status.textContent = 'No hay conexión con la base del CIEHS. Vuelve a intentarlo más tarde.'; }
        return;
      }
      var boton = form.querySelector('button[type="submit"]');
      if(boton) boton.disabled = true;
      if(status){ status.classList.remove('error'); status.textContent = 'Enviando…'; }
      envio().then(function(){
        if(boton) boton.disabled = false;
        if(status) status.textContent = exito;
        form.reset();
      }).catch(function(e){
        if(boton) boton.disabled = false;
        if(status){
          status.classList.add('error');
          status.textContent = 'No se pudo enviar: ' + ((e && e.message) || 'error desconocido');
        }
      });
    });
  }

  conectarEnvio(el('pedidoForm'), 'pedTrampa', 'pedStatus', function(){
    return D.crearPedido({
      nombre: (el('pedNombre').value || '').trim(),
      contacto: (el('pedContacto').value || '').trim(),
      cultivo: el('pedCultivo') ? el('pedCultivo').value : null,
      kg: el('pedKg').value,
      notas: (el('pedNota').value || '').trim()
    });
  }, 'Reserva recibida. El equipo de Ventas te confirmará la disponibilidad y el día de entrega.');

  conectarEnvio(el('comentarioForm'), 'comTrampa', 'comStatus', function(){
    return D.crearComentario({
      nombre: (el('comNombre').value || '').trim(),
      rol: el('comRol') ? el('comRol').value : null,
      mensaje: (el('comMensaje').value || '').trim()
    });
  }, 'Gracias. Tu comentario llegó a la coordinación y se publicará en cuanto lo revise.');

  /* =================== PANEL DE ADMINISTRACION =================== */

  var adminModal   = el('adminModal');
  var adminOpen    = el('adminOpenBtn');
  var adminClose   = el('adminCloseBtn');
  var adminBack    = el('adminBackdrop');
  var loginStep    = el('adminPinStep');
  var formStep     = el('adminFormStep');
  var loginBtn     = el('adminPinSubmit');
  var loginError   = el('adminPinError');
  var connBox      = el('adminConn');
  var whoBox       = el('adminWho');
  var logoutBtn    = el('adminLogoutBtn');
  var saveBtn      = el('adminSaveBtn');
  var saveStatus   = el('adminSaveStatus');
  var teleSaveBtn  = el('teleSaveBtn');
  var teleStatus   = el('teleStatus');
  var teleModulo   = el('teleModulo');

  function llenarSelectorModulos(modulos){
    if(!teleModulo) return;
    teleModulo.innerHTML = (modulos || []).map(function(m){
      return '<option value="' + esc(m.id) + '">' + esc(m.code) + ' · ' + esc(m.crop || m.name) + '</option>';
    }).join('');
  }

  function mostrarConexion(){
    if(!connBox) return;
    if(!D || !D.listo){
      connBox.className = 'admin-conn bad';
      connBox.textContent = 'No se pudo cargar el cliente de la base de datos.';
      return;
    }
    if(D.conectado){
      connBox.className = 'admin-conn ok';
      connBox.textContent = 'Conectado a la base del CIEHS · esquema ciehs';
    }else{
      connBox.className = 'admin-conn bad';
      connBox.textContent = D.motivo || 'Sin conexión con la base del CIEHS.';
    }
  }

  function abrirPanel(){
    if(!adminModal) return;
    adminModal.hidden = false;
    document.body.style.overflow = 'hidden';
    mostrarConexion();
    if(loginError){ loginError.hidden = true; }
    D.sesion().then(function(ses){
      if(!ses) return false;
      return D.esAdmin();
    }).then(function(ok){
      if(ok){ mostrarFormulario(); } else { mostrarLogin(); }
    }).catch(function(){ mostrarLogin(); });
  }

  function cerrarPanel(){
    if(!adminModal) return;
    adminModal.hidden = true;
    document.body.style.overflow = '';
  }

  function mostrarLogin(){
    if(loginStep) loginStep.hidden = false;
    if(formStep) formStep.hidden = true;
  }

  function mostrarFormulario(){
    if(loginStep) loginStep.hidden = true;
    if(formStep) formStep.hidden = false;
    abrirPestana('portada');
    rellenarFormulario();
    D.sesion().then(function(ses){
      if(whoBox && ses && ses.user) whoBox.textContent = 'Sesión: ' + ses.user.email;
    });
  }

  function rellenarFormulario(){
    var c = (datos && datos.config) || {};
    if(el('adminHeroTitle'))  el('adminHeroTitle').value  = c.hero_title || '';
    if(el('adminHeroSub'))    el('adminHeroSub').value    = c.hero_subtitle || '';
    if(el('adminKpiCosecha')) el('adminKpiCosecha').value = c.kpi_cosecha_kg != null ? c.kpi_cosecha_kg : '';
    if(el('adminKpiAhorro'))  el('adminKpiAhorro').value  = c.kpi_ahorro_pct != null ? c.kpi_ahorro_pct : '';
    if(el('adminAviso'))      el('adminAviso').value      = c.aviso || '';
    if(el('adminAvisoActive'))el('adminAvisoActive').checked = !!c.aviso_active;
    if(datos && datos.modulos) llenarSelectorModulos(datos.modulos);
  }

  if(adminOpen)  adminOpen.addEventListener('click', abrirPanel);
  if(adminClose) adminClose.addEventListener('click', cerrarPanel);
  if(adminBack)  adminBack.addEventListener('click', cerrarPanel);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && adminModal && !adminModal.hidden) cerrarPanel();
  });

  function entrar(){
    var email = (el('adminEmail') || {}).value;
    var pass  = (el('adminPassword') || {}).value;
    if(!email || !pass){
      loginError.textContent = 'Escribe el correo y la contraseña.';
      loginError.hidden = false;
      return;
    }
    loginBtn.disabled = true;
    loginError.hidden = true;
    D.entrar(email.trim(), pass).then(function(){
      loginBtn.disabled = false;
      if(el('adminPassword')) el('adminPassword').value = '';
      return refrescar().then(mostrarFormulario);
    }).catch(function(e){
      loginBtn.disabled = false;
      var m = (e && e.message) || 'No se pudo iniciar sesión.';
      if(/invalid login credentials/i.test(m)) m = 'Correo o contraseña incorrectos.';
      loginError.textContent = m;
      loginError.hidden = false;
    });
  }

  if(loginBtn) loginBtn.addEventListener('click', entrar);
  [el('adminEmail'), el('adminPassword')].forEach(function(inp){
    if(!inp) return;
    inp.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ e.preventDefault(); entrar(); }
    });
  });

  if(logoutBtn){
    logoutBtn.addEventListener('click', function(){
      D.salir().then(function(){ mostrarLogin(); });
    });
  }

  if(saveBtn){
    saveBtn.addEventListener('click', function(){
      saveBtn.disabled = true;
      saveStatus.classList.remove('error');
      saveStatus.textContent = 'Guardando…';
      D.guardarConfig({
        heroTitle:    el('adminHeroTitle').value.trim(),
        heroSub:      el('adminHeroSub').value.trim(),
        kpiCosechaKg: el('adminKpiCosecha').value.trim(),
        kpiAhorroPct: el('adminKpiAhorro').value.trim(),
        aviso:        el('adminAviso').value.trim(),
        avisoActive:  el('adminAvisoActive').checked
      }).then(function(){
        try{ sessionStorage.removeItem('ciehs_aviso_dismissed'); }catch(e){}
        return refrescar();
      }).then(function(){
        saveBtn.disabled = false;
        saveStatus.textContent = 'Cambios publicados para todo el portal.';
      }).catch(function(e){
        saveBtn.disabled = false;
        saveStatus.classList.add('error');
        saveStatus.textContent = 'No se pudo guardar: ' + ((e && e.message) || 'error desconocido');
      });
    });
  }

  if(teleSaveBtn){
    teleSaveBtn.addEventListener('click', function(){
      var ph = el('telePh').value.trim();
      var ce = el('teleCe').value.trim();
      if(!ph && !ce){
        teleStatus.classList.add('error');
        teleStatus.textContent = 'Anota al menos el pH o la CE.';
        return;
      }
      teleSaveBtn.disabled = true;
      teleStatus.classList.remove('error');
      teleStatus.textContent = 'Registrando…';
      D.registrarLectura({
        moduleId: teleModulo.value,
        ph: ph, ce: ce,
        notes: el('teleNota').value.trim()
      }).then(function(){
        el('telePh').value = ''; el('teleCe').value = ''; el('teleNota').value = '';
        return refrescar();
      }).then(function(){
        teleSaveBtn.disabled = false;
        teleStatus.textContent = 'Lectura registrada y publicada en la sección Datos.';
      }).catch(function(e){
        teleSaveBtn.disabled = false;
        teleStatus.classList.add('error');
        teleStatus.textContent = 'No se pudo registrar: ' + ((e && e.message) || 'error desconocido');
      });
    });
  }


  /* ==================== PESTAÑAS DEL PANEL ==================== */

  var tabBtns = document.querySelectorAll('.admin-tabs [data-tab]');
  var tabPanes = document.querySelectorAll('[data-tabpanel]');

  function abrirPestana(nombre){
    tabBtns.forEach(function(b){
      var activo = b.getAttribute('data-tab') === nombre;
      b.classList.toggle('is-active', activo);
      b.setAttribute('aria-selected', String(activo));
    });
    tabPanes.forEach(function(p){
      p.hidden = p.getAttribute('data-tabpanel') !== nombre;
    });
    if(nombre === 'investigaciones') cargarListaInvestigaciones();
    if(window.CIEHS && window.CIEHS.cargarPestanaAdmin) window.CIEHS.cargarPestanaAdmin(nombre);
  }

  tabBtns.forEach(function(b){
    b.addEventListener('click', function(){ abrirPestana(b.getAttribute('data-tab')); });
  });

  /* ================ EDITOR DE INVESTIGACIONES ================ */

  var invLista     = el('invAdminLista');
  var invForm      = el('invForm');
  var invFormTit   = el('invFormTitulo');
  var invNuevaBtn  = el('invNuevaBtn');
  var invCancelar  = el('invCancelarBtn');
  var invBorrar    = el('invBorrarBtn');
  var invGuardar   = el('invGuardarBtn');
  var invMsg       = el('invStatusMsg');

  var invEditando = null;   // code de la fila en edicion, o null si es nueva
  var invCache = [];

  function cargarListaInvestigaciones(){
    if(!invLista) return;
    invLista.innerHTML = '<p class="inv-vacia">Cargando…</p>';
    D.listarInvestigaciones().then(function(filas){
      invCache = filas;
      if(!filas.length){
        invLista.innerHTML = '<p class="inv-vacia">Todavía no hay ninguna investigación registrada.</p>';
        return;
      }
      invLista.innerHTML = filas.map(function(f){
        var pub = f.published;
        return '<div class="inv-item">'
          + '<div class="txt">'
          +   '<span class="cod">' + esc(f.code) + '</span>'
          +   '<span class="tit">' + enfasis(f.title || '') + '</span>'
          + '</div>'
          + '<span class="estado ' + (pub ? 'pub' : 'bor') + '">' + (pub ? 'publicada' : 'borrador') + '</span>'
          + '<button type="button" class="editar" data-editar="' + esc(f.code) + '">Editar</button>'
          + '</div>';
      }).join('');
      invLista.querySelectorAll('[data-editar]').forEach(function(b){
        b.addEventListener('click', function(){ abrirFicha(b.getAttribute('data-editar')); });
      });
    }).catch(function(e){
      invLista.innerHTML = '<p class="inv-vacia">No se pudo cargar la lista: ' + esc((e && e.message) || 'error') + '</p>';
    });
  }

  function valor(id, v){ var n = el(id); if(n) n.value = v == null ? '' : v; }

  function abrirFicha(code){
    var f = invCache.filter(function(x){ return x.code === code; })[0];
    invEditando = f ? f.code : null;
    invFormTit.textContent = f ? ('Editando ' + f.code) : 'Nueva investigación';
    valor('invCode', f ? f.code : '');
    valor('invStatus', f ? f.status : 'Proyecto Eureka 2026');
    valor('invTitle', f ? f.title : '');
    valor('invQuestion', f ? f.question : '');
    valor('invHypothesis', f ? f.hypothesis : '');
    valor('invVarInd', f ? f.var_independent : '');
    valor('invVarDep', f ? f.var_dependent : '');
    valor('invVarCon', f ? f.var_control : '');
    valor('invMethod', f ? f.method : '');
    valor('invTags', f && f.tags ? f.tags.join('\n') : '');
    valor('invPosition', f ? f.position : (invCache.length + 1));
    el('invPublished').checked = f ? !!f.published : false;
    // El codigo identifica la fila: cambiarlo al editar crearia una copia en
    // vez de actualizar, asi que se bloquea mientras se edita.
    el('invCode').readOnly = !!f;
    invBorrar.hidden = !f;
    invBorrar.textContent = 'Eliminar';
    invBorrar.classList.remove('inv-confirmar');
    invMsg.textContent = '';
    invMsg.classList.remove('error');
    invForm.hidden = false;
    invForm.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  function cerrarFicha(){
    invForm.hidden = true;
    invEditando = null;
    invMsg.textContent = '';
  }

  if(invNuevaBtn) invNuevaBtn.addEventListener('click', function(){ abrirFicha(null); });
  if(invCancelar) invCancelar.addEventListener('click', cerrarFicha);

  if(invForm){
    invForm.addEventListener('submit', function(e){
      e.preventDefault();
      var code = el('invCode').value.trim();
      var title = el('invTitle').value.trim();
      if(!code || !title){
        invMsg.classList.add('error');
        invMsg.textContent = 'El código y el título son obligatorios.';
        return;
      }
      invGuardar.disabled = true;
      invMsg.classList.remove('error');
      invMsg.textContent = 'Guardando…';
      D.guardarInvestigacion({
        code: code,
        title: title,
        status: el('invStatus').value.trim(),
        question: el('invQuestion').value.trim(),
        hypothesis: el('invHypothesis').value.trim(),
        varInd: el('invVarInd').value.trim(),
        varDep: el('invVarDep').value.trim(),
        varCon: el('invVarCon').value.trim(),
        method: el('invMethod').value.trim(),
        tags: el('invTags').value.split('\n').map(function(t){ return t.trim(); }).filter(Boolean),
        position: el('invPosition').value,
        published: el('invPublished').checked
      }).then(function(){
        return refrescar();                 // repinta ya la seccion publica
      }).then(function(){
        cargarListaInvestigaciones();
        invGuardar.disabled = false;
        invMsg.textContent = el('invPublished').checked
          ? 'Guardada y publicada en el portal.'
          : 'Guardada como borrador: todavía no se ve en el portal.';
        setTimeout(cerrarFicha, 1400);
      }).catch(function(e){
        invGuardar.disabled = false;
        invMsg.classList.add('error');
        var m = (e && e.message) || 'error desconocido';
        if(/duplicate key/i.test(m)) m = 'Ya existe una investigación con ese código.';
        invMsg.textContent = 'No se pudo guardar: ' + m;
      });
    });
  }

  if(invBorrar){
    // Confirmacion en dos pasos sobre el propio boton: un confirm() del
    // navegador bloquea la pagina y aqui basta con obligar a pulsar dos veces.
    invBorrar.addEventListener('click', function(){
      if(!invEditando) return;
      if(!invBorrar.classList.contains('inv-confirmar')){
        invBorrar.classList.add('inv-confirmar');
        invBorrar.textContent = '¿Eliminar definitivamente? Pulsa otra vez';
        setTimeout(function(){
          invBorrar.classList.remove('inv-confirmar');
          invBorrar.textContent = 'Eliminar';
        }, 4000);
        return;
      }
      invBorrar.disabled = true;
      invMsg.textContent = 'Eliminando…';
      D.eliminarInvestigacion(invEditando).then(function(){
        return refrescar();
      }).then(function(){
        invBorrar.disabled = false;
        cargarListaInvestigaciones();
        cerrarFicha();
      }).catch(function(e){
        invBorrar.disabled = false;
        invMsg.classList.add('error');
        invMsg.textContent = 'No se pudo eliminar: ' + ((e && e.message) || 'error');
      });
    });
  }

  /* ============ EDITORES 2026: bitácora, carpeta, recursos, comunidad ======
     Los cuatro editores comparten la misma mecánica que el de investigaciones
     —lista, ficha, guardar, borrar— así que aquí vive una sola implementación
     genérica y cada editor solo declara qué campos tiene y cómo se guardan. */

  function txt(id, v){ var n = el(id); if(n) n.value = v == null ? '' : v; }
  function leer(id){ var n = el(id); return n ? n.value : ''; }
  function marcar(id, v){ var n = el(id); if(n) n.checked = !!v; }
  function leerMarca(id){ var n = el(id); return !!(n && n.checked); }

  function crearEditor(cfg){
    var lista    = el(cfg.lista);
    var form     = el(cfg.form);
    var titulo   = el(cfg.titulo);
    var nuevoBtn = el(cfg.nuevo);
    var cancelar = el(cfg.cancelar);
    var borrar   = el(cfg.borrar);
    var msg      = el(cfg.msg);
    if(!lista || !form) return { cargar: function(){} };

    var cache = [];
    var editando = null;      // clave de la fila en edición, null si es nueva

    function aviso(texto, error){
      if(!msg) return;
      msg.classList.toggle('error', !!error);
      msg.textContent = texto || '';
    }

    function cargar(){
      lista.innerHTML = '<p class="inv-vacia">Cargando…</p>';
      cfg.listar().then(function(filas){
        cache = filas;
        if(!filas.length){
          lista.innerHTML = '<p class="inv-vacia">' + esc(cfg.vacio) + '</p>';
          return;
        }
        lista.innerHTML = filas.map(function(f){
          var pub = f.published;
          return '<div class="inv-item">'
            + '<div class="txt">'
            +   '<span class="cod">' + esc(cfg.clave(f)) + '</span>'
            +   '<span class="tit">' + esc(cfg.etiqueta(f)) + '</span>'
            + '</div>'
            + '<span class="estado ' + (pub ? 'pub' : 'bor') + '">' + (pub ? 'publicado' : 'borrador') + '</span>'
            + '<button type="button" class="editar" data-editar="' + esc(cfg.clave(f)) + '">Editar</button>'
            + '</div>';
        }).join('');
        lista.querySelectorAll('[data-editar]').forEach(function(b){
          b.addEventListener('click', function(){ abrir(b.getAttribute('data-editar')); });
        });
      }).catch(function(e){
        lista.innerHTML = '<p class="inv-vacia">No se pudo cargar la lista: '
          + esc((e && e.message) || 'error') + '</p>';
      });
    }

    function abrir(clave){
      var fila = null;
      for(var i = 0; i < cache.length; i++){
        if(String(cfg.clave(cache[i])) === String(clave)){ fila = cache[i]; break; }
      }
      editando = fila ? clave : null;
      if(titulo) titulo.textContent = fila ? cfg.tituloEditar : cfg.tituloNuevo;
      cfg.rellenar(fila);
      if(borrar) borrar.hidden = !fila;
      form.hidden = false;
      aviso('');
      form.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }

    if(nuevoBtn) nuevoBtn.addEventListener('click', function(){ abrir(null); });
    if(cancelar) cancelar.addEventListener('click', function(){ form.hidden = true; aviso(''); });

    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      aviso('Guardando…');
      cfg.guardar().then(function(){
        aviso('Guardado y publicado.');
        form.hidden = true;
        cargar();
        if(window.CIEHS && window.CIEHS.refrescarDatos) window.CIEHS.refrescarDatos();
      }).catch(function(e){
        aviso('No se pudo guardar: ' + ((e && e.message) || 'error desconocido'), true);
      });
    });

    if(borrar){
      borrar.addEventListener('click', function(){
        if(!editando) return;
        // Doble pulsación en lugar de confirm(): un diálogo nativo bloquea la
        // pestaña y en las tablets del laboratorio se queda colgado a veces.
        if(!borrar.classList.contains('inv-confirmar')){
          borrar.classList.add('inv-confirmar');
          borrar.textContent = 'Pulsa otra vez para eliminar';
          setTimeout(function(){
            borrar.classList.remove('inv-confirmar');
            borrar.textContent = 'Eliminar';
          }, 4000);
          return;
        }
        cfg.eliminar(editando).then(function(){
          borrar.classList.remove('inv-confirmar');
          borrar.textContent = 'Eliminar';
          form.hidden = true;
          cargar();
          if(window.CIEHS && window.CIEHS.refrescarDatos) window.CIEHS.refrescarDatos();
        }).catch(function(e){
          aviso('No se pudo eliminar: ' + ((e && e.message) || 'error'), true);
        });
      });
    }

    return { cargar: cargar };
  }

  /* ----------------------------- bitácora ----------------------------- */

  var edBitacora = crearEditor({
    lista:'bitAdminLista', form:'bitForm', titulo:'bitFormTitulo', nuevo:'bitNuevoBtn',
    cancelar:'bitCancelarBtn', borrar:'bitBorrarBtn', msg:'bitStatusMsg',
    tituloNuevo:'Nuevo lote', tituloEditar:'Editar lote',
    vacio:'Todavía no hay ningún lote registrado.',
    clave: function(f){ return f.lote; },
    etiqueta: function(f){ return f.crop + (f.module_code ? ' · ' + f.module_code : ''); },
    listar: function(){ return D.listarLotes(); },
    eliminar: function(lote){ return D.eliminarLote(lote); },
    rellenar: function(f){
      f = f || {};
      txt('bitLote', f.lote); txt('bitModulo', f.module_code);
      txt('bitCultivo', f.crop); txt('bitCientifico', f.scientific);
      txt('bitSiembra', f.sown_on); txt('bitSemana', f.week);
      txt('bitPh', f.ph); txt('bitCe', f.ce); txt('bitFase', f.phase);
      txt('bitCosecha', f.harvest_on); txt('bitKg', f.harvest_kg);
      txt('bitNotas', f.notes); txt('bitPos', f.position == null ? 1 : f.position);
      marcar('bitPublicado', f.lote ? f.published : true);
    },
    guardar: function(){
      return D.guardarLote({
        lote: leer('bitLote').trim(), crop: leer('bitCultivo').trim(),
        scientific: leer('bitCientifico').trim(), moduleCode: leer('bitModulo').trim(),
        sownOn: leer('bitSiembra'), week: leer('bitSemana'),
        ph: leer('bitPh'), ce: leer('bitCe'), phase: leer('bitFase').trim(),
        harvestOn: leer('bitCosecha'), harvestKg: leer('bitKg'),
        notes: leer('bitNotas').trim(), position: leer('bitPos'),
        published: leerMarca('bitPublicado')
      });
    }
  });

  /* -------------------------- carpeta de campo ------------------------ */

  var edCarpeta = crearEditor({
    lista:'carAdminLista', form:'carForm', titulo:'carFormTitulo', nuevo:'carNuevoBtn',
    cancelar:'carCancelarBtn', borrar:'carBorrarBtn', msg:'carStatusMsg',
    tituloNuevo:'Nueva entrada', tituloEditar:'Editar entrada',
    vacio:'Todavía no hay ninguna entrada en la carpeta de campo.',
    clave: function(f){ return f.code; },
    etiqueta: function(f){ return f.title; },
    listar: function(){ return D.listarNotas(); },
    eliminar: function(code){ return D.eliminarNota(code); },
    rellenar: function(f){
      f = f || {};
      txt('carCode', f.code); txt('carTitle', f.title);
      txt('carSummary', f.summary); txt('carBody', f.body);
      txt('carKind', f.kind || 'informe'); txt('carTeam', f.team);
      txt('carAuthor', f.author_label); txt('carMedia', f.media_url);
      txt('carFecha', f.published_on); txt('carPos', f.position == null ? 1 : f.position);
      marcar('carPublicado', f.published);
    },
    guardar: function(){
      return D.guardarNota({
        code: leer('carCode').trim(), title: leer('carTitle').trim(),
        summary: leer('carSummary').trim(), body: leer('carBody').trim(),
        kind: leer('carKind'), team: leer('carTeam').trim(),
        authorLabel: leer('carAuthor').trim(), mediaUrl: leer('carMedia').trim(),
        publishedOn: leer('carFecha'), position: leer('carPos'),
        published: leerMarca('carPublicado')
      });
    }
  });

  /* ---------------------------- recursos ------------------------------ */

  var edRecursos = crearEditor({
    lista:'recAdminLista', form:'recForm', titulo:'recFormTitulo', nuevo:'recNuevoBtn',
    cancelar:'recCancelarBtn', borrar:'recBorrarBtn', msg:'recStatusMsg',
    tituloNuevo:'Nuevo recurso', tituloEditar:'Editar recurso',
    vacio:'Todavía no hay ningún recurso cargado.',
    clave: function(f){ return f.id; },
    etiqueta: function(f){ return f.title; },
    listar: function(){ return D.listarRecursos(); },
    eliminar: function(id){ return D.eliminarRecurso(id); },
    rellenar: function(f){
      f = f || {};
      recEditandoId = f.id || null;
      txt('recTitle', f.title); txt('recDesc', f.description);
      txt('recLevel', f.level || 'todos'); txt('recArea', f.area || 'cyt');
      txt('recKind', f.kind || 'ficha'); txt('recFileKind', f.file_kind || 'pdf');
      txt('recUrl', f.file_url); txt('recDur', f.duration);
      txt('recPos', f.position == null ? 1 : f.position);
      marcar('recFeatured', f.featured); marcar('recPublicado', f.published);
    },
    guardar: function(){
      return D.guardarRecurso({
        id: recEditandoId,
        title: leer('recTitle').trim(), description: leer('recDesc').trim(),
        level: leer('recLevel'), area: leer('recArea'), kind: leer('recKind'),
        fileKind: leer('recFileKind'), fileUrl: leer('recUrl').trim(),
        duration: leer('recDur').trim(), position: leer('recPos'),
        featured: leerMarca('recFeatured'), published: leerMarca('recPublicado')
      });
    }
  });
  var recEditandoId = null;

  /* -------------------------- transparencia --------------------------- */

  var edCaja = crearEditor({
    lista:'traAdminLista', form:'traForm', titulo:'traFormTitulo', nuevo:'traNuevoBtn',
    cancelar:'traCancelarBtn', borrar:'traBorrarBtn', msg:'traStatusMsg',
    tituloNuevo:'Nuevo movimiento', tituloEditar:'Editar movimiento',
    vacio:'Todavía no hay movimientos registrados.',
    clave: function(f){ return f.id; },
    etiqueta: function(f){ return f.concept + ' · S/ ' + f.amount_pen; },
    listar: function(){ return D.listarCaja(); },
    eliminar: function(id){ return D.eliminarMovimiento(id); },
    rellenar: function(f){
      f = f || {};
      traEditandoId = f.id || null;
      txt('traFecha', f.occurred_on || new Date().toISOString().slice(0,10));
      txt('traTipo', f.kind || 'ingreso'); txt('traConcepto', f.concept);
      txt('traMonto', f.amount_pen); txt('traPeriodo', f.period); txt('traNota', f.note);
      marcar('traPublicado', f.id ? f.published : true);
    },
    guardar: function(){
      return D.guardarMovimiento({
        id: traEditandoId, occurredOn: leer('traFecha'), kind: leer('traTipo'),
        concept: leer('traConcepto').trim(), amount: leer('traMonto'),
        period: leer('traPeriodo').trim(), note: leer('traNota').trim(),
        published: leerMarca('traPublicado')
      });
    }
  });
  var traEditandoId = null;

  /* ------------------ pedidos y moderación de comentarios -------------- */

  var pedLista = el('pedAdminLista');
  var comLista = el('comAdminLista');

  var ESTADO_SIGUIENTE = { pendiente:'confirmado', confirmado:'entregado', entregado:'entregado', anulado:'pendiente' };

  function cargarPedidos(){
    if(!pedLista) return;
    pedLista.innerHTML = '<p class="inv-vacia">Cargando…</p>';
    D.listarPedidos().then(function(filas){
      if(!filas.length){
        pedLista.innerHTML = '<p class="inv-vacia">No hay pedidos registrados.</p>';
        return;
      }
      pedLista.innerHTML = filas.map(function(p){
        return '<div class="inv-item">'
          + '<div class="txt">'
          +   '<span class="cod">' + esc(p.requester_name) + '</span>'
          +   '<span class="tit">' + esc(p.contact) + ' · ' + esc(p.crop || 'sin especificar')
          +     (p.qty_kg ? ' · ' + esc(p.qty_kg) + ' kg' : '')
          +     (p.notes ? ' — ' + esc(p.notes) : '') + '</span>'
          + '</div>'
          + '<span class="estado ' + (p.status === 'entregado' ? 'pub' : 'bor') + '">' + esc(p.status) + '</span>'
          + '<button type="button" class="editar" data-avanzar="' + esc(p.id) + '" data-estado="'
          +   esc(ESTADO_SIGUIENTE[p.status] || 'confirmado') + '">Marcar '
          +   esc(ESTADO_SIGUIENTE[p.status] || 'confirmado') + '</button>'
          + '<button type="button" class="inv-borrar" data-borrar-pedido="' + esc(p.id) + '">Borrar</button>'
          + '</div>';
      }).join('');
      pedLista.querySelectorAll('[data-avanzar]').forEach(function(b){
        b.addEventListener('click', function(){
          D.cambiarEstadoPedido(b.getAttribute('data-avanzar'), b.getAttribute('data-estado'))
            .then(cargarPedidos).catch(function(){ b.textContent = 'Error'; });
        });
      });
      pedLista.querySelectorAll('[data-borrar-pedido]').forEach(function(b){
        b.addEventListener('click', function(){
          D.eliminarPedido(b.getAttribute('data-borrar-pedido'))
            .then(cargarPedidos).catch(function(){ b.textContent = 'Error'; });
        });
      });
    }).catch(function(e){
      pedLista.innerHTML = '<p class="inv-vacia">No se pudo cargar: ' + esc((e && e.message) || 'error') + '</p>';
    });
  }

  function cargarComentariosAdmin(){
    if(!comLista) return;
    comLista.innerHTML = '<p class="inv-vacia">Cargando…</p>';
    D.listarComentarios().then(function(filas){
      if(!filas.length){
        comLista.innerHTML = '<p class="inv-vacia">No hay comentarios.</p>';
        return;
      }
      comLista.innerHTML = filas.map(function(c){
        return '<div class="inv-item">'
          + '<div class="txt">'
          +   '<span class="cod">' + esc(c.display_name) + '</span>'
          +   '<span class="tit">' + esc(c.message) + '</span>'
          + '</div>'
          + '<span class="estado ' + (c.published ? 'pub' : 'bor') + '">'
          +   (c.published ? 'publicado' : 'por revisar') + '</span>'
          + '<button type="button" class="editar" data-publicar="' + esc(c.id) + '" data-valor="'
          +   (c.published ? 'false' : 'true') + '">'
          +   (c.published ? 'Retirar' : 'Publicar') + '</button>'
          + '<button type="button" class="inv-borrar" data-borrar-com="' + esc(c.id) + '">Borrar</button>'
          + '</div>';
      }).join('');
      comLista.querySelectorAll('[data-publicar]').forEach(function(b){
        b.addEventListener('click', function(){
          D.moderarComentario(b.getAttribute('data-publicar'),
                              { published: b.getAttribute('data-valor') === 'true' })
            .then(function(){
              cargarComentariosAdmin();
              if(window.CIEHS && window.CIEHS.refrescarDatos) window.CIEHS.refrescarDatos();
            }).catch(function(){ b.textContent = 'Error'; });
        });
      });
      comLista.querySelectorAll('[data-borrar-com]').forEach(function(b){
        b.addEventListener('click', function(){
          D.eliminarComentario(b.getAttribute('data-borrar-com'))
            .then(function(){
              cargarComentariosAdmin();
              if(window.CIEHS && window.CIEHS.refrescarDatos) window.CIEHS.refrescarDatos();
            }).catch(function(){ b.textContent = 'Error'; });
        });
      });
    }).catch(function(e){
      comLista.innerHTML = '<p class="inv-vacia">No se pudo cargar: ' + esc((e && e.message) || 'error') + '</p>';
    });
  }

  window.CIEHS = window.CIEHS || {};
  window.CIEHS.cargarPestanaAdmin = function(nombre){
    if(nombre === 'bitacora')  edBitacora.cargar();
    if(nombre === 'carpeta')   edCarpeta.cargar();
    if(nombre === 'recursos')  edRecursos.cargar();
    if(nombre === 'comunidad'){ cargarPedidos(); cargarComentariosAdmin(); edCaja.cargar(); }
  };
  /* ------------------------------ arranque ---------------------------- */

  refrescar();

  window.CIEHS = window.CIEHS || {};
  window.CIEHS.refrescarDatos = refrescar;
  window.CIEHS.snapshot = function(){ return datos; };
})();

/* ===========================================================================
   7. DOCENTES: rutas de aprendizaje por nivel
   =========================================================================== */
(function(){
  var tabs = document.querySelectorAll('.nivel-tab');
  var panels = document.querySelectorAll('[data-nivel-panel]');
  if(!tabs.length) return; // page not present

  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      tabs.forEach(function(t){ t.classList.toggle('is-active', t === tab); });
      var lvl = tab.getAttribute('data-nivel-tab');
      panels.forEach(function(p){ p.hidden = p.getAttribute('data-nivel-panel') !== lvl; });
    });
  });
})();

/* ===========================================================================
   8. JUEGA: Simulador de Cultivo + Calculadora de Ahorro de Agua
   =========================================================================== */
(function(){
  var simAgua = document.getElementById('simAgua');
  var simPh = document.getElementById('simPh');
  var simLuz = document.getElementById('simLuz');
  var simAguaVal = document.getElementById('simAguaVal');
  var simPhVal = document.getElementById('simPhVal');
  var simLuzVal = document.getElementById('simLuzVal');
  var simBtn = document.getElementById('simCultivarBtn');
  var simResult = document.getElementById('simResult');

  function fmtPh(v){ return (Number(v) / 10).toFixed(1); }

  if(simAgua && simAguaVal) simAgua.addEventListener('input', function(){ simAguaVal.textContent = simAgua.value; });
  if(simPh && simPhVal) simPh.addEventListener('input', function(){ simPhVal.textContent = fmtPh(simPh.value); });
  if(simLuz && simLuzVal) simLuz.addEventListener('input', function(){ simLuzVal.textContent = simLuz.value; });

  if(simBtn && simAgua && simPh && simLuz && simResult){
    simBtn.addEventListener('click', function(){
      var agua = Number(simAgua.value);
      var ph = Number(simPh.value) / 10;
      var luz = Number(simLuz.value);
      var okAgua = agua >= 60 && agua <= 85;
      var okPh = ph >= 5.5 && ph <= 6.8;
      var okLuz = luz >= 12 && luz <= 16;
      var score = [okAgua, okPh, okLuz].filter(Boolean).length;
      var msg, cls;
      if(score === 3){
        msg = '🥬 ¡Cosecha exitosa! El agua, el pH y la luz estuvieron dentro del rango óptimo del módulo NFT.';
        cls = 'is-success';
      } else if(score === 2){
        msg = '🌱 Cultivo aceptable, pero puedes mejorar: revisa el parámetro que quedó fuera de rango.';
        cls = '';
      } else {
        msg = '🥀 El cultivo se estresó. Ajusta agua (60–85 %), pH (5.5–6.8) y luz (12–16 h/día) y vuelve a intentar.';
        cls = 'is-fail';
      }
      simResult.textContent = msg;
      simResult.className = 'sim-result' + (cls ? ' ' + cls : '');
    });
  }

  var calcKg = document.getElementById('calcKg');
  var calcBtn = document.getElementById('calcBtn');
  var calcResult = document.getElementById('calcResult');
  var L_HIDROPONIA = 15, L_TRADICIONAL = 150;

  if(calcBtn && calcKg && calcResult){
    calcBtn.addEventListener('click', function(){
      var kg = Number(calcKg.value);
      if(!kg || kg <= 0){
        calcResult.textContent = 'Ingresa una cantidad de kilogramos mayor a 0.';
        calcResult.className = 'calc-result';
        return;
      }
      var ahorro = Math.round(kg * (L_TRADICIONAL - L_HIDROPONIA));
      calcResult.innerHTML = 'Con <b>' + kg + ' kg</b> cosechados en el CIEHS, tu equipo ahorró aproximadamente <b>' + ahorro.toLocaleString('es-PE') + ' litros</b> de agua potable frente al cultivo tradicional en suelo, en Huanchaco.';
      calcResult.className = 'calc-result is-success';
    });
  }
})();

/* ===========================================================================
   9. DISEÑO: movimiento — reveal, contadores, brillo, ondas y progreso

   Con una paleta casi monocroma el movimiento deja de ser adorno: es lo que
   jerarquiza. Todo lo de aquí comprueba `prefers-reduced-motion` y se apaga
   entero si el visitante lo pide.
   =========================================================================== */
(function(){
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var puedeHover  = window.matchMedia && window.matchMedia('(hover: hover)').matches;

  /* ------------------------------------------------ 1. reveal escalonado ---
     El indice se cuenta DENTRO de cada contenedor, no sobre la lista global:
     antes una tarjeta heredaba el turno de otra rejilla y se quedaba esperando
     medio segundo sin ninguna razon visible. */
  var revealSelectors = [
    '.section-head', '.hub-card', '.card', '.qr-card', '.hero-kpi',
    '.stat-tile', '.viz-card', '.badge-card', '.not-only .card',
    '.climate-block', '.mural-panel', '.qr-panel', '.ruta-fase', '.cneb-card',
    '.contact-card', '.contact-form', '.problem-block', '.problema-card',
    '.hpos-card', '.mvp-card', '.modulo-chip', '.pasaporte-porque article',
    '.destacado-card', '.dwc-aviso', '.carpeta-como', '.comunidad-card'
  ];
  var revealEls = [].slice.call(document.querySelectorAll(revealSelectors.join(',')));
  var conteoPorPadre = new Map();
  revealEls.forEach(function(el){
    el.classList.add('reveal');
    var padre = el.parentNode;
    var n = conteoPorPadre.get(padre) || 0;
    conteoPorPadre.set(padre, n + 1);
    el.style.setProperty('--i', reduceMotion ? 0 : Math.min(n, 7));
  });

  function mostrar(el){ el.classList.add('is-visible'); }

  // Red de seguridad. El navegador estrangula IntersectionObserver en pestanas
  // sin foco o en ahorro de energia: si eso pasa, .reveal se queda en opacity:0
  // y la pagina entera aparece en blanco. Contenido invisible es un fallo, no
  // una animacion perdida, asi que a los 3 s sin una sola entrega se da el
  // observador por muerto y se muestra todo de golpe.
  var ioVivo = false;
  var io = null;
  if('IntersectionObserver' in window && !reduceMotion){
    io = new IntersectionObserver(function(entries){
      ioVivo = true;
      entries.forEach(function(entry){
        if(entry.isIntersecting){ mostrar(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold:0.12, rootMargin:'0px 0px -8% 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
    setTimeout(function(){
      if(ioVivo) return;
      io.disconnect();
      revealEls.forEach(mostrar);
      document.querySelectorAll('.range-row').forEach(function(f){ f.classList.add('is-drawn'); });
    }, 3000);
  } else {
    revealEls.forEach(mostrar);
  }

  /* --------------------------------------------------- 2. cifras que ruedan --
     Se anima solo el primer nodo de texto: asi el <small> con la unidad (%, kg)
     se queda intacto y no hay que reconstruir el marcado. */
  function leerCifra(el){
    var nodo = el.firstChild;
    while(nodo && nodo.nodeType !== 3) nodo = nodo.nextSibling;
    if(!nodo) return null;
    var bruto = nodo.nodeValue;
    var m = bruto.match(/-?\d+(?:[.,]\d+)?/);
    if(!m) return null;
    var crudo = m[0];
    var decs = (crudo.split(/[.,]/)[1] || '').length;
    return {
      nodo: nodo,
      destino: parseFloat(crudo.replace(',', '.')),
      decs: decs,
      antes: bruto.slice(0, m.index),
      despues: bruto.slice(m.index + crudo.length)
    };
  }

  // Contadores en vuelo. Un numero a medias se lee como si fuera el definitivo:
  // "48 estudiantes" en lugar de 280. Por eso cada cuenta se puede rematar de
  // golpe, y hay que poder rematarlas todas cuando el navegador deje de dar
  // fotogramas (pestana en segundo plano, ahorro de energia, bfcache).
  var cifrasEnVuelo = [];

  function rematar(el){
    if(el._rafCifra){ cancelAnimationFrame(el._rafCifra); el._rafCifra = null; }
    if(el._finCifra){ el._finCifra(); el._finCifra = null; }
    var i = cifrasEnVuelo.indexOf(el);
    if(i > -1) cifrasEnVuelo.splice(i, 1);
  }

  function rematarTodas(){
    cifrasEnVuelo.slice().forEach(rematar);
  }

  function animarCifra(el){
    if(reduceMotion) return;
    // Rematar ANTES de leer. Si hubiera una cuenta en vuelo sobre este mismo
    // elemento, el texto de ahora seria un valor intermedio y arrancariamos la
    // nueva animacion hacia un destino inventado.
    rematar(el);
    var d = leerCifra(el);
    if(!d || !isFinite(d.destino)) return;
    var final = d.antes + d.destino.toFixed(d.decs) + d.despues;
    el._finCifra = function(){ d.nodo.nodeValue = final; };
    // Sin pestana visible no hay fotogramas: se escribe el valor final y ya.
    if(document.hidden){ el._finCifra(); el._finCifra = null; return; }
    var desde = 0, dur = 1100, t0 = 0;
    el.classList.add('is-counting');
    cifrasEnVuelo.push(el);
    function paso(ts){
      if(!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 4);           // easeOutQuart
      var v = desde + (d.destino - desde) * e;
      d.nodo.nodeValue = d.antes + v.toFixed(d.decs) + d.despues;
      if(p < 1){ el._rafCifra = requestAnimationFrame(paso); }
      else { el._rafCifra = null; rematar(el); }
    }
    el._rafCifra = requestAnimationFrame(paso);
  }

  // Al ocultarse la pestana se rematan las cuentas en curso: si se dejaran, al
  // volver el visitante encontraria la cifra congelada donde murio el rAF.
  document.addEventListener('visibilitychange', function(){
    if(document.hidden) rematarTodas();
  });
  window.addEventListener('pagehide', rematarTodas);

  var cifras = [].slice.call(document.querySelectorAll('.hero-kpi .n, .stat-tile .value'));
  if('IntersectionObserver' in window && !reduceMotion){
    var ioCifra = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ animarCifra(en.target); ioCifra.unobserve(en.target); }
      });
    }, { threshold:0.5 });
    cifras.forEach(function(c){ ioCifra.observe(c); });
  }

  // La capa de datos llama aqui despues de reescribir los KPI desde la base.
  window.CIEHS = window.CIEHS || {};
  window.CIEHS.recontar = function(){
    if(reduceMotion) return;
    document.querySelectorAll('.js-kpi-ahorro, .js-kpi-ahorro-neg, .js-kpi-cosecha')
      .forEach(function(el){
        var r = el.getBoundingClientRect();
        if(r.width > 0 && r.top < window.innerHeight && r.bottom > 0) animarCifra(el);
      });
  };

  /* ------------------------------------------- 3. barras que se dibujan -----
     El ancho puede venir de dos sitios: la clase de utilidad del HTML estatico
     (u-width-26p7pct) o el data-width que escribe la capa de datos al repintar
     los rangos de pH desde la base. Se traduce a --w y solo entonces se marca
     .is-anim: si este script no llegara a correr, la barra se ve completa.

     `prepararBarras` es idempotente a proposito: la base reescribe esas filas
     despues de la carga inicial, asi que hay que poder volver a pasar por aqui
     sobre nodos nuevos sin tocar los que ya estaban dibujados. */
  function anchoDeBarra(el){
    var d = el.getAttribute("data-width");
    if(d) return parseFloat(d) + "%";
    var m = /u-width-(\d+)(?:p(\d+))?pct/.exec(el.className);
    if(!m) return null;
    return m[1] + (m[2] ? "." + m[2] : "") + "%";
  }

  var ioBarra = null;
  if(!reduceMotion && "IntersectionObserver" in window){
    ioBarra = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add("is-drawn"); ioBarra.unobserve(en.target); }
      });
    }, { threshold:0.25 });
  }

  function prepararBarras(){
    if(reduceMotion) return;
    document.querySelectorAll(".range-row").forEach(function(fila, i){
      var fill = fila.querySelector(".range-fill");
      if(!fill || fill.classList.contains("is-anim")) return;
      var w = anchoDeBarra(fill);
      if(!w) return;
      fill.style.setProperty("--w", w);
      fill.style.setProperty("--i", Math.min(i % 8, 7));
      fill.classList.add("is-anim");
      if(ioBarra) ioBarra.observe(fila); else fila.classList.add("is-drawn");
    });
  }
  prepararBarras();
  window.CIEHS = window.CIEHS || {};
  window.CIEHS.dibujarBarras = prepararBarras;

  /* ------------------------------------- 4. cambio de ruta: revelar y redibujar
     Al mostrarse una seccion que estaba [hidden], lo que ya cae en pantalla se
     revela de inmediato y las barras de esa seccion se dibujan. */
  var mainEl = document.querySelector('main');
  if(mainEl && 'MutationObserver' in window){
    var mo = new MutationObserver(function(){
      requestAnimationFrame(function(){
        document.querySelectorAll('.reveal:not(.is-visible)').forEach(function(el){
          var r = el.getBoundingClientRect();
          if(r.top < window.innerHeight && r.bottom > 0 && r.width > 0) mostrar(el);
        });
        if(!reduceMotion){
          document.querySelectorAll('.range-row:not(.is-drawn)').forEach(function(f){
            var r = f.getBoundingClientRect();
            if(r.top < window.innerHeight && r.bottom > 0 && r.width > 0) f.classList.add('is-drawn');
          });
          if(window.CIEHS.recontar) window.CIEHS.recontar();
        }
      });
    });
    mo.observe(mainEl, { attributes:true, attributeFilter:['hidden'], subtree:true });
  }

  /* ----------------------------------------- 5. header: vidrio y compactado --*/
  var header = document.querySelector('header.site');
  var barra = document.querySelector('.scroll-progress i');

  function alHacerScroll(){
    if(header) header.classList.toggle('is-scrolled', window.scrollY > 12);
    if(barra){
      var alto = document.documentElement.scrollHeight - window.innerHeight;
      var p = alto > 0 ? Math.min(window.scrollY / alto, 1) : 0;
      barra.style.setProperty('--p', p.toFixed(4));
    }
  }
  window.addEventListener('scroll', alHacerScroll, { passive:true });
  window.addEventListener('resize', alHacerScroll, { passive:true });
  alHacerScroll();

  /* --------------------------------- 6. brillo especular siguiendo al cursor --
     Solo con raton: en tactil no hay puntero al que seguir y encenderlo al
     tocar quedaria pegado hasta el siguiente toque. */
  if(puedeHover && !reduceMotion){
    var brillables = '.card, .hub-card, .stat-tile, .viz-card, .modulo-chip, .problema-card';
    document.addEventListener('pointermove', function(e){
      var t = e.target && e.target.closest ? e.target.closest(brillables) : null;
      if(!t) return;
      var r = t.getBoundingClientRect();
      t.style.setProperty('--cx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      t.style.setProperty('--cy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      t.style.setProperty('--sheen', '1');
    }, { passive:true });
    document.addEventListener('pointerout', function(e){
      var t = e.target && e.target.closest ? e.target.closest(brillables) : null;
      if(t && (!e.relatedTarget || !t.contains(e.relatedTarget))) t.style.setProperty('--sheen', '0');
    }, { passive:true });
  }

  /* ------------------------------------------------ 7. onda al pulsar boton --*/
  if(!reduceMotion){
    document.addEventListener('pointerdown', function(e){
      var btn = e.target && e.target.closest ? e.target.closest('.btn') : null;
      if(!btn) return;
      var r = btn.getBoundingClientRect();
      var onda = document.createElement('span');
      onda.className = 'ripple';
      var d = Math.max(r.width, r.height) * 2.2;
      onda.style.width = d + 'px';
      onda.style.height = d + 'px';
      onda.style.left = (e.clientX - r.left) + 'px';
      onda.style.top  = (e.clientY - r.top) + 'px';
      btn.appendChild(onda);
      setTimeout(function(){ if(onda.parentNode) onda.parentNode.removeChild(onda); }, 650);
    }, { passive:true });
  }

  /* ------------------------- 8. cascada para lo que llega por red ------------
     Las filas de la bitacora, la caja y los comentarios se pintan despues de
     que responda la base. Se les numera al vuelo para que entren en cascada en
     vez de aparecer todas de golpe. */
  function numerar(sel){
    document.querySelectorAll(sel).forEach(function(cont){
      [].slice.call(cont.children).forEach(function(hijo, i){
        hijo.style.setProperty('--i', Math.min(i, 11));
      });
    });
  }
  window.CIEHS.escalonar = function(){
    if(reduceMotion) return;
    numerar('#bitacoraCuerpo, #transpCuerpo, #carpetaGrid, #comentariosLista');
  };

  /* --------------------------------------- 9. aura del hero sigue al cursor --*/
  var hero = document.querySelector('.hero');
  if(hero && !reduceMotion && puedeHover){
    var ticking = false, lastX = 50, lastY = 10;
    hero.addEventListener('pointermove', function(e){
      var rect = hero.getBoundingClientRect();
      lastX = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      lastY = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
      if(!ticking){
        requestAnimationFrame(function(){
          hero.style.setProperty('--mx', lastX + '%');
          hero.style.setProperty('--my', lastY + '%');
          ticking = false;
        });
        ticking = true;
      }
    }, { passive:true });
  }
})();

/* ===========================================================================
   10. TRAZABILIDAD: generacion real de codigos QR
   =========================================================================== */
(function(){
  if(typeof qrcode !== 'function'){
    document.querySelectorAll('[data-qr-slot]').forEach(function(el){
      el.classList.add('is-error');
      el.textContent = 'No se pudo cargar el generador de códigos QR.';
    });
    return;
  }

  // Zona tranquila de 4 módulos: el estándar la exige para que el lector
  // encuentre los patrones de posición. Sin ella muchos móviles fallan.
  var QUIET = 4;
  // Nivel Q = 25 % de redundancia. Estos códigos van pegados junto a módulos
  // hidropónicos, con humedad y salpicaduras, así que conviene el margen.
  var EC = 'Q';

  function esc(t){
    return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function svgFor(text, label){
    var q = qrcode(0, EC);          // tipo 0 = versión mínima que quepa
    q.addData(text);
    q.make();
    var n = q.getModuleCount();
    var size = n + QUIET * 2;
    var d = '';
    for(var r = 0; r < n; r++){
      for(var c = 0; c < n; c++){
        if(q.isDark(r, c)) d += 'M' + (c + QUIET) + ' ' + (r + QUIET) + 'h1v1h-1z';
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '"'
         + ' shape-rendering="crispEdges" role="img" aria-label="' + esc(label) + '">'
         + '<title>' + esc(label) + '</title>'
         + '<rect width="' + size + '" height="' + size + '" fill="#ffffff"/>'
         + '<path d="' + d + '" fill="#000000"/></svg>';
  }

  function urlFor(route){
    if(window.CIEHS && typeof window.CIEHS.urlFor === 'function') return window.CIEHS.urlFor(route);
    return window.location.origin + window.location.pathname + '#/' + route;
  }

  var svgCache = {};

  document.querySelectorAll('[data-qr-slot]').forEach(function(slot){
    var route = slot.getAttribute('data-qr-slot');
    var label = slot.getAttribute('data-qr-label') || ('Código QR hacia ' + route);
    var url = urlFor(route);
    try{
      var svg = svgFor(url, label + ' — ' + url);
      svgCache[route] = svg;
      slot.innerHTML = svg;
    }catch(e){
      slot.classList.add('is-error');
      slot.textContent = 'No se pudo generar este código.';
    }
  });

  // La URL bajo cada código es deliberada: quien no pueda escanear todavía
  // puede teclearla, y quien imprima la hoja se lleva la dirección legible.
  document.querySelectorAll('[data-qr-url]').forEach(function(el){
    var route = el.getAttribute('data-qr-url');
    el.textContent = urlFor(route).replace(/^https?:\/\//, '');
  });

  document.querySelectorAll('[data-qr-download]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var route = btn.getAttribute('data-qr-download');
      var svg = svgCache[route];
      if(!svg) return;
      // SVG y no PNG a propósito: es vectorial, así que el mismo archivo
      // sirve para una etiqueta de 5 cm y para un panel de feria de 1 m.
      var blob = new Blob([svg], { type:'image/svg+xml;charset=utf-8' });
      var href = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = href;
      a.download = btn.getAttribute('data-qr-file') || ('ciehs-qr-' + route + '.svg');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(href); }, 1000);
      var prev = btn.textContent;
      btn.textContent = 'Descargado ✓';
      setTimeout(function(){ btn.textContent = prev; }, 1800);
    });
  });

  var printBtn = document.getElementById('qrPrintBtn');
  if(printBtn) printBtn.addEventListener('click', function(){ window.print(); });

  // Para poder comprobar los códigos desde la consola durante el montaje.
  window.CIEHS = window.CIEHS || {};
  window.CIEHS.qrSvg = function(route){ return svgCache[route]; };
  window.CIEHS.qrRoutes = Object.keys(svgCache);
})();
