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
  var NIVELES = [
    { id:'primaria',        nombre:'Primaria',        desc:'Observación y primeras medidas' },
    { id:'secundaria',      nombre:'Secundaria',      desc:'Variables y parámetros del cultivo' },
    { id:'preuniversitario',nombre:'Preuniversitario',desc:'Cálculo, proporciones y diseño' },
    { id:'universitario',   nombre:'Universitario',   desc:'Análisis, estadística y fisiología' }
  ];
  var TEMAS = {
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

  var progreso = { mejores:{}, resueltos:{} };
  try {
    var g = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    if (g && g.mejores && g.resueltos) progreso = g;
  } catch (e) {}
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
  function tiempoDe(reto){
    return (TIEMPOS[reto.dif] || 22) + (reto.tipo === 'escucha' ? EXTRA_ESCUCHA : 0);
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
    fin:     function(){ tono(523,0.15); setTimeout(function(){ tono(659,0.15); },140); setTimeout(function(){ tono(784,0.3); },280); }
  };

  function leerEnVoz(texto){
    try{
      if(!global.speechSynthesis) return false;
      global.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(texto);
      u.lang = 'es-PE'; u.rate = 0.95;
      var voces = global.speechSynthesis.getVoices();
      var es = voces.filter(function(v){ return /^es/i.test(v.lang); })[0];
      if(es) u.voice = es;
      global.speechSynthesis.speak(u);
      return true;
    }catch(e){ return false; }
  }

  /* ============================ PARTIDA ============================ */

  function nuevaPartida(nivel){
    var banco = BANCO[nivel] || [];
    partida = {
      nivel: nivel,
      retos: barajar(banco).slice(0, Math.min(RETOS_POR_PARTIDA, banco.length)),
      i: 0, puntos: 0, racha: 0, mejorRacha: 0, vidas: VIDAS, aciertos: 0, consultas: 0
    };
    pintarReto();
  }

  function terminarPartida(){
    detenerTemporizador(); detenerFondo();
    var n = partida.nivel;
    if(!progreso.mejores[n] || partida.puntos > progreso.mejores[n]) progreso.mejores[n] = partida.puntos;
    guardar();
    sonido.fin();

    var total = partida.retos.length;
    capa.innerHTML =
      '<div class="ar-fin">'
      + '<p class="ar-eyebrow">Partida terminada</p>'
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
  }

  function pintarReto(){
    detenerTemporizador();
    if(partida.i >= partida.retos.length || partida.vidas <= 0){ terminarPartida(); return; }

    var r = partida.retos[partida.i];
    var tema = TEMAS[r.tema] || TEMAS.datos;
    raiz.style.setProperty('--ar-acento', tema.acento);
    raiz.setAttribute('data-tema', r.tema);
    iniciarFondo(r.tema);

    var segundos = tiempoDe(r);
    var esEscucha = r.tipo === 'escucha';

    var cabecera =
      '<header class="ar-top">'
      + '<div class="ar-top-izq">'
      +   '<button type="button" class="ar-salir" data-accion="menu" aria-label="Volver al menú">‹ Niveles</button>'
      +   '<span class="ar-tema">' + esc(tema.nombre) + '</span>'
      + '</div>'
      + '<div class="ar-top-der">'
      +   '<span class="ar-vidas" aria-label="Vidas restantes">' + repetir('◆', partida.vidas) + repetir('◇', VIDAS - partida.vidas) + '</span>'
      +   '<span class="ar-puntos"><b>' + partida.puntos + '</b> pts</span>'
      + '</div></header>'
      + '<div class="ar-progreso"><span style="width:' + ((partida.i)/partida.retos.length*100) + '%"></span></div>';

    var meta =
      '<div class="ar-meta">'
      + '<span class="ar-num">Reto ' + (partida.i+1) + ' / ' + partida.retos.length + '</span>'
      + '<span class="ar-dif ar-dif-' + r.dif + '">' + ['','Fácil','Media','Difícil'][r.dif] + '</span>'
      + (partida.racha > 1 ? '<span class="ar-racha">Racha ×' + partida.racha + '</span>' : '')
      + '</div>';

    var enunciado = esEscucha
      ? '<div class="ar-escucha"><button type="button" class="ar-btn ar-repetir" id="arRepetir">🔊 Repetir enunciado</button>'
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

    montarCuerpo(r);
    arrancarTemporizador(segundos, r);

    if(esEscucha){
      leerEnVoz(r.q);
      var rep = document.getElementById('arRepetir');
      if(rep) rep.addEventListener('click', function(){ leerEnVoz(r.q); });
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
  function detenerTemporizador(){ if(temporizador){ clearInterval(temporizador); temporizador = null; } }

  /* ----------------------------- resolver ----------------------------- */

  function resolver(r, acertado, boton, nota){
    detenerTemporizador();
    if(global.speechSynthesis) try{ global.speechSynthesis.cancel(); }catch(e){}

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
      partida.puntos += base + bonusTiempo + bonusRacha;
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
      elPuntos.textContent = partida.puntos;
      elPuntos.classList.remove('ar-sube');
      void elPuntos.offsetWidth;            // reinicia la animacion
      if(acertado) elPuntos.classList.add('ar-sube');
    }
    var elVidas = document.querySelector('.ar-vidas');
    if(elVidas) elVidas.textContent = repetir('◆', partida.vidas) + repetir('◇', VIDAS - partida.vidas);
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

  /* ------------------------------- menú ------------------------------- */

  function pintarMenu(){
    detenerTemporizador(); detenerFondo();
    raiz.setAttribute('data-tema', 'datos');
    raiz.style.setProperty('--ar-acento', TEMAS.datos.acento);
    iniciarFondo('datos');

    var resueltos = Object.keys(progreso.resueltos).length;
    var totalRetos = NIVELES.reduce(function(n, l){ return n + (BANCO[l.id]||[]).length; }, 0);

    capa.innerHTML =
      '<div class="ar-menu">'
      + '<button type="button" class="ar-salir ar-salir-menu" data-accion="salir">‹ Volver al portal</button>'
      + '<p class="ar-eyebrow">Arena CIEHS</p>'
      + '<h1>Elige tu nivel</h1>'
      + '<p class="ar-menu-lede">Ocho retos por partida, tres vidas y tiempo contado. Cada reto cambia de ambientación según su tema y alterna entre opciones, verdadero o falso, escucha, ordenar, ajustar valores y escribir.</p>'
      + '<div class="ar-niveles">'
      + NIVELES.map(function(l){
          var n = (BANCO[l.id]||[]).length;
          var mejor = progreso.mejores[l.id] || 0;
          return '<button type="button" class="ar-nivel" data-nivel="' + l.id + '">'
               + '<span class="ar-nivel-nom">' + esc(l.nombre) + '</span>'
               + '<span class="ar-nivel-desc">' + esc(l.desc) + '</span>'
               + '<span class="ar-nivel-pie">' + n + ' retos · récord ' + mejor + ' pts</span>'
               + '</button>';
        }).join('')
      + '</div>'
      + '<p class="ar-menu-pie">Progreso total: ' + resueltos + ' de ' + totalRetos + ' retos resueltos alguna vez.</p>'
      + '</div>';

    capa.querySelectorAll('[data-nivel]').forEach(function(b){
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
    detenerTemporizador(); detenerFondo();
    if(global.speechSynthesis) try{ global.speechSynthesis.cancel(); }catch(e){}
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
