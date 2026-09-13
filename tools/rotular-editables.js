#!/usr/bin/env node
/* rotular-editables.js — propone (y aplica) el rotulado data-edit del portal.

   Se ejecuta desde la RAIZ del proyecto. Es idempotente: lo que ya lleva
   data-edit se respeta, asi que al añadir una seccion nueva basta con volver a
   pasarlo y solo rotula lo que falta.

   Las claves son SEMANTICAS -ruta.bloque.slug-, nunca por posicion: una clave
   por indice se romperia en silencio al reordenar el HTML y el texto guardado
   aparecería en el elemento equivocado.
     node rotular2.js              informe
     node rotular2.js --volcar     informe + propuestas.txt / excluidas.txt
     node rotular2.js --aplicar    escribe index.html

   Trabaja linea a linea y no con un parser porque el HTML del proyecto lo
   permite: 740 de las 756 etiquetas p/h2-h5/li abren linea y NINGUNA linea
   lleva dos. Comprobado antes de escribir esto. */

const fs = require('fs');
const path = require('path');
const APLICAR = process.argv.includes('--aplicar');
const SALIDA = process.cwd();
const RUTA = 'index.html';

let src = fs.readFileSync(RUTA, 'utf8');
const NL = (src.indexOf('\r\n') > -1) ? '\r\n' : '\n';
const L = src.split(NL);

/* --------------------------------------------------------- exclusiones --- */

// Contenedores que REPINTA el JS: sus hijos se sustituyen enteros, asi que un
// data-edit ahi dentro guardaria un valor que el siguiente refresco borra. Lo
// que hay en el HTML es su respaldo estatico, no contenido editable.
const REPINTADOS = new Set([
  'aportePublicados', 'bitacoraCuerpo', 'carpetaGrid', 'comentariosLista',
  'destacadosGrid', 'galeriaPista', 'invGrid', 'invOrigen', 'modulosLista',
  'phModulosChart', 'resGrid', 'telemetriaLista', 'tiendaGrid', 'vozControl',
  'adminModal'
]);

// Nodos cuyo texto pisa el JS con textContent. Un lapiz ahi mentiria.
const PISADOS_POR_JS = new Set(
  (fs.readFileSync('assets/js/ciehs-app.js', 'utf8')
     .match(/el\('([a-zA-Z0-9_-]+)'\)\s*\.\s*textContent\s*=/g) || [])
    .map(m => m.match(/'([^']+)'/)[1])
);

// Clases que marcan interfaz, no contenido. Solo deciden si un p/h/li SE
// ROTULA; para nombrar el bloque se usa cualquier clase (ver mas abajo), o las
// claves acabarian mintiendo sobre donde vive el texto.
const CLASES_FUERA = [
  'ed-', 'admin-', 'inv-', 'navtoggle', 'aviso-', 'skip',
  'form-status', 'chip', 'range-label', 'dato-previsto', 'qr-url'
];

/* -------------------------------------------------------------- avisos --- */
/* Textos que comprometen algo si se cambian a la ligera. Siguen siendo
   editables -es lo acordado-, pero el editor avisa antes de abrirlos. */
const AVISOS = [
  { desde: 'privacidad', aviso: 'Esta página describe el protocolo de imagen de menores. Cambiarla altera un compromiso con las familias.' },
  { clave: /^portal\.fcontact\.datos-institucionales/, aviso: 'Este párrafo declara que los datos son oficiales de la I.E. N.° 80033. Cambiarlo altera una afirmación pública de veracidad.' },
  { clave: /^portal\.fcontact\.2026-ciehs/, aviso: 'Es la nota de derechos del portal.' },
  { texto: /UNESCO|no es un programa oficial|certificación/i, aviso: 'Este texto delimita qué NO es el CIEHS frente a organismos oficiales. Cambiarlo puede convertirlo en una afirmación falsa.' },
  { texto: /caras pixeladas|rostros|menores/i, aviso: 'Habla del tratamiento de imágenes de menores. Compruébalo con la coordinación antes de cambiarlo.' }
];

