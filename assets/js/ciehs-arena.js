/* ============================================================================
   CIEHS · ARENA — motor del juego

   Capa a pantalla completa, independiente del portal: al entrar se oculta la
   navegacion y el reto ocupa toda la ventana con su propia ambientacion.

   Cada tema monta un fondo animado en canvas. Se dibuja con requestAnimationFrame
   y se detiene por completo al salir o si el sistema pide reducir el movimiento.

   Contramedidas frente a resolver desde fuera:
     - Temporizador por reto, mas corto cuanto mayor es la dificultad.
     - Formatos que no se resuelven copiando texto: dial, ordenar, escucha.
     - En los retos de escucha el enunciado NO aparece escrito: se lee en voz
       alta con la sintesis del navegador.
     - Seleccion de texto y menu contextual desactivados dentro de la arena.
     - Salir de la pestaña congela el reto y lo marca como consultado.
   Ninguna de estas medidas es infalible: son friccion deliberada, no una
   barrera. Un examen calificado no deberia apoyarse solo en esto.
   ========================================================================== */
(function (global) {
  'use strict';

  var BANCO = global.CIEHS_ARENA;
  if (!BANCO) return;

  var CLAVE = 'ciehs_arena_v1';
  // Los tres primeros son los niveles de la institución y se juegan sin límite.
  // Los dos ultimos son EXPEDICIONES: la institucion educativa llega hasta
  // se plantean como un desafío excepcional, no como un curso más. Una tirada al
  // día, una sola vida y puntuación doble.
  var NIVELES = [
    { id:'inicial',    nombre:'Inicial',    desc:'Explora, escucha y descubre',        icono:'brote' },
    { id:'primaria',   nombre:'Primaria',   desc:'Observación y primeras medidas',     icono:'lente' },
    { id:'secundaria', nombre:'Secundaria', desc:'Variables y parámetros del cultivo', icono:'matraz' },
    { id:'preuniversitario', nombre:'Expedición Preuniversitaria',
      desc:'Cálculo, proporciones y diseño experimental', icono:'umbral', expedicion:true,
      requiere:{ nivel:'secundaria', retos:12 },
      lema:'Más allá del aula' },
    { id:'universitario', nombre:'Expedición Universitaria',
      desc:'Análisis, estadística y fisiología vegetal', icono:'corona', expedicion:true,
      requiere:{ nivel:'preuniversitario', retos:10 },
      lema:'El último umbral' }
  ];
  // Marcas vectoriales en lugar de emoji. El emoji cambia de dibujo en cada
  // sistema operativo y en las expediciones desentonaba por completo.
  var ICONOS = {
    brote:  '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">'
          + '<path d="M20 34V16"/><path d="M20 22c-6 0-9-4-9-9 5-1 9 3 9 9Z" fill="currentColor" fill-opacity=".18"/>'
          + '<path d="M20 19c6-1 9-5 8-10-5 0-9 4-8 10Z" fill="currentColor" fill-opacity=".28"/></svg>',
    lente:  '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">'
          + '<circle cx="17" cy="17" r="10"/><path d="M25 25l9 9"/>'
          + '<path d="M13 17a4 4 0 0 1 4-4" opacity=".55"/></svg>',
    matraz: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">'
          + '<path d="M16 5v11L7 31a3 3 0 0 0 2.6 4.5h20.8A3 3 0 0 0 33 31l-9-15V5"/>'
          + '<path d="M13 5h14"/><path d="M11.5 25h17" opacity=".6"/>'
          + '<circle cx="17" cy="29" r="1.6" fill="currentColor" stroke="none"/>'
          + '<circle cx="23" cy="31" r="1.1" fill="currentColor" stroke="none"/></svg>',
    umbral: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">'
          + '<path d="M20 3 34 11v18L20 37 6 29V11Z"/>'
          + '<path d="M20 10 28 14.6v9.8L20 29l-8-4.6v-9.8Z" opacity=".55"/>'
          + '<circle cx="20" cy="20" r="2.6" fill="currentColor" stroke="none"/></svg>',
    corona: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">'
          + '<path d="M6 28 8 12l7 6 5-9 5 9 7-6 2 16Z" fill="currentColor" fill-opacity=".14"/>'
          + '<path d="M6 32h28" opacity=".7"/>'
          + '<circle cx="20" cy="22" r="1.8" fill="currentColor" stroke="none"/></svg>',
    sello:  '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4">'
          + '<circle cx="20" cy="20" r="14" stroke-dasharray="3 4" opacity=".7"/>'
          + '<circle cx="20" cy="20" r="9"/>'
          + '<path d="m20 14 1.9 4.1 4.1.5-3 2.9.8 4.5L20 24l-3.8 2 .8-4.5-3-2.9 4.1-.5Z" fill="currentColor" stroke="none"/></svg>'
  };
  function icono(id){ return ICONOS[id] || ''; }

  var TIEMPO_EXTRA_NIVEL = { inicial: 1.7 };   // los más pequeños necesitan margen
  var VIDAS_EXPEDICION = 1;
  var RETOS_EXPEDICION = 10;
  var MULTIPLICADOR_EXPEDICION = 2;
  var TEMAS = {
    umbral:      { nombre:'El umbral',               acento:'#c084fc' },
    santuario:   { nombre:'Santuario de datos',      acento:'#f0c876' },
    pociones:    { nombre:'Laboratorio de alquimia', acento:'#a855f7' },
    abismo:      { nombre:'Abismo hídrico',          acento:'#38bdf8' },
    invernadero: { nombre:'Invernadero',             acento:'#34d399' },
    tormenta:    { nombre:'Frente climático',        acento:'#f0c876' },
    datos:       { nombre:'Sala de análisis',        acento:'#7dd3fc' },
    taller:      { nombre:'Taller de módulos',       acento:'#fb923c' }
  };
  var TIEMPOS   = { 1: 30, 2: 22, 3: 16 };   // segundos segun dificultad
  var EXTRA_ESCUCHA = 8;                     // el audio consume tiempo
  var RETOS_POR_PARTIDA = 8;
  var VIDAS = 3;

  var reduceMotion = global.matchMedia
    && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------ estado ------------------------------ */

  var progreso = { mejores:{}, resueltos:{}, tiradas:{}, sellos:{} };
  try {
    var g = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    if (g && g.mejores && g.resueltos) {
      // El contenido de localStorage lo controla quien usa el navegador, y los
      // records acaban insertados en HTML. Se normalizan los tipos al cargar:
      // un numero no puede llevar marcado dentro. Es auto-XSS de bajo riesgo,
      // pero sanear en la frontera cuesta cuatro lineas.
      progreso = { mejores:{}, resueltos:{}, tiradas:{}, sellos:{} };
      Object.keys(g.mejores || {}).forEach(function(k){
        var v = Number(g.mejores[k]);
        if (isFinite(v) && v >= 0) progreso.mejores[k] = Math.floor(v);
      });
      Object.keys(g.resueltos || {}).forEach(function(k){ progreso.resueltos[k] = true; });
      Object.keys(g.tiradas || {}).forEach(function(k){ progreso.tiradas[k] = String(g.tiradas[k]).slice(0, 12); });
      Object.keys(g.sellos  || {}).forEach(function(k){ progreso.sellos[k]  = String(g.sellos[k]).slice(0, 12); });
    }
  } catch (e) {}

  function hoy(){
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
  }
  function defNivel(id){
    for(var i=0;i<NIVELES.length;i++) if(NIVELES[i].id === id) return NIVELES[i];
    return null;
  }
  function resueltosDe(nivel){
    var banco = BANCO[nivel] || [];
    var n = 0;
    banco.forEach(function(r){ if(progreso.resueltos[r.id]) n++; });
    return n;
  }
  // Devuelve null si se puede jugar; si no, el motivo del bloqueo.
  function bloqueo(def){
    if(!def.expedicion) return null;
    var req = def.requiere;
    if(req && resueltosDe(req.nivel) < req.retos){
      var falta = req.retos - resueltosDe(req.nivel);
      return { tipo:'requisito', texto:'Resuelve ' + falta + ' reto' + (falta===1?'':'s')
        + ' más de ' + defNivel(req.nivel).nombre + ' para abrir esta expedición.' };
    }
    if(progreso.tiradas[def.id] === hoy()){
      return { tipo:'diario', texto:'Ya emprendiste esta expedición hoy. Vuelve mañana.' };
    }
    return null;
  }
  function msHastaManana(){
    var m = new Date(); m.setHours(24,0,0,0);
    return m - new Date();
  }
  function formatoEspera(ms){
    var h = Math.floor(ms/3600000), m = Math.floor(ms%3600000/60000);
    return h > 0 ? (h + ' h ' + m + ' min') : (m + ' min');
  }
  function guardar(){ try{ localStorage.setItem(CLAVE, JSON.stringify(progreso)); }catch(e){} }

  var partida = null;
  var raiz, capa, fondo, ctx, animId = null, temporizador = null;

  /* --------------------------- utilidades ----------------------------- */

  function esc(t){
    return String(t == null ? '' : t)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function barajar(a){
    a = a.slice();
    for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  }
  function normalizar(t){
    return String(t||'').toLowerCase().trim()
      .normalize('NFD').replace(/[̀-ͯ]/g,'')
      .replace(/[^a-z0-9 /]/g,'').replace(/\s+/g,' ');
  }
  function tiempoDe(reto, nivel){
    var base = (TIEMPOS[reto.dif] || 22) + (reto.tipo === 'escucha' ? EXTRA_ESCUCHA : 0);
    return Math.round(base * (TIEMPO_EXTRA_NIVEL[nivel] || 1));
  }

  /* =========================== AMBIENTACIONES ===========================
     Fondos generativos en canvas. Cada tema tiene su propio comportamiento;
     todos comparten el mismo bucle y se detienen al salir del reto.        */

  // roundRect es reciente. Sin este respaldo, en un navegador algo antiguo el
  // tema de pociones lanzaria y el reto se quedaria sin fondo.
  if(!CanvasRenderingContext2D.prototype.roundRect){
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r){
      var rad = Array.isArray(r) ? Math.max.apply(null, r) : (r || 0);
      rad = Math.min(rad, w/2, h/2);
      this.beginPath();
      this.moveTo(x + rad, y);
      this.arcTo(x + w, y, x + w, y + h, rad);
      this.arcTo(x + w, y + h, x, y + h, rad);
      this.arcTo(x, y + h, x, y, rad);
      this.arcTo(x, y, x + w, y, rad);
      this.closePath();
      return this;
    };
  }

  var pintores = {

    // Viales burbujeantes y volutas de vapor sobre una mesa de alquimia.
    pociones: function(w, h, t){
      var viales = 5;
      for(var i=0;i<viales;i++){
        var x = w*(0.12 + i*0.19);
        var alto = h*0.20 + Math.sin(t/900 + i)*8;
        var y = h*0.82;
        var tono = ['#a855f7','#34d399','#38bdf8','#f0c876','#fb7185'][i];
        ctx.globalAlpha = 0.34;
        ctx.fillStyle = tono;
        ctx.beginPath();
        ctx.roundRect(x-26, y-alto, 52, alto, [6,6,20,20]);
        ctx.fill();
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = tono; ctx.lineWidth = 2; ctx.stroke();
        // burbujas que suben dentro del vial
        for(var b=0;b<5;b++){
          var fase = (t/1000 + b*0.37 + i*0.6) % 1;
          var by = y - fase*alto;
          var br = 2 + Math.sin(fase*Math.PI)*3;
          ctx.globalAlpha = 0.85*(1-fase);
          ctx.beginPath(); ctx.arc(x + Math.sin(fase*7+b)*12, by, br, 0, 6.283); ctx.fill();
        }
        // vapor
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        ctx.arc(x, y-alto-24 - Math.sin(t/700+i)*10, 20+Math.sin(t/500+i)*6, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    // Columna de burbujas ascendentes y ondas, como dentro del depósito.
    abismo: function(w, h, t){
      ctx.fillStyle = '#38bdf8';
      for(var i=0;i<46;i++){
        var s = (i*137.5) % w;
        var fase = ((t/2600) + i*0.081) % 1;
        var y = h - fase*(h+60);
        var r = 1.5 + (i%5);
        ctx.globalAlpha = 0.48*(1-fase*0.7);
        ctx.beginPath();
        ctx.arc(s + Math.sin(fase*8 + i)*16, y, r, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 0.26; ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 1.4;
      for(var o=0;o<4;o++){
        ctx.beginPath();
        for(var x=0;x<=w;x+=12){
          var y2 = h*(0.24+o*0.19) + Math.sin(x/130 + t/1100 + o)*13;
          x ? ctx.lineTo(x,y2) : ctx.moveTo(x,y2);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },

    // Hojas cayendo y raíces que laten desde el borde inferior.
    invernadero: function(w, h, t){
      for(var i=0;i<26;i++){
        var fase = ((t/9000) + i*0.0385) % 1;
        var x = ((i*211) % w) + Math.sin(fase*6 + i)*40;
        var y = fase*(h+80) - 40;
        var g = Math.sin(t/800 + i)*0.5;
        ctx.save(); ctx.translate(x,y); ctx.rotate(g);
        ctx.globalAlpha = 0.42; ctx.fillStyle = i%3 ? '#34d399' : '#6ee7b7';
        ctx.beginPath();
        ctx.ellipse(0,0,11,5,0,0,6.283);
        ctx.fill(); ctx.restore();
      }
      ctx.globalAlpha = 0.30; ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
      for(var r=0;r<9;r++){
        var bx = w*(r+0.5)/9;
        ctx.beginPath(); ctx.moveTo(bx,h);
        for(var yy=h; yy>h*0.55; yy-=14){
          ctx.lineTo(bx + Math.sin((h-yy)/34 + t/1400 + r)*17, yy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },

    // Nubes en movimiento, lluvia oblicua y algún relámpago.
    tormenta: function(w, h, t){
      ctx.globalAlpha = 0.16; ctx.fillStyle = '#f0c876';
      for(var c=0;c<5;c++){
        var cx = ((t/60 + c*380) % (w+320)) - 160;
        var cy = h*(0.12 + c*0.07);
        ctx.beginPath();
        ctx.arc(cx,cy,46,0,6.283); ctx.arc(cx+42,cy+8,34,0,6.283); ctx.arc(cx-40,cy+10,30,0,6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 0.36; ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 1.4;
      for(var i=0;i<70;i++){
        var fase = ((t/900) + i*0.0143) % 1;
        var x = (i*167) % w;
        var y = fase*(h+70) - 35;
        ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-7,y+16); ctx.stroke();
      }
      var rayo = Math.sin(t/1700);
      if(rayo > 0.985){
        ctx.globalAlpha = (rayo-0.985)*24;
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h);
      }
      ctx.globalAlpha = 1;
    },

    // Rejilla de datos con barras que respiran y puntos que recorren ejes.
    datos: function(w, h, t){
      ctx.globalAlpha = 0.18; ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 1;
      for(var x=0;x<w;x+=54){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
      for(var y=0;y<h;y+=54){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
      ctx.globalAlpha = 0.40; ctx.fillStyle = '#0ea5e9';
      for(var b=0;b<16;b++){
        var bh = (h*0.30) * (0.35 + 0.65*Math.abs(Math.sin(t/1300 + b*0.6)));
        ctx.fillRect(w*(b+0.5)/16 - 13, h-bh, 26, bh);
      }
      ctx.globalAlpha = 0.5; ctx.fillStyle = '#7dd3fc';
      for(var p=0;p<8;p++){
        var f = ((t/3400) + p*0.125) % 1;
        ctx.beginPath();
        ctx.arc(f*w, h*0.35 + Math.sin(f*7+p)*40, 3, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    /* -------- ambientaciones exclusivas de expedición --------
       Más sobrias y más lentas que las de los niveles básicos: aquí manda
       la luz volumétrica, no el confeti. */

    // Rayos de luz atravesando una cámara en penumbra, con polvo suspendido.
    umbral: function(w, h, t){
      var cx = w*0.5, cy = h*0.34;
      // haces volumétricos que barren muy despacio
      for(var i=0;i<7;i++){
        var ang = -Math.PI/2 + (i-3)*0.30 + Math.sin(t/5200 + i)*0.07;
        var largo = Math.max(w,h)*1.5;
        var ancho = 46 + Math.sin(t/2300 + i*1.7)*22;
        var g = ctx.createLinearGradient(cx, cy, cx+Math.cos(ang)*largo, cy+Math.sin(ang)*largo);
        g.addColorStop(0, 'rgba(192,132,252,0.30)');
        g.addColorStop(0.45, 'rgba(192,132,252,0.09)');
        g.addColorStop(1, 'rgba(192,132,252,0)');
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang + Math.PI/2);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-ancho*0.16, 0); ctx.lineTo(ancho*0.16, 0);
        ctx.lineTo(ancho, largo); ctx.lineTo(-ancho, largo);
        ctx.closePath(); ctx.fill(); ctx.restore();
      }
      // polvo en suspensión, muy lento
      for(var p=0;p<80;p++){
        var f = ((t/16000) + p*0.0125) % 1;
        var px = ((p*173) % w) + Math.sin(t/3000 + p)*26;
        var py = h - f*(h+120);
        ctx.globalAlpha = 0.30 * Math.sin(f*Math.PI);
        ctx.fillStyle = '#e9d5ff';
        ctx.beginPath(); ctx.arc(px, py, 0.9 + (p%3)*0.7, 0, 6.283); ctx.fill();
      }
      // anillo del portal, latiendo
      var r0 = Math.min(w,h)*0.19 + Math.sin(t/1500)*7;
      ctx.globalAlpha = 0.5; ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(cx, cy, r0, 0, 6.283); ctx.stroke();
      ctx.globalAlpha = 0.22;
      ctx.beginPath(); ctx.arc(cx, cy, r0*1.35 + Math.sin(t/1900)*10, 0, 6.283); ctx.stroke();
      ctx.globalAlpha = 1;
    },

    // Constelación de nodos que se enlazan al pasar cerca, en tono ámbar.
    santuario: function(w, h, t){
      var n = 34, nodos = [];
      for(var i=0;i<n;i++){
        var a = (i*2.399) + t/9000;
        var rad = (Math.min(w,h)*0.12) + ((i*97)%Math.min(w,h))*0.42;
        nodos.push({
          x: w*0.5 + Math.cos(a)*rad*0.9,
          y: h*0.5 + Math.sin(a)*rad*0.55
        });
      }
      ctx.lineWidth = 1;
      for(var i2=0;i2<n;i2++){
        for(var j=i2+1;j<n;j++){
          var dx = nodos[i2].x-nodos[j].x, dy = nodos[i2].y-nodos[j].y;
          var d = Math.sqrt(dx*dx+dy*dy);
          if(d < 165){
            ctx.globalAlpha = 0.24*(1 - d/165);
            ctx.strokeStyle = '#f0c876';
            ctx.beginPath(); ctx.moveTo(nodos[i2].x,nodos[i2].y); ctx.lineTo(nodos[j].x,nodos[j].y); ctx.stroke();
          }
        }
      }
      for(var k=0;k<n;k++){
        var brillo = 0.4 + 0.6*Math.abs(Math.sin(t/1400 + k));
        ctx.globalAlpha = 0.65*brillo;
        ctx.fillStyle = '#fde68a';
        ctx.beginPath(); ctx.arc(nodos[k].x, nodos[k].y, 1.6 + brillo*1.9, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    // Circuitos y pulsos recorriendo pistas, como los sensores del módulo.
    taller: function(w, h, t){
      ctx.globalAlpha = 0.26; ctx.strokeStyle = '#fb923c'; ctx.lineWidth = 2;
      var filas = 7;
      for(var i=0;i<filas;i++){
        var y = h*(i+0.5)/filas;
        ctx.beginPath(); ctx.moveTo(0,y);
        var x = 0;
        while(x < w){
          var salto = 60 + ((i*37 + x) % 90);
          x += salto;
          ctx.lineTo(Math.min(x,w), y);
          if(x < w){ y += (i % 2 ? 16 : -16); ctx.lineTo(Math.min(x,w), y); }
        }
        ctx.stroke();
        ctx.globalAlpha = 0.7; ctx.fillStyle = '#fdba74';
        var f = ((t/2400) + i*0.14) % 1;
        ctx.beginPath(); ctx.arc(f*w, h*(i+0.5)/filas, 3.5, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 0.26;
      }
      ctx.globalAlpha = 1;
    }
  };

  // El cambio de tema no corta en seco: el fondo se apaga, se sustituye el
  // pintor y vuelve a subir. Sin esto, pasar de las burbujas a la tormenta
  // era un salto brusco que rompía la inmersión.
  function cambiarFondo(tema){
    if(!fondo){ return; }
    if(reduceMotion){ iniciarFondo(tema); return; }
    fondo.style.transition = 'opacity .28s ease';
    fondo.style.opacity = '0';
    setTimeout(function(){
      iniciarFondo(tema);
      requestAnimationFrame(function(){ fondo.style.opacity = '1'; });
    }, 280);
  }

  function iniciarFondo(tema){
    detenerFondo();
    if(!fondo) return;
    var pintor = pintores[tema] || pintores.datos;
    var w, h;
    function medir(){
      w = fondo.clientWidth; h = fondo.clientHeight;
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      fondo.width = w * dpr; fondo.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    medir();
    fondo.__medir = medir;
    global.addEventListener('resize', medir);

    if(reduceMotion){                 // un solo fotograma, sin animar
      ctx.clearRect(0,0,w,h);
      pintor(w, h, 0);
      return;
    }
    var inicio = performance.now();
    (function bucle(ahora){
      ctx.clearRect(0,0,w,h);
      pintor(w, h, ahora - inicio);
      animId = requestAnimationFrame(bucle);
    })(inicio);
  }

  /* Chispas: partículas efímeras que salen del punto donde se acertó. Se
     dibujan en su propio canvas para no interferir con el bucle del fondo. */
  var chispas = [];
  var chispasCanvas = null, chispasCtx = null, chispasAnim = null;

  function prepararChispas(){
    if(chispasCanvas) return;
    chispasCanvas = document.createElement('canvas');
    chispasCanvas.className = 'ar-chispas';
    chispasCanvas.setAttribute('aria-hidden','true');
    raiz.insertBefore(chispasCanvas, capa);
    chispasCtx = chispasCanvas.getContext('2d');
  }

  function lanzarChispas(x, y, color){
    if(reduceMotion) return;
    prepararChispas();
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    chispasCanvas.width = raiz.clientWidth * dpr;
    chispasCanvas.height = raiz.clientHeight * dpr;
    chispasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for(var i=0;i<34;i++){
      var ang = (Math.PI * 2 * i / 34) + Math.random()*0.4;
      var vel = 2.4 + Math.random()*5.2;
      chispas.push({
        x:x, y:y,
        vx:Math.cos(ang)*vel, vy:Math.sin(ang)*vel - 1.6,
        vida:1, r:1.6 + Math.random()*3.2, color:color
      });
    }
    if(!chispasAnim) bucleChispas();
  }

  /* ---------------- explosión de fallo ----------------
     Onda de choque que se expande, esquirlas con rotación propia y un
     destello que se apaga. Comparte canvas y bucle con las chispas para no
     abrir un segundo requestAnimationFrame. */
  var ondas = [];

  function explotar(x, y){
    if(reduceMotion) return;
    prepararChispas();
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    chispasCanvas.width = raiz.clientWidth * dpr;
    chispasCanvas.height = raiz.clientHeight * dpr;
    chispasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ondas.push({ x:x, y:y, r:6, vida:1 });

    // Esquirlas: fragmentos alargados que giran mientras se alejan.
    for(var i=0;i<46;i++){
      var ang = Math.random() * 6.283;
      var vel = 3.5 + Math.random()*11;
      chispas.push({
        x:x, y:y,
        vx:Math.cos(ang)*vel, vy:Math.sin(ang)*vel,
        vida:1, decae:0.013 + Math.random()*0.012,
        r:1.4 + Math.random()*2.6,
        largo: 5 + Math.random()*16,
        giro: Math.random()*6.283,
        vgiro: (Math.random()-0.5)*0.34,
        color: i % 4 === 0 ? '#ffffff' : (i % 3 === 0 ? '#fca5a5' : '#fb7185'),
        esquirla: true
      });
    }
    if(!chispasAnim) bucleChispas();
  }

  function bucleChispas(){
    chispasAnim = requestAnimationFrame(bucleChispas);
    var w = chispasCanvas.width, h = chispasCanvas.height;
    chispasCtx.clearRect(0, 0, w, h);

    // ondas de choque: dos anillos que se expanden y adelgazan
    for(var o = ondas.length - 1; o >= 0; o--){
      var on = ondas[o];
      on.r += 16 + on.r * 0.055;      // se abre acelerando
      on.vida -= 0.026;
      if(on.vida <= 0){ ondas.splice(o,1); continue; }
      chispasCtx.globalAlpha = Math.max(0, on.vida * 0.85);
      chispasCtx.strokeStyle = '#fb7185';
      chispasCtx.lineWidth = Math.max(0.6, 9 * on.vida);
      chispasCtx.beginPath(); chispasCtx.arc(on.x, on.y, on.r, 0, 6.283); chispasCtx.stroke();
      chispasCtx.globalAlpha = Math.max(0, on.vida * 0.45);
      chispasCtx.strokeStyle = '#ffffff';
      chispasCtx.lineWidth = Math.max(0.4, 3 * on.vida);
      chispasCtx.beginPath(); chispasCtx.arc(on.x, on.y, on.r * 0.72, 0, 6.283); chispasCtx.stroke();
    }

    for(var i = chispas.length - 1; i >= 0; i--){
      var p = chispas[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.16;            // gravedad
      p.vx *= 0.985;
      p.vida -= (p.decae || 0.019);
      if(p.vida <= 0){ chispas.splice(i,1); continue; }
      chispasCtx.globalAlpha = Math.max(0, p.vida);
      if(p.esquirla){
        p.giro += p.vgiro;
        chispasCtx.save();
        chispasCtx.translate(p.x, p.y);
        chispasCtx.rotate(p.giro);
        chispasCtx.fillStyle = p.color;
        chispasCtx.fillRect(-p.largo*p.vida/2, -p.r/2, p.largo*p.vida, p.r);
        chispasCtx.restore();
      } else {
        chispasCtx.fillStyle = p.color;
        chispasCtx.beginPath();
        chispasCtx.arc(p.x, p.y, p.r * p.vida, 0, 6.283);
        chispasCtx.fill();
      }
    }
    chispasCtx.globalAlpha = 1;
    if(!chispas.length && !ondas.length){ cancelAnimationFrame(chispasAnim); chispasAnim = null; }
  }

  /* Contador que sube en lugar de saltar: la cifra final llega en ~600 ms. */
  function contarHasta(el, desde, hasta, ms){
    if(!el) return;
    if(reduceMotion){ el.textContent = hasta; return; }
    var t0 = performance.now();
    (function paso(ahora){
      var k = Math.min(1, (ahora - t0) / ms);
      var suave = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(desde + (hasta - desde) * suave);
      if(k < 1) requestAnimationFrame(paso);
    })(t0);
  }

  function detenerFondo(){
    if(animId){ cancelAnimationFrame(animId); animId = null; }
    if(fondo && fondo.__medir){ global.removeEventListener('resize', fondo.__medir); fondo.__medir = null; }
  }

  /* ============================ SONIDO ============================
     Tonos sintetizados: no hay archivos de audio que descargar.      */

  var audioCtx = null;
  function tono(frec, dur, tipo){
    try{
      if(!audioCtx) audioCtx = new (global.AudioContext || global.webkitAudioContext)();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = tipo || 'sine'; o.frequency.value = frec;
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.09, audioCtx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + dur + 0.02);
    }catch(e){}
  }
  var sonido = {
    acierto: function(){ tono(660,0.12); setTimeout(function(){ tono(880,0.16); },90); },
    fallo:   function(){ tono(200,0.22,'sawtooth'); },
    tic:     function(){ tono(1200,0.04,'square'); },
    fin:     function(){ tono(523,0.15); setTimeout(function(){ tono(659,0.15); },140); setTimeout(function(){ tono(784,0.3); },280); },
    // Golpe grave y corto: acompaña a la onda de choque.
    impacto: function(){ tono(70,0.42,'sawtooth'); setTimeout(function(){ tono(48,0.5,'triangle'); }, 40); },
    umbral:  function(){ tono(196,0.5,'sine'); setTimeout(function(){ tono(294,0.5); },180); setTimeout(function(){ tono(392,0.9); },360); }
  };

  /* ------------------------------ voz --------------------------------
     Dos problemas resueltos aquí:

     1. La voz enmudecía al salir y volver a entrar. La causa es conocida:
        speechSynthesis.cancel() puede dejar el motor en estado pausado, y
        además speak() inmediatamente después de cancel() se traga la frase.
        Se corrige llamando a resume() y dejando pasar un tick antes de hablar.

     2. Sonaba robótica. Ahora se busca explícitamente una voz femenina en
        español entre las del sistema, ordenadas por naturalidad conocida, y
        se ajustan tono y velocidad para una lectura más cálida.
     -------------------------------------------------------------------- */

  var vozElegida = null;

  // Nombres habituales de voces femeninas en español, de más a menos natural.
  var PREFERIDAS = [
    'google español', 'google español de estados unidos', 'microsoft sabina',
    'microsoft helena', 'microsoft laura', 'microsoft dalia', 'microsoft elvira',
    'mónica', 'monica', 'paulina', 'esperanza', 'marisol', 'lucía', 'lucia',
    'catalina', 'sabina', 'helena', 'laura'
  ];
  var MASCULINAS = ['jorge','diego','pablo','carlos','juan','miguel','raul','raúl','enrique','alvaro','álvaro'];

  function elegirVoz(){
    if(!global.speechSynthesis) return null;
    var voces = global.speechSynthesis.getVoices() || [];
    if(!voces.length) return null;
    var es = voces.filter(function(v){ return /^es/i.test(v.lang || ''); });
    if(!es.length) es = voces;

    // 1) coincidencia exacta con la lista de preferidas
    for(var i=0;i<PREFERIDAS.length;i++){
      for(var j=0;j<es.length;j++){
        if((es[j].name || '').toLowerCase().indexOf(PREFERIDAS[i]) > -1) return es[j];
      }
    }
    // 2) cualquiera que no suene a nombre masculino
    var neutra = es.filter(function(v){
      var n = (v.name || '').toLowerCase();
      return !MASCULINAS.some(function(m){ return n.indexOf(m) > -1; });
    });
    // 3) preferir es-MX o es-US, que suelen ser más suaves que es-ES
    var latina = neutra.filter(function(v){ return /es-(MX|US|419|PE|CO|AR)/i.test(v.lang || ''); });
    return latina[0] || neutra[0] || es[0];
  }

  function cargarVoces(){ vozElegida = elegirVoz(); }
  if(global.speechSynthesis){
    cargarVoces();
    global.speechSynthesis.onvoiceschanged = cargarVoces;
  }

  var vozTimer = null;
  function leerEnVoz(texto, opciones){
    // Se delega en la capa de voz del portal cuando esta cargada. Antes habia
    // DOS motores con ajustes distintos (tono 1.25 aqui, 1.08 en el quiz), asi
    // que la misma aplicacion sonaba a dos personas segun donde estuvieras.
    // El motor de abajo queda como respaldo por si el orden de carga cambia.
    var V = global.CIEHS && global.CIEHS.voz;
    if(V && typeof V.hablar === 'function'){
      V.hablar(texto, opciones || { forzar: true });
      return true;
    }
    var ss = global.speechSynthesis;
    if(!ss) return false;
    try{
      if(vozTimer){ clearTimeout(vozTimer); vozTimer = null; }
      ss.cancel();
      // El tick es imprescindible: hablar en el mismo turno que cancel() hace
      // que Chrome descarte la frase sin avisar.
      vozTimer = setTimeout(function(){
        try{
          ss.resume();                       // deshace un estado pausado previo
          if(!vozElegida) cargarVoces();
          var u = new SpeechSynthesisUtterance(texto);
          if(vozElegida){ u.voice = vozElegida; u.lang = vozElegida.lang; }
          else { u.lang = 'es-MX'; }
          u.rate = 0.9;      // algo más pausada: se entiende mejor
          u.pitch = 1.25;    // más aguda y cálida que el ajuste por defecto
          u.volume = 1;
          ss.speak(u);
        }catch(e){}
      }, 90);
      return true;
    }catch(e){ return false; }
  }
  function callarVoz(){
    if(vozTimer){ clearTimeout(vozTimer); vozTimer = null; }
    try{
      if(global.speechSynthesis){
        global.speechSynthesis.cancel();
        // resume() tras cancel() deja el motor listo para la próxima vez.
        global.speechSynthesis.resume();
      }
    }catch(e){}
  }

  /* ============================ PARTIDA ============================ */

  function nuevaPartida(nivel){
    var def = defNivel(nivel);
    var esExp = !!(def && def.expedicion);
    if(esExp){
      var b = bloqueo(def);
      if(b){ pintarMenu(); return; }                 // no se cuela por la puerta de atrás
      progreso.tiradas[nivel] = hoy();               // la tirada del día se consume al entrar
      guardar();
    }
    var banco = BANCO[nivel] || [];
    var cuantos = esExp ? RETOS_EXPEDICION : RETOS_POR_PARTIDA;
    partida = {
      nivel: nivel, def: def, expedicion: esExp,
      retos: barajar(banco).slice(0, Math.min(cuantos, banco.length)),
      i: 0, puntos: 0, racha: 0, mejorRacha: 0,
      vidas: esExp ? VIDAS_EXPEDICION : VIDAS,
      vidasMax: esExp ? VIDAS_EXPEDICION : VIDAS,
      aciertos: 0, consultas: 0
    };
    raiz.classList.toggle('ar-modo-exped', esExp);
    if(esExp) pintarPortalExpedicion(def);
    else pintarReto();
  }

  // Antesala de la expedición: una pantalla que deja claro que esto no es
  // una partida más antes de gastar la única tirada del día.
  function pintarPortalExpedicion(def){
    detenerFondo();
    var tema = def.id === 'universitario' ? 'santuario' : 'umbral';
    raiz.setAttribute('data-tema', tema);
    raiz.style.setProperty('--ar-acento', TEMAS[tema].acento);
    iniciarFondo(tema);
    sonido.umbral();
    capa.innerHTML =
      '<div class="ar-portal">'
      + '<div class="ar-portal-sello">' + icono(def.icono) + '</div>'
      + '<p class="ar-eyebrow">' + esc(def.lema) + '</p>'
      + '<h1>' + esc(def.nombre) + '</h1>'
      + '<p class="ar-menu-lede">' + esc(def.desc) + '</p>'
      + '<ul class="ar-reglas">'
      +   '<li><b>' + RETOS_EXPEDICION + '</b> retos seguidos</li>'
      +   '<li><b>1</b> sola vida</li>'
      +   '<li><b>×' + MULTIPLICADOR_EXPEDICION + '</b> puntos</li>'
      +   '<li><b>1</b> intento al día</li>'
      + '</ul>'
      + '<p class="ar-portal-aviso">Un solo fallo termina la expedición. La tirada de hoy ya está consumida.</p>'
      + '<button type="button" class="ar-btn ar-btn-primario ar-portal-btn" id="arEmpezar">Cruzar el umbral</button>'
      + '</div>';
    var b = document.getElementById('arEmpezar');
    b.focus();
    b.addEventListener('click', function(){ pintarReto(); });
  }

  function terminarPartida(){
    detenerTemporizador(); detenerFondo();
    var n = partida.nivel;
    if(!progreso.mejores[n] || partida.puntos > progreso.mejores[n]) progreso.mejores[n] = partida.puntos;
    guardar();
    sonido.fin();

    var total = partida.retos.length;
    var completa = partida.aciertos === total;
    if(partida.expedicion && completa){
      progreso.sellos[n] = hoy();
      guardar();
    }
    capa.innerHTML =
      '<div class="ar-fin">'
      + (partida.expedicion && completa ? '<div class="ar-portal-sello ar-sello-gana">' + icono(partida.def.icono) + '</div>' : '')
      + '<p class="ar-eyebrow">' + (partida.expedicion ? (completa ? 'Expedición superada' : 'Expedición fallida') : 'Partida terminada') + '</p>'
      + '<h2>' + partida.aciertos + ' de ' + total + '</h2>'
      + '<div class="ar-fin-datos">'
      +   '<div><b>' + partida.puntos + '</b><span>puntos</span></div>'
      +   '<div><b>' + partida.mejorRacha + '</b><span>mejor racha</span></div>'
      +   '<div><b>' + progreso.mejores[n] + '</b><span>récord del nivel</span></div>'
      + '</div>'
      + (partida.consultas ? '<p class="ar-aviso">Saliste de la pantalla ' + partida.consultas
          + (partida.consultas === 1 ? ' vez' : ' veces') + ' durante un reto. Esos retos quedaron marcados como consultados.</p>' : '')
      + '<div class="ar-fin-acciones">'
      +   '<button type="button" class="ar-btn ar-btn-primario" data-accion="revancha">Otra partida</button>'
      +   '<button type="button" class="ar-btn" data-accion="menu">Cambiar de nivel</button>'
      +   '<button type="button" class="ar-btn" data-accion="salir">Salir de la Arena</button>'
      + '</div></div>';

    // Las cifras del resumen suben desde cero: el resultado se lee mejor
    // cuando llega, en lugar de aparecer ya puesto.
    var cifras = capa.querySelectorAll('.ar-fin-datos b');
    var finales = [partida.puntos, partida.mejorRacha, progreso.mejores[n]];
    cifras.forEach(function(el, i){
      el.textContent = '0';
      setTimeout(function(){ contarHasta(el, 0, finales[i], 900); }, 180 + i*140);
    });
  }

  function pintarReto(){
    detenerTemporizador();
    if(partida.i >= partida.retos.length || partida.vidas <= 0){ terminarPartida(); return; }

    // El reto saliente se desliza antes de montar el siguiente.
    var previo = capa.querySelector('.ar-reto');
    if(previo && !reduceMotion){
      previo.classList.add('ar-sale');
      var t = previo;
      setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 240);
    }

    var r = partida.retos[partida.i];
    var tema = TEMAS[r.tema] || TEMAS.datos;
    raiz.style.setProperty('--ar-acento', tema.acento);
    raiz.setAttribute('data-tema', r.tema);
    cambiarFondo(r.tema);

    var segundos = tiempoDe(r, partida.nivel);
    var esEscucha = r.tipo === 'escucha';

    var cabecera =
      '<header class="ar-top">'
      + '<div class="ar-top-izq">'
      +   '<button type="button" class="ar-salir" data-accion="menu" aria-label="Volver al menú">‹ Niveles</button>'
      +   '<span class="ar-tema">' + esc(tema.nombre) + '</span>'
      + '</div>'
      + '<div class="ar-top-der">'
      +   '<span class="ar-vidas" aria-label="Vidas restantes">' + repetir('◆', partida.vidas) + repetir('◇', partida.vidasMax - partida.vidas) + '</span>'
      +   '<span class="ar-puntos"><b>' + partida.puntos + '</b> pts</span>'
      + '</div></header>'
      + '<div class="ar-progreso"><span></span></div>';

    var meta =
      '<div class="ar-meta">'
      + '<span class="ar-num">Reto ' + (partida.i+1) + ' / ' + partida.retos.length + '</span>'
      + '<span class="ar-dif ar-dif-' + r.dif + '">' + ['','Fácil','Media','Difícil'][r.dif] + '</span>'
      + (partida.racha > 1 ? '<span class="ar-racha">Racha ×' + partida.racha + '</span>' : '')
      + '</div>';

    var enunciado = esEscucha
      ? '<div class="ar-escucha"><button type="button" class="ar-btn ar-repetir" id="arRepetir"><svg class="ar-mini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6"/><path d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8"/></svg> Repetir enunciado</button>'
        + '<p class="ar-escucha-nota">Este reto se escucha: el enunciado no aparece escrito.</p></div>'
      : '<h2 class="ar-pregunta">' + esc(r.q) + '</h2>';

    capa.innerHTML =
      cabecera
      + '<div class="ar-reto">'
      +   meta
      +   '<div class="ar-crono"><span class="ar-crono-barra" id="arCronoBarra"></span>'
      +     '<span class="ar-crono-num" id="arCronoNum">' + segundos + '</span></div>'
      +   enunciado
      +   '<div class="ar-cuerpo" id="arCuerpo"></div>'
      +   '<p class="ar-feedback" id="arFeedback" hidden></p>'
      + '</div>';

    var barraProg = capa.querySelector('.ar-progreso span');
    if(barraProg) barraProg.style.width = (partida.i / partida.retos.length * 100) + '%';

    montarCuerpo(r);
    // Entrada escalonada: las opciones aparecen una tras otra, no de golpe.
    capa.querySelectorAll('.ar-op, .ar-orden-item').forEach(function(el, i){
      el.style.setProperty('--i', i);
    });
    arrancarTemporizador(segundos, r);

    if(esEscucha){
      // Aqui el audio ES el enunciado: suena tenga o no la voz activada.
      leerEnVoz(r.q, { forzar: true });
      var rep = document.getElementById('arRepetir');
      if(rep) rep.addEventListener('click', function(){ leerEnVoz(r.q, { forzar: true }); });
    } else {
      // El resto de retos tambien se leen, con sus opciones numeradas, pero
      // solo si el estudiante ha pedido la voz.
      var partes = [r.q];
      capa.querySelectorAll('.ar-op').forEach(function(o, i){
        partes.push('Opción ' + (i + 1) + ': ' + o.textContent.trim() + '.');
      });
      leerEnVoz(partes.join(' '), { forzar: false });
    }
  }

  function repetir(c, n){ return new Array(Math.max(0,n)+1).join(c); }

  /* ------------------------- formatos de reto ------------------------- */

  function montarCuerpo(r){
    var cuerpo = document.getElementById('arCuerpo');

    if(r.tipo === 'opcion' || r.tipo === 'escucha'){
      cuerpo.innerHTML = '<div class="ar-ops">' + barajar(r.ops).map(function(o){
        return '<button type="button" class="ar-op" data-ok="' + (o[1]?'1':'0') + '">' + esc(o[0]) + '</button>';
      }).join('') + '</div>';
      cuerpo.querySelectorAll('.ar-op').forEach(function(b){
        b.addEventListener('click', function(){
          resolver(r, b.getAttribute('data-ok') === '1', b);
        });
      });

    } else if(r.tipo === 'vf'){
      cuerpo.innerHTML =
        '<div class="ar-vf">'
        + '<button type="button" class="ar-op ar-vf-si" data-ok="' + (r.correcta?'1':'0') + '">Verdadero</button>'
        + '<button type="button" class="ar-op ar-vf-no" data-ok="' + (r.correcta?'0':'1') + '">Falso</button>'
        + '</div>';
      cuerpo.querySelectorAll('.ar-op').forEach(function(b){
        b.addEventListener('click', function(){ resolver(r, b.getAttribute('data-ok') === '1', b); });
      });

    } else if(r.tipo === 'dial'){
      cuerpo.innerHTML =
        '<div class="ar-dial">'
        + '<output class="ar-dial-val" id="arDialVal">' + r.inicio.toFixed(r.paso < 1 ? 2 : 0) + ' <small>' + esc(r.unidad) + '</small></output>'
        + '<input type="range" id="arDial" min="' + r.min + '" max="' + r.max + '" step="' + r.paso + '" value="' + r.inicio + '">'
        + '<div class="ar-dial-ejes"><span>' + r.min + '</span><span>' + r.max + '</span></div>'
        + '<button type="button" class="ar-btn ar-btn-primario" id="arDialOk">Confirmar valor</button>'
        + '</div>';
      var dial = document.getElementById('arDial'), val = document.getElementById('arDialVal');
      dial.addEventListener('input', function(){
        val.innerHTML = Number(dial.value).toFixed(r.paso < 1 ? 2 : 0) + ' <small>' + esc(r.unidad) + '</small>';
      });
      document.getElementById('arDialOk').addEventListener('click', function(){
        var d = Math.abs(Number(dial.value) - r.objetivo);
        resolver(r, d <= (r.tolerancia || 0) + 1e-9, null,
                 'Tu valor: ' + Number(dial.value).toFixed(r.paso<1?2:0) + ' ' + r.unidad);
      });

    } else if(r.tipo === 'orden'){
      var mezcla = barajar(r.pasos);
      // Se rebaraja si el azar devolvio el orden correcto.
      if(mezcla.join('|') === r.pasos.join('|')) mezcla = mezcla.reverse();
      cuerpo.innerHTML =
        '<ol class="ar-orden" id="arOrden">'
        + mezcla.map(function(p){
            return '<li class="ar-orden-item" draggable="true" data-txt="' + esc(p) + '">'
                 + '<span class="ar-asa" aria-hidden="true">⋮⋮</span>' + esc(p)
                 + '<span class="ar-flechas"><button type="button" data-mov="-1" aria-label="Subir">▲</button>'
                 + '<button type="button" data-mov="1" aria-label="Bajar">▼</button></span></li>';
          }).join('')
        + '</ol>'
        + '<button type="button" class="ar-btn ar-btn-primario" id="arOrdenOk">Confirmar orden</button>';
      var lista = document.getElementById('arOrden');
      // Flechas ademas de arrastrar: en movil arrastrar es poco fiable y con
      // teclado es directamente inaccesible.
      lista.querySelectorAll('[data-mov]').forEach(function(b){
        b.addEventListener('click', function(e){
          e.stopPropagation();
          var li = b.closest('li'), dir = Number(b.getAttribute('data-mov'));
          if(dir < 0 && li.previousElementSibling) lista.insertBefore(li, li.previousElementSibling);
          if(dir > 0 && li.nextElementSibling) lista.insertBefore(li.nextElementSibling, li);
        });
      });
      var arrastrado = null;
      lista.querySelectorAll('li').forEach(function(li){
        li.addEventListener('dragstart', function(){ arrastrado = li; li.classList.add('arrastrando'); });
        li.addEventListener('dragend', function(){ li.classList.remove('arrastrando'); arrastrado = null; });
        li.addEventListener('dragover', function(e){
          e.preventDefault();
          if(!arrastrado || arrastrado === li) return;
          var caja = li.getBoundingClientRect();
          var despues = (e.clientY - caja.top) > caja.height/2;
          lista.insertBefore(arrastrado, despues ? li.nextSibling : li);
        });
      });
      document.getElementById('arOrdenOk').addEventListener('click', function(){
        var actual = [].map.call(lista.querySelectorAll('li'), function(li){ return li.getAttribute('data-txt'); });
        resolver(r, actual.join('|') === r.pasos.map(esc).join('|'), null);
      });

    } else if(r.tipo === 'escribe'){
      cuerpo.innerHTML =
        '<div class="ar-escribe">'
        + '<input type="text" id="arTexto" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe tu respuesta">'
        + '<button type="button" class="ar-btn ar-btn-primario" id="arTextoOk">Responder</button>'
        + '</div>';
      var campo = document.getElementById('arTexto');
      campo.focus();
      function comprobar(){
        var v = normalizar(campo.value);
        var ok = (r.respuestas || []).some(function(a){ return normalizar(a) === v; });
        resolver(r, ok, null, 'Escribiste: “' + esc(campo.value.trim() || '—') + '”');
      }
      document.getElementById('arTextoOk').addEventListener('click', comprobar);
      campo.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); comprobar(); } });
    }
  }

  /* --------------------------- temporizador --------------------------- */

  function arrancarTemporizador(segundos, reto){
    var barra = document.getElementById('arCronoBarra');
    var num = document.getElementById('arCronoNum');
    var total = segundos * 1000;
    var fin = performance.now() + total;
    var ultimoTic = segundos;

    temporizador = setInterval(function(){
      var queda = Math.max(0, fin - performance.now());
      var pct = queda / total;
      if(barra) barra.style.width = (pct*100).toFixed(1) + '%';
      tension(pct);
      var s = Math.ceil(queda/1000);
      if(num && s !== ultimoTic){
        num.textContent = s;
        if(s <= 5 && s > 0){ num.classList.add('ar-urgente'); sonido.tic(); }
        ultimoTic = s;
      }
      if(queda <= 0){
        detenerTemporizador();
        resolver(reto, false, null, 'Se acabó el tiempo.');
      }
    }, 100);
  }
  function detenerTemporizador(){
    if(temporizador){ clearInterval(temporizador); temporizador = null; }
    tension(1);
  }

  /* ----------------------------- resolver ----------------------------- */

  function resolver(r, acertado, boton, nota){
    detenerTemporizador();
    callarVoz();

    var cuerpo = document.getElementById('arCuerpo');
    cuerpo.querySelectorAll('button, input').forEach(function(x){ x.disabled = true; });
    cuerpo.querySelectorAll('.ar-op').forEach(function(b){
      if(b.getAttribute('data-ok') === '1') b.classList.add('ar-ok');
      else if(b === boton) b.classList.add('ar-mal');
    });

    if(acertado){
      partida.aciertos++;
      partida.racha++;
      partida.mejorRacha = Math.max(partida.mejorRacha, partida.racha);
      // La dificultad y la racha multiplican; el tiempo restante da un extra.
      var barra = document.getElementById('arCronoBarra');
      var restante = barra ? parseFloat(barra.style.width) || 0 : 0;
      var base = r.dif * 100;
      var bonusTiempo = Math.round(restante);
      var bonusRacha = (partida.racha - 1) * 25;
      var mult = partida.expedicion ? MULTIPLICADOR_EXPEDICION : 1;
      partida.puntos += (base + bonusTiempo + bonusRacha) * mult;
      progreso.resueltos[r.id] = true;
      guardar();
      sonido.acierto();
    } else {
      partida.racha = 0;
      partida.vidas--;
      sonido.fallo();
    }

    // El marcador se refresca aqui y no al pintar el siguiente reto: ver subir
    // los puntos en el momento del acierto es la mitad de la recompensa.
    var elPuntos = document.querySelector('.ar-puntos b');
    if(elPuntos){
      var antes = parseInt(elPuntos.textContent, 10) || 0;
      contarHasta(elPuntos, antes, partida.puntos, 620);
      elPuntos.classList.remove('ar-sube');
      void elPuntos.offsetWidth;            // reinicia la animacion
      if(acertado) elPuntos.classList.add('ar-sube');
    }

    var panel = capa.querySelector('.ar-reto');
    if(acertado){
      // Las chispas salen del boton pulsado, o del centro del panel si el
      // reto no se resolvio con un boton (dial, escribir).
      var origen = boton || document.getElementById('arDialOk') ||
                   document.getElementById('arTextoOk') || document.getElementById('arOrdenOk');
      var caja = (origen || panel).getBoundingClientRect();
      var acento = getComputedStyle(raiz).getPropertyValue('--ar-acento').trim() || '#7dd3fc';
      lanzarChispas(caja.left + caja.width/2, caja.top + caja.height/2, acento);
      if(panel){ panel.classList.remove('ar-acierta'); void panel.offsetWidth; panel.classList.add('ar-acierta'); }
    } else if(panel){
      panel.classList.remove('ar-falla'); void panel.offsetWidth; panel.classList.add('ar-falla');
      var foco = boton || document.getElementById('arDialOk') ||
                 document.getElementById('arTextoOk') || document.getElementById('arOrdenOk') || panel;
      var cf = foco.getBoundingClientRect();
      explotar(cf.left + cf.width/2, cf.top + cf.height/2);
      // Sacudida de toda la escena y destello rojo: el fallo se siente.
      raiz.classList.remove('ar-impacto'); void raiz.offsetWidth; raiz.classList.add('ar-impacto');
      sonido.impacto();
    }
    var elVidas = document.querySelector('.ar-vidas');
    if(elVidas){
      elVidas.textContent = repetir('◆', partida.vidas) + repetir('◇', partida.vidasMax - partida.vidas);
      if(!acertado){ elVidas.classList.remove('ar-pierde'); void elVidas.offsetWidth; elVidas.classList.add('ar-pierde'); }
    }
    var elProg = document.querySelector('.ar-progreso span');
    if(elProg) elProg.style.width = ((partida.i + 1) / partida.retos.length * 100) + '%';
    var elRacha = document.querySelector('.ar-racha');
    if(acertado && partida.racha > 1 && !elRacha){
      var meta = document.querySelector('.ar-meta');
      if(meta){
        var s = document.createElement('span');
        s.className = 'ar-racha';
        s.textContent = 'Racha ×' + partida.racha;
        meta.appendChild(s);
      }
    } else if(elRacha){
      if(acertado && partida.racha > 1) elRacha.textContent = 'Racha ×' + partida.racha;
      else elRacha.remove();
    }

    var fb = document.getElementById('arFeedback');
    fb.hidden = false;
    fb.className = 'ar-feedback ' + (acertado ? 'ar-feedback-ok' : 'ar-feedback-mal');
    fb.innerHTML =
      '<b>' + (acertado ? '¡Correcto!' : 'Incorrecto') + '</b> '
      + (nota ? '<i>' + nota + '</i> ' : '')
      + esc(r.exp)
      + '<button type="button" class="ar-btn ar-btn-primario ar-siguiente" id="arSiguiente">'
      + (partida.vidas <= 0 ? 'Ver resultado' : (partida.i + 1 >= partida.retos.length ? 'Ver resultado' : 'Siguiente reto'))
      + '</button>';
    var sig = document.getElementById('arSiguiente');
    sig.focus();
    sig.addEventListener('click', function(){ partida.i++; pintarReto(); });
  }

  /* ---------------- relieve y luz ----------------
     El panel se inclina en el espacio siguiendo al cursor y una luz especular
     recorre su superficie. En las expediciones la inclinación es mayor: son
     las que deben sentirse como un objeto físico y no como una pantalla. */

  var punteroRaf = null, punteroUlt = null;

  function seguirPuntero(e){
    punteroUlt = e;
    if(punteroRaf) return;
    punteroRaf = requestAnimationFrame(function(){
      punteroRaf = null;
      var ev = punteroUlt;
      if(!ev) return;
      var objetivos = capa.querySelectorAll('.ar-reto, .ar-portal, .ar-nivel');
      objetivos.forEach(function(el){
        var c = el.getBoundingClientRect();
        var px = (ev.clientX - c.left) / c.width;
        var py = (ev.clientY - c.top) / c.height;
        // La luz se sitúa siempre; la inclinación solo si el cursor está encima.
        el.style.setProperty('--mx', (px*100).toFixed(1) + '%');
        el.style.setProperty('--my', (py*100).toFixed(1) + '%');
        var dentro = px >= -0.15 && px <= 1.15 && py >= -0.15 && py <= 1.15;
        var fuerza = el.classList.contains('ar-exped') || partida && partida.expedicion ? 9 : 4.5;
        if(dentro && !reduceMotion){
          el.style.setProperty('--rx', ((0.5 - py) * fuerza).toFixed(2) + 'deg');
          el.style.setProperty('--ry', ((px - 0.5) * fuerza).toFixed(2) + 'deg');
          el.style.setProperty('--luz', '1');
        } else {
          el.style.setProperty('--rx', '0deg');
          el.style.setProperty('--ry', '0deg');
          el.style.setProperty('--luz', '0');
        }
      });
    });
  }

  /* Tensión del cronómetro: la viñeta se cierra y late a medida que se agota
     el tiempo. Es información, no adorno: se ve por el rabillo del ojo. */
  function tension(pct){
    raiz.style.setProperty('--tension', (1 - pct).toFixed(3));
  }

  /* ------------------------------- menú ------------------------------- */

  function pintarMenu(){
    detenerTemporizador(); detenerFondo();
    raiz.setAttribute('data-tema', 'datos');
    raiz.style.setProperty('--ar-acento', TEMAS.datos.acento);
    iniciarFondo('datos');

    var resueltos = Object.keys(progreso.resueltos).length;
    var totalRetos = NIVELES.reduce(function(n, l){ return n + (BANCO[l.id]||[]).length; }, 0);

    function tarjeta(l, idx){
      var n = (BANCO[l.id]||[]).length;
      var mejor = progreso.mejores[l.id] || 0;
      var bl = bloqueo(l);
      var clases = 'ar-nivel' + (l.expedicion ? ' ar-exped' : '') + (bl ? ' ar-bloq' : '')
                 + (progreso.sellos[l.id] ? ' ar-sellado' : '');
      var pie = bl
        ? (bl.tipo === 'diario'
            ? '<span class="ar-nivel-pie ar-pie-bloq"><svg class="ar-mini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7"/></svg> Disponible en ' + formatoEspera(msHastaManana()) + '</span>'
            : '<span class="ar-nivel-pie ar-pie-bloq"><svg class="ar-mini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7"/></svg> ' + esc(bl.texto) + '</span>')
        : '<span class="ar-nivel-pie">' + n + ' retos · récord ' + mejor + ' pts'
          + (l.expedicion ? ' · 1 intento al día' : '') + '</span>';
      return '<button type="button" class="' + clases + '" data-nivel="' + l.id + '" data-i="' + idx + '"'
           + (bl ? ' disabled aria-disabled="true"' : '') + '>'
           + '<span class="ar-nivel-icono" aria-hidden="true">' + icono(l.icono) + '</span>'
           + (l.expedicion ? '<span class="ar-nivel-tag">Expedición</span>' : '')
           + (progreso.sellos[l.id] ? '<span class="ar-nivel-sello" title="Expedición superada">' + icono('sello') + '</span>' : '')
           + '<span class="ar-nivel-nom">' + esc(l.nombre) + '</span>'
           + '<span class="ar-nivel-desc">' + esc(l.desc) + '</span>'
           + pie
           + '</button>';
    }

    var basicos = NIVELES.filter(function(l){ return !l.expedicion; });
    var expedic = NIVELES.filter(function(l){ return l.expedicion; });

    capa.innerHTML =
      '<div class="ar-menu">'
      + '<button type="button" class="ar-salir ar-salir-menu" data-accion="salir">‹ Volver al portal</button>'
      + '<p class="ar-eyebrow">Arena CIEHS</p>'
      + '<h1>Elige tu nivel</h1>'
      + '<p class="ar-menu-lede">Ocho retos por partida, tres vidas y tiempo contado. Cada reto abre una ambientación distinta y alterna entre opciones, verdadero o falso, escucha, ordenar, ajustar valores y escribir.</p>'
      + '<div class="ar-niveles">' + basicos.map(tarjeta).join('') + '</div>'
      + '<div class="ar-exped-sep"><span>Expediciones</span></div>'
      + '<p class="ar-exped-nota">La institución educativa llega hasta secundaria. Estas dos van más allá: <b>una sola tirada al día</b>, <b>una vida</b> y <b>puntos dobles</b>. Se abren cuando demuestras nivel en la etapa anterior.</p>'
      + '<div class="ar-niveles">' + expedic.map(function(l,i){ return tarjeta(l, i + basicos.length); }).join('') + '</div>'
      + '<p class="ar-menu-pie">Progreso total: ' + resueltos + ' de ' + totalRetos + ' retos resueltos alguna vez.</p>'
      + '</div>';

    capa.querySelectorAll('[data-nivel]').forEach(function(b){
      // El retardo escalonado se aplica por CSSOM: la CSP no permite atributos
      // style, ni siquiera los que llegan dentro de innerHTML.
      b.style.setProperty('--i', b.getAttribute('data-i') || '0');
      if(b.disabled) return;
      b.addEventListener('click', function(){ nuevaPartida(b.getAttribute('data-nivel')); });
    });
  }

  /* --------------------------- entrar y salir --------------------------- */

  function abrir(){
    raiz.hidden = false;
    document.body.classList.add('ar-abierta');
    pintarMenu();
    raiz.focus();
  }
  function cerrar(){
    detenerTemporizador(); detenerFondo(); callarVoz();
    chispas.length = 0; ondas.length = 0;
    raiz.classList.remove('ar-modo-exped','ar-impacto');
    tension(1);
    if(chispasAnim){ cancelAnimationFrame(chispasAnim); chispasAnim = null; }
    if(chispasCtx && chispasCanvas) chispasCtx.clearRect(0,0,chispasCanvas.width,chispasCanvas.height);
    raiz.hidden = true;
    document.body.classList.remove('ar-abierta');
    partida = null;
  }

  /* ----------------------------- arranque ----------------------------- */

  function montar(){
    raiz = document.getElementById('arenaCapa');
    if(!raiz) return;
    fondo = document.getElementById('arenaFondo');
    capa = document.getElementById('arenaUI');
    ctx = fondo.getContext('2d');

    capa.addEventListener('click', function(e){
      var b = e.target.closest('[data-accion]');
      if(!b) return;
      var a = b.getAttribute('data-accion');
      if(a === 'salir') cerrar();
      if(a === 'menu') pintarMenu();
      if(a === 'revancha') nuevaPartida(partida.nivel);
    });

    // Friccion: ni seleccionar ni menu contextual dentro de la arena.
    raiz.addEventListener('pointermove', seguirPuntero, { passive:true });
    raiz.addEventListener('contextmenu', function(e){ e.preventDefault(); });
    raiz.addEventListener('selectstart', function(e){
      if(e.target.tagName !== 'INPUT') e.preventDefault();
    });
    raiz.addEventListener('copy', function(e){ e.preventDefault(); });

    // Salir de la pestaña con un reto abierto lo congela y lo deja marcado.
    document.addEventListener('visibilitychange', function(){
      if(document.hidden && partida && temporizador){
        detenerTemporizador();
        partida.consultas++;
        var fb = document.getElementById('arFeedback');
        if(fb && fb.hidden){
          fb.hidden = false;
          fb.className = 'ar-feedback ar-feedback-mal';
          fb.innerHTML = '<b>Reto congelado.</b> Saliste de la pantalla mientras el cronómetro corría, '
            + 'así que este reto queda marcado como consultado.'
            + '<button type="button" class="ar-btn ar-btn-primario ar-siguiente" id="arSiguiente">Continuar</button>';
          var s = document.getElementById('arSiguiente');
          s.addEventListener('click', function(){ partida.i++; partida.racha = 0; pintarReto(); });
        }
      }
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && !raiz.hidden) cerrar();
    });

    document.querySelectorAll('[data-abrir-arena]').forEach(function(b){
      b.addEventListener('click', abrir);
    });

    global.CIEHSArena = { abrir: abrir, cerrar: cerrar, menu: pintarMenu };
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})(window);
