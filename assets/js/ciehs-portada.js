/* ============================================================================
   CIEHS · Portada v2 — Fase 3 del rediseño (2026-09-29)

   1. Burbujas del hero: oxígeno que sube por la solución nutritiva, se aparta
      del cursor y estalla en un anillo al tocar. Es la pregunta abierta del
      laboratorio (los módulos funcionan sin bomba de aire) hecha fondo vivo.
      Canvas 2D, densidad de píxel limitada, se detiene fuera de pantalla o con
      la pestaña oculta, y no existe con prefers-reduced-motion.
   2. «Del problema a la solución»: relato con scroll. El paso que cruza el
      centro de la pantalla se activa y el visual fijo cambia de capa.
   3. Los 280 puntos del paso 4: una persona, un punto; diez colores, diez
      equipos. Entran escalonados cuando el paso se activa.
   ========================================================================== */
(function(){
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------ 1. burbujas */
  var lienzo = document.getElementById('hmBurbujas');
  var hero = lienzo && lienzo.closest('section');
  if(lienzo && hero && !reduceMotion && lienzo.getContext){
    var ctx = lienzo.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0, burbujas = [], chispas = [];
    var px = -9999, py = -9999, visible = true, corriendo = false, ultimo = 0;

    function medir(){
      var r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = W < 700 ? 28 : 60;
      while(burbujas.length < n) burbujas.push(nueva(true));
      burbujas.length = n;
    }
    function nueva(inicio){
      var r = 1.2 + Math.pow(Math.random(), 2.2) * 6;
      return {
        x: Math.random() * W,
        y: inicio ? Math.random() * H : H + r + Math.random() * 40,
        r: r,
        v: 0.25 + r * 0.09 + Math.random() * 0.2,
        f: Math.random() * Math.PI * 2,
        a: 0.18 + Math.random() * 0.35,
        dx: 0
      };
    }
    function paso(t){
      if(!visible){ corriendo = false; return; }
      var dt = Math.min(48, t - (ultimo || t)) / 16.7;
      ultimo = t;
      ctx.clearRect(0, 0, W, H);
      for(var i = 0; i < burbujas.length; i++){
        var b = burbujas[i];
        b.f += 0.02 * dt;
        b.y -= b.v * dt;
        // El cursor empuja: fuerza que cae con la distancia.
        var ddx = b.x - px, ddy = b.y - py, d2 = ddx * ddx + ddy * ddy;
        if(d2 < 16000){
          var d = Math.sqrt(d2) || 1, k = (1 - d / 126) * 2.4;
          b.dx += (ddx / d) * k * dt;
          b.y += (ddy / d) * k * 0.6 * dt;
        }
        b.dx *= 0.92;
        b.x += (Math.sin(b.f) * 0.35 + b.dx) * dt;
        if(b.y < -12 || b.x < -20 || b.x > W + 20) burbujas[i] = nueva(false);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(214,255,236,' + b.a + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
        if(b.r > 2.5){
          ctx.beginPath();
          ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,' + (b.a * 0.9) + ')';
          ctx.fill();
        }
      }
      for(var j = chispas.length - 1; j >= 0; j--){
        var c = chispas[j];
        c.t += 0.028 * dt;
        if(c.t >= 1){ chispas.splice(j, 1); continue; }
        ctx.beginPath();
        ctx.arc(c.x, c.y, 6 + c.t * 70, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(167,243,208,' + (0.55 * (1 - c.t)) + ')';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      requestAnimationFrame(paso);
    }
    function arrancar(){
      if(corriendo || !visible) return;
      corriendo = true; ultimo = 0;
      requestAnimationFrame(paso);
    }

    medir();
    window.addEventListener('resize', medir);
    hero.addEventListener('pointermove', function(e){
      var r = hero.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top;
    }, { passive:true });
    hero.addEventListener('pointerleave', function(){ px = py = -9999; });
    hero.addEventListener('pointerdown', function(e){
      if(e.target.closest('button, a')) return;
      var r = hero.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      chispas.push({ x:x, y:y, t:0 });
      for(var k = 0; k < 8; k++){
        var b = nueva(false);
        b.x = x + (Math.random() - 0.5) * 30; b.y = y + (Math.random() - 0.5) * 20;
        b.dx = (Math.random() - 0.5) * 6;
        burbujas.push(b);
      }
      if(burbujas.length > 90) burbujas.splice(0, burbujas.length - 90);
    });
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(en){
        visible = en[0].isIntersecting && !document.hidden;
        if(visible) arrancar();
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', function(){
      visible = !document.hidden && !hero.hidden;
      if(visible) arrancar();
    });
    arrancar();
  }

  /* ------------------------------------------------------------ 3. la gente */
  var gente = document.querySelector('.hv-gente');
  if(gente){
    var COLORES = ['#0f9f6e','#0b7fb8','#d97706','#7c3aed','#e11d48','#65a30d','#0891b2','#c2410c','#4f46e5','#0e1a14'];
    var frag = document.createDocumentFragment();
    for(var i = 0; i < 280; i++){
      var p = document.createElement('i');
      var eq = Math.floor(i / 28);
      p.style.setProperty('--c', COLORES[eq]);
      p.style.setProperty('--d', ((i % 20) * 12 + Math.floor(i / 20) * 18) + 'ms');
      frag.appendChild(p);
    }
    gente.appendChild(frag);
  }

  /* ------------------------------------------------------------ 2. el relato */
  var pasos = [].slice.call(document.querySelectorAll('.historia-paso'));
  var capas = [].slice.call(document.querySelectorAll('.historia-visual .hv-capa'));
  if(pasos.length && capas.length){
    document.documentElement.classList.add('historia-viva');
    function activar(n){
      pasos.forEach(function(p){ p.classList.toggle('is-activo', p.getAttribute('data-paso') === n); });
      capas.forEach(function(c){ c.classList.toggle('is-activa', c.getAttribute('data-capa') === n); });
    }
    if('IntersectionObserver' in window){
      // La franja central de la pantalla decide: el paso que la cruza manda.
      var io = new IntersectionObserver(function(en){
        en.forEach(function(e){ if(e.isIntersecting) activar(e.target.getAttribute('data-paso')); });
      }, { rootMargin:'-45% 0px -45% 0px', threshold:0 });
      pasos.forEach(function(p){ io.observe(p); });
    }
    // Al pulsar un paso (teclado o toque) también se activa.
    pasos.forEach(function(p){
      p.addEventListener('focusin', function(){ activar(p.getAttribute('data-paso')); });
    });
  }
})();