function avisoPara(clave, ruta, texto) {
  for (const a of AVISOS) {
    if (a.desde && ruta === a.desde) return a.aviso;
    if (a.clave && a.clave.test(clave)) return a.aviso;
    if (a.texto && a.texto.test(texto)) return a.aviso;
  }
  return null;
}

/* ------------------------------------------------------------ utilidades - */

const VACIAS = new Set(['el','la','los','las','un','una','de','del','y','o','a','en','que','con','por','para','su','sus','es','se','al','lo','como','mas','no','ya','ni','esta','este','esa','ese','sobre','desde','hasta','entre']);

function slug(texto, max) {
  let s = texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const palabras = s.split('-').filter(Boolean);
  const utiles = palabras.filter(p => !VACIAS.has(p) && p.length > 1);
  s = (utiles.length ? utiles : palabras).join('-');
  if (s.length > max) s = s.slice(0, max).replace(/-+$/, '');
  return s;
}

const indent = l => l.match(/^\s*/)[0].length;

function textoDe(linea) {
  const m = linea.match(/^\s*<(?:p|h[2-5]|li)\b[^>]*>(.*)$/);
  if (!m) return '';
  return m[1].replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

/* ------------------------------------------- primera pasada: exclusiones - */

const excluida = new Array(L.length).fill(false);

function excluirBloque(i) {
  const base = indent(L[i]);
  const etiqueta = (L[i].match(/<([a-z][a-z0-9]*)\b/) || [])[1];
  excluida[i] = true;
  if (etiqueta && new RegExp('</' + etiqueta + '>').test(L[i])) return;
  for (let j = i + 1; j < L.length; j++) {
    excluida[j] = true;
    if (L[j].trim().startsWith('</') && indent(L[j]) <= base) break;
  }
}

L.forEach((linea, i) => {
  const m = linea.match(/\bid="([a-zA-Z0-9_-]+)"/);
  if (m && REPINTADOS.has(m[1])) excluirBloque(i);
  // <noscript>: lo que hay dentro solo lo lee quien NO tiene JavaScript, y el
  // editor vive en JavaScript. Un lapiz ahi nunca se veria.
  if (/^\s*<noscript\b/.test(linea)) excluirBloque(i);
  // <template>: molde, no contenido.
  if (/^\s*<template\b/.test(linea)) excluirBloque(i);
});

/* --------------------------------------- segunda pasada: rutas y bloques - */

const propuestas = [];
const usadas = new Set((src.match(/data-edit="([^"]+)"/g) || []).map(m => m.match(/"([^"]+)"/)[1]));

let ruta = 'portal';
const pilaRuta = [];      // [{ sangria, nombre }]
const pilaBloque = [];    // [{ sangria, nombre }]

const CONTENEDOR = /^\s*<(?:div|section|article|aside|figure|ul|ol|dl|nav|footer|header|main)\b/;

L.forEach((linea, i) => {
  const sangria = indent(linea);

  // Se cierran las pilas ANTES de mirar la linea actual: un </div> a sangria N
  // cierra todo lo que se abrio a sangria >= N.
  if (linea.trim().startsWith('</')) {
    while (pilaBloque.length && pilaBloque[pilaBloque.length - 1].sangria >= sangria) pilaBloque.pop();
    while (pilaRuta.length && pilaRuta[pilaRuta.length - 1].sangria >= sangria) pilaRuta.pop();
    ruta = pilaRuta.length ? pilaRuta[pilaRuta.length - 1].nombre : 'portal';
  }

  const mp = linea.match(/data-page="([a-z]+)"/);
  if (mp) { pilaRuta.push({ sangria, nombre: mp[1] }); ruta = mp[1]; }

  // El bloque toma el nombre de la clase del contenedor. Sin filtrar por
  // CLASES_FUERA: eso solo decide si un texto se rotula, no como se llama el
  // sitio donde vive. Filtrarlo aqui hacia que el bloque anterior se heredara y
  // la clave dijera «nav-right» de un texto que estaba en el menu.
  if (CONTENEDOR.test(linea)) {
    const mc = linea.match(/class="([^"]*)"/);
    if (mc) {
      const nombre = slug(mc[1].split(/\s+/)[0].replace(/[_-]+/g, ' '), 22);
      if (nombre) pilaBloque.push({ sangria, nombre });
    }
  }

  if (excluida[i]) return;
  if (!/^\s*<(?:p|h[2-5]|li)\b/.test(linea)) return;
  if (/\bdata-edit=/.test(linea)) return;

  const texto = textoDe(linea);
  if (texto.length < 3) return;

  const mid = linea.match(/\bid="([a-zA-Z0-9_-]+)"/);
  if (mid && PISADOS_POR_JS.has(mid[1])) return;

  const mc = linea.match(/class="([^"]*)"/);
  if (mc && CLASES_FUERA.some(p => mc[1].split(/\s+/).some(c => c.startsWith(p)))) return;

  const tipo = linea.match(/^\s*<([a-z0-9]+)/)[1];
  const bloque = pilaBloque.length ? pilaBloque[pilaBloque.length - 1].nombre : tipo;
  const base = [ruta, bloque, slug(texto, 34)].filter(Boolean).join('.');
  let clave = base.slice(0, 81).replace(/[.-]+$/, '');
  let n = 2;
  while (usadas.has(clave)) {
    const suf = '-' + n++;
    clave = base.slice(0, 81 - suf.length).replace(/[.-]+$/, '') + suf;
  }
  usadas.add(clave);
  propuestas.push({ i, clave, tipo, ruta, bloque, texto, aviso: avisoPara(clave, ruta, texto) });
});

