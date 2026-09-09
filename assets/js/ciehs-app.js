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
    // La ruta actual queda en <body data-route> para que el CSS adapte la
    // cabecera sobre el hero oscuro de #inicio (transparente + texto blanco).
    document.body.setAttribute('data-route', route);
    pageEls.forEach(function(el){ el.hidden = el.getAttribute('data-page') !== route; });
    routeEls.forEach(function(el){
      var active = el.getAttribute('data-route') === route;
      el.classList.toggle('is-active', active);
      // aria-current="page" solo tiene sentido en la navegacion principal.
      // Antes lo recibian los 13 elementos que apuntan a inicio (la marca mas
      // un breadcrumb "<- Inicio" por seccion) y un lector de pantalla
      // anunciaba trece veces "pagina actual".
      var isNav = el.closest('.nav, .menu-panel');
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

  /* ------------------------------- menu de tres rayas -------------------
     Un solo panel para los catorce apartados, agrupados en cuatro familias.
     Es un cajon lateral, no un desplegable: cabe la descripcion de cada
     apartado, que es lo que hace que un menu agrupado se entienda. */
  var toggle   = document.getElementById('navToggle');
  var panel    = document.getElementById('menuPanel');
  var velo     = document.getElementById('menuVelo');
  var cerrarBtn= document.getElementById('menuCerrar');

  if(toggle && panel && velo){
    var abierto = false;
    var focoPrevio = null;

    function foco(){ return panel.querySelectorAll('button'); }

    function abrirMenu(){
      if(abierto) return;
      abierto = true;
      focoPrevio = document.activeElement;
      panel.hidden = false; velo.hidden = false;
      // Un fotograma entre mostrar y animar: sin el, el navegador aplica el
      // estado final de golpe y el cajon aparece sin deslizarse.
      requestAnimationFrame(function(){
        panel.classList.add('is-abierto');
        velo.classList.add('is-abierto');
      });
      toggle.setAttribute('aria-expanded','true');
      document.body.style.overflow = 'hidden';
      var primero = foco()[0];
      if(primero) primero.focus();
    }

    function cerrarMenu(devolverFoco){
      if(!abierto) return;
      abierto = false;
      panel.classList.remove('is-abierto');
      velo.classList.remove('is-abierto');
      toggle.setAttribute('aria-expanded','false');
      document.body.style.overflow = '';
      // Se oculta al terminar la transicion para que no desaparezca de golpe;
      // el temporizador es la red por si transitionend no llega.
      setTimeout(function(){
        if(!abierto){ panel.hidden = true; velo.hidden = true; }
      }, 430);
      if(devolverFoco && focoPrevio && focoPrevio.focus) focoPrevio.focus();
    }

    toggle.addEventListener('click', function(){
      if(abierto) cerrarMenu(true); else abrirMenu();
    });
    velo.addEventListener('click', function(){ cerrarMenu(true); });
    if(cerrarBtn) cerrarBtn.addEventListener('click', function(){ cerrarMenu(true); });

    // Elegir un apartado cierra el cajon, pero el foco lo mueve el router al
    // titulo de la seccion nueva: devolverlo al boton de menu seria pelearse
    // con el.
    panel.querySelectorAll('[data-route]').forEach(function(b){
      b.addEventListener('click', function(){ cerrarMenu(false); });
    });

    document.addEventListener('keydown', function(e){
      if(!abierto) return;
      if(e.key === 'Escape'){ cerrarMenu(true); return; }
      if(e.key !== 'Tab') return;
      // Trampa de foco: con el cajon abierto el resto de la pagina esta
      // tapada por el velo, asi que tabular hasta ella deja el foco invisible.
      var f = foco();
      if(!f.length) return;
      var primero = f[0], ultimo = f[f.length - 1];
      if(e.shiftKey && document.activeElement === primero){ e.preventDefault(); ultimo.focus(); }
      else if(!e.shiftKey && document.activeElement === ultimo){ e.preventDefault(); primero.focus(); }
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
      // Orden ESTABLE, no aleatorio: una locucion pregrabada dice "Opcion 1:"
      // y tiene que coincidir con lo que hay en pantalla. Barajar en cada
      // ronda haria que el audio nombrara la opcion equivocada, que es peor
      // que no tener audio. El reparto sigue existiendo: la permutacion es
      // distinta para cada pregunta.
      var ordenar = window.CIEHS_ORDEN_OPCIONES;
      var opsOrdenadas = ordenar ? ordenar(p.id, p.ops) : barajar(p.ops);
      var opciones = opsOrdenadas.map(function(o){
        return '<button type="button" class="quiz-opt" data-correct="' + (o[1] ? 'true' : 'false') + '">'
             + esc(o[0]) + '</button>';
      }).join('');
      return '<div class="quiz-q' + (repaso ? ' ya-acertada' : '') + '" data-qid="' + esc(p.id)
           + '" data-category="' + esc(p.cat) + '" data-explain="' + esc(p.exp) + '">'
           + (repaso ? '<span class="quiz-repaso">Repaso · ya acertada</span>' : '')
           + '<p class="quiz-q-text">' + esc(p.q)
           +   '<button type="button" class="quiz-oir" data-oir aria-label="Escuchar esta pregunta">'
           +     '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.8a4.5 4.5 0 0 1 0 6.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
           +   '</button>'
           + '</p>'
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
      // Se lee la explicación, no el "✓" o la "✗": un lector diría "marca de
      // verificación" y eso no explica nada. El acierto o el fallo se dice con
      // palabras, que además es lo que se recuerda.
      if(window.CIEHS && window.CIEHS.voz){
        // La explicacion NO usa grabacion, y es deliberado: el veredicto de
        // delante ("Correcto" / "No es esa") depende de lo que haya respondido
        // esta persona, asi que tendria que sintetizarse igual. Encadenar una
        // palabra sintetica con una frase grabada suena a fallo, no a voz. Se
        // sintetiza entera, con una sola voz.
        window.CIEHS.voz.hablar(
          (isCorrect ? 'Correcto. ' : 'No es esa. ') + (q.getAttribute('data-explain') || '')
        );
      }
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

  // Lee la pregunta con sus opciones. Se enumeran ("Opcion 1...") porque sin
  // numerar, oidas seguidas, no hay forma de saber cual es cual.
  function leerPregunta(q){
    if(!window.CIEHS || !window.CIEHS.voz) return;
    var texto = q.querySelector('.quiz-q-text');
    var enunciado = texto ? (texto.childNodes[0] ? texto.childNodes[0].nodeValue : texto.textContent) : '';
    var ops = [].slice.call(q.querySelectorAll('.quiz-opt')).map(function(o, i){
      return 'Opción ' + (i + 1) + ': ' + o.textContent.trim() + '.';
    }).join(' ');
    // La clave es el id de la pregunta, que ya es estable (con el se guarda el
    // progreso del Pasaporte). Asi una grabacion subida como voz/<id>-p.mp3
    // sustituye a la sintesis sin tocar nada mas.
    var qid = q.getAttribute('data-qid');
    window.CIEHS.voz.hablar((enunciado || '').trim() + ' ' + ops,
                            qid ? { clave: qid + '-p' } : null);
  }

  function conectarPreguntas(raiz){
    raiz.querySelectorAll('.quiz-q').forEach(function(q){
      var opts = [].slice.call(q.querySelectorAll('.quiz-opt'));
      var feedback = q.querySelector('.quiz-feedback');
      var oir = q.querySelector('[data-oir]');
      if(oir) oir.addEventListener('click', function(){ leerPregunta(q); });
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

  /* ================= ESTADOS DE DATOS: cargando · error · vacío =============
     Toda seccion que dependa de la base tiene tres momentos en los que NO puede
     enseñar lo que promete, y son tres cosas distintas:

       cargando  la peticion esta en vuelo. Se responde con esqueleto, no con la
                 palabra "Cargando", porque un bloque con la forma de lo que va a
                 llegar dice ademas CUANTO va a llegar.
       vacio     la base respondio y no hay nada. Es un estado NORMAL: la carpeta
                 de campo recien abierta esta legitimamente vacia. Se explica sin
                 alarma y, cuando toca, se dice quien la va a llenar.
       error     la base no respondio. Es lo unico de los tres que el visitante
                 puede intentar arreglar, asi que es lo unico que lleva boton.

     Antes esto vivia repartido en cada pintor, con seis cajas distintas y sin
     separar las dos ultimas: "no hay comentarios" y "no se pudo cargar" se veian
     igual. Aqui hay un solo inventario, como con la navegacion.

     El reintento se enchufa desde fuera (CIEHS.estado.alReintentar) para que este
     bloque no necesite conocer a refrescar(), que se define mucho mas abajo.
     ------------------------------------------------------------------------- */
  var alReintentar = null;
  var reintentando = false;

  function caja(variante, ico, titulo, texto, accion){
    return '<div class="estado estado--' + variante + '">'
      + '<span class="estado-ico" aria-hidden="true">' + ico + '</span>'
      + '<div class="estado-txt">'
      +   (titulo ? '<b>' + esc(titulo) + '</b>' : '')
      +   '<p>' + esc(texto) + '</p>'
      + '</div>'
      + (accion || '')
      + '</div>';
  }

  var Estado = {
    /* Esqueleto con la forma de lo que se espera. n = cuantas piezas. */
    esqueleto: function(n, forma){
      var clase = 'skeleton skeleton-' + (forma || 'fila');
      var out = '';
      for(var i = 0; i < (n || 3); i++) out += '<div class="' + clase + '"></div>';
      return out;
    },

    cargando: function(texto){
      return caja('cargando',
        '<span class="estado-pulso"></span>',
        null,
        texto || 'Consultando la base del CIEHS…');
    },

    vacio: function(titulo, texto, ico){
      return caja('vacio', ico || '🌱', titulo, texto);
    },

    /* El unico con boton. `detalle` es el motivo tecnico: se enseña porque en un
       laboratorio escolar quien mira la pantalla suele ser tambien quien puede
       avisar de que la base esta caida, y "no se pudo cargar" a secas no le
       sirve para eso. */
    error: function(texto, detalle){
      var t = texto || 'No se pudo conectar con la base del CIEHS.';
      if(detalle) t += ' (' + detalle + ')';
      return caja('error', '⚠',
        'No se pudo cargar',
        t,
        '<button type="button" class="estado-accion" data-reintentar>'
          + (reintentando ? 'Reintentando…' : 'Reintentar') + '</button>');
    },

    /* Azucar: elige la variante segun la fase, para que cada pintor no repita
       el mismo if de tres ramas. */
    segunFase: function(opts){
      if(fase === 'cargando') return Estado.cargando(opts.cargando);
      if(fase === 'error')    return Estado.error(opts.error, D && D.motivo);
      return Estado.vacio(opts.vacioTitulo, opts.vacio, opts.ico);
    },

    /* Pinta dentro de un contenedor y lo revela; si no hay nada que decir, lo
       oculta. Devuelve true si pinto algo, para poder encadenar. */
    en: function(elemento, html){
      if(!elemento) return false;
      if(!html){ elemento.innerHTML = ''; elemento.hidden = true; return false; }
      elemento.innerHTML = html;
      elemento.hidden = false;
      return true;
    },

    alReintentar: function(fn){ alReintentar = fn; }
  };

  /* fase: 'cargando' mientras la peticion esta en vuelo, 'error' si fallo,
     'listo' si respondio (aunque venga vacia). Es lo que permite a los pintores
     distinguir "todavia no ha llegado" de "llego y no habia nada", que antes se
     confundian porque D.conectado vale false en los dos casos. */
  var fase = 'cargando';
  function faseActual(){ return fase; }

  /* ---- aviso de datos caducados ----
     Caso aparte y facil de pasar por alto: la carga falla PERO ya habia datos
     buenos en pantalla de un intento anterior. Borrarlos para enseñar un error
     seria absurdo —se tiraria informacion valida—, pero dejarlos sin decir nada
     es peor: el visitante lee cifras viejas creyendo que son de ahora.

     Asi que los datos se quedan y encima aparece una barra que dice desde
     cuando son y ofrece reintentar. Solo sale en este caso: en la primera carga
     fallida no hay nada viejo que advertir y hablan los estados de seccion. */
  var barraCaducado = null;
  var horaBuena = null;

  function avisarDatosCaducados(hayDatos){
    if(fase === 'error' && hayDatos){
      if(!barraCaducado){
        barraCaducado = document.createElement('div');
        barraCaducado.className = 'datos-caducados';
        barraCaducado.setAttribute('role', 'status');
        barraCaducado.setAttribute('aria-live', 'polite');
        document.body.appendChild(barraCaducado);
      }
      barraCaducado.innerHTML =
          '<span class="estado-ico" aria-hidden="true">⚠</span>'
        // Sin punto final propio cuando lleva hora: en es-PE la hora ya termina
        // en punto ("05:28 p. m.") y quedaba un "p. m..".
        + '<p>Sin conexión con la base. Lo que ves es lo último que se pudo cargar'
        +   (horaBuena ? ', de las ' + esc(horaBuena) : '.') + '</p>'
        + '<button type="button" class="estado-accion" data-reintentar>'
        +   (reintentando ? 'Reintentando…' : 'Reintentar') + '</button>';
      barraCaducado.hidden = false;
    } else if(barraCaducado){
      barraCaducado.hidden = true;
    }
  }

  /* Un solo listener delegado para todos los botones de reintento, presentes y
     futuros: los estados se repintan enteros y un listener por boton se habria
     perdido en cada repintado. */
  document.addEventListener('click', function(ev){
    var b = ev.target.closest ? ev.target.closest('[data-reintentar]') : null;
    if(!b || reintentando || typeof alReintentar !== 'function') return;
    reintentando = true;
    // Se marcan TODOS los botones a la vez: si fallo la carga del portal,
    // fallaron todas las secciones y todas se estan reintentando juntas.
    document.querySelectorAll('[data-reintentar]').forEach(function(o){
      o.disabled = true; o.textContent = 'Reintentando…';
    });
    Promise.resolve(alReintentar())["catch"](function(){})
      .then(function(){ reintentando = false; });
  });

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

    if(fase === 'cargando'){
      teleEstado.textContent = 'consultando…';
      // Esqueleto con la forma de las filas que van a llegar, no un texto: dice
      // ademas cuantas, que es la mitad de la informacion de una espera.
      teleLista.innerHTML = Estado.esqueleto(3, 'tele');
      return;
    }

    if(fase === 'error' || !D || !D.conectado){
      teleEstado.textContent = 'sin conexión';
      teleLista.innerHTML = Estado.error(
        'No se pudo consultar el registro de lecturas. Debajo siguen los rangos de referencia '
        + 'que trae el portal, que no dependen de la red.', D && D.motivo);
      return;
    }

    var lecturas = (datos && datos.lecturas) || [];
    if(!lecturas.length){
      teleEstado.textContent = '0 lecturas';
      // Estado vacio honesto: no se inventan mediciones que nadie ha tomado.
      teleLista.innerHTML = Estado.vacio(
        'Todavía sin lecturas',
        'En cuanto el equipo de Monitoreo anote la primera medición de pH y CE desde el panel '
        + 'de administración, aparecerá aquí con su fecha.', '💧');
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


  /* ---------------------- resultados de una investigacion ------------------
     Lo que responde la pregunta de estos estudios es la COMPARACION entre
     tratamientos (50/100/150 % de solucion; con y sin bioestimulante), asi que
     se grafica una serie por tratamiento sobre el mismo eje. Una sola linea
     con todo mezclado no diria nada.

     Si de una variable solo hay una fecha, la comparacion es de barras: unir
     dos puntos que no forman serie temporal sugiere una tendencia inventada. */
  var PALETA = ['var(--leaf-500)', 'var(--azure-500)', 'var(--sun-500)', '#7c3aed', '#c2410c'];

  function resultadosDe(code){
    return ((datos && datos.resultados) || []).filter(function(r){
      return r.investigation_code === code;
    });
  }

  function graficaResultados(filas, variable){
    var propias = filas.filter(function(r){ return r.variable === variable; });
    if(!propias.length) return '';

    var unidad = (propias.find(function(r){ return r.unidad; }) || {}).unidad || '';
    var trats = [];
    propias.forEach(function(r){ if(trats.indexOf(r.tratamiento) === -1) trats.push(r.tratamiento); });
    var fechas = [];
    propias.forEach(function(r){ if(fechas.indexOf(r.medido_en) === -1) fechas.push(r.medido_en); });
    fechas.sort();

    var valores = propias.map(function(r){ return Number(r.valor); });
    var vMax = Math.max.apply(null, valores);
    var vMin = Math.min.apply(null, valores.concat([0]));
    if(vMax === vMin) vMax = vMin + 1;

    var W = 560, H = 210, ml = 46, mr = 12, mt = 14, mb = 40;
    var iw = W - ml - mr, ih = H - mt - mb;
    function py(v){ return mt + ih - ((v - vMin) / (vMax - vMin)) * ih; }

    var partes = [];
    for(var g = 0; g <= 3; g++){
      var val = vMin + (vMax - vMin) * (g / 3);
      var yy = py(val);
      partes.push('<line x1="' + ml + '" y1="' + yy.toFixed(1) + '" x2="' + (W - mr) + '" y2="' + yy.toFixed(1)
        + '" stroke="var(--chart-grid)" stroke-width="1"/>');
      partes.push('<text x="' + (ml - 7) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end" font-size="10"'
        + ' fill="var(--chart-ink-2)" font-family="var(--font-mono)">' + val.toFixed(1) + '</text>');
    }

    if(fechas.length === 1){
      // Una sola fecha: barras comparando tratamientos.
      var ancho = iw / (trats.length * 2);
      trats.forEach(function(t, k){
        var r = propias.filter(function(x){ return x.tratamiento === t; })[0];
        if(!r) return;
        var x0 = ml + (k * 2 + 0.5) * ancho;
        var y0 = py(Number(r.valor));
        partes.push('<rect x="' + x0.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + ancho.toFixed(1)
          + '" height="' + (mt + ih - y0).toFixed(1) + '" rx="4" fill="' + PALETA[k % PALETA.length] + '" opacity="0.85">'
          + '<title>' + esc(t + ': ' + r.valor + (unidad ? ' ' + unidad : '')
          + (r.n_muestras ? ' · n=' + r.n_muestras : '')) + '</title></rect>');
        partes.push('<text x="' + (x0 + ancho / 2).toFixed(1) + '" y="' + (H - 22)
          + '" text-anchor="middle" font-size="10" fill="var(--chart-ink-2)" font-family="var(--font-mono)">'
          + esc(t.length > 12 ? t.slice(0, 11) + '…' : t) + '</text>');
      });
    } else {
      // Varias fechas: una linea por tratamiento.
      trats.forEach(function(t, k){
        var serie = propias.filter(function(x){ return x.tratamiento === t; })
                           .sort(function(a, b){ return a.medido_en < b.medido_en ? -1 : 1; });
        var pts = serie.map(function(r){
          var i = fechas.indexOf(r.medido_en);
          var x = ml + (fechas.length === 1 ? iw / 2 : (i / (fechas.length - 1)) * iw);
          return { x: x, y: py(Number(r.valor)), r: r };
        });
        if(pts.length > 1){
          partes.push('<polyline points="' + pts.map(function(p){ return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ')
            + '" fill="none" stroke="' + PALETA[k % PALETA.length] + '" stroke-width="2.2"'
            + ' stroke-linecap="round" stroke-linejoin="round"/>');
        }
        pts.forEach(function(p){
          partes.push('<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4"'
            + ' fill="' + PALETA[k % PALETA.length] + '" stroke="var(--surface)" stroke-width="1.8">'
            + '<title>' + esc(t + ' · ' + p.r.medido_en + ': ' + p.r.valor + (unidad ? ' ' + unidad : '')) + '</title></circle>');
        });
      });
      partes.push('<text x="' + ml + '" y="' + (H - 8) + '" font-size="10" fill="var(--chart-ink-2)"'
        + ' font-family="var(--font-mono)">' + esc(fechas[0]) + '</text>');
      partes.push('<text x="' + (W - mr) + '" y="' + (H - 8) + '" text-anchor="end" font-size="10"'
        + ' fill="var(--chart-ink-2)" font-family="var(--font-mono)">' + esc(fechas[fechas.length - 1]) + '</text>');
    }

    var leyenda = trats.map(function(t, k){
      return '<span class="res-lg"><i style="background:' + PALETA[k % PALETA.length] + '"></i>' + esc(t) + '</span>';
    }).join('');

    return '<div class="res-bloque">'
      + '<p class="res-var">' + esc(variable) + (unidad ? ' <small>(' + esc(unidad) + ')</small>' : '') + '</p>'
      + '<div class="res-gr-wrap"><svg class="res-grafica" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="'
      +   esc('Comparación de ' + variable + ' entre ' + trats.length + ' tratamientos.') + '">'
      +   partes.join('') + '</svg></div>'
      + '<div class="res-leyenda">' + leyenda + '</div>'
      + '</div>';
  }

  var ETIQUETA_HIP = {
    confirmada: 'Hipótesis confirmada',
    refutada:   'Hipótesis refutada',
    parcial:    'Confirmada en parte',
    en_curso:   'Todavía en curso'
  };

  function bloqueResultados(i){
    var filas = resultadosDe(i.code);
    var variables = [];
    filas.forEach(function(r){ if(variables.indexOf(r.variable) === -1) variables.push(r.variable); });

    if(!filas.length && !i.conclusion){
      // Una investigacion sin resultados no es un fallo: es una investigacion en
      // curso. Lo que seria deshonesto es callarlo o insinuar que ya concluyo.
      return Estado.vacio(
        'Todavía sin resultados publicados',
        'La investigación está en curso. Los equipos van sumando mediciones a medida que miden, '
        + 'y aquí aparecerán con su gráfica en cuanto haya la primera.', '🔬');
    }

    var graficas = variables.map(function(v){ return graficaResultados(filas, v); }).join('');
    var estado = i.hipotesis_estado
      ? '<span class="res-estado est-' + esc(i.hipotesis_estado) + '">'
        + esc(ETIQUETA_HIP[i.hipotesis_estado] || i.hipotesis_estado) + '</span>'
      : '';
    var conclusion = i.conclusion
      ? '<div class="res-conclusion">' + estado
        + '<p><b>Conclusión:</b> ' + enfasis(i.conclusion) + '</p></div>'
      : (estado ? '<div class="res-conclusion">' + estado + '</div>' : '');

    var n = filas.length;
    return '<div class="res-zona">'
      + '<p class="eyebrow">Resultados</p>'
      + (n ? '<p class="res-cuenta mono">' + n + (n === 1 ? ' medición publicada' : ' mediciones publicadas') + '</p>' : '')
      + graficas
      + conclusion
      + '</div>';
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
      + bloqueResultados(i)
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

  // Repinta las secciones que solo existen si la base responde. Se llama en los
  // tres momentos —al empezar a cargar, al fallar y al terminar— porque cada
  // pintor lee `fase` y ya sabe cual de los tres estados le toca. Sin la llamada
  // inicial el esqueleto del HTML se quedaria brillando para siempre en un
  // reintento, y sin la del fallo se quedaria brillando para siempre a secas.
  function repintarSeccionesDeRed(){
    pintarCarpeta(); pintarBitacora(); pintarTransparencia(); pintarComentarios();
  }

  function refrescar(){
    if(!D || !D.listo){
      fase = 'error';
      repintarSeccionesDeRed();
      pintarTelemetria();
      avisarDatosCaducados(!!datos);
      return Promise.resolve();
    }
    // Cada intento —el primero y cada reintento— vuelve a poner las secciones en
    // "cargando". Sin esto, al pulsar Reintentar el aviso de error se quedaria
    // fijo hasta que la respuesta llegara, y no habria ninguna señal de que la
    // pulsacion hizo algo.
    fase = 'cargando';
    avisarDatosCaducados(false);
    repintarSeccionesDeRed();
    pintarTelemetria();

    return D.cargarPortal().then(function(res){
      if(!res) {
        fase = 'error';
        pintarSync(); pintarTelemetria();
        repintarSeccionesDeRed();
        avisarDatosCaducados(!!datos);
        return;
      }
      fase = 'listo';
      datos = res;
      horaBuena = new Date().toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' });
      avisarDatosCaducados(false);
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
      pintarEvidencias();
      // La carpeta de campo depende de los modulos y de los registros, que solo
      // existen a partir de aqui: antes de esto su selector estaria vacio.
      if(window.CIEHS && window.CIEHS.refrescarCampo) window.CIEHS.refrescarCampo();
      if(window.CIEHS && window.CIEHS.refrescarAportes) window.CIEHS.refrescarAportes();
      if(window.CIEHS && window.CIEHS.refrescarFormResultados) window.CIEHS.refrescarFormResultados();
      if(window.CIEHS && window.CIEHS.refrescarTienda) window.CIEHS.refrescarTienda();
      if(window.CIEHS && window.CIEHS.escalonar) window.CIEHS.escalonar();
    })["catch"](function(err){
      // Un rechazo (red caida, CORS, token invalido) tiene que terminar igual
      // que una respuesta vacia: con un mensaje, no con un esqueleto eterno.
      if(window.console && console.warn) console.warn("CIEHS: no se pudo cargar el portal", err);
      fase = 'error';
      pintarSync(); pintarTelemetria();
      repintarSeccionesDeRed();
      avisarDatosCaducados(!!datos);
    });
  }

  // El boton "Reintentar" de cualquier estado de error vuelve a lanzar la misma
  // carga. Es la unica de las tres situaciones que el visitante puede arreglar.
  Estado.alReintentar(refrescar);
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

    if(fase === 'cargando'){
      Estado.en(carpetaEstado, null);
      carpetaGrid.innerHTML = Estado.esqueleto(3, 'tarjeta');
      return;
    }

    var todas = (datos && datos.carpeta) || [];
    var filas = (carpetaFiltro === 'todos')
      ? todas
      : todas.filter(function(f){ return f.kind === carpetaFiltro; });

    if(!filas.length){
      carpetaGrid.innerHTML = '';
      // Tres vacios distintos, y merecen tres frases distintas: el filtro no
      // encuentra nada (culpa del filtro, y se ofrece deshacerlo), la carpeta
      // esta recien abierta (normal), o la base no responde (reintentable).
      if(todas.length){
        Estado.en(carpetaEstado, Estado.vacio(
          'Nada de ese tipo, todavía',
          'La carpeta tiene ' + todas.length + (todas.length === 1 ? ' entrada' : ' entradas')
          + ', pero ninguna de esta clase. Prueba con «Todos».', '🔍'));
      } else {
        Estado.en(carpetaEstado, Estado.segunFase({
          error: 'La carpeta de campo no se puede mostrar ahora mismo.',
          vacioTitulo: 'La carpeta está abierta y vacía',
          vacio: 'Todavía sin entradas publicadas. Las primeras las suben los equipos al cerrar '
               + 'el ciclo en curso.',
          ico: '📓'
        }));
      }
      return;
    }
    Estado.en(carpetaEstado, null);
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
  var bitTabla   = el('bitacoraTablaWrap');

  // Una tabla sin filas es solo una fila de encabezados flotando: no dice nada
  // y encima parece rota. Cuando no hay nada que enseñar, la tabla se retira y
  // habla el estado. Durante la carga si se queda, porque el esqueleto va dentro.
  function verTabla(v){ if(bitTabla) bitTabla.hidden = !v; }

  function pintarBitacora(){
    if(!bitCuerpo) return;

    if(fase === 'cargando'){
      Estado.en(bitEstado, null);
      verTabla(true);
      // El esqueleto va DENTRO de la tabla, ocupando las nueve columnas: una
      // tabla a la que se le meten divis sueltos rompe su propia rejilla.
      bitCuerpo.innerHTML = '<tr><td colspan="9">' + Estado.esqueleto(4, 'fila') + '</td></tr>';
      return;
    }

    var todas = (datos && datos.bitacora) || [];
    var filas = todas;

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
      verTabla(false);
      if(todas.length){
        Estado.en(bitEstado, Estado.vacio(
          'Ningún lote con ese cultivo',
          'La bitácora tiene ' + todas.length + (todas.length === 1 ? ' lote' : ' lotes')
          + ' registrados, pero ninguno de esa especie. Prueba con «Todos los cultivos».', '🔍'));
      } else {
        Estado.en(bitEstado, Estado.segunFase({
          error: 'La bitácora agronómica no se puede mostrar ahora mismo.',
          vacioTitulo: 'Todavía sin lotes registrados',
          vacio: 'Cada lote aparece aquí en cuanto el equipo lo siembra y lo anota desde el panel '
               + 'de administración: qué día, en qué módulo y con qué solución.',
          ico: '🌾'
        }));
      }
      return;
    }
    Estado.en(bitEstado, null);
    verTabla(true);
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

  // La transparencia dejo de mostrar importes: ahora se publica el REPARTO en
  // porcentaje, que es lo que dice en que cree el proyecto. Lo pinta el modulo
  // de la tienda, que ya tiene la caja a mano; aqui solo se delega para no
  // duplicar el calculo en dos sitios que puedan discrepar.
  function pintarTransparencia(){
    if(window.CIEHS && window.CIEHS.refrescarTienda) window.CIEHS.refrescarTienda();
  }

  /* --------------------- comentarios de la comunidad ------------------- */

  var comentariosLista  = el('comentariosLista');
  var comentariosEstado = el('comentariosEstado');
  var ROL_ETIQUETA = { estudiante:'Estudiante', docente:'Docente', familia:'Familia', visitante:'Visitante' };

  /* --------- galeria de evidencias de la portada ----------------------
     Las cuatro laminas que trae el HTML son fotografias de infraestructura sin
     ninguna persona, y se quedan como respaldo: si la base no responde, la
     portada sigue teniendo galeria en lugar de un hueco. Cuando si responde,
     manda la base, porque es alli donde se puede revocar una autorizacion. */
  function pintarEvidencias(){
    var pista = el('galeriaPista');
    if(!pista) return;
    var filas = (datos && datos.evidencias) || [];
    if(!filas.length) return;               // se conserva el respaldo estatico

    pista.innerHTML = filas.map(function(f, i){
      var url = D.urlEvidencia(f.storage_path);
      if(!url) return '';
      var dim = (f.width && f.height)
        ? ' width="' + Number(f.width) + '" height="' + Number(f.height) + '"'
        : '';
      // La primera se carga de inmediato porque es la que se ve; el resto en
      // diferido. fetchpriority solo tiene sentido en la primera.
      var carga = i === 0
        ? ' decoding="async" fetchpriority="high"'
        : ' loading="lazy" decoding="async"';
      return '<li class="galeria-lam' + (i === 0 ? ' is-activa' : '') + '">'
        + '<img src="' + esc(url) + '"' + dim + carga + ' alt="' + esc(f.alt || f.title) + '">'
        + '<div class="galeria-pie">'
        +   (f.eyebrow ? '<p class="eyebrow">' + esc(f.eyebrow) + '</p>' : '')
        +   '<h3>' + esc(f.title) + '</h3>'
        +   (f.body ? '<p>' + esc(f.body) + '</p>' : '')
        + '</div>'
        + '</li>';
    }).join('');

    // El carrusel se monto sobre las laminas que habia al cargar la pagina:
    // hay que decirle que ahora son otras, o las flechas y los puntos se
    // quedarian contando las viejas.
    if(window.CIEHS && window.CIEHS.recomponerGaleria) window.CIEHS.recomponerGaleria();
  }

  function pintarComentarios(){
    if(!comentariosLista) return;

    if(fase === 'cargando'){
      Estado.en(comentariosEstado, null);
      comentariosLista.innerHTML = Estado.esqueleto(2, 'fila');
      return;
    }

    var filas = (datos && datos.comentarios) || [];
    if(!filas.length){
      comentariosLista.innerHTML = '';
      Estado.en(comentariosEstado, Estado.segunFase({
        error: 'Los comentarios de la comunidad no se pueden mostrar ahora mismo. '
             + 'El formulario de abajo tampoco podrá enviarse hasta que vuelva la conexión.',
        vacioTitulo: 'Sé el primero',
        vacio: 'Todavía no hay comentarios publicados. El tuyo puede serlo — pasará antes por '
             + 'la coordinación, como todos.',
        ico: '💬'
      }));
      return;
    }
    Estado.en(comentariosEstado, null);
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

  // El formulario de pedidos lo maneja ahora el modulo de la tienda, que suma
  // el carrito y guarda las lineas. Tenerlo tambien aqui hacia que un solo
  // envio disparara DOS manejadores sobre el mismo formulario.

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
    // Si ya se entró con código en esta pestaña, directo al formulario.
    if(D.codigoActivo && D.codigoActivo()){ mostrarFormulario(); return; }
    // Camino histórico: sesión autenticada listada como admin.
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
    if(whoBox) whoBox.textContent = 'Sesión de administración activa';
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
  // Otros disparadores del modal (p. ej. la píldora "Administración" del header).
  document.querySelectorAll('.js-abrir-admin').forEach(function(b){
    b.addEventListener('click', abrirPanel);
  });
  if(adminClose) adminClose.addEventListener('click', cerrarPanel);
  if(adminBack)  adminBack.addEventListener('click', cerrarPanel);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && adminModal && !adminModal.hidden) cerrarPanel();
  });

  function entrar(){
    var codigo = (el('adminCodigo') || {}).value;
    if(!codigo || !codigo.trim()){
      loginError.textContent = 'Escribe el código de acceso.';
      loginError.hidden = false;
      return;
    }
    loginBtn.disabled = true;
    loginError.hidden = true;
    D.entrarConCodigo(codigo).then(function(){
      loginBtn.disabled = false;
      if(el('adminCodigo')) el('adminCodigo').value = '';
      return refrescar().then(mostrarFormulario);
    }).catch(function(e){
      loginBtn.disabled = false;
      var m = (e && e.message) || 'No se pudo entrar.';
      if(/permission denied|PGRST202|function .*verificar_codigo/i.test(m)){
        m = 'El acceso por código todavía no está activo en la base de datos.';
      }
      loginError.textContent = m;
      loginError.hidden = false;
    });
  }

  if(loginBtn) loginBtn.addEventListener('click', entrar);
  [el('adminCodigo')].forEach(function(inp){
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
      txt('traCategoria', f.categoria || '');
      marcar('traPublicado', f.id ? f.published : true);
    },
    guardar: function(){
      return D.guardarMovimiento({
        id: traEditandoId, occurredOn: leer('traFecha'), kind: leer('traTipo'),
        concept: leer('traConcepto').trim(), amount: leer('traMonto'),
        period: leer('traPeriodo').trim(), note: leer('traNota').trim(),
        categoria: leer('traCategoria'),
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
    Promise.all([D.listarPedidos(), D.lineasPorPedido()]).then(function(par){
      var filas = par[0], porPedido = par[1] || {};
      if(!filas.length){
        pedLista.innerHTML = '<p class="inv-vacia">No hay pedidos registrados.</p>';
        return;
      }
      pedLista.innerHTML = filas.map(function(p){
        // El detalle vive en las lineas. crop y qty_kg solo tienen valor en los
        // pedidos antiguos de un solo cultivo; se usan como respaldo.
        var lineas = porPedido[p.id] || [];
        var detalle = lineas.length
          ? lineas.map(function(l){ return l.cantidad + '× ' + l.nombre; }).join(' · ')
          : (p.crop || 'sin especificar') + (p.qty_kg ? ' · ' + p.qty_kg + ' kg' : '');
        var total = lineas.reduce(function(t, l){
          return t + (l.precio_pen != null ? Number(l.precio_pen) * l.cantidad : 0);
        }, 0);
        return '<div class="inv-item">'
          + '<div class="txt">'
          +   '<span class="cod">' + esc(p.requester_name) + ' · ' + esc(p.contact) + '</span>'
          +   '<span class="tit">' + esc(detalle)
          +     (total > 0 ? ' — ' + soles(total) : '') + '</span>'
          +   (p.notes ? '<span class="tit u-color-ink-mute">' + esc(p.notes) + '</span>' : '')
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
  /* --------------------------- evidencias ----------------------------
     Unico editor con subida de archivo. El orden importa: primero sube la
     imagen al bucket y solo si eso funciona escribe la ficha. Al reves
     quedaria una fila apuntando a un archivo que no existe, y la galeria
     mostraria un hueco roto en la portada. */
  var eviArchivoEl = el('eviArchivo');

  // Nombre de archivo seguro: el bucket admite casi cualquier cosa, pero un
  // nombre con tildes o espacios acaba siendo una URL ilegible que ademas hay
  // que escapar en cada sitio donde se use.
  function rutaSegura(nombre){
    return String(nombre || '').trim().toLowerCase()
      // ̀-ͯ son las marcas diacriticas que NFD separa de su letra.
      // Escrito con escapes y no con los caracteres literales: combinantes
      // sueltos en el fuente son invisibles y sobreviven mal a un copiado.
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  // Se leen las dimensiones reales del archivo para escribirlas en la ficha:
  // con width y height la galeria reserva el hueco y la pagina no da el salto
  // de maquetacion al cargar la imagen.
  function medirImagen(archivo){
    return new Promise(function(res){
      var url = URL.createObjectURL(archivo);
      var img = new Image();
      img.onload = function(){ URL.revokeObjectURL(url); res({ w: img.naturalWidth, h: img.naturalHeight }); };
      img.onerror = function(){ URL.revokeObjectURL(url); res({ w: null, h: null }); };
      img.src = url;
    });
  }

  var edEvidencias = crearEditor({
    lista:'eviAdminLista', form:'eviForm', titulo:'eviFormTitulo', nuevo:'eviNuevoBtn',
    cancelar:'eviCancelarBtn', borrar:'eviBorrarBtn', msg:'eviStatusMsg',
    tituloNuevo:'Nueva fotografía', tituloEditar:'Editar fotografía',
    vacio:'Todavía no hay ninguna fotografía en la galería.',
    clave: function(f){ return f.storage_path; },
    etiqueta: function(f){ return f.title; },
    listar: function(){ return D.listarEvidencias(); },
    eliminar: function(ruta){ return D.eliminarEvidencia(ruta); },
    rellenar: function(f){
      f = f || {};
      txt('eviRuta', f.storage_path); txt('eviTitle', f.title);
      txt('eviEyebrow', f.eyebrow); txt('eviBody', f.body);
      txt('eviAlt', f.alt); txt('eviConsent', f.consent_ref);
      txt('eviPos', f.position == null ? 0 : f.position);
      marcar('eviPublicado', f.published);
      if(eviArchivoEl) eviArchivoEl.value = '';
      // La ficha guarda el id para que al editar se actualice la fila en vez
      // de intentar crear otra con la misma ruta.
      edEvidencias._id = f.id || null;
      edEvidencias._w = f.width || null;
      edEvidencias._h = f.height || null;
    },
    guardar: function(){
      var archivo = eviArchivoEl && eviArchivoEl.files && eviArchivoEl.files[0];
      var ruta = rutaSegura(leer('eviRuta'));
      if(!ruta) return Promise.reject(new Error('Falta el nombre del archivo.'));
      if(!edEvidencias._id && !archivo){
        return Promise.reject(new Error('Elige una imagen: es una fotografía nueva.'));
      }
      if(archivo && archivo.size > 6 * 1024 * 1024){
        return Promise.reject(new Error('La imagen pesa más de 6 MB. Redúcela antes de subirla.'));
      }

      var paso = archivo
        ? medirImagen(archivo).then(function(dim){
            return D.subirEvidencia(archivo, ruta).then(function(){ return dim; });
          })
        : Promise.resolve({ w: edEvidencias._w, h: edEvidencias._h });

      return paso.then(function(dim){
        return D.guardarEvidencia({
          id: edEvidencias._id,
          storagePath: ruta,
          title: leer('eviTitle').trim(),
          eyebrow: leer('eviEyebrow').trim(),
          body: leer('eviBody').trim(),
          alt: leer('eviAlt').trim(),
          width: dim.w, height: dim.h,
          consentRef: leer('eviConsent').trim(),
          position: leer('eviPos'),
          published: leerMarca('eviPublicado')
        });
      });
    }
  });

  /* ------------------- validacion de la carpeta de campo -----------------
     No usa crearEditor: aqui no se edita nada, solo se decide si un dato entra
     o no. Dos botones por fila y ninguna ficha que rellenar. */
  var regLista = el('regAdminLista');
  var regMsg   = el('regStatusMsg');

  function regAviso(t, error){
    if(!regMsg) return;
    regMsg.classList.toggle('error', !!error);
    regMsg.textContent = t || '';
  }

  function resumenMedidas(r){
    var partes = [];
    if(r.ph != null)        partes.push('pH ' + r.ph);
    if(r.ce != null)        partes.push('CE ' + r.ce);
    if(r.temp_c != null)    partes.push(r.temp_c + ' °C');
    if(r.altura_cm != null) partes.push(r.altura_cm + ' cm');
    if(r.hojas != null)     partes.push(r.hojas + ' hojas');
    return partes.join(' · ') || '—';
  }

  function cargarRegistros(){
    if(!regLista) return;
    regLista.innerHTML = '<p class="inv-vacia">Cargando…</p>';
    D.listarRegistros().then(function(filas){
      if(!filas.length){
        regLista.innerHTML = '<p class="inv-vacia">Todavía no hay mediciones registradas por los estudiantes.</p>';
        return;
      }
      regLista.innerHTML = filas.map(function(r){
        var quien = [r.equipo, r.grado].filter(Boolean).join(' · ') || 'Sin equipo indicado';
        return '<div class="inv-item">'
          + '<div class="txt">'
          +   '<span class="cod">' + esc(r.module_code) + ' · ' + esc(r.medido_en) + '</span>'
          +   '<span class="tit">' + esc(resumenMedidas(r)) + '</span>'
          +   '<span class="tit u-color-ink-mute">' + esc(quien)
          +     (r.nota ? ' — “' + esc(r.nota) + '”' : '') + '</span>'
          + '</div>'
          + '<span class="estado ' + (r.published ? 'pub' : 'bor') + '">'
          +   (r.published ? 'validado' : 'pendiente') + '</span>'
          + '<button type="button" class="editar" data-validar="' + esc(r.id) + '" data-a="'
          +   (r.published ? '0' : '1') + '">' + (r.published ? 'Retirar' : 'Validar') + '</button>'
          + '<button type="button" class="inv-borrar" data-borrar="' + esc(r.id) + '">Eliminar</button>'
          + '</div>';
      }).join('');

      regLista.querySelectorAll('[data-validar]').forEach(function(b){
        b.addEventListener('click', function(){
          b.disabled = true;
          regAviso('Guardando…');
          D.validarRegistro(b.getAttribute('data-validar'), b.getAttribute('data-a') === '1')
            .then(function(){
              regAviso('Hecho.');
              cargarRegistros();
              if(window.CIEHS && window.CIEHS.refrescarDatos) window.CIEHS.refrescarDatos();
            })
            .catch(function(e){ b.disabled = false; regAviso('No se pudo: ' + ((e && e.message) || 'error'), true); });
        });
      });

      regLista.querySelectorAll('[data-borrar]').forEach(function(b){
        b.addEventListener('click', function(){
          // Doble pulsacion, igual que en el resto del panel: confirm() nativo
          // deja colgadas las tablets del laboratorio.
          if(!b.classList.contains('inv-confirmar')){
            b.classList.add('inv-confirmar');
            b.textContent = 'Pulsa otra vez';
            setTimeout(function(){ b.classList.remove('inv-confirmar'); b.textContent = 'Eliminar'; }, 4000);
            return;
          }
          D.eliminarRegistro(b.getAttribute('data-borrar')).then(function(){
            regAviso('Medición descartada.');
            cargarRegistros();
            if(window.CIEHS && window.CIEHS.refrescarDatos) window.CIEHS.refrescarDatos();
          }).catch(function(e){ regAviso('No se pudo eliminar: ' + ((e && e.message) || 'error'), true); });
        });
      });
    }).catch(function(e){
      regLista.innerHTML = '<p class="inv-vacia">No se pudo cargar: ' + esc((e && e.message) || 'error') + '</p>';
    });
  }

  var regRecargar = el('regRecargarBtn');
  if(regRecargar) regRecargar.addEventListener('click', cargarRegistros);

  /* ------------------------- revision de aportes -------------------------
     Cada fila trae su propio enlace firmado: aprobar a ciegas un archivo que
     no se ha abierto es justo lo que la cuarentena existe para impedir. */
  var apoLista = el('apoAdminLista');
  var apoMsg   = el('apoStatusMsg');

  function apoAviso(t, error){
    if(!apoMsg) return;
    apoMsg.classList.toggle('error', !!error);
    apoMsg.textContent = t || '';
  }
  function peso(b){
    if(b == null) return '';
    return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  }

  function cargarAportes(){
    if(!apoLista) return;
    apoLista.innerHTML = '<p class="inv-vacia">Cargando…</p>';
    D.listarAportes().then(function(filas){
      if(!filas.length){
        apoLista.innerHTML = '<p class="inv-vacia">Todavía no hay aportes subidos.</p>';
        return;
      }
      apoLista.innerHTML = filas.map(function(a){
        var quien = [a.equipo, a.grado].filter(Boolean).join(' · ') || 'Sin equipo indicado';
        return '<div class="inv-item">'
          + '<div class="txt">'
          +   '<span class="cod">' + esc(a.kind) + ' · ' + esc(peso(a.size_bytes)) + '</span>'
          +   '<span class="tit">' + esc(a.title) + '</span>'
          +   '<span class="tit u-color-ink-mute">' + esc(quien)
          +     (a.description ? ' — ' + esc(a.description) : '') + '</span>'
          + '</div>'
          + '<span class="estado ' + (a.published ? 'pub' : 'bor') + '">'
          +   (a.published ? 'publicado' : 'en cuarentena') + '</span>'
          + '<button type="button" class="editar" data-ver="' + esc(a.storage_path) + '">Abrir</button>'
          + '<button type="button" class="editar" data-aprobar="' + esc(a.id) + '" data-a="'
          +   (a.published ? '0' : '1') + '">' + (a.published ? 'Retirar' : 'Aprobar') + '</button>'
          + '<button type="button" class="inv-borrar" data-quitar="' + esc(a.id)
          +   '" data-ruta="' + esc(a.storage_path) + '">Eliminar</button>'
          + '</div>';
      }).join('');

      apoLista.querySelectorAll('[data-ver]').forEach(function(b){
        b.addEventListener('click', function(){
          b.disabled = true;
          D.urlAporte(b.getAttribute('data-ver'), 600).then(function(url){
            window.open(url, '_blank', 'noopener,noreferrer');
          }).catch(function(e){
            apoAviso('No se pudo abrir: ' + ((e && e.message) || 'error'), true);
          }).then(function(){ b.disabled = false; });
        });
      });

      apoLista.querySelectorAll('[data-aprobar]').forEach(function(b){
        b.addEventListener('click', function(){
          b.disabled = true;
          apoAviso('Guardando…');
          D.aprobarAporte(b.getAttribute('data-aprobar'), b.getAttribute('data-a') === '1')
            .then(function(){
              apoAviso('Hecho.');
              cargarAportes();
              if(window.CIEHS && window.CIEHS.refrescarDatos) window.CIEHS.refrescarDatos();
            })
            .catch(function(e){ b.disabled = false; apoAviso('No se pudo: ' + ((e && e.message) || 'error'), true); });
        });
      });

      apoLista.querySelectorAll('[data-quitar]').forEach(function(b){
        b.addEventListener('click', function(){
          if(!b.classList.contains('inv-confirmar')){
            b.classList.add('inv-confirmar');
            b.textContent = 'Pulsa otra vez';
            setTimeout(function(){ b.classList.remove('inv-confirmar'); b.textContent = 'Eliminar'; }, 4000);
            return;
          }
          D.eliminarAporte(b.getAttribute('data-quitar'), b.getAttribute('data-ruta')).then(function(){
            apoAviso('Aporte y archivo eliminados.');
            cargarAportes();
            if(window.CIEHS && window.CIEHS.refrescarDatos) window.CIEHS.refrescarDatos();
          }).catch(function(e){ apoAviso('No se pudo eliminar: ' + ((e && e.message) || 'error'), true); });
        });
      });
    }).catch(function(e){
      apoLista.innerHTML = '<p class="inv-vacia">No se pudo cargar: ' + esc((e && e.message) || 'error') + '</p>';
    });
  }

  var apoRecargar = el('apoRecargarBtn');
  if(apoRecargar) apoRecargar.addEventListener('click', cargarAportes);

  /* ------------------ resultados: validacion y conclusion ---------------- */
  var resLista = el('resAdminLista');
  var resMsg   = el('resAdminMsg');
  var concForm = el('concForm');
  var concInv  = el('concInv');

  function resAviso(t, error){
    if(!resMsg) return;
    resMsg.classList.toggle('error', !!error);
    resMsg.textContent = t || '';
  }

  function llenarConcInv(){
    if(!concInv) return;
    var inv = (datos && datos.investigaciones) || [];
    if(!inv.length){ concInv.innerHTML = '<option value="">(sin investigaciones)</option>'; return; }
    concInv.innerHTML = inv.map(function(i){
      return '<option value="' + esc(i.code) + '">' + esc(i.code) + '</option>';
    }).join('');
    volcarConclusion();
  }

  // Al cambiar de investigacion se cargan SU conclusion y SU estado: si no, se
  // editaria a ciegas y se pisaria lo que ya hubiera escrito otro.
  function volcarConclusion(){
    var inv = (datos && datos.investigaciones) || [];
    var elegida = inv.filter(function(i){ return i.code === concInv.value; })[0];
    txt('concTexto', elegida ? elegida.conclusion : '');
    txt('concEstado', elegida && elegida.hipotesis_estado ? elegida.hipotesis_estado : '');
  }
  if(concInv) concInv.addEventListener('change', volcarConclusion);

  if(concForm){
    concForm.addEventListener('submit', function(ev){
      ev.preventDefault();
      var st = el('concStatus');
      if(st){ st.classList.remove('error'); st.textContent = 'Guardando…'; }
      D.guardarConclusion(concInv.value, leer('concTexto'), leer('concEstado')).then(function(){
        if(st) st.textContent = 'Conclusión guardada.';
        if(window.CIEHS && window.CIEHS.refrescarDatos) window.CIEHS.refrescarDatos();
      }).catch(function(e){
        if(st){ st.classList.add('error'); st.textContent = 'No se pudo guardar: ' + ((e && e.message) || 'error'); }
      });
    });
  }

  function cargarResultadosAdmin(){
    if(!resLista) return;
    resLista.innerHTML = '<p class="inv-vacia">Cargando…</p>';
    D.listarResultados().then(function(filas){
      if(!filas.length){
        resLista.innerHTML = '<p class="inv-vacia">Todavía no hay mediciones de resultado.</p>';
        return;
      }
      resLista.innerHTML = filas.map(function(r){
        var quien = [r.equipo, r.grado].filter(Boolean).join(' · ') || 'Sin equipo indicado';
        return '<div class="inv-item">'
          + '<div class="txt">'
          +   '<span class="cod">' + esc(r.investigation_code) + ' · ' + esc(r.tratamiento) + '</span>'
          +   '<span class="tit">' + esc(r.variable) + ': ' + esc(r.valor) + (r.unidad ? ' ' + esc(r.unidad) : '')
          +     (r.n_muestras ? ' (n=' + esc(r.n_muestras) + ')' : '') + ' · ' + esc(r.medido_en) + '</span>'
          +   '<span class="tit u-color-ink-mute">' + esc(quien)
          +     (r.nota ? ' — “' + esc(r.nota) + '”' : '') + '</span>'
          + '</div>'
          + '<span class="estado ' + (r.published ? 'pub' : 'bor') + '">'
          +   (r.published ? 'validado' : 'pendiente') + '</span>'
          + '<button type="button" class="editar" data-valres="' + esc(r.id) + '" data-a="'
          +   (r.published ? '0' : '1') + '">' + (r.published ? 'Retirar' : 'Validar') + '</button>'
          + '<button type="button" class="inv-borrar" data-delres="' + esc(r.id) + '">Eliminar</button>'
          + '</div>';
      }).join('');

      resLista.querySelectorAll('[data-valres]').forEach(function(b){
        b.addEventListener('click', function(){
          b.disabled = true;
          resAviso('Guardando…');
          D.validarResultado(b.getAttribute('data-valres'), b.getAttribute('data-a') === '1')
            .then(function(){
              resAviso('Hecho.');
              cargarResultadosAdmin();
              if(window.CIEHS && window.CIEHS.refrescarDatos) window.CIEHS.refrescarDatos();
            })
            .catch(function(e){ b.disabled = false; resAviso('No se pudo: ' + ((e && e.message) || 'error'), true); });
        });
      });

      resLista.querySelectorAll('[data-delres]').forEach(function(b){
        b.addEventListener('click', function(){
          if(!b.classList.contains('inv-confirmar')){
            b.classList.add('inv-confirmar');
            b.textContent = 'Pulsa otra vez';
            setTimeout(function(){ b.classList.remove('inv-confirmar'); b.textContent = 'Eliminar'; }, 4000);
            return;
          }
          D.eliminarResultado(b.getAttribute('data-delres')).then(function(){
            resAviso('Medición descartada.');
            cargarResultadosAdmin();
            if(window.CIEHS && window.CIEHS.refrescarDatos) window.CIEHS.refrescarDatos();
          }).catch(function(e){ resAviso('No se pudo eliminar: ' + ((e && e.message) || 'error'), true); });
        });
      });
    }).catch(function(e){
      resLista.innerHTML = '<p class="inv-vacia">No se pudo cargar: ' + esc((e && e.message) || 'error') + '</p>';
    });
  }

  var resRecargar = el('resRecargarBtn');
  if(resRecargar) resRecargar.addEventListener('click', cargarResultadosAdmin);

  /* ---------------------------- catalogo --------------------------------- */
  var ETIQ_ESTADO_PROD = {
    disponible:'disponible ahora', en_crecimiento:'en crecimiento', agotado:'agotado'
  };
  var edProductos = crearEditor({
    lista:'proAdminLista', form:'proForm', titulo:'proFormTitulo', nuevo:'proNuevoBtn',
    cancelar:'proCancelarBtn', borrar:'proBorrarBtn', msg:'proStatusMsg',
    tituloNuevo:'Nuevo producto', tituloEditar:'Editar producto',
    vacio:'Todavía no hay nada en el catálogo.',
    clave: function(p){ return p.id; },
    etiqueta: function(p){
      return p.nombre + ' · ' + (ETIQ_ESTADO_PROD[p.estado] || p.estado)
           + (p.precio_pen != null ? ' · ' + soles(p.precio_pen) : '');
    },
    listar: function(){ return D.listarProductos(); },
    eliminar: function(id){ return D.eliminarProducto(id); },
    rellenar: function(p){
      p = p || {};
      txt('proNombre', p.nombre); txt('proCientifico', p.cientifico);
      txt('proDesc', p.descripcion); txt('proEstado', p.estado || 'en_crecimiento');
      txt('proDesde', p.disponible_desde); txt('proPrecio', p.precio_pen);
      txt('proUnidad', p.unidad || 'unidad'); txt('proFoto', p.foto_path);
      txt('proPos', p.position == null ? 0 : p.position);
      marcar('proPublicado', p.published);
      edProductos._id = p.id || null;
    },
    guardar: function(){
      return D.guardarProducto({
        id: edProductos._id,
        nombre: leer('proNombre').trim(), cientifico: leer('proCientifico').trim(),
        descripcion: leer('proDesc').trim(), estado: leer('proEstado'),
        desde: leer('proDesde'), precio: leer('proPrecio'),
        unidad: leer('proUnidad').trim() || 'unidad', fotoPath: leer('proFoto').trim(),
        position: leer('proPos'), published: leerMarca('proPublicado')
      });
    }
  });

  window.CIEHS.cargarPestanaAdmin = function(nombre){
    if(nombre === 'catalogo')  edProductos.cargar();
    if(nombre === 'resultados'){ llenarConcInv(); cargarResultadosAdmin(); }
    if(nombre === 'aportes')   cargarAportes();
    if(nombre === 'bitacora')  edBitacora.cargar();
    if(nombre === 'carpeta')   edCarpeta.cargar();
    if(nombre === 'recursos')  edRecursos.cargar();
    if(nombre === 'evidencias') edEvidencias.cargar();
    if(nombre === 'registros') cargarRegistros();
    if(nombre === 'comunidad'){ cargarPedidos(); cargarComentariosAdmin(); edCaja.cargar(); }
  };
  /* ------------------------------ arranque ---------------------------- */

  refrescar();

  window.CIEHS = window.CIEHS || {};
  window.CIEHS.refrescarDatos = refrescar;
  window.CIEHS.snapshot = function(){ return datos; };
  // Los modulos de mas abajo (tienda, transparencia, campo, aportes) pintan sus
  // propias secciones a partir del mismo snapshot, asi que necesitan las mismas
  // tres respuestas y la misma fase. Se exportan en vez de duplicarse: un solo
  // inventario de estados, como uno solo de navegacion.
  window.CIEHS.estado = Estado;
  window.CIEHS.faseDatos = faseActual;
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

/* ===========================================================================
   10. PORTADA: brisa del hero y galeria de evidencias
   =========================================================================== */
(function(){
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------------- 1. la brisa ---
     Un huerto escolar de Huanchaco visto a traves de la malla raschel: luz
     tamizada, hojas que cruzan empujadas por el viento de la costa y motas de
     polen. Se dibuja en canvas y no en video porque no pesa nada, no depende
     de la red y se puede apagar por completo.

     Tres cosas la mantienen barata:
     - se detiene cuando el hero sale de pantalla o la pestana se oculta;
     - el lienzo se limita a 2x de densidad aunque la pantalla ofrezca mas;
     - el numero de hojas se calcula segun el ancho, no fijo. */
  var lienzo = document.getElementById('heroBrisa');
  if(lienzo && !reduceMotion){
    var ctx = lienzo.getContext('2d', { alpha:true });
    var hojas = [], motas = [], ancho = 0, alto = 0, dpr = 1, raf = null, t = 0;
    var corriendo = false;

    var VERDES = ['rgba(5,150,105,', 'rgba(16,140,90,', 'rgba(4,120,87,', 'rgba(101,163,13,'];

    function medir(){
      var r = lienzo.getBoundingClientRect();
      if(!r.width || !r.height) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = r.width; alto = r.height;
      lienzo.width  = Math.round(ancho * dpr);
      lienzo.height = Math.round(alto  * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }

    function nuevaHoja(inicial){
      return {
        x: inicial ? Math.random() * ancho : -40,
        y: Math.random() * alto * 0.92,
        tam: 7 + Math.random() * 11,
        v: 0.18 + Math.random() * 0.42,          // deriva horizontal
        vaiven: 12 + Math.random() * 26,         // amplitud del balanceo
        ritmo: 0.006 + Math.random() * 0.011,
        fase: Math.random() * 6.28,
        giro: (Math.random() - 0.5) * 0.012,
        ang: Math.random() * 6.28,
        color: VERDES[(Math.random() * VERDES.length) | 0],
        op: 0.20 + Math.random() * 0.30
      };
    }

    function poblar(){
      var nHojas = Math.max(7, Math.min(18, Math.round(ancho / 90)));
      var nMotas = Math.max(10, Math.min(34, Math.round(ancho / 46)));
      hojas = []; motas = [];
      for(var i = 0; i < nHojas; i++) hojas.push(nuevaHoja(true));
      for(var j = 0; j < nMotas; j++){
        motas.push({
          x: Math.random() * ancho,
          y: Math.random() * alto,
          r: 1 + Math.random() * 2.2,
          v: 0.06 + Math.random() * 0.16,
          fase: Math.random() * 6.28,
          op: 0.16 + Math.random() * 0.3
        });
      }
    }

    // Una hoja simple: dos curvas espejadas y el nervio central. Dibujarla es
    // mas barato que cargar un sprite y escala sin pixelarse.
    function pintarHoja(h){
      ctx.save();
      ctx.translate(h.x, h.y + Math.sin(t * h.ritmo + h.fase) * h.vaiven);
      ctx.rotate(h.ang);
      ctx.beginPath();
      ctx.moveTo(0, -h.tam);
      ctx.quadraticCurveTo( h.tam * 0.78, 0, 0, h.tam);
      ctx.quadraticCurveTo(-h.tam * 0.78, 0, 0, -h.tam);
      ctx.fillStyle = h.color + h.op.toFixed(2) + ')';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -h.tam); ctx.lineTo(0, h.tam);
      ctx.strokeStyle = 'rgba(255,255,255,' + (h.op * 0.5).toFixed(2) + ')';
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.restore();
    }

    // Haces de luz que entran por la malla: franjas muy tenues que respiran.
    function pintarLuz(){
      for(var i = 0; i < 3; i++){
        var base = ancho * (0.16 + i * 0.3);
        var desliz = Math.sin(t * 0.0007 + i) * 26;
        var fuerza = Math.max(0.05 + Math.sin(t * 0.0011 + i * 1.7) * 0.022, 0);
        var g = ctx.createLinearGradient(base + desliz, 0, base + desliz + 120, alto);
        g.addColorStop(0,   'rgba(255,255,255,0)');
        g.addColorStop(0.4, 'rgba(214,240,224,' + fuerza.toFixed(3) + ')');
        g.addColorStop(1,   'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(base + desliz - 60, 0);
        ctx.lineTo(base + desliz + 130, 0);
        ctx.lineTo(base + desliz + 250, alto);
        ctx.lineTo(base + desliz + 60,  alto);
        ctx.closePath();
        ctx.fill();
      }
    }

    function arrancar(){ if(raf === null && corriendo) raf = requestAnimationFrame(cuadro); }
    function parar(){ if(raf !== null){ cancelAnimationFrame(raf); raf = null; } }

    function cuadro(){
      raf = null;
      t += 16;
      ctx.clearRect(0, 0, ancho, alto);
      pintarLuz();

      for(var i = 0; i < motas.length; i++){
        var m = motas[i];
        m.x += m.v; m.y -= m.v * 0.35;
        if(m.x > ancho + 6 || m.y < -6){ m.x = -6; m.y = alto * (0.3 + Math.random() * 0.7); }
        ctx.beginPath();
        ctx.arc(m.x, m.y + Math.sin(t * 0.002 + m.fase) * 5, m.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(255,255,255,' + m.op.toFixed(2) + ')';
        ctx.fill();
      }

      for(var j = 0; j < hojas.length; j++){
        var h = hojas[j];
        h.x += h.v; h.ang += h.giro;
        if(h.x > ancho + 40) hojas[j] = nuevaHoja(false);
        pintarHoja(h);
      }
      arrancar();
    }

    function fijarEstado(activo){
      if(activo === corriendo) return;
      corriendo = activo;
      if(activo) arrancar(); else parar();
    }

    if(medir()){
      poblar();
      lienzo.classList.add('is-lista');
      fijarEstado(true);
    }

    var remedir = null;
    window.addEventListener('resize', function(){
      clearTimeout(remedir);
      remedir = setTimeout(function(){ if(medir()) poblar(); }, 180);
    }, { passive:true });

    // Fuera de pantalla o pestana oculta: no se gastan fotogramas en algo que
    // nadie esta mirando.
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(entradas){
        fijarEstado(entradas[0].isIntersecting && !document.hidden);
      }, { threshold:0.01 }).observe(lienzo);
    }
    document.addEventListener('visibilitychange', function(){
      if(document.hidden) fijarEstado(false);
      else if(lienzo.getBoundingClientRect().bottom > 0) fijarEstado(true);
    });
  }

  /* ------------------------------------------------------- 2. la galeria ---
     La pista es un scroller nativo con scroll-snap: el gesto tactil, la rueda
     del trackpad y la tabulacion ya funcionan sin codigo. Esto solo anade las
     flechas, los puntos y el teclado, y lee la posicion del scroll en vez de
     llevar un indice propio: asi nunca se desincroniza de lo que se ve. */
  var galeria = document.getElementById('galeria');
  if(galeria){
    var pista  = document.getElementById('galeriaPista');
    var prev   = document.getElementById('galeriaPrev');
    var next   = document.getElementById('galeriaNext');
    var puntos = document.getElementById('galeriaPuntos');
    var lams   = [].slice.call(pista.querySelectorAll('.galeria-lam'));

    var indiceActual = function(){
      if(!lams.length) return 0;
      var centro = pista.scrollLeft + pista.clientWidth / 2;
      var mejor = 0, dist = Infinity;
      lams.forEach(function(lam, i){
        var c = lam.offsetLeft + lam.offsetWidth / 2;
        var d = Math.abs(c - centro);
        if(d < dist){ dist = d; mejor = i; }
      });
      return mejor;
    };

    var ir = function(i){
      var lam = lams[Math.max(0, Math.min(i, lams.length - 1))];
      pista.scrollTo({
        left: lam.offsetLeft - (pista.clientWidth - lam.offsetWidth) / 2,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    };

    var sincronizar = function(){
      if(!lams.length) return;
      var i = indiceActual();
      if(puntos){
        [].forEach.call(puntos.children, function(b, j){
          b.setAttribute('aria-selected', String(j === i));
        });
      }
      lams.forEach(function(lam, j){ lam.classList.toggle('is-activa', j === i); });
      // Las flechas se esconden en los extremos en vez de quedarse muertas: un
      // boton visible que no hace nada es peor que uno ausente.
      if(prev) prev.disabled = (i === 0);
      if(next) next.disabled = (i === lams.length - 1);
    };

    // Los oyentes se enganchan UNA vez y no dependen de que laminas haya: la
    // base sustituye el contenido de la pista despues de cargar, y volver a
    // registrarlos en cada repintado los iria acumulando.
    if(prev) prev.addEventListener('click', function(){ ir(indiceActual() - 1); });
    if(next) next.addEventListener('click', function(){ ir(indiceActual() + 1); });

    var tick = null;
    pista.addEventListener('scroll', function(){
      if(tick) return;
      tick = requestAnimationFrame(function(){ tick = null; sincronizar(); });
    }, { passive:true });

    galeria.addEventListener('keydown', function(e){
      if(e.key === 'ArrowLeft'){ e.preventDefault(); ir(indiceActual() - 1); }
      else if(e.key === 'ArrowRight'){ e.preventDefault(); ir(indiceActual() + 1); }
    });

    window.addEventListener('resize', function(){ sincronizar(); }, { passive:true });

    // Lee las laminas que hay AHORA y rehace los puntos. Se llama al cargar y
    // otra vez cuando la base entrega su propia galeria.
    function montar(){
      lams = [].slice.call(pista.querySelectorAll('.galeria-lam'));
      var varias = lams.length > 1;
      if(puntos){
        puntos.innerHTML = '';
        puntos.hidden = !varias;
      }
      if(prev) prev.hidden = !varias;
      if(next) next.hidden = !varias;
      if(varias && puntos){
        lams.forEach(function(lam, i){
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('role', 'tab');
          b.setAttribute('aria-label', 'Fotografía ' + (i + 1) + ' de ' + lams.length);
          b.addEventListener('click', function(){ ir(i); });
          puntos.appendChild(b);
        });
      }
      sincronizar();
    }

    montar();
    window.CIEHS = window.CIEHS || {};
    window.CIEHS.recomponerGaleria = montar;
  }
})();

/* ===========================================================================
   11. CARPETA DE CAMPO DIGITAL

   El estudiante registra su medicion y la grafica se rehace sola. El registro
   nace SIN publicar y lo valida el panel, igual que los comentarios: eso no es
   burocracia, es lo que ensena que un dato cientifico se contrasta antes de
   darse por bueno. Mientras espera, su punto se dibuja aparte, marcado como
   pendiente, para que vea que su trabajo cuenta.

   La grafica es SVG generado a mano, sin libreria: son series de pocas decenas
   de puntos y cargar una dependencia entera para eso no se sostiene.
   =========================================================================== */
(function(){
  var form = document.getElementById('campoForm');
  if(!form) return;                       // la seccion no esta en esta pagina

  var D = window.CIEHSData;
  var selModulo = document.getElementById('campoModulo');
  var elFecha   = document.getElementById('campoFecha');
  var elStatus  = document.getElementById('campoStatus');
  var elEnviar  = document.getElementById('campoEnviar');
  var svg       = document.getElementById('campoGrafica');
  var elTitulo  = document.getElementById('campoVisorTitulo');
  var elVacio   = document.getElementById('campoVacio');
  var elSeries  = document.getElementById('campoSeries');

  var VARIABLES = [
    { clave:'ph',        etiqueta:'pH',      unidad:'',       min:4,  max:8   },
    { clave:'ce',        etiqueta:'CE',      unidad:' mS/cm', min:0,  max:4   },
    { clave:'temp_c',    etiqueta:'Temp.',   unidad:' °C',    min:10, max:35  },
    { clave:'altura_cm', etiqueta:'Altura',  unidad:' cm',    min:0,  max:40  },
    { clave:'hojas',     etiqueta:'Hojas',   unidad:'',       min:0,  max:20  }
  ];
  var variableActiva = 'ph';

  // Registros que este navegador acaba de enviar y todavia no estan validados.
  // Viven solo en memoria: no se guardan en localStorage porque una medicion
  // pendiente no es un dato del portal, es un envio en transito.
  var pendientes = [];

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function aviso(texto, error){
    if(!elStatus) return;
    elStatus.classList.toggle('error', !!error);
    elStatus.textContent = texto || '';
  }

  /* ------------------------------------------------- selector de modulos --*/
  function llenarModulos(){
    if(!selModulo) return;
    var snap = (window.CIEHS && window.CIEHS.snapshot && window.CIEHS.snapshot()) || null;
    var mods = (snap && snap.modulos) || [];
    // Solo modulos reales: PROY-NFT y PROY-VER son proyecciones a futuro y no
    // existen fisicamente, asi que nadie puede medirlos.
    mods = mods.filter(function(m){ return m.code && m.code.indexOf('PROY-') !== 0; });
    if(!mods.length){
      selModulo.innerHTML = '<option value="">(no se pudo cargar la lista)</option>';
      return;
    }
    var previo = selModulo.value;
    selModulo.innerHTML = mods.map(function(m){
      return '<option value="' + esc(m.code) + '">' + esc(m.code)
           + (m.crop ? ' · ' + esc(m.crop) : '') + '</option>';
    }).join('');
    if(previo) selModulo.value = previo;
    dibujar();
  }

  /* ----------------------------------------------- pestanas de variable ---*/
  function pintarSeries(){
    if(!elSeries) return;
    elSeries.innerHTML = VARIABLES.map(function(v){
      return '<button type="button" role="tab" class="campo-serie' + (v.clave === variableActiva ? ' is-active' : '')
        + '" data-var="' + v.clave + '" aria-selected="' + (v.clave === variableActiva) + '">'
        + esc(v.etiqueta) + '</button>';
    }).join('');
    elSeries.querySelectorAll('[data-var]').forEach(function(b){
      b.addEventListener('click', function(){
        variableActiva = b.getAttribute('data-var');
        pintarSeries();
        dibujar();
      });
    });
  }

  /* ---------------------------------------------------------- la grafica --*/
  function datosDe(codigo, clave){
    var snap = (window.CIEHS && window.CIEHS.snapshot && window.CIEHS.snapshot()) || null;
    var todos = (snap && snap.registros) || [];
    function util(r){
      return r.module_code === codigo && r[clave] != null && r[clave] !== '';
    }
    var val = todos.filter(util).map(function(r){
      return { x: r.medido_en, y: Number(r[clave]), pendiente: false };
    });
    var pen = pendientes.filter(util).map(function(r){
      return { x: r.medido_en, y: Number(r[clave]), pendiente: true };
    });
    return val.concat(pen).sort(function(a, b){ return a.x < b.x ? -1 : a.x > b.x ? 1 : 0; });
  }

  function dibujar(){
    if(!svg || !selModulo) return;
    var codigo = selModulo.value;
    var v = VARIABLES.filter(function(x){ return x.clave === variableActiva; })[0] || VARIABLES[0];
    var puntos = datosDe(codigo, v.clave);

    if(elTitulo) elTitulo.textContent = codigo ? (codigo + ' · ' + v.etiqueta) : 'Elige un módulo';
    if(elVacio) elVacio.hidden = puntos.length > 0;
    if(!puntos.length){ svg.innerHTML = ''; return; }

    var W = 640, H = 260, ml = 48, mr = 16, mt = 18, mb = 34;
    var iw = W - ml - mr, ih = H - mt - mb;

    // La escala se calcula sobre los datos reales, pero se ensancha hasta el
    // rango de referencia del cultivo: si todos los puntos caen en 6.1-6.3, una
    // escala ajustada a eso convertiria el ruido en una montana rusa.
    var ys = puntos.map(function(p){ return p.y; });
    var yMin = Math.min.apply(null, ys.concat([v.min]));
    var yMax = Math.max.apply(null, ys.concat([v.max]));
    if(yMax - yMin < 1e-6){ yMax = yMin + 1; }
    var pad = (yMax - yMin) * 0.08;
    yMin -= pad; yMax += pad;

    var n = puntos.length;
    function px(i){ return ml + (n === 1 ? iw / 2 : (i / (n - 1)) * iw); }
    function py(y){ return mt + ih - ((y - yMin) / (yMax - yMin)) * ih; }

    var partes = [];

    // Rejilla horizontal con sus etiquetas.
    for(var g = 0; g <= 4; g++){
      var val = yMin + (yMax - yMin) * (g / 4);
      var yy = py(val);
      partes.push('<line x1="' + ml + '" y1="' + yy.toFixed(1) + '" x2="' + (W - mr) + '" y2="' + yy.toFixed(1)
        + '" stroke="var(--chart-grid)" stroke-width="1"/>');
      partes.push('<text x="' + (ml - 8) + '" y="' + (yy + 4).toFixed(1)
        + '" text-anchor="end" font-size="11" fill="var(--chart-ink-2)" font-family="var(--font-mono)">'
        + val.toFixed(v.clave === 'hojas' ? 0 : 1) + '</text>');
    }

    // Linea de los validados. Los pendientes NO entran en la linea: son puntos
    // sueltos, porque unirlos daria a un dato sin contrastar la misma
    // apariencia de verdad que a los demas.
    var val2 = puntos.filter(function(p){ return !p.pendiente; });
    if(val2.length > 1){
      var d = val2.map(function(p){
        var i = puntos.indexOf(p);
        return px(i).toFixed(1) + ',' + py(p.y).toFixed(1);
      }).join(' ');
      partes.push('<polyline points="' + d + '" fill="none" stroke="var(--leaf-500)" stroke-width="2.5" '
        + 'stroke-linecap="round" stroke-linejoin="round"/>');
    }

    puntos.forEach(function(p, i){
      var cx = px(i).toFixed(1), cy = py(p.y).toFixed(1);
      var etiqueta = p.x + ' · ' + p.y + v.unidad + (p.pendiente ? ' (pendiente de validar)' : '');
      if(p.pendiente){
        partes.push('<circle cx="' + cx + '" cy="' + cy + '" r="5.5" fill="var(--surface)" '
          + 'stroke="var(--sun-500)" stroke-width="2.5" stroke-dasharray="3 2">'
          + '<title>' + esc(etiqueta) + '</title></circle>');
      } else {
        partes.push('<circle cx="' + cx + '" cy="' + cy + '" r="4.5" fill="var(--leaf-500)" '
          + 'stroke="var(--surface)" stroke-width="2">'
          + '<title>' + esc(etiqueta) + '</title></circle>');
      }
    });

    // Fechas: solo la primera y la ultima. Con quince mediciones, todas las
    // etiquetas se solapan y no se lee ninguna.
    if(n){
      partes.push('<text x="' + ml + '" y="' + (H - 10) + '" font-size="11" fill="var(--chart-ink-2)" '
        + 'font-family="var(--font-mono)">' + esc(puntos[0].x) + '</text>');
      if(n > 1){
        partes.push('<text x="' + (W - mr) + '" y="' + (H - 10) + '" text-anchor="end" font-size="11" '
          + 'fill="var(--chart-ink-2)" font-family="var(--font-mono)">' + esc(puntos[n - 1].x) + '</text>');
      }
    }

    svg.innerHTML = partes.join('');
    svg.setAttribute('aria-label', 'Evolución de ' + v.etiqueta + ' en el módulo ' + codigo
      + ': ' + n + (n === 1 ? ' medición' : ' mediciones')
      + ', de ' + Math.min.apply(null, ys).toFixed(1) + ' a ' + Math.max.apply(null, ys).toFixed(1) + v.unidad + '.');
  }

  /* ------------------------------------------------------------- el envio --*/
  function hoy(){
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
         + '-' + String(d.getDate()).padStart(2, '0');
  }
  if(elFecha){
    elFecha.value = hoy();
    elFecha.max = hoy();                  // no se puede medir el futuro
  }

  function leerNum(id){
    var e = document.getElementById(id);
    return e && e.value !== '' ? e.value : '';
  }

  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    if(!D || !D.listo){
      aviso('No hay conexión con la base del CIEHS, así que la medición no se puede registrar ahora mismo.', true);
      return;
    }
    var medida = {
      moduleCode: selModulo.value,
      equipo: (document.getElementById('campoEquipo') || {}).value || '',
      grado:  (document.getElementById('campoGrado')  || {}).value || '',
      medidoEn: elFecha.value,
      ph: leerNum('campoPh'), ce: leerNum('campoCe'), tempC: leerNum('campoTemp'),
      alturaCm: leerNum('campoAltura'), hojas: leerNum('campoHojas'),
      nota: (document.getElementById('campoNota') || {}).value || ''
    };
    if(!medida.moduleCode){ aviso('Elige el módulo que has medido.', true); return; }
    if(!medida.medidoEn){ aviso('Pon la fecha de la medición.', true); return; }
    // Misma regla que la restriccion de la base: al menos una medicion. Se
    // comprueba aqui tambien para dar un mensaje util en vez de un error de SQL.
    if(!medida.ph && !medida.ce && !medida.tempC && !medida.alturaCm && !medida.hojas){
      aviso('Anota al menos una medición: pH, CE, temperatura, altura o número de hojas.', true);
      return;
    }

    if(elEnviar) elEnviar.disabled = true;
    aviso('Registrando…');
    D.registrarMedicion(medida).then(function(fila){
      if(fila) pendientes.push(fila);
      aviso('Registrado. Tu medición ya aparece en la gráfica marcada como pendiente: el equipo coordinador la valida y pasa a ser oficial.');
      dibujar();
      ['campoPh','campoCe','campoTemp','campoAltura','campoHojas','campoNota'].forEach(function(id){
        var e = document.getElementById(id); if(e) e.value = '';
      });
    }).catch(function(e){
      aviso('No se pudo registrar: ' + ((e && e.message) || 'error desconocido'), true);
    }).then(function(){
      if(elEnviar) elEnviar.disabled = false;
    });
  });

  if(selModulo) selModulo.addEventListener('change', dibujar);

  pintarSeries();
  llenarModulos();
  dibujar();

  // La capa de datos avisa cuando termina de cargar: hasta entonces no hay
  // modulos que listar ni registros que graficar.
  window.CIEHS = window.CIEHS || {};
  window.CIEHS.refrescarCampo = function(){ llenarModulos(); dibujar(); };
})();

/* ===========================================================================
   12. APORTES: fotos, videos, articulos y trabajos de investigacion

   Los iconos son botones: al pulsar uno se abre el formulario ya configurado
   para ese tipo de archivo (accept, limite y textos). Nada de lo que llega es
   accesible hasta que el panel lo apruebe — el bucket es privado y la politica
   de lectura exige una ficha aprobada.
   =========================================================================== */
(function(){
  var zona = document.getElementById('aportes');
  if(!zona) return;

  var D = window.CIEHSData;
  var form     = document.getElementById('aporteForm');
  var elArch   = document.getElementById('aporteArchivo');
  var elTipo   = document.getElementById('aporteTipoLabel');
  var elLim    = document.getElementById('aporteLimite');
  var elStatus = document.getElementById('aporteStatus');
  var elEnviar = document.getElementById('aporteEnviar');
  var elBarra  = document.getElementById('aporteBarra');
  var elPubs   = document.getElementById('aportePublicados');
  var elCerrar = document.getElementById('aporteCerrar');

  var TIPOS = {
    foto:          { etiqueta:'Fotografía',            accept:'image/jpeg,image/png,image/webp', mb:6  },
    video:         { etiqueta:'Vídeo',                 accept:'video/mp4,video/webm',            mb:25 },
    articulo:      { etiqueta:'Artículo científico',   accept:'application/pdf',                 mb:15 },
    investigacion: { etiqueta:'Trabajo de investigación', accept:'application/pdf',              mb:15 },
    audio:         { etiqueta:'Audio',                 accept:'audio/mpeg,audio/mp4,audio/ogg',  mb:15 }
  };
  var tipoActivo = 'foto';

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function aviso(t, error){
    if(!elStatus) return;
    elStatus.classList.toggle('error', !!error);
    elStatus.textContent = t || '';
  }
  function pesoLegible(b){
    if(b == null) return '';
    return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  }

  // Mismo saneado que en evidencias: un nombre con tildes o espacios acaba
  // siendo una ruta ilegible que hay que escapar en cada sitio donde se use.
  function rutaSegura(nombre){
    return String(nombre || '').trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  /* ------------------------------------------------- los iconos-boton -----*/
  function activarTipo(kind){
    tipoActivo = kind;
    var t = TIPOS[kind] || TIPOS.foto;
    zona.querySelectorAll('.aporte-icono').forEach(function(b){
      var mio = b.getAttribute('data-kind') === kind;
      b.classList.toggle('is-active', mio);
      b.setAttribute('aria-pressed', String(mio));
    });
    if(elTipo) elTipo.textContent = t.etiqueta;
    if(elArch){ elArch.setAttribute('accept', t.accept); elArch.value = ''; }
    if(elLim) elLim.textContent = 'Máximo ' + t.mb + ' MB.';
    form.hidden = false;
    aviso('');
    form.scrollIntoView({ behavior:'smooth', block:'nearest' });
    var titulo = document.getElementById('aporteTitulo');
    if(titulo) titulo.focus();
  }

  zona.querySelectorAll('.aporte-icono').forEach(function(b){
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function(){ activarTipo(b.getAttribute('data-kind')); });
  });

  /* ------------------------------------------- tapado de rostros ---------
     Toda imagen pasa por el editor, tenga caras o no: la recodificacion del
     canvas es lo que elimina los metadatos EXIF (el GPS de una foto de movil
     puede llevar las coordenadas del laboratorio o de una casa), y eso no
     puede depender de que alguien se acuerde de pedirlo. */
  var zonaRostros = document.getElementById('rostrosZona');
  var hostRostros = document.getElementById('rostrosEditor');
  var chkSinCaras = document.getElementById('rostrosSinCaras');
  var avisoRostros = document.getElementById('rostrosAviso');
  var editorRostros = null;

  function esImagen(archivo){
    return archivo && /^image\//.test(archivo.type || '');
  }

  function avisoR(t, error){
    if(!avisoRostros) return;
    avisoRostros.classList.toggle('error', !!error);
    avisoRostros.textContent = t || '';
  }

  function refrescarAvisoRostros(n){
    if(!chkSinCaras) return;
    // Marcar "no hay caras" y a la vez haber tapado alguna es contradictorio:
    // manda lo tapado y se desmarca la casilla.
    if(n > 0 && chkSinCaras.checked) chkSinCaras.checked = false;
    chkSinCaras.disabled = n > 0;
    avisoR(n > 0
      ? 'Se subirá la imagen con ' + n + (n === 1 ? ' cara tapada.' : ' caras tapadas.')
      : '');
  }

  if(elArch){
    elArch.addEventListener('change', function(){
      var archivo = elArch.files && elArch.files[0];
      if(!zonaRostros) return;
      if(!esImagen(archivo)){
        zonaRostros.hidden = true;
        editorRostros = null;
        return;
      }
      zonaRostros.hidden = false;
      if(chkSinCaras){ chkSinCaras.checked = false; chkSinCaras.disabled = false; }
      avisoR('Abriendo la imagen…');
      if(!editorRostros && window.CIEHS && window.CIEHS.crearEditorRostros){
        editorRostros = window.CIEHS.crearEditorRostros(hostRostros, { alCambiar: refrescarAvisoRostros });
      }
      if(!editorRostros){ avisoR('No se pudo abrir el editor de rostros en este navegador.', true); return; }
      editorRostros.cargar(archivo).then(function(){ avisoR(''); })
        .catch(function(e){ avisoR(e.message, true); });
    });
  }
  if(elCerrar) elCerrar.addEventListener('click', function(){
    form.hidden = true;
    zona.querySelectorAll('.aporte-icono').forEach(function(b){
      b.classList.remove('is-active'); b.setAttribute('aria-pressed','false');
    });
  });

  /* ------------------------------------------------------------ el envio --*/
  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    if(!D || !D.listo){
      aviso('No hay conexión con la base del CIEHS, así que el archivo no se puede subir ahora mismo.', true);
      return;
    }
    var archivo = elArch && elArch.files && elArch.files[0];
    var titulo  = (document.getElementById('aporteTitulo') || {}).value || '';
    var t = TIPOS[tipoActivo] || TIPOS.foto;

    if(!archivo){ aviso('Elige el archivo que quieres subir.', true); return; }
    if(titulo.trim().length < 3){ aviso('Ponle un título de al menos tres letras.', true); return; }
    if(archivo.size > t.mb * 1024 * 1024){
      aviso('El archivo pesa ' + pesoLegible(archivo.size) + ' y el máximo para ' +
            t.etiqueta.toLowerCase() + ' es ' + t.mb + ' MB.', true);
      return;
    }

    // Puerta de los rostros: una imagen no sale de aqui sin haber pasado por el
    // editor. O se tapo al menos una cara, o alguien afirmo expresamente que no
    // hay ninguna. No se permite subir "sin decidir".
    if(esImagen(archivo)){
      if(!editorRostros){ aviso('Vuelve a elegir la imagen: el editor de rostros no llegó a abrirse.', true); return; }
      if(!editorRostros.hayCaras() && !(chkSinCaras && chkSinCaras.checked)){
        aviso('Tapa las caras arrastrando sobre cada una, o marca que en la imagen no aparece ninguna.', true);
        if(zonaRostros) zonaRostros.scrollIntoView({ behavior:'smooth', block:'center' });
        return;
      }
    }

    // Ruta unica: sin esto, dos equipos que suban "informe.pdf" chocarian, y
    // como el alta usa upsert:false el segundo recibiria un error opaco.
    var base = rutaSegura(archivo.name) || 'aporte';
    var ruta = tipoActivo + '/' + Date.now().toString(36) + '-' +
               Math.random().toString(36).slice(2, 7) + '-' + base;

    if(elEnviar) elEnviar.disabled = true;
    if(elBarra) elBarra.hidden = false;
    aviso('Preparando la imagen…');

    // Para imagenes se sube SIEMPRE el resultado del canvas, nunca el archivo
    // original: es lo que garantiza que el original no salga del dispositivo y
    // que los metadatos se vayan con la recodificacion.
    var preparar = esImagen(archivo)
      ? editorRostros.exportar(archivo.name).then(function(tapada){
          archivo = tapada;
          ruta = tipoActivo + '/' + Date.now().toString(36) + '-' +
                 Math.random().toString(36).slice(2, 7) + '-' + (rutaSegura(tapada.name) || 'foto.jpg');
          return tapada;
        })
      : Promise.resolve(archivo);

    preparar.then(function(){
      aviso('Subiendo ' + pesoLegible(archivo.size) + '…');
      return D.subirAporte(archivo, ruta);
    }).then(function(){
      aviso('Guardando la ficha…');
      return D.registrarAporte({
        kind: tipoActivo, title: titulo.trim(),
        description: (document.getElementById('aporteDesc')   || {}).value || '',
        equipo:      (document.getElementById('aporteEquipo') || {}).value || '',
        grado:       (document.getElementById('aporteGrado')  || {}).value || '',
        rol:         (document.getElementById('aporteRol')    || {}).value || '',
        storagePath: ruta, mime: archivo.type, sizeBytes: archivo.size
      });
    }).then(function(){
      aviso('Subido. Tu aporte queda a la espera de que el equipo coordinador lo revise; hasta entonces no es visible para nadie más.');
      form.reset();
      if(elArch) elArch.setAttribute('accept', t.accept);
      if(zonaRostros) zonaRostros.hidden = true;
      editorRostros = null;
    }).catch(function(e){
      var m = (e && e.message) || 'error desconocido';
      // El error crudo del bucket no le dice nada a un estudiante de 2.°.
      if(/mime|content type/i.test(m)) m = 'Ese tipo de archivo no se admite para ' + t.etiqueta.toLowerCase() + '.';
      else if(/exceeded|too large|maximum/i.test(m)) m = 'El archivo supera el tamaño permitido.';
      else if(/duplicate|already exists/i.test(m)) m = 'Ya hay un archivo con ese nombre. Vuelve a intentarlo.';
      aviso('No se pudo subir: ' + m, true);
    }).then(function(){
      if(elEnviar) elEnviar.disabled = false;
      if(elBarra) elBarra.hidden = true;
    });
  });

  /* ------------------------------------------- lo ya aprobado, en lista ---
     El bucket es privado, asi que cada enlace se firma al vuelo y caduca. Se
     piden todos a la vez y se pintan los que respondan: si uno falla, el resto
     no debe quedarse sin aparecer. */
  var ICONO = {
    foto:'🖼️', video:'🎬', articulo:'📄', investigacion:'🔬', audio:'🎧', otro:'📎'
  };

  function pintarAprobados(){
    if(!elPubs) return;
    var E = window.CIEHS && window.CIEHS.estado;
    var faseD = (window.CIEHS && window.CIEHS.faseDatos) ? window.CIEHS.faseDatos() : 'listo';
    var snap = (window.CIEHS && window.CIEHS.snapshot && window.CIEHS.snapshot()) || null;
    var filas = (snap && snap.aportes) || [];

    if(!filas.length){
      // Antes esto se vaciaba en silencio y la seccion quedaba en un hueco sin
      // explicacion: el visitante no podia saber si es que no habia aportes o si
      // es que algo habia fallado.
      elPubs.innerHTML = !E ? ''
        : faseD === 'cargando' ? E.cargando('Buscando los aportes ya aprobados…')
        : faseD === 'error'    ? E.error('La lista de aportes publicados no se puede mostrar ahora mismo.',
                                         window.CIEHSData && window.CIEHSData.motivo)
        : E.vacio('Todavía sin aportes publicados',
                  'Lo que se envía desde aquí pasa antes por la coordinación. En cuanto se apruebe '
                  + 'el primero, aparecerá en esta lista.', '📎');
      return;
    }

    elPubs.innerHTML = '<h4 class="aporte-pub-titulo">Aportes publicados</h4>'
      + '<ul class="aporte-lista">' + filas.map(function(a){
      var quien = [a.equipo, a.grado].filter(Boolean).join(' · ');
      return '<li class="aporte-item" data-ruta="' + esc(a.storage_path) + '">'
        + '<span class="aporte-ico" aria-hidden="true">' + (ICONO[a.kind] || ICONO.otro) + '</span>'
        + '<div class="aporte-txt">'
        +   '<b>' + esc(a.title) + '</b>'
        +   (a.description ? '<span>' + esc(a.description) + '</span>' : '')
        +   '<span class="aporte-meta mono">' + esc(quien || 'CIEHS')
        +     (a.size_bytes ? ' · ' + pesoLegible(a.size_bytes) : '') + '</span>'
        + '</div>'
        + '<span class="aporte-abrir" data-slot>…</span>'
        + '</li>';
    }).join('') + '</ul>';

    filas.forEach(function(a){
      var li = elPubs.querySelector('[data-ruta="' + (window.CSS && CSS.escape ? CSS.escape(a.storage_path) : a.storage_path) + '"]');
      if(!li) return;
      var slot = li.querySelector('[data-slot]');
      D.urlAporte(a.storage_path).then(function(url){
        slot.outerHTML = '<a class="aporte-abrir" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">Abrir</a>';
      }).catch(function(){
        slot.outerHTML = '<span class="aporte-abrir is-off">No disponible</span>';
      });
    });
  }

  window.CIEHS = window.CIEHS || {};
  window.CIEHS.refrescarAportes = pintarAprobados;
})();

/* ===========================================================================
   13. TAPAR ROSTROS ANTES DE SUBIR

   Por que PIXELADO y no desenfoque. Un desenfoque gaussiano es una operacion
   reversible en el sentido practico: existen tecnicas de deconvolucion que
   recuperan bastante de la cara original, y sobre rostros pequenos el
   resultado puede volver a ser identificable. El pixelado con bloques grandes
   promedia y descarta la informacion: no hay nada que recuperar. Para
   anonimizar a un menor esa diferencia no es un matiz.

   Por que en el navegador. El archivo original NUNCA sale del dispositivo. Lo
   que se sube es un canvas re-codificado, y eso ademas elimina de paso todos
   los metadatos EXIF (incluido el GPS, que en una foto de movil puede llevar
   las coordenadas del laboratorio o de una casa).

   Todo pasa por aqui, incluso una foto sin caras: asi la re-codificacion —y
   por tanto el borrado de metadatos— no depende de que alguien se acuerde.
   =========================================================================== */
(function(){
  var BLOQUE_MIN = 12;      // lado minimo del mosaico, en pixeles de la imagen

  // Crea el editor sobre un contenedor. Devuelve un objeto con:
  //   cargar(File) -> Promise           abre una imagen
  //   exportar()   -> Promise<Blob>     devuelve la imagen ya tapada
  //   hayCaras()   -> boolean           si se marco al menos una region
  //   limpiar()                         vuelve a cero
  function crearEditorRostros(host, opciones){
    opciones = opciones || {};
    var lienzo = document.createElement('canvas');
    lienzo.className = 'rostros-lienzo';
    var ctx = lienzo.getContext('2d');

    var barra = document.createElement('div');
    barra.className = 'rostros-barra';
    barra.innerHTML =
        '<button type="button" class="rostros-btn" data-accion="auto" hidden>Detectar caras</button>'
      + '<button type="button" class="rostros-btn" data-accion="deshacer">Deshacer</button>'
      + '<button type="button" class="rostros-btn" data-accion="limpiar">Quitar todas</button>'
      + '<span class="rostros-cuenta" data-cuenta>Sin caras tapadas</span>';

    var ayuda = document.createElement('p');
    ayuda.className = 'rostros-ayuda';
    ayuda.innerHTML = '<b>Arrastra sobre cada cara</b> para taparla. Puedes marcar varias. '
      + 'Lo que se sube es la imagen tapada: el archivo original no sale de este dispositivo.';

    host.innerHTML = '';
    host.appendChild(ayuda);
    host.appendChild(lienzo);
    host.appendChild(barra);

    var img = null;         // Image ya cargada
    var cajas = [];         // regiones en coordenadas de la IMAGEN, no del canvas
    var escala = 1;         // canvas / imagen
    var arrastrando = null; // caja en curso

    function elCuenta(){ return barra.querySelector('[data-cuenta]'); }

    function pintar(){
      if(!img) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);

      cajas.forEach(function(c){ pixelarEnCanvas(ctx, img, c, escala); });

      if(arrastrando){
        ctx.save();
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(arrastrando.x * escala, arrastrando.y * escala,
                       arrastrando.w * escala, arrastrando.h * escala);
        ctx.restore();
      }

      var n = cajas.length;
      elCuenta().textContent = n === 0 ? 'Sin caras tapadas'
        : (n === 1 ? '1 cara tapada' : n + ' caras tapadas');
      elCuenta().classList.toggle('is-ok', n > 0);
      if(typeof opciones.alCambiar === 'function') opciones.alCambiar(n);
    }

    // Pixela una region dibujando la zona reducida y volviendola a ampliar con
    // el suavizado apagado. Trabaja sobre la imagen ORIGINAL, no sobre lo ya
    // pintado: asi el mosaico es igual de grueso en la vista previa y en la
    // exportacion a tamano completo.
    function pixelarEnCanvas(destino, fuente, caja, k){
      var sx = Math.max(0, Math.round(caja.x));
      var sy = Math.max(0, Math.round(caja.y));
      var sw = Math.max(1, Math.round(caja.w));
      var sh = Math.max(1, Math.round(caja.h));
      if(sx + sw > fuente.naturalWidth)  sw = fuente.naturalWidth  - sx;
      if(sy + sh > fuente.naturalHeight) sh = fuente.naturalHeight - sy;
      if(sw <= 0 || sh <= 0) return;

      // Bloques grandes en proporcion al tamano de la cara: una cara pequena
      // necesita bloques relativamente mas grandes para quedar irreconocible.
      var lado = Math.max(BLOQUE_MIN, Math.round(Math.min(sw, sh) / 5));
      var cols = Math.max(1, Math.round(sw / lado));
      var filas = Math.max(1, Math.round(sh / lado));

      var mini = document.createElement('canvas');
      mini.width = cols; mini.height = filas;
      var mctx = mini.getContext('2d');
      mctx.imageSmoothingEnabled = true;      // al reducir, promedia
      mctx.drawImage(fuente, sx, sy, sw, sh, 0, 0, cols, filas);

      destino.save();
      destino.imageSmoothingEnabled = false;  // al ampliar, bloques duros
      destino.drawImage(mini, 0, 0, cols, filas,
                        sx * k, sy * k, sw * k, sh * k);
      destino.restore();
    }

    /* --------------------------------------------- dibujar con el puntero --*/
    function puntoEnImagen(ev){
      var r = lienzo.getBoundingClientRect();
      // El canvas puede estar escalado por CSS: se traduce del pixel de
      // pantalla al pixel del canvas y de ahi al de la imagen.
      var cx = (ev.clientX - r.left) * (lienzo.width / r.width);
      var cy = (ev.clientY - r.top)  * (lienzo.height / r.height);
      return { x: cx / escala, y: cy / escala };
    }

    lienzo.addEventListener('pointerdown', function(ev){
      if(!img) return;
      // setPointerCapture lanza InvalidStateError si el puntero ya no esta
      // activo. Sin este try, esa excepcion abortaria el manejador antes de
      // empezar el trazo y el recuadro no se dibujaria nunca.
      try { lienzo.setPointerCapture(ev.pointerId); } catch(e){ /* se sigue sin captura */ }
      var p = puntoEnImagen(ev);
      arrastrando = { x0:p.x, y0:p.y, x:p.x, y:p.y, w:0, h:0 };
    });

    lienzo.addEventListener('pointermove', function(ev){
      if(!arrastrando) return;
      var p = puntoEnImagen(ev);
      arrastrando.x = Math.min(arrastrando.x0, p.x);
      arrastrando.y = Math.min(arrastrando.y0, p.y);
      arrastrando.w = Math.abs(p.x - arrastrando.x0);
      arrastrando.h = Math.abs(p.y - arrastrando.y0);
      pintar();
    });

    function soltar(){
      if(!arrastrando) return;
      var c = arrastrando;
      arrastrando = null;
      // Un toque suelto no es una region: seria una caja de 0 px que ademas
      // dejaria la cuenta diciendo que hay una cara tapada cuando no la hay.
      if(c.w > 6 && c.h > 6) cajas.push({ x:c.x, y:c.y, w:c.w, h:c.h });
      pintar();
    }
    lienzo.addEventListener('pointerup', soltar);
    lienzo.addEventListener('pointercancel', soltar);
    lienzo.addEventListener('pointerleave', soltar);

    barra.addEventListener('click', function(ev){
      var b = ev.target.closest('[data-accion]');
      if(!b) return;
      var a = b.getAttribute('data-accion');
      if(a === 'deshacer'){ cajas.pop(); pintar(); }
      else if(a === 'limpiar'){ cajas = []; pintar(); }
      else if(a === 'auto'){ detectar(b); }
    });

    /* ------------------------------------------------- deteccion opcional --
       FaceDetector solo existe en algunos navegadores. Cuando esta, ahorra
       trabajo; cuando no, el boton ni aparece. Nunca sustituye a la revision
       manual: lo que detecta se anade como cajas normales, editables. */
    var hayDetector = typeof window.FaceDetector === 'function';
    if(hayDetector) barra.querySelector('[data-accion="auto"]').hidden = false;

    function detectar(boton){
      if(!img || !hayDetector) return;
      boton.disabled = true;
      var textoPrevio = boton.textContent;
      boton.textContent = 'Buscando…';
      new window.FaceDetector({ fastMode:false })
        .detect(img)
        .then(function(caras){
          (caras || []).forEach(function(c){
            var b = c.boundingBox;
            // Se ensancha un 18 %: los detectores ajustan al rostro y dejan
            // fuera frente, orejas y menton, que tambien identifican.
            var mx = b.width * 0.18, my = b.height * 0.18;
            cajas.push({ x:b.x - mx, y:b.y - my, w:b.width + mx*2, h:b.height + my*2 });
          });
          pintar();
          boton.textContent = (caras && caras.length)
            ? 'Detectadas ' + caras.length
            : 'No encontró caras';
          setTimeout(function(){ boton.textContent = textoPrevio; boton.disabled = false; }, 2200);
        })
        .catch(function(){
          boton.textContent = 'No se pudo';
          setTimeout(function(){ boton.textContent = textoPrevio; boton.disabled = false; }, 2200);
        });
    }

    /* -------------------------------------------------------- carga/export --*/
    function cargar(archivo){
      return new Promise(function(res, rej){
        var url = URL.createObjectURL(archivo);
        var im = new Image();
        im.onload = function(){
          URL.revokeObjectURL(url);
          img = im;
          cajas = [];
          // El lienzo se limita a 900 px de ancho para que dibujar sea comodo;
          // la exportacion usa siempre el tamano original.
          var anchoVista = Math.min(900, im.naturalWidth);
          escala = anchoVista / im.naturalWidth;
          lienzo.width  = Math.round(im.naturalWidth  * escala);
          lienzo.height = Math.round(im.naturalHeight * escala);
          pintar();
          res();
        };
        im.onerror = function(){ URL.revokeObjectURL(url); rej(new Error('No se pudo abrir la imagen.')); };
        im.src = url;
      });
    }

    // Exporta a tamano original. JPEG con calidad alta: el PNG de una foto de
    // movil puede multiplicar por cinco el peso sin ganar nada.
    function exportar(nombre){
      return new Promise(function(res, rej){
        if(!img) return rej(new Error('No hay ninguna imagen cargada.'));
        var full = document.createElement('canvas');
        full.width = img.naturalWidth;
        full.height = img.naturalHeight;
        var fctx = full.getContext('2d');
        fctx.drawImage(img, 0, 0);
        cajas.forEach(function(c){ pixelarEnCanvas(fctx, img, c, 1); });
        full.toBlob(function(blob){
          if(!blob) return rej(new Error('No se pudo generar la imagen.'));
          var base = (nombre || 'foto').replace(/\.[^.]+$/, '');
          res(new File([blob], base + '.jpg', { type:'image/jpeg' }));
        }, 'image/jpeg', 0.9);
      });
    }

    return {
      cargar: cargar,
      exportar: exportar,
      hayCaras: function(){ return cajas.length > 0; },
      cuenta: function(){ return cajas.length; },
      limpiar: function(){ cajas = []; pintar(); }
    };
  }

  window.CIEHS = window.CIEHS || {};
  window.CIEHS.crearEditorRostros = crearEditorRostros;
})();

/* ===========================================================================
   14. AÑADIR RESULTADOS A UNA INVESTIGACION

   El tratamiento es obligatorio a proposito: estos estudios comparan grupos, y
   una medicion sin grupo no se puede contrastar contra nada — entraria en la
   base pero no diria nada en la grafica.
   =========================================================================== */
(function(){
  var form = document.getElementById('resForm');
  if(!form) return;

  var D = window.CIEHSData;
  var selInv   = document.getElementById('resInv');
  var elFecha  = document.getElementById('resFecha');
  var elStatus = document.getElementById('resStatus');
  var elEnviar = document.getElementById('resEnviar');

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function aviso(t, error){
    if(!elStatus) return;
    elStatus.classList.toggle('error', !!error);
    elStatus.textContent = t || '';
  }
  function hoy(){
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
         + '-' + String(d.getDate()).padStart(2, '0');
  }
  if(elFecha){ elFecha.value = hoy(); elFecha.max = hoy(); }

  function llenarInvestigaciones(){
    if(!selInv) return;
    var snap = (window.CIEHS && window.CIEHS.snapshot && window.CIEHS.snapshot()) || null;
    var inv = (snap && snap.investigaciones) || [];
    if(!inv.length){
      // Respaldo: las dos fichas oficiales viven tambien en el HTML, asi que el
      // formulario sigue siendo usable aunque la base no conteste.
      var estaticas = [].slice.call(document.querySelectorAll('#invGrid [data-inv-code]'));
      inv = estaticas.map(function(a){
        return { code: a.getAttribute('data-inv-code'),
                 title: (a.querySelector('h3') || {}).textContent || a.getAttribute('data-inv-code') };
      });
    }
    if(!inv.length){ selInv.innerHTML = '<option value="">(no hay investigaciones)</option>'; return; }
    var previo = selInv.value;
    selInv.innerHTML = inv.map(function(i){
      var t = (i.title || '').replace(/\s+/g, ' ').trim();
      if(t.length > 70) t = t.slice(0, 69) + '…';
      return '<option value="' + esc(i.code) + '">' + esc(i.code) + ' · ' + esc(t) + '</option>';
    }).join('');
    if(previo) selInv.value = previo;
  }

  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    if(!D || !D.listo){
      aviso('No hay conexión con la base del CIEHS, así que el resultado no se puede guardar ahora mismo.', true);
      return;
    }
    function v(id){ var e = document.getElementById(id); return e ? e.value.trim() : ''; }

    var datos = {
      code: selInv.value,
      tratamiento: v('resTrat'),
      medidoEn: elFecha.value,
      variable: v('resVar'),
      valor: v('resValor'),
      unidad: v('resUnidad'),
      n: v('resN'),
      equipo: v('resEquipo'), grado: v('resGrado'), nota: v('resNota')
    };

    if(!datos.code){ aviso('Elige la investigación.', true); return; }
    if(!datos.tratamiento){ aviso('Indica el tratamiento o grupo: sin él la medición no se puede comparar con nada.', true); return; }
    if(!datos.variable){ aviso('Escribe qué mediste.', true); return; }
    if(datos.valor === '' || isNaN(Number(datos.valor))){ aviso('El valor tiene que ser un número.', true); return; }
    if(!datos.medidoEn){ aviso('Pon la fecha de la medición.', true); return; }

    if(elEnviar) elEnviar.disabled = true;
    aviso('Guardando…');
    D.registrarResultado(datos).then(function(){
      aviso('Añadido. El equipo coordinador lo valida y entra en la gráfica de la investigación.');
      ['resValor','resN','resNota'].forEach(function(id){
        var e = document.getElementById(id); if(e) e.value = '';
      });
    }).catch(function(e){
      aviso('No se pudo guardar: ' + ((e && e.message) || 'error desconocido'), true);
    }).then(function(){
      if(elEnviar) elEnviar.disabled = false;
    });
  });

  llenarInvestigaciones();
  window.CIEHS = window.CIEHS || {};
  window.CIEHS.refrescarFormResultados = llenarInvestigaciones;
})();

/* ===========================================================================
   15. TIENDA: catalogo, carrito y destino de los recursos en porcentaje
   =========================================================================== */
(function(){
  var grid = document.getElementById('tiendaGrid');
  if(!grid) return;

  var D = window.CIEHSData;
  var elEstado  = document.getElementById('tiendaEstado');
  var carrito   = document.getElementById('carrito');
  var carLista  = document.getElementById('carritoLista');
  var carTotal  = document.getElementById('carritoTotal');
  var carVaciar = document.getElementById('carritoVaciar');
  var form      = document.getElementById('pedidoForm');
  var pedStatus = document.getElementById('pedStatus');
  var pedEnviar = document.getElementById('pedEnviar');
  var destino   = document.getElementById('destinoLista');
  var transpEst = document.getElementById('transpEstado');

  // El carrito vive solo en memoria. No se guarda en localStorage a proposito:
  // los equipos del laboratorio son compartidos y nadie deberia encontrarse el
  // pedido a medio hacer de la persona anterior.
  var cesta = [];

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function soles(n){ return 'S/ ' + Number(n).toFixed(2); }
  function fmtDia(v){
    if(!v) return '';
    var d = new Date(v + 'T12:00:00');
    if(isNaN(d.getTime())) return v;
    return d.toLocaleDateString('es-PE', { day:'2-digit', month:'long' });
  }

  var ETIQUETA_ESTADO = {
    disponible:        { txt:'Disponible ahora',  cls:'est-disp' },
    // El estado mas util para una familia: le dice cuando volver.
    proximo_a_cosecha: { txt:'Próximo a cosecha', cls:'est-prox' },
    en_crecimiento:    { txt:'En crecimiento',    cls:'est-crec' },
    agotado:           { txt:'Agotado',           cls:'est-ago'  }
  };

  /* ------------------------------------------------------- el catalogo ----*/
  function productos(){
    var snap = (window.CIEHS && window.CIEHS.snapshot && window.CIEHS.snapshot()) || null;
    return (snap && snap.productos) || [];
  }

  function pintarCatalogo(){
    var E = window.CIEHS && window.CIEHS.estado;
    var faseD = (window.CIEHS && window.CIEHS.faseDatos) ? window.CIEHS.faseDatos() : 'listo';
    var lista = productos();

    if(!lista.length){
      // NO se vacia la rejilla: el HTML trae un catalogo de respaldo con las seis
      // especies y su estado. Borrarlo dejaria la seccion en blanco justo a
      // quien peor conexion tiene, que es a quien mas falta le hace saber que
      // se cultiva. Solo se explica que no se puede reservar todavia.
      if(elEstado && E){
        E.en(elEstado,
          faseD === 'cargando'
            ? E.cargando('Consultando el catálogo de la semana… Debajo, mientras tanto, lo que el CIEHS cultiva habitualmente.')
          : faseD === 'error'
            ? E.error('Se muestra el catálogo habitual, pero la reserva en línea no está disponible '
                    + 'hasta que vuelva la conexión.', D && D.motivo)
            : E.vacio('Sin cosecha publicada esta semana',
                      'El catálogo de reservas está vacío ahora mismo. Abajo, lo que el CIEHS '
                      + 'cultiva habitualmente.', '🥬'));
      }
      return;
    }
    if(elEstado && E) E.en(elEstado, null);

    grid.innerHTML = lista.map(function(p){
      var e = ETIQUETA_ESTADO[p.estado] || ETIQUETA_ESTADO.en_crecimiento;
      var foto = p.foto_path && D && D.urlEvidencia ? D.urlEvidencia(p.foto_path) : '';
      var enCesta = cesta.filter(function(c){ return c.id === p.id; })[0];
      var puede = p.estado === 'disponible';

      return '<article class="prod' + (puede ? '' : ' is-off') + '" data-prod="' + esc(p.id) + '">'
        + '<div class="prod-foto">'
        +   (foto
              ? '<img src="' + esc(foto) + '" alt="' + esc(p.nombre) + ' cultivada en el CIEHS" loading="lazy" decoding="async">'
              : '<span class="prod-sinfoto" aria-hidden="true">🌱</span>')
        +   '<span class="prod-estado ' + e.cls + '">' + esc(e.txt) + '</span>'
        + '</div>'
        + '<div class="prod-cuerpo">'
        +   '<h4>' + esc(p.nombre) + '</h4>'
        +   (p.cientifico ? '<p class="prod-cient"><i>' + esc(p.cientifico) + '</i></p>' : '')
        +   (p.descripcion ? '<p class="prod-desc">' + esc(p.descripcion) + '</p>' : '')
        +   (!puede && p.disponible_desde
              ? '<p class="prod-cuando">Se podrá reservar desde el <b>' + esc(fmtDia(p.disponible_desde)) + '</b></p>'
              : '')
        +   '<div class="prod-pie">'
        +     '<span class="prod-precio tabular">' + (p.precio_pen != null ? soles(p.precio_pen) : '—')
        +       '<small> / ' + esc(p.unidad || 'unidad') + '</small></span>'
        +     (puede
                ? (enCesta
                    ? '<div class="prod-cant" role="group" aria-label="Unidades de ' + esc(p.nombre) + '">'
                      + '<button type="button" data-menos="' + esc(p.id) + '" aria-label="Quitar una unidad">−</button>'
                      + '<b class="tabular">' + enCesta.cantidad + '</b>'
                      + '<button type="button" data-mas="' + esc(p.id) + '" aria-label="Añadir una unidad">+</button>'
                      + '</div>'
                    : '<button type="button" class="prod-add" data-add="' + esc(p.id) + '">Añadir</button>')
                : '<span class="prod-nodisp">No disponible</span>')
        +   '</div>'
        + '</div>'
        + '</article>';
    }).join('');

    grid.querySelectorAll('[data-add]').forEach(function(b){
      b.addEventListener('click', function(){ sumar(b.getAttribute('data-add'), 1); });
    });
    grid.querySelectorAll('[data-mas]').forEach(function(b){
      b.addEventListener('click', function(){ sumar(b.getAttribute('data-mas'), 1); });
    });
    grid.querySelectorAll('[data-menos]').forEach(function(b){
      b.addEventListener('click', function(){ sumar(b.getAttribute('data-menos'), -1); });
    });
  }

  /* --------------------------------------------------------- el carrito ---*/
  function sumar(id, delta){
    var p = productos().filter(function(x){ return x.id === id; })[0];
    if(!p || p.estado !== 'disponible') return;
    var linea = cesta.filter(function(c){ return c.id === id; })[0];
    if(!linea){
      if(delta < 0) return;
      linea = { id:p.id, nombre:p.nombre, unidad:p.unidad, precio:p.precio_pen, cantidad:0 };
      cesta.push(linea);
    }
    linea.cantidad += delta;
    // El tope no es decorativo: la restriccion de la base rechaza mas de 999, y
    // un pedido de tres digitos en un huerto escolar es casi siempre un dedazo.
    if(linea.cantidad > 99) linea.cantidad = 99;
    if(linea.cantidad <= 0) cesta = cesta.filter(function(c){ return c.id !== id; });
    pintarCatalogo();
    pintarCarrito();
  }

  function totalCesta(){
    return cesta.reduce(function(s, c){
      return s + (c.precio != null ? Number(c.precio) * c.cantidad : 0);
    }, 0);
  }
  function unidadesCesta(){
    return cesta.reduce(function(s, c){ return s + c.cantidad; }, 0);
  }

  function pintarCarrito(){
    if(!carrito) return;
    carrito.hidden = cesta.length === 0;
    if(!cesta.length) return;

    carLista.innerHTML = cesta.map(function(c){
      return '<li>'
        + '<span class="car-n tabular">' + c.cantidad + '×</span>'
        + '<span class="car-nom">' + esc(c.nombre) + '</span>'
        + '<span class="car-sub tabular">' + (c.precio != null ? soles(Number(c.precio) * c.cantidad) : '—') + '</span>'
        + '<button type="button" class="car-quitar" data-quitar="' + esc(c.id) + '" aria-label="Quitar ' + esc(c.nombre) + '">×</button>'
        + '</li>';
    }).join('');

    carLista.querySelectorAll('[data-quitar]').forEach(function(b){
      b.addEventListener('click', function(){
        cesta = cesta.filter(function(c){ return c.id !== b.getAttribute('data-quitar'); });
        pintarCatalogo(); pintarCarrito();
      });
    });

    var u = unidadesCesta();
    var conPrecio = cesta.some(function(c){ return c.precio != null; });
    carTotal.textContent = (conPrecio ? soles(totalCesta()) + ' · ' : '')
      + u + (u === 1 ? ' unidad' : ' unidades');
  }

  if(carVaciar) carVaciar.addEventListener('click', function(){
    cesta = []; pintarCatalogo(); pintarCarrito();
    if(pedStatus) pedStatus.textContent = '';
  });

  /* --------------------------------------------------------- el pedido ----*/
  function aviso(t, error){
    if(!pedStatus) return;
    pedStatus.classList.toggle('error', !!error);
    pedStatus.textContent = t || '';
  }

  if(form){
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      // Trampa para robots: un campo oculto que una persona nunca rellena.
      var trampa = document.getElementById('pedTrampa');
      if(trampa && trampa.value){ aviso('Reserva enviada.'); return; }

      if(!D || !D.listo){ aviso('No hay conexión con la base del CIEHS, así que la reserva no se puede enviar ahora mismo.', true); return; }
      if(!cesta.length){ aviso('Añade al menos un producto a tu reserva.', true); return; }

      var nombre   = (document.getElementById('pedNombre')   || {}).value || '';
      var contacto = (document.getElementById('pedContacto') || {}).value || '';
      if(nombre.trim().length < 2){ aviso('Escribe tu nombre para poder entregarte el pedido.', true); return; }
      if(contacto.trim().length < 5){ aviso('Deja un teléfono o correo: sin eso no podemos confirmarte la entrega.', true); return; }

      if(pedEnviar) pedEnviar.disabled = true;
      aviso('Reservando…');
      D.crearPedido({
        nombre: nombre.trim(), contacto: contacto.trim(),
        nota: (document.getElementById('pedNota') || {}).value || '',
        lineas: cesta
      }).then(function(){
        var u = unidadesCesta();
        aviso('Reserva registrada: ' + u + (u === 1 ? ' unidad' : ' unidades') +
              '. El equipo de Ventas te escribirá para confirmar el día de entrega.');
        cesta = [];
        form.reset();
        pintarCatalogo(); pintarCarrito();
      }).catch(function(e){
        aviso('No se pudo reservar: ' + ((e && e.message) || 'error desconocido'), true);
      }).then(function(){
        if(pedEnviar) pedEnviar.disabled = false;
      });
    });
  }

  /* ------------------------------------ destino de los recursos, en % -----
     Se calcula a partir del registro de egresos que ya lleva Tesoreria, en vez
     de teclear porcentajes a mano: asi la cifra no puede desmentir a la
     contabilidad. No se muestra ningun importe ni cuanto se ha vendido — lo que
     dice en que cree el proyecto es la PROPORCION, no el monto. */
  var COLORES = ['var(--leaf-500)', 'var(--azure-500)', 'var(--sun-500)', '#7c3aed', '#c2410c', '#0f766e'];
  // Las cuatro lineas en que el CIEHS reinvierte. Fijas a proposito: son las
  // que el proyecto se compromete a sostener, no una lista que crece sola.
  var NOMBRE_CATEGORIA = {
    nutrientes:    'Nutrientes y solución',
    semillas:      'Semillas y almácigo',
    modulos:       'Mantenimiento de los módulos',
    investigacion: 'Materiales de investigación',
    otros:         'Otros destinos'
  };

  function pintarDestino(){
    if(!destino) return;
    var snap = (window.CIEHS && window.CIEHS.snapshot && window.CIEHS.snapshot()) || null;
    var caja = (snap && snap.caja) || [];
    var egresos = caja.filter(function(e){ return e.kind === 'egreso' && Number(e.amount_pen) > 0; });

    if(!egresos.length){
      // Igual que el catalogo: se conserva el respaldo, que muestra el reparto
      // PREVISTO y lo dice con esas palabras. Ensenar un plan como si fuera
      // gasto ya ejecutado seria mentir; ensenarlo etiquetado como plan es lo
      // que una familia quiere saber antes de comprar.
      var E = window.CIEHS && window.CIEHS.estado;
      var faseD = (window.CIEHS && window.CIEHS.faseDatos) ? window.CIEHS.faseDatos() : 'listo';
      if(transpEst && E){
        E.en(transpEst,
          faseD === 'cargando'
            ? E.cargando('Consultando la caja del CIEHS… Abajo, mientras tanto, el reparto previsto.')
          : faseD === 'error'
            ? E.error('No se pudo leer la caja, así que lo de abajo es el reparto PREVISTO, '
                    + 'no lo ya gastado.', D && D.motivo)
            : E.vacio('Todavía sin egresos registrados',
                      'Abajo, el reparto previsto. En cuanto el equipo de Tesorería anote el primer '
                      + 'gasto, esta rueda pasa a mostrar el reparto real.', '🧾'));
      }
      return;
    }
    if(transpEst && window.CIEHS && window.CIEHS.estado) window.CIEHS.estado.en(transpEst, null);

    // Se agrupa por CATEGORIA canonica, no por el concepto en texto libre:
    // "solucion nutritiva", "Solucion Nutritiva" y "nutrientes" son el mismo
    // gasto, y agrupar por texto daba tantas porciones como formas de
    // escribirlo. Los egresos antiguos sin categoria caen en "Otros".
    var porConcepto = {};
    egresos.forEach(function(e){
      var c = NOMBRE_CATEGORIA[e.categoria] || 'Otros destinos';
      porConcepto[c] = (porConcepto[c] || 0) + Number(e.amount_pen);
    });
    var total = Object.keys(porConcepto).reduce(function(s, k){ return s + porConcepto[k]; }, 0);
    var filas = Object.keys(porConcepto).map(function(k){
      return { concepto:k, pct: (porConcepto[k] / total) * 100 };
    }).sort(function(a, b){ return b.pct - a.pct; });

    // Barra apilada: se ve de un vistazo cual se lleva la mayor parte, que es
    // justo la pregunta que hace quien mira esto.
    var apilada = '<div class="destino-barra" role="img" aria-label="'
      + esc('Reparto de los egresos: ' + filas.map(function(f){
          return f.concepto + ' ' + f.pct.toFixed(0) + ' %'; }).join(', ') + '.')
      + '">' + filas.map(function(f, i){
          return '<span style="width:' + f.pct.toFixed(2) + '%;background:' + COLORES[i % COLORES.length] + '"></span>';
        }).join('') + '</div>';

    var detalle = '<ul class="destino-lista">' + filas.map(function(f, i){
      return '<li>'
        + '<i style="background:' + COLORES[i % COLORES.length] + '"></i>'
        + '<span class="destino-con">' + esc(f.concepto) + '</span>'
        + '<b class="destino-pct tabular">' + f.pct.toFixed(1) + ' %</b>'
        + '</li>';
    }).join('') + '</ul>';

    destino.innerHTML = apilada + detalle;
  }

  window.CIEHS = window.CIEHS || {};
  window.CIEHS.refrescarTienda = function(){
    // Un producto puede haberse agotado mientras alguien tenia el carrito
    // abierto: se depura la cesta contra el catalogo nuevo antes de repintar,
    // o se enviaria un pedido de algo que ya no se ofrece.
    var vivos = productos();
    cesta = cesta.filter(function(c){
      return vivos.some(function(p){ return p.id === c.id && p.estado === 'disponible'; });
    });
    pintarCatalogo();
    pintarCarrito();
    pintarDestino();
  };

  pintarCatalogo();
  pintarDestino();
})();

/* ===========================================================================
   16. VOZ — Diseño Universal para el Aprendizaje (DUA)

   El CNEB pide ofrecer el contenido por más de una vía. Aquí eso significa que
   todo lo que hay que leer para jugar se puede ESCUCHAR: la pregunta, las
   opciones y la explicación de por qué una respuesta era la correcta.

   TRES DECISIONES QUE CAMBIAN CÓMO SUENA
   --------------------------------------
   1. Acento. Se prefieren las variantes LATINOAMERICANAS (es-US, es-MX, es-419,
      es-PE) sobre es-ES. El castellano de España cecea, y a un estudiante de
      Huanchaco eso le suena a persona de fuera leyendo su examen.

   2. Voz de mujer. Se busca por nombre entre las conocidas (Sabina, Paulina,
      Laura, Helena, Mónica…) porque la API no expone el género. Si ninguna
      coincide, se usa la primera en español antes que una en inglés.

   3. Frase a frase, no de un tirón. Un párrafo entero leído sin pausas suena a
      máquina; además Chrome corta la locución a los ~15 segundos. Partirlo por
      frases resuelve las dos cosas a la vez.

   SUBIR DE CALIDAD SIN TOCAR ESTE CÓDIGO
   --------------------------------------
   Si existe un archivo de audio para una clave dada en el bucket de aportes, se
   reproduce ESE en lugar de sintetizar. Así se puede pregrabar el banco de
   preguntas con una voz de gama alta y el portal la usará sola, sin claves de
   API en el navegador (que además serían públicas: el repositorio lo es).
   =========================================================================== */
(function(){
  var soporta = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

  var CLAVE = 'ciehs_voz_v1';
  var activa = false;
  try { activa = localStorage.getItem(CLAVE) === '1'; } catch(e){ activa = false; }

  var vozElegida = null;
  var audioActual = null;

  /* ----------------------------------------------- elegir la mejor voz -----*/
  var NOMBRES_MUJER = /sabina|paulina|laura|helena|m[oó]nica|esperanza|lupe|marisol|luciana|camila|female|mujer|google espa/i;
  // Orden de preferencia de acento: primero lo latinoamericano.
  var PRIORIDAD_LANG = ['es-us','es-mx','es-419','es-pe','es-co','es-ar','es-cl','es-es','es'];

  function puntuar(v){
    var lang = (v.lang || '').toLowerCase().replace('_', '-');
    var idx = PRIORIDAD_LANG.findIndex(function(p){ return lang.indexOf(p) === 0; });
    if(idx === -1) return -1;                       // no es español: descartada
    var p = (PRIORIDAD_LANG.length - idx) * 10;
    if(NOMBRES_MUJER.test(v.name)) p += 25;         // voz de mujer: lo pedido
    // Las de red suelen sonar bastante mejor que las locales del sistema.
    if(!v.localService) p += 8;
    return p;
  }

  function elegirVoz(){
    if(!soporta) return null;
    var voces = speechSynthesis.getVoices() || [];
    var mejor = null, mejorP = -1;
    voces.forEach(function(v){
      var p = puntuar(v);
      if(p > mejorP){ mejorP = p; mejor = v; }
    });
    vozElegida = mejorP > -1 ? mejor : null;
    return vozElegida;
  }

  if(soporta){
    elegirVoz();
    // En Chrome la lista llega vacía y se rellena después: sin esto, la primera
    // locución usaría la voz por defecto del sistema, casi siempre en inglés.
    speechSynthesis.addEventListener('voiceschanged', elegirVoz);
  }

  /* ------------------------------------------------------------- hablar ----*/
  // Se parte por frases SIN lookbehind. No es purismo: `(?<=...)` es un error
  // de SINTAXIS en Safari anterior a la 16.4, y un error de sintaxis no rompe
  // solo la voz — impide que se evalúe este archivo entero y tumba el portal
  // completo en los iPad viejos de un colegio.
  function frasear(texto){
    var limpio = String(texto || '').replace(/\s+/g, ' ').trim();
    if(!limpio) return [];
    var frases = [], actual = '';
    for(var i = 0; i < limpio.length; i++){
      var c = limpio[i];
      actual += c;
      if('.!?…'.indexOf(c) > -1){
        // Se corta solo si lo siguiente es un espacio: así "6.5" o "MOD-DWC-01"
        // no se parten por la mitad.
        if(i + 1 >= limpio.length || limpio[i + 1] === ' '){
          frases.push(actual.trim());
          actual = '';
        }
      }
    }
    if(actual.trim()) frases.push(actual.trim());
    return frases;
  }

  function parar(){
    if(soporta){ try { speechSynthesis.cancel(); } catch(e){} }
    if(audioActual){ try { audioActual.pause(); } catch(e){} audioActual = null; }
  }

  function sintetizar(texto){
    if(!soporta) return;
    var frases = frasear(texto);
    if(!frases.length) return;
    if(!vozElegida) elegirVoz();

    frases.forEach(function(f, i){
      var u = new SpeechSynthesisUtterance(f);
      if(vozElegida){ u.voice = vozElegida; u.lang = vozElegida.lang; }
      else { u.lang = 'es-PE'; }
      // Algo más lenta y algo más aguda: es lo que separa "lectura de robot" de
      // "alguien explicando". Pasarse de tono la vuelve chillona.
      u.rate  = 0.95;
      u.pitch = 1.08;
      u.volume = 1;
      // Un respiro entre frases. La API no tiene pausas, así que se simula
      // retrasando cada frase con un silencio previo.
      if(i > 0) u.text = ' ' + u.text;
      speechSynthesis.speak(u);
    });
  }

  // Si hay pista pregrabada, manda esa. La clave es libre: la usa quien haya
  // subido el audio con ese nombre al bucket de aportes.
  function reproducirPista(clave){
    var D = window.CIEHSData;
    if(!clave || !D || typeof D.urlAporte !== 'function') return Promise.reject();
    return D.urlAporte('voz/' + clave + '.mp3', 600).then(function(url){
      return new Promise(function(res, rej){
        var a = new Audio(url);
        audioActual = a;
        a.onended = function(){ audioActual = null; res(); };
        a.onerror = rej;
        a.play().catch(rej);
      });
    });
  }

  function hablar(texto, opciones){
    opciones = opciones || {};
    // 'forzar' existe para los retos de escucha de la Arena: ahi el audio NO es
    // una ayuda, es el enunciado. Si se callara con la voz apagada, el reto
    // seria imposible de resolver.
    if(!activa && !opciones.forzar) return;
    parar();
    if(opciones.clave){
      reproducirPista(opciones.clave).catch(function(){ sintetizar(texto); });
    } else {
      sintetizar(texto);
    }
  }

  /* --------------------------------------------------- el interruptor ------*/
  function pintarBoton(btn){
    btn.setAttribute('aria-pressed', String(activa));
    btn.classList.toggle('is-on', activa);
    btn.querySelector('[data-voz-txt]').textContent = activa ? 'Voz activada' : 'Escuchar';
    btn.title = activa
      ? 'La voz está activada: se leerán en voz alta las preguntas y las explicaciones.'
      : 'Activa la voz para escuchar las preguntas y las explicaciones.';
  }

  function montarBoton(){
    var host = document.getElementById('vozControl');
    if(!host) return;
    if(!soporta){
      host.innerHTML = '<p class="voz-nosoporta">Este navegador no puede leer en voz alta. '
        + 'En Chrome o Edge sí funciona.</p>';
      return;
    }
    host.innerHTML =
      '<button type="button" class="voz-btn" id="vozBtn" aria-pressed="false">'
      + '<span class="voz-ico" aria-hidden="true">'
      +   '<svg viewBox="0 0 24 24" fill="none"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>'
      +   '<path class="onda1" d="M16.5 8.8a4.5 4.5 0 0 1 0 6.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
      +   '<path class="onda2" d="M19.2 6a8.2 8.2 0 0 1 0 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
      + '</span>'
      + '<span data-voz-txt>Escuchar</span>'
      + '</button>'
      + '<p class="voz-nota">Diseño Universal para el Aprendizaje: lo que hay que leer, también se puede escuchar.</p>';

    var btn = document.getElementById('vozBtn');
    pintarBoton(btn);
    btn.addEventListener('click', function(){
      activa = !activa;
      try { localStorage.setItem(CLAVE, activa ? '1' : '0'); } catch(e){}
      pintarBoton(btn);
      if(activa){
        // La primera locución tiene que salir del propio clic: los navegadores
        // bloquean el audio que no nace de un gesto de la persona.
        sintetizar('Voz activada. Te leeré las preguntas y las explicaciones.');
      } else {
        parar();
      }
    });
  }

  // Al cambiar de sección se corta lo que se estuviera leyendo: seguir narrando
  // una pregunta que ya no está en pantalla desorienta.
  window.addEventListener('hashchange', parar);
  document.addEventListener('visibilitychange', function(){ if(document.hidden) parar(); });

  window.CIEHS = window.CIEHS || {};
  window.CIEHS.voz = {
    hablar: hablar,
    parar: parar,
    activa: function(){ return activa; },
    soporta: soporta,
    vozActual: function(){ return vozElegida ? (vozElegida.name + ' · ' + vozElegida.lang) : null; }
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', montarBoton);
  } else {
    montarBoton();
  }
})();

/* ===========================================================================
   17. LABORATORIO VIRTUAL (PhET) y voz en el resto de los juegos

   Los simuladores se cargan BAJO DEMANDA por dos razones que apuntan al mismo
   sitio: pesan varios megas —y quien abre esto suele estar con datos móviles de
   un colegio— y, hasta que alguien pulsa, el portal no contacta con ningún
   servidor ajeno. La privacidad aquí no es un extra: la nota de privacidad del
   CIEHS enumera a los terceros uno por uno, y este es el segundo.
   =========================================================================== */
(function(){
  var zona = document.getElementById('phet');

  if(zona){
    // Se comprueba el idioma del navegador: PhET publica cada simulador por
    // idioma en una URL distinta, y en un aula peruana el español es lo
    // esperable, pero si alguien navega en ingles no hay razon para forzarle.
    var idioma = (navigator.language || 'es').toLowerCase().indexOf('en') === 0 ? 'en' : 'es';

    zona.querySelectorAll('[data-abrir]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var card  = btn.closest('.phet-card');
        var marco = card.querySelector('[data-marco]');
        var sim   = card.getAttribute('data-sim');
        var titulo = (card.querySelector('h4') || {}).textContent || 'Simulador';

        if(marco.querySelector('iframe')){          // ya abierto: se cierra
          marco.innerHTML = '';
          marco.classList.remove('is-abierto');
          btn.textContent = 'Abrir simulador';
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Cargando…';

        var f = document.createElement('iframe');
        f.src = 'https://phet.colorado.edu/sims/html/' + sim + '/latest/' + sim + '_' + idioma + '.html';
        f.title = titulo + ' — simulador de PhET, Universidad de Colorado';
        f.loading = 'lazy';
        f.allowFullscreen = true;
        // Sin permisos que no necesita. Un simulador no tiene por que pedir
        // camara, microfono ni geolocalizacion.
        f.setAttribute('allow', 'fullscreen');
        f.setAttribute('referrerpolicy', 'no-referrer');

        f.addEventListener('load', function(){
          btn.disabled = false;
          btn.textContent = 'Cerrar simulador';
          marco.classList.add('is-abierto');
        });
        // Si PhET no responde (aula sin salida a internet, filtro del colegio),
        // hay que decirlo: un marco en blanco parece un fallo del portal.
        var aviso = setTimeout(function(){
          if(!marco.classList.contains('is-abierto')){
            btn.disabled = false;
            btn.textContent = 'Reintentar';
            marco.innerHTML = '<p class="phet-fallo">No se pudo cargar el simulador. '
              + 'Puede que la red del colegio bloquee <span class="mono">phet.colorado.edu</span>, '
              + 'o que la conexión se haya caído.</p>';
          }
        }, 15000);
        f.addEventListener('load', function(){ clearTimeout(aviso); });

        marco.innerHTML = '';
        marco.appendChild(f);
      });
    });
  }

  /* ------------------------------------- voz en el resto de los juegos ----
     El quiz ya hablaba. Estos dos devolvian su resultado solo por escrito, que
     es justo la barrera que el DUA pide quitar. Se lee el resultado en cuanto
     aparece, sin boton aparte: aqui el resultado ES la respuesta a lo que la
     persona acaba de hacer, no un texto que este ahi de antes. */
  function leerResultado(nodo){
    if(!nodo || !window.CIEHS || !window.CIEHS.voz) return;
    var t = (nodo.textContent || '').replace(/\s+/g, ' ').trim();
    if(t) window.CIEHS.voz.hablar(t);
  }

  ['simResult', 'calcResult'].forEach(function(id){
    var nodo = document.getElementById(id);
    if(!nodo || !('MutationObserver' in window)) return;
    var previo = '';
    new MutationObserver(function(){
      var t = (nodo.textContent || '').trim();
      // Solo cuando el texto CAMBIA: el observador tambien se dispara al
      // repintar lo mismo, y repetir la locucion identica molesta.
      if(t && t !== previo){ previo = t; leerResultado(nodo); }
    }).observe(nodo, { childList:true, subtree:true, characterData:true });
  });
})();

/* ===========================================================================
   18. REGISTRO DEL SERVICE WORKER (PWA offline)

   Se registra al final y en un bloque propio para que, si algo falla aquí, no
   arrastre al resto del portal. Solo en https (o localhost), que es requisito
   del navegador. El SW hace que el portal abra sin red; ver sw.js.
   =========================================================================== */
(function(){
  if(!('serviceWorker' in navigator)) return;
  // Registro tras 'load' para no competir por ancho de banda con el primer
  // pintado: el SW es para la SEGUNDA visita, no urge en la primera.
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('/sw.js').catch(function(e){
      if(window.console && console.warn) console.warn('CIEHS: no se pudo registrar el service worker', e);
    });
  });
})();

/* ============================================================================
   Hero interactivo #inicio: foco del cursor que revela el modulo DWC, parallax
   de la rejilla, cabecera solida al bajar e indicador de scroll. Los estilos
   dinamicos se fijan por CSSOM (permitido por la CSP), nunca por atributos
   inline. Assets locales. Respeta prefers-reduced-motion.
   ========================================================================== */
(function(){
  'use strict';
  var doc = document;

  /* 1) Cabecera: fondo solido al bajar (is-scrolled). Sobre el hero de #inicio,
        el CSS la deja transparente con texto blanco cuando NO tiene esa clase. */
  var header = doc.querySelector('header.site');
  if(header){
    var aplicarScroll = function(){
      if(window.scrollY > 40) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    aplicarScroll();
    // Altura real de la cabecera -> el hero puede medir 100svh menos eso, para
    // llenar exactamente el viewport sin que su base caiga bajo el pliegue.
    var medirHeader = function(){
      doc.documentElement.style.setProperty('--hdr-h', header.offsetHeight + 'px');
    };
    medirHeader();
    window.addEventListener('scroll', aplicarScroll, { passive:true });
    window.addEventListener('resize', medirHeader);
    window.addEventListener('hashchange', function(){ setTimeout(function(){ aplicarScroll(); medirHeader(); }, 0); });
  }

  /* 2) Indicador de scroll: baja a las evidencias del laboratorio. */
  var hmScroll = doc.getElementById('hmScroll');
  if(hmScroll){
    hmScroll.addEventListener('click', function(){
      var destino = doc.getElementById('evidencias');
      if(destino) destino.scrollIntoView({ behavior:'smooth', block:'start' });
      else window.scrollTo({ top: window.innerHeight, behavior:'smooth' });
    });
  }

  /* 3) Foco del cursor + parallax de la rejilla. */
  var seccion = doc.getElementById('inicio');
  var lienzo  = doc.getElementById('hmMask');
  var reveal  = doc.getElementById('hmReveal');
  var rejilla = doc.getElementById('hmGrid');
  if(!(seccion && lienzo && reveal)) return;

  var ctx = lienzo.getContext('2d');
  if(!ctx) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var RADIO = 230;
  var LERP_FOCO = reduce ? 1 : 0.1;
  var LERP_REJILLA = 0.06;
  var DESPL = 16;

  var objetivo = { x:-9999, y:-9999 }, suave = { x:-9999, y:-9999 };
  var rejObjetivo = { x:0, y:0 }, rejSuave = { x:0, y:0 };
  var movido = false, ultX = -9999, ultY = -9999, raf = 0;

  function medir(){
    var r = seccion.getBoundingClientRect();
    if(r.width < 2 || r.height < 2) return null;   // seccion oculta (otra ruta)
    var w = Math.round(r.width), h = Math.round(r.height);
    if(lienzo.width !== w || lienzo.height !== h){ lienzo.width = w; lienzo.height = h; }
    return r;
  }

  function aplicarMascara(){
    var url = lienzo.toDataURL();
    reveal.style.setProperty('-webkit-mask-image', 'url(' + url + ')');
    reveal.style.setProperty('mask-image', 'url(' + url + ')');
  }

  function dibujar(vacia){
    var w = lienzo.width, h = lienzo.height;
    if(!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    if(!vacia && movido){
      var g = ctx.createRadialGradient(suave.x, suave.y, 0, suave.x, suave.y, RADIO);
      g.addColorStop(0,    'rgba(255,255,255,1)');
      g.addColorStop(0.40, 'rgba(255,255,255,1)');
      g.addColorStop(0.60, 'rgba(255,255,255,0.75)');
      g.addColorStop(0.75, 'rgba(255,255,255,0.4)');
      g.addColorStop(0.88, 'rgba(255,255,255,0.12)');
      g.addColorStop(1,    'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    aplicarMascara();
  }

  medir();
  dibujar(true);   // mascara vacia: la vitrina queda oculta hasta pasar el cursor

  function bucle(){
    suave.x += (objetivo.x - suave.x) * LERP_FOCO;
    suave.y += (objetivo.y - suave.y) * LERP_FOCO;
    if(rejilla && !reduce){
      rejSuave.x += (rejObjetivo.x - rejSuave.x) * LERP_REJILLA;
      rejSuave.y += (rejObjetivo.y - rejSuave.y) * LERP_REJILLA;
      rejilla.style.setProperty('transform',
        'translate3d(' + rejSuave.x.toFixed(2) + 'px,' + rejSuave.y.toFixed(2) + 'px,0)');
    }
    if(movido && (Math.abs(suave.x - ultX) > 0.3 || Math.abs(suave.y - ultY) > 0.3)){
      dibujar(false); ultX = suave.x; ultY = suave.y;
    }
    raf = requestAnimationFrame(bucle);
  }
  raf = requestAnimationFrame(bucle);

  seccion.addEventListener('mousemove', function(e){
    var r = medir();
    if(!r) return;
    var x = e.clientX - r.left, y = e.clientY - r.top;
    objetivo.x = x; objetivo.y = y;
    if(!movido){ movido = true; suave.x = x; suave.y = y; }
    var cx = r.width / 2, cy = r.height / 2;
    rejObjetivo.x = ((x - cx) / cx) * DESPL;
    rejObjetivo.y = ((y - cy) / cy) * DESPL;
  });

  seccion.addEventListener('mouseleave', function(){
    movido = false;
    rejObjetivo.x = 0; rejObjetivo.y = 0;
    dibujar(true);
  });

  window.addEventListener('resize', function(){ if(medir()) dibujar(!movido); });
})();
