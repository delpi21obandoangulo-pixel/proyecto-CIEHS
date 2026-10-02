// Línea de tiempo: cada escena dura lo que dura su locución, más un respiro.
import guion from "./guion.json";
import duraciones from "./duraciones.json";

export const FPS = 30;
export const ANCHO = 1920;
export const ALTO = 1080;

const ENTRADA = 0.6; // s antes de la primera frase de cada escena
const PAUSA = 0.4; // s entre frases
const SALIDA = 0.8; // s después de la última frase
const FINAL = 3.5; // s extra para el cierre

export type Frase = {
  archivo: string;
  texto: string;
  desde: number; // frame absoluto
  frames: number;
};

export type Escena = {
  id: string;
  titulo: string;
  desde: number;
  frames: number;
  frases: Frase[];
};

const f = (s: number) => Math.round(s * FPS);
const dur = duraciones as Record<string, number>;

// En la locución se deletrea la dirección; en pantalla se escribe.
const aPantalla = (s: string) => s.replace("ciehs punto vercel punto app", "ciehs.vercel.app");

let cursor = 0;
export const ESCENAS: Escena[] = guion.escenas.map((e, ei) => {
  const desde = cursor;
  let t = desde + f(ENTRADA);
  const frases = e.frases.map((texto, i) => {
    const archivo = `${e.id}-${i}.mp3`;
    const frames = f(dur[`${e.id}-${i}`]);
    const frase = { archivo, texto: aPantalla(texto), desde: t, frames };
    t += frames + f(PAUSA);
    return frase;
  });
  const fin = t - f(PAUSA) + f(SALIDA) + (ei === guion.escenas.length - 1 ? f(FINAL) : 0);
  cursor = fin;
  return { id: e.id, titulo: e.titulo, desde, frames: fin - desde, frases };
});

export const FRASES = ESCENAS.flatMap((e) => e.frases);
export const DURACION = cursor;

export const C = {
  fondo1: "#04241a",
  fondo2: "#0a4a33",
  hoja: "#0f9f6e",
  hojaClara: "#9fe39a",
  crema: "#f5f6f1",
  tinta: "#0e1a14",
  sol: "#f2b33d",
  agua: "#4fc3f7",
};
