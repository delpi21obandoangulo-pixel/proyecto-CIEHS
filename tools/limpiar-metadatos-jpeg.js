/* Inspecciona y limpia JPEG sin dependencias.
   - Lee dimensiones del SOF.
   - Detecta APP1/Exif y si trae GPS.
   - Escribe una copia sin ningun segmento APPn (salvo APP0/JFIF) ni COM,
     que es donde viven Exif, GPS, XMP e ICC con datos del dispositivo.
   El protocolo del CIEHS exige retirar metadatos antes de publicar: una foto
   de movil puede llevar las coordenadas del laboratorio y del domicilio. */
var fs = require('fs');

function analizar(buf){
  var i = 2, out = { w:0, h:0, exif:false, gps:false, segmentos:[] };
  if(buf[0] !== 0xFF || buf[1] !== 0xD8) throw new Error('no es JPEG');
  while(i < buf.length - 1){
    if(buf[i] !== 0xFF){ i++; continue; }
    var m = buf[i+1];
    if(m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)){ i += 2; continue; }
    if(m === 0xDA) break;                       // empieza el scan
    var len = buf.readUInt16BE(i+2);
    var nombre = 'FF' + m.toString(16).toUpperCase();
    out.segmentos.push(nombre + '(' + len + ')');
    if(m === 0xE1){
      out.exif = true;
      var trozo = buf.slice(i+4, i+4+len);
      if(trozo.indexOf(Buffer.from('GPS')) !== -1) out.gps = true;
    }
    // SOF0..SOF15 salvo DHT(C4), JPG(C8) y DAC(CC)
    if(m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC){
      out.h = buf.readUInt16BE(i+5);
      out.w = buf.readUInt16BE(i+7);
    }
    i += 2 + len;
  }
  return out;
}

function limpiar(buf){
  var partes = [buf.slice(0,2)], i = 2;
  while(i < buf.length - 1){
    if(buf[i] !== 0xFF){ partes.push(buf.slice(i)); break; }
    var m = buf[i+1];
    if(m === 0xDA){ partes.push(buf.slice(i)); break; }   // scan: se copia entero
    if(m === 0x01 || (m >= 0xD0 && m <= 0xD7)){ partes.push(buf.slice(i,i+2)); i += 2; continue; }
    var len = buf.readUInt16BE(i+2);
    var esAppSobrante = (m >= 0xE1 && m <= 0xEF) || m === 0xFE;  // APP1..APP15 y comentario
    if(!esAppSobrante) partes.push(buf.slice(i, i+2+len));
    i += 2 + len;
  }
  return Buffer.concat(partes);
}

var modo = process.argv[2];
var origen = process.argv[3];
var destino = process.argv[4];
var buf = fs.readFileSync(origen);

if(modo === 'ver'){
  var a = analizar(buf);
  console.log([a.w + 'x' + a.h, a.exif ? 'EXIF' : 'sin-exif', a.gps ? 'GPS!' : 'sin-gps',
               Math.round(buf.length/1024) + 'KB', origen.replace(/^.*[\\/]/,'')].join('\t'));
} else if(modo === 'limpiar'){
  var salida = limpiar(buf);
  fs.writeFileSync(destino, salida);
  var b = analizar(salida);
  console.log(destino.replace(/^.*[\\/]/,'') + '\t' + b.w + 'x' + b.h +
              '\t' + (b.exif ? 'AUN TIENE EXIF' : 'sin-exif') +
              '\t' + (b.gps ? 'AUN TIENE GPS' : 'sin-gps') +
              '\t' + Math.round(salida.length/1024) + 'KB');
}
