/* ============================================================================
   CIEHS · Genera el guion de locucion del banco de preguntas.

   Produce EXACTAMENTE el texto que el portal pronuncia, para que la grabacion
   y la sintesis digan lo mismo. Si el banco cambia, se vuelve a ejecutar y el
   guion se regenera: no hay una segunda copia del texto que pueda quedar
   desfasada.

     node tools/guion-voz.js            -> guion-voz.md (para leer y grabar)
     node tools/guion-voz.js --csv      -> guion-voz.csv (para pegar en lote)
     node tools/guion-voz.js --json     -> guion-voz.json (para automatizar)

   Solo se genera la PREGUNTA con sus opciones (clave <id>-p). La explicacion no
   se graba a proposito: el veredicto que la precede depende de lo que haya
   respondido cada estudiante, asi que se sintetiza igual, y encadenar una
   palabra sintetica con una frase grabada suena a fallo.
   ========================================================================== */
'use strict';
var fs = require('fs');
var path = require('path');

// El banco se declara sobre `window`; en Node se le da uno.
global.window = global;
require(path.join(__dirname, '..', 'assets', 'js', 'ciehs-preguntas.js'));

var BANCO = global.CIEHS_PREGUNTAS;
if (!BANCO) { console.error('No se pudo cargar el banco de preguntas.'); process.exit(1); }

var NIVEL = { inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' };

// Mismo montaje que hace el portal en leerPregunta(): enunciado y luego las
// opciones NUMERADAS. Sin numerar, oidas seguidas, no hay forma de saber cual
// es cual.
//
// El orden lo da CIEHS_ORDEN_OPCIONES, que vive en el propio banco y usan tanto
// el portal como este generador. Es determinista por id: siempre el mismo para
// una pregunta dada, y distinto entre preguntas.
function textoDe(p) {
  // MISMO orden que usa el portal. Es la unica forma de que "Opcion 1" en la
  // grabacion sea la opcion 1 en pantalla; si esto se desincroniza, el audio
  // nombra la respuesta equivocada.
  var ordenadas = global.CIEHS_ORDEN_OPCIONES(p.id, p.ops);
  var ops = ordenadas.map(function (o, i) {
    return 'Opción ' + (i + 1) + ': ' + o[0].replace(/\s+$/, '').replace(/\.?$/, '.');
  }).join(' ');
  return p.q.trim() + ' ' + ops;
}

var filas = [];
Object.keys(BANCO).forEach(function (nivel) {
  BANCO[nivel].forEach(function (p) {
    filas.push({
      clave: p.id + '-p',
      archivo: 'voz/' + p.id + '-p.mp3',
      nivel: NIVEL[nivel] || nivel,
      categoria: p.cat,
      texto: textoDe(p)
    });
  });
});

var modo = process.argv[2] || '--md';
var salida, destino;

if (modo === '--json') {
  destino = 'guion-voz.json';
  salida = JSON.stringify(filas, null, 2);

} else if (modo === '--csv') {
  destino = 'guion-voz.csv';
  function q(s) { return '"' + String(s).replace(/"/g, '""') + '"'; }
  salida = '﻿' + ['archivo,nivel,categoria,texto']
    .concat(filas.map(function (f) {
      return [q(f.archivo), q(f.nivel), q(f.categoria), q(f.texto)].join(',');
    })).join('\r\n');
  // BOM y CRLF para que Excel en Windows abra las tildes bien a la primera.

} else {
  destino = 'guion-voz.md';
  var caracteres = filas.reduce(function (s, f) { return s + f.texto.length; }, 0);
  var lineas = [
    '# CIEHS · Guion de locución',
    '',
    'Generado por `tools/guion-voz.js` a partir del banco real de preguntas.',
    'No editar a mano: si el banco cambia, vuelve a ejecutarlo.',
    '',
    '- **' + filas.length + ' pistas** · **' + caracteres.toLocaleString('es-PE') + ' caracteres** en total.',
    '- Nombra cada archivo **exactamente** como dice su fila.',
    '- Súbelos desde *Administración → Aportes*, tipo **Audio**, y apruébalos.',
    '',
    '> Las opciones van numeradas y **en este orden exacto**, que es el mismo',
    '> que el estudiante ve en pantalla. No lo cambies al grabar: si "Opción 1"',
    '> del audio no es la 1 de la pantalla, el audio nombra la respuesta',
    '> equivocada, y eso es peor que no tener audio.',
    ''
  ];
  var nivelActual = null;
  filas.forEach(function (f) {
    if (f.nivel !== nivelActual) {
      nivelActual = f.nivel;
      lineas.push('', '---', '', '## ' + nivelActual, '');
    }
    lineas.push('### `' + f.archivo + '`', '', f.texto, '');
  });
  salida = lineas.join('\n');
}

fs.writeFileSync(path.join(process.cwd(), destino), salida, 'utf8');
console.log('Escrito ' + destino + ' · ' + filas.length + ' pistas · ' +
            filas.reduce(function (s, f) { return s + f.texto.length; }, 0) + ' caracteres');
