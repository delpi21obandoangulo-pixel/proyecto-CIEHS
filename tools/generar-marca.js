#!/usr/bin/env node
'use strict';
/* ---------------------------------------------------------------------------
   generar-marca.js — rasteriza la identidad del CIEHS a PNG.

   Los favicons, los iconos de la PWA y la tarjeta al compartir llevaban el
   ESCUDO de la I.E. 80033. Son dos marcas distintas: el escudo es del colegio y
   el isotipo del brote hidroponico es del proyecto (ver CIEHS-Identidad-Visual.md
   y la propia pagina de identidad del portal, que ya lo dice por escrito). Este
   script deja los cuatro archivos derivados del isotipo, para que no vuelvan a
   descuadrarse a mano.

   Sin dependencias: usa el Chrome que puppeteer ya dejo en cache y su modo
   --screenshot. No hay que instalar nada.

     node tools/generar-marca.js

   Reescribe:
     assets/img/icon-32.png    assets/img/icon-180.png
     assets/img/icon-512.png   assets/img/ciehs-og.png
--------------------------------------------------------------------------- */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const IMG  = path.join(RAIZ, 'assets', 'img');

/* --- localizar el Chrome de puppeteer ------------------------------------ */
function buscarChrome(){
  if(process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const base = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
  if(!fs.existsSync(base)) return null;
  // la version mas alta gana: los directorios son "win64-131.0.6778.204"
  const candidatos = fs.readdirSync(base)
    .map(d => path.join(base, d, 'chrome-win64', 'chrome.exe'))
    .filter(p => fs.existsSync(p))
    .sort();
  return candidatos.pop() || null;
}

/* --- el isotipo, en linea, para no depender de rutas al rasterizar -------- */
const ISOTIPO = fs.readFileSync(path.join(IMG, 'isotipo-ciehs.svg'), 'utf8');

/* Marco cuadrado del icono. El isotipo ya trae su propio circulo con borde, asi
   que aqui solo se le da aire (8% por lado) y un fondo blanco: en el carrusel de
   pestanas y en la pantalla de inicio de Android el PNG se recorta a un circulo
   o a un "squircle" y sin ese margen el borde verde se come. */
const paginaIcono = (lado) => `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:#ffffff;}
  body{width:${lado}px;height:${lado}px;display:grid;place-items:center;}
  svg{width:${Math.round(lado * 0.84)}px;height:${Math.round(lado * 0.84)}px;display:block;}
</style>
${ISOTIPO}`;

/* Tarjeta al compartir (WhatsApp, Facebook, X). Misma composicion que la que
   habia —fondo oscuro, marca a la izquierda, lema a la derecha— cambiando el
   escudo por el isotipo. El texto se dibuja aqui y no se hereda de ningun sitio:
   si cambia el lema, se cambia en esta plantilla y se vuelve a ejecutar. */
const paginaOG = `<!doctype html><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;padding:0;}
  body{
    width:1200px;height:630px;overflow:hidden;position:relative;
    background:
      radial-gradient(90% 120% at 12% 20%, rgba(5,150,105,.30) 0%, rgba(5,150,105,0) 60%),
      radial-gradient(80% 110% at 95% 90%, rgba(2,132,199,.26) 0%, rgba(2,132,199,0) 60%),
      linear-gradient(140deg,#07110d 0%,#0b1a16 45%,#071018 100%);
    font-family:'Space Grotesk',system-ui,sans-serif;color:#fff;
    display:flex;align-items:center;gap:64px;padding:0 76px;box-sizing:border-box;
  }
  .marca{flex:none;width:300px;display:grid;place-items:center;}
  .marca svg{width:300px;height:300px;filter:drop-shadow(0 26px 60px rgba(0,0,0,.55));}
  .texto{flex:1;min-width:0;}
  .sigla{font-family:'JetBrains Mono',monospace;font-weight:500;font-size:22px;letter-spacing:.30em;color:#6ee7b7;margin:0;}
  .nombre{font-family:'JetBrains Mono',monospace;font-weight:500;font-size:15.5px;letter-spacing:.16em;color:rgba(255,255,255,.62);margin:12px 0 0;text-transform:uppercase;}
  .lema{font-size:60px;font-weight:700;line-height:1.06;letter-spacing:-.022em;margin:30px 0 0;}
  .lema em{font-style:normal;color:#6ee7b7;display:block;}
  .pie{margin:30px 0 0;font-size:20px;line-height:1.45;color:rgba(255,255,255,.74);max-width:44ch;}
  .chips{display:flex;gap:12px;margin:32px 0 0;}
  .chip{font-family:'JetBrains Mono',monospace;font-size:14px;letter-spacing:.10em;padding:10px 18px;border-radius:999px;
        border:1px solid rgba(110,231,183,.34);color:#a7f3d0;text-transform:uppercase;}
  .chip.b{border-color:rgba(125,211,252,.34);color:#bae6fd;}
  .filo{position:absolute;left:0;right:0;bottom:0;height:6px;background:linear-gradient(90deg,#059669,#0284c7,#b45309);}
</style>
<div class="marca">${ISOTIPO}</div>
<div class="texto">
  <p class="sigla">CIEHS</p>
  <p class="nombre">Centro de Investigación Escolar Hidropónico Sostenible</p>
  <p class="lema">Cultivamos ciencia,<em>cosechamos futuro</em></p>
  <p class="pie">Laboratorio de hidroponía escolar de la I.E. N.° 80033 “José Olaya Balandra” · Huanchaco</p>
  <div class="chips"><span class="chip">ODS 13 · Acción por el Clima</span><span class="chip b">15 módulos DWC</span></div>
</div>
<div class="filo"></div>`;

/* --- rasterizado ---------------------------------------------------------- */
function rasterizar(chrome, html, ancho, alto, destino, esperaMs){
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ciehs-marca-'));
  const pagina = path.join(tmp, 'pagina.html');
  fs.writeFileSync(pagina, html, 'utf8');
  const args = [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--default-background-color=00000000',
    `--window-size=${ancho},${alto}`,
    `--screenshot=${destino}`,
    // la tarjeta usa fuentes de Google: hay que darle tiempo a que bajen
    `--virtual-time-budget=${esperaMs}`,
    'file:///' + pagina.split(path.sep).join('/')
  ];
  execFileSync(chrome, args, { stdio:'ignore' });
  fs.rmSync(tmp, { recursive:true, force:true });
  const kb = (fs.statSync(destino).size / 1024).toFixed(1);
  console.log(`  ${path.basename(destino).padEnd(16)} ${ancho}x${alto}  ${kb} kB`);
}

const chrome = buscarChrome();
if(!chrome){
  console.error('No encuentro el Chrome de puppeteer. Fija CHROME_PATH a un chrome.exe y repite.');
  process.exit(1);
}
console.log('Chrome:', chrome);
console.log('Rasterizando la identidad del CIEHS desde isotipo-ciehs.svg:');

for(const lado of [32, 180, 512]){
  rasterizar(chrome, paginaIcono(lado), lado, lado, path.join(IMG, `icon-${lado}.png`), 1500);
}
rasterizar(chrome, paginaOG, 1200, 630, path.join(IMG, 'ciehs-og.png'), 6000);

console.log('\nListo. El escudo de la I.E. 80033 ya no aparece en ningun derivado de marca.');
