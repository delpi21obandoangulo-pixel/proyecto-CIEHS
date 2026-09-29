/* ============================================================================
   CIEHS · Secciones v2 — Fase 4 del rediseño (2026-09-29)

   1. Módulos: plano interactivo del invernadero. Las once mesas y las cuatro
      botellas dibujadas como lo que son, coloreadas por cultivo, con filtro
      por cultivo y una ficha al elegir una: rango de pH y CE sobre una escala,
      y los dos atajos que importan — registrar una medición de ESE módulo o
      verlo en Trazabilidad.
      Fuente: las fichas .modulo-chip que ya pinta ciehs-app.js desde la base
      (con el HTML estático de respaldo). Se relee cada vez que cambian.
   2. Datos: descarga en CSV de los módulos y de los resultados publicados,
      al estilo de Our World in Data: el dato que se muestra se puede llevar.
   ========================================================================== */
(function(){
  'use strict';

  var CIEHS = window.CIEHS || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function h(tag, cls, txt){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(txt != null) e.textContent = txt;
    return e;
  }
  function norm(s){ return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }

  /* ======================================================================
     1. PLANO DEL INVERNADERO
     ====================================================================== */
  var lista = document.getElementById('modulosLista');
  var seccion = document.getElementById('modulos');
  if(lista && seccion){
    var COLOR = {
      'lechuga crespa':'#22a06b', 'lechuga arrepollada':'#7cb518', 'lechuga americana':'#7cb518',
      'espinaca':'#146c43', 'cebolla china':'#8b5cf6', 'albahaca':'#0d9488', 'acelga':'#e11d48'
    };
    function color(c){ return COLOR[norm(c)] || '#64748b'; }

    var caja = h('div', 'plano');
    var cab = h('div', 'plano-cab');
    var cabTx = h('div');
    cabTx.appendChild(h('p', 'plano-tit', 'Plano del invernadero'));
    cabTx.appendChild(h('p', 'plano-sub', 'Elige un módulo para ver su rango de cultivo o registrar una medición.'));
    var filtros = h('div', 'plano-filtros');
    filtros.setAttribute('role', 'group');
    filtros.setAttribute('aria-label', 'Filtrar por cultivo');
    cab.appendChild(cabTx); cab.appendChild(filtros);

    var cuerpo = h('div', 'plano-cuerpo');
    var mapa = h('div', 'plano-mapa');
    var ficha = h('aside', 'plano-ficha');
    ficha.setAttribute('aria-live', 'polite');
    cuerpo.appendChild(mapa); cuerpo.appendChild(ficha);
    caja.appendChild(cab); caja.appendChild(cuerpo);

    var aviso = seccion.querySelector('.dwc-aviso');
    (aviso || lista).parentNode.insertBefore(caja, aviso ? aviso.nextSibling : lista);
    seccion.classList.add('mod-v2');

    var elegido = '', filtro = '';

    function leer(){
      return [].map.call(lista.querySelectorAll('.modulo-chip'), function(c){
        function n(a){ var v = parseFloat(c.getAttribute(a)); return isNaN(v) ? null : v; }
        return {
          code: c.getAttribute('data-modulo') || '',
          cultivo: c.getAttribute('data-cultivo') || (c.querySelector('b') || {}).textContent || '',
          phmin: n('data-phmin'), phmax: n('data-phmax'), cemin: n('data-cemin'), cemax: n('data-cemax'),
          botella: c.classList.contains('es-botella')
        };
      });
    }

    function pintar(){
      var mods = leer();
      if(!mods.length) return;
      if(!elegido || !mods.some(function(m){ return m.code === elegido; })) elegido = mods[0].code;

      // Filtros por cultivo, con cuántos módulos tiene cada uno. Se agrupa sin
      // distinguir mayúsculas («lechuga crespa» = «Lechuga crespa») y se
      // muestra con la primera letra en mayúscula.
      var cuenta = {}, nombre = {};
      mods.forEach(function(m){
        var k = norm(m.cultivo);
        if(!nombre[k]) nombre[k] = m.cultivo.charAt(0).toUpperCase() + m.cultivo.slice(1);
        m.cultivo = nombre[k];
        cuenta[m.cultivo] = (cuenta[m.cultivo] || 0) + 1;
      });
      filtros.textContent = '';
      [''].concat(Object.keys(cuenta)).forEach(function(c){
        var b = h('button', 'plano-filtro' + (filtro === c ? ' is-on' : ''));
        b.type = 'button';
        b.setAttribute('aria-pressed', filtro === c ? 'true' : 'false');
        if(c){
          var dot = h('i'); dot.style.setProperty('--c', color(c)); b.appendChild(dot);
          b.appendChild(document.createTextNode(c + ' · ' + cuenta[c]));
        } else b.appendChild(document.createTextNode('Todos · ' + mods.length));
        b.addEventListener('click', function(){ filtro = c; pintar(); });
        filtros.appendChild(b);
      });

      mapa.textContent = '';
      [['Mesas de raíz flotante', false], ['Botellas reutilizadas', true]].forEach(function(g){
        var grupo = mods.filter(function(m){ return m.botella === g[1]; });
        if(!grupo.length) return;
        var bloque = h('div', 'plano-grupo' + (g[1] ? ' es-botellas' : ''));
        bloque.appendChild(h('p', 'plano-grupo-tit', g[0]));
        var rej = h('div', 'plano-rejilla');
        grupo.forEach(function(m, i){
          var b = h('button', 'plano-mod' + (m.code === elegido ? ' is-sel' : '') + (filtro && filtro !== m.cultivo ? ' is-apagado' : ''));
          b.type = 'button';
          b.style.setProperty('--c', color(m.cultivo));
          b.style.setProperty('--k', i);
          b.setAttribute('aria-pressed', m.code === elegido ? 'true' : 'false');
          b.setAttribute('aria-label', m.code + ', ' + m.cultivo + (m.botella ? ', botella' : ''));
          var num = h('span', 'plano-num', m.code.replace(/^.*-/, ''));
          var cul = h('span', 'plano-cul', m.cultivo);
          var hojas = h('span', 'plano-hojas');
          hojas.setAttribute('aria-hidden', 'true');
          for(var k = 0; k < (m.botella ? 2 : 4); k++) hojas.appendChild(h('i'));
          b.appendChild(hojas); b.appendChild(num); b.appendChild(cul);
          b.addEventListener('click', function(){ elegido = m.code; pintar(); });
          rej.appendChild(b);
        });
        bloque.appendChild(rej);
        mapa.appendChild(bloque);
      });

      pintarFicha(mods.filter(function(m){ return m.code === elegido; })[0]);
    }

    // Escala común para comparar rangos: pH 5–7.5, CE 1–2.5 mS/cm.
    function escala(tit, min, max, lo, hi, unidad){
      var d = h('div', 'pf-escala');
      d.appendChild(h('p', 'pf-et', tit));
      var barra = h('div', 'pf-barra');
      var tramo = h('i');
      if(min != null && max != null){
        tramo.style.setProperty('--a', ((min - lo) / (hi - lo) * 100).toFixed(1) + '%');
        tramo.style.setProperty('--b', ((max - lo) / (hi - lo) * 100).toFixed(1) + '%');
      }
      barra.appendChild(tramo);
      d.appendChild(barra);
      var ejes = h('div', 'pf-ejes');
      ejes.appendChild(h('span', null, String(lo)));
      ejes.appendChild(h('b', null, min != null && max != null ? min.toFixed(1) + '–' + max.toFixed(1) + (unidad ? ' ' + unidad : '') : 'Sin rango'));
      ejes.appendChild(h('span', null, String(hi)));
      d.appendChild(ejes);
      return d;
    }

    function pintarFicha(m){
      ficha.textContent = '';
      if(!m) return;
      ficha.style.setProperty('--c', color(m.cultivo));
      var top = h('div', 'pf-top');
      top.appendChild(h('span', 'pf-code mono', m.code));
      top.appendChild(h('span', 'pf-forma', m.botella ? 'Botella reutilizada' : 'Mesa de raíz flotante'));
      ficha.appendChild(top);
      ficha.appendChild(h('h3', 'pf-cul', m.cultivo));
      ficha.appendChild(escala('pH de la solución', m.phmin, m.phmax, 5, 7.5, ''));
      ficha.appendChild(escala('Conductividad eléctrica (CE)', m.cemin, m.cemax, 1, 2.5, 'mS/cm'));
      if(m.botella) ficha.appendChild(h('p', 'pf-nota', 'Tiene mucho menos volumen de solución que una mesa: su nivel se revisa con más frecuencia.'));
      var acc = h('div', 'pf-acc');
      var reg = h('button', 'btn btn-primary', 'Registrar pH o CE');
      reg.type = 'button';
      reg.addEventListener('click', function(){
        if(!CIEHS.abrirAportar) return;
        CIEHS.abrirAportar('modulo');
        var sel = document.getElementById('campoModulo');
        if(sel) [].some.call(sel.options, function(o){
          if(o.value === m.code || o.textContent.indexOf(m.code) !== -1){ sel.value = o.value; return true; }
        });
      });
      var traz = h('button', 'btn btn-ghost', 'Ver en Trazabilidad');
      traz.type = 'button';
      traz.addEventListener('click', function(){ CIEHS.navigate('trazabilidad'); });
      acc.appendChild(reg); acc.appendChild(traz);
      ficha.appendChild(acc);
      if(!reduceMotion){ ficha.classList.remove('is-entra'); void ficha.offsetWidth; ficha.classList.add('is-entra'); }
    }

    new MutationObserver(pintar).observe(lista, { childList:true, subtree:true, attributes:true });
    pintar();
  }

  /* ======================================================================
     2. DESCARGAR LOS DATOS
     ====================================================================== */
  var datos = document.getElementById('datos');
  var cabDatos = datos && datos.querySelector('.section-head');
  if(cabDatos){
    function celda(v){
      if(v == null) return '';
      var s = String(v);
      return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    function bajar(nombre, filas){
      // BOM para que Excel abra bien las tildes.
      var blob = new Blob(['﻿' + filas.map(function(f){ return f.map(celda).join(','); }).join('\r\n')], { type:'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = nombre;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000);
    }
    var barra = h('div', 'datos-descargas');
    barra.appendChild(h('span', 'dd-et', 'Llévate los datos:'));
    var b1 = h('button', 'btn btn-ghost dd-btn', 'Módulos (CSV)');
    b1.type = 'button';
    b1.addEventListener('click', function(){
      var mods = [].map.call(document.querySelectorAll('#modulosLista .modulo-chip'), function(c){
        return [c.getAttribute('data-modulo'), c.getAttribute('data-cultivo'), c.classList.contains('es-botella') ? 'botella' : 'mesa',
                c.getAttribute('data-phmin'), c.getAttribute('data-phmax'), c.getAttribute('data-cemin'), c.getAttribute('data-cemax')];
      });
      bajar('ciehs-modulos.csv', [['modulo','cultivo','forma','ph_min','ph_max','ce_min_mS_cm','ce_max_mS_cm']].concat(mods));
    });
    var b2 = h('button', 'btn btn-ghost dd-btn', 'Resultados de investigación (CSV)');
    b2.type = 'button';
    b2.addEventListener('click', function(){
      var s = CIEHS.snapshot && CIEHS.snapshot();
      var filas = ((s && s.resultados) || []).map(function(r){
        return [r.investigation_code, r.tratamiento, r.medido_en, r.variable, r.valor, r.unidad, r.n_muestras, r.equipo, r.grado];
      });
      if(!filas.length){ b2.textContent = 'Aún no hay resultados publicados'; setTimeout(function(){ b2.textContent = 'Resultados de investigación (CSV)'; }, 2600); return; }
      bajar('ciehs-resultados.csv', [['investigacion','tratamiento','fecha','variable','valor','unidad','n_plantas','equipo','grado']].concat(filas));
    });
    barra.appendChild(b1); barra.appendChild(b2);
    barra.appendChild(h('span', 'dd-lic', 'Fuente: CIEHS · I.E. 80033, Huanchaco'));
    cabDatos.appendChild(barra);
  }
})();