/* -------------------------------------------------------------- informe - */

const porRuta = {};
propuestas.forEach(p => { porRuta[p.ruta] = (porRuta[p.ruta] || 0) + 1; });

console.log('Propuestas: ' + propuestas.length + '   con aviso: ' + propuestas.filter(p => p.aviso).length);
Object.keys(porRuta).sort().forEach(r => console.log('  ' + r.padEnd(18) + porRuta[r]));
const mala = propuestas.filter(p => !/^[a-z0-9][a-z0-9._-]{1,80}$/.test(p.clave));
console.log('Claves invalidas para el CHECK: ' + mala.length);
mala.slice(0, 5).forEach(p => console.log('   ! ' + p.clave));

if (process.argv.includes('--volcar')) {
  fs.writeFileSync(path.join(SALIDA, 'propuestas.txt'),
    propuestas.map(p => (p.i + 1) + '\t' + p.clave + '\t' + (p.aviso ? '[AVISO] ' : '') + p.texto.slice(0, 80)).join('\n'), 'utf8');
  const fuera = [];
  L.forEach((linea, i) => {
    if (!excluida[i] || !/^\s*<(?:p|h[2-5]|li)\b/.test(linea)) return;
    const t = textoDe(linea);
    if (t.length >= 3) fuera.push((i + 1) + '\t' + t.slice(0, 80));
  });
  fs.writeFileSync(path.join(SALIDA, 'excluidas.txt'), fuera.join('\n'), 'utf8');
  console.log('volcado: ' + propuestas.length + ' propuestas, ' + fuera.length + ' excluidas con texto');
}

if (APLICAR) {
  propuestas.forEach(p => {
    const extra = ' data-edit="' + p.clave + '"' +
      (p.aviso ? ' data-edit-aviso="' + p.aviso.replace(/"/g, '&quot;') + '"' : '');
    L[p.i] = L[p.i].replace(/^(\s*<[a-z0-9]+)/, '$1' + extra);
  });
  fs.writeFileSync(RUTA, L.join(NL));
  console.log('\nAPLICADO: ' + propuestas.length + ' atributos sobre index.html.');
}
