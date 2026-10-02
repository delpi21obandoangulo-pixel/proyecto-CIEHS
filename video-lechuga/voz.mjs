// Genera la locución de Lucha (una pista por frase) y mide cuánto dura cada una.
// Uso: node voz.mjs   →  public/voz/<escena>-<n>.mp3  +  src/duraciones.json
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { readFileSync, writeFileSync, renameSync, mkdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const guion = JSON.parse(readFileSync("src/guion.json", "utf8"));
const salida = "public/voz";
mkdirSync(salida, { recursive: true });

const escapar = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const tts = new MsEdgeTTS();
await tts.setMetadata(guion.voz, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

const duraciones = {};
for (const escena of guion.escenas) {
  for (const [i, frase] of escena.frases.entries()) {
    const nombre = `${escena.id}-${i}`;
    const tmp = path.join(salida, "_tmp");
    rmSync(tmp, { recursive: true, force: true });
    mkdirSync(tmp, { recursive: true });
    const { audioFilePath } = await tts.toFile(tmp, escapar(frase), { rate: "-4%", pitch: "+6Hz" });
    const destino = path.join(salida, `${nombre}.mp3`);
    renameSync(audioFilePath, destino);
    rmSync(tmp, { recursive: true, force: true });
    // MP3 de tasa constante (96 kbit/s): la duración sale del tamaño.
    const seg = (statSync(destino).size * 8) / 96000;
    duraciones[nombre] = seg;
    console.log(nombre, seg.toFixed(2), "s");
  }
}
tts.close();
writeFileSync("src/duraciones.json", JSON.stringify(duraciones, null, 2));
