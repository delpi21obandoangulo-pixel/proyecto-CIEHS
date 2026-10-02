import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, ESCENAS, FRASES } from "./linea";
import { Gesto, Lucha } from "./Lucha";
import { EscenaAgua, EscenaBeneficios, EscenaCierre, EscenaHola, EscenaPorque, EscenaReservar } from "./Escenas";
import { fuenteSans } from "./fuentes";

const PANELES = { hola: EscenaHola, agua: EscenaAgua, beneficios: EscenaBeneficios, reservar: EscenaReservar, porque: EscenaPorque, cierre: EscenaCierre } as const;
const GESTOS: Record<string, Gesto> = { hola: "saluda", agua: "senala", beneficios: "normal", reservar: "senala", porque: "normal", cierre: "feliz" };

const Fondo: React.FC = () => {
  const frame = useCurrentFrame();
  const mancha = (x: number, y: number, r: number, color: string, v: number, ph: number) => (
    <div
      style={{
        position: "absolute",
        left: x + Math.sin(frame / v + ph) * 140 - r,
        top: y + Math.cos(frame / (v * 1.3) + ph) * 90 - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
      }}
    />
  );
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${C.fondo1} 0%, ${C.fondo2} 100%)`, overflow: "hidden" }}>
      {mancha(400, 300, 600, "rgba(15,159,110,0.45)", 60, 0)}
      {mancha(1500, 800, 700, "rgba(11,127,184,0.28)", 75, 2)}
      {mancha(1300, 150, 500, "rgba(159,227,154,0.18)", 50, 4)}
      {/* Agua bajo Lucha */}
      <div style={{ position: "absolute", left: 60, top: 800, width: 800, height: 200, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(79,195,247,0.22), transparent 70%)" }} />
    </AbsoluteFill>
  );
};

// Hojitas que caen en el cierre.
const Hojas: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 26 }).map((_, i) => {
        const x = (i * 211) % 1920;
        const y = -80 + ((frame * (3 + (i % 4)) + i * 97) % 1250);
        const giro = frame * (2 + (i % 3)) + i * 40;
        return (
          <svg key={i} viewBox="0 0 40 24" width={44 + (i % 3) * 14} style={{ position: "absolute", left: x + Math.sin(frame / 15 + i) * 40, top: y, transform: `rotate(${giro}deg)`, opacity: 0.85 }}>
            <path d="M2 12 Q20 -4 38 12 Q20 28 2 12Z" fill={i % 2 ? C.hojaClara : C.hoja} />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

const Subtitulo: React.FC = () => {
  const frame = useCurrentFrame();
  const fr = FRASES.find((x) => frame >= x.desde - 4 && frame < x.desde + x.frames + 8);
  if (!fr) return null;
  const p = (frame - fr.desde) / fr.frames;
  const entra = interpolate(frame - fr.desde, [-4, 4], [0, 1], { extrapolateRight: "clamp" });
  const sale = interpolate(frame, [fr.desde + fr.frames, fr.desde + fr.frames + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const palabras = fr.texto.split(" ");
  const total = fr.texto.length;
  let acum = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 160,
        right: 160,
        bottom: 70,
        display: "flex",
        justifyContent: "center",
        opacity: entra * sale,
        transform: `translateY(${(1 - entra) * 16}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          padding: "20px 40px",
          borderRadius: 26,
          background: "rgba(2,20,13,0.72)",
          border: "1.5px solid rgba(245,246,241,0.14)",
          fontFamily: fuenteSans,
          fontSize: 46,
          fontWeight: 600,
          lineHeight: 1.25,
          textAlign: "center",
          color: C.crema,
        }}
      >
        {palabras.map((w, i) => {
          const dicha = acum / total < p;
          acum += w.length + 1;
          return (
            <span key={i} style={{ color: dicha ? C.crema : "rgba(245,246,241,0.45)" }}>
              {w}{" "}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const escena = ESCENAS.find((e) => frame >= e.desde && frame < e.desde + e.frames) ?? ESCENAS[ESCENAS.length - 1];
  const final = ESCENAS[ESCENAS.length - 1];
  return (
    <AbsoluteFill>
      <Fondo />
      {ESCENAS.map((e) => {
        const Panel = PANELES[e.id as keyof typeof PANELES];
        return (
          <Sequence key={e.id} from={e.desde} durationInFrames={e.frames} name={e.titulo}>
            <Panel e={e} />
          </Sequence>
        );
      })}
      <div style={{ position: "absolute", left: 130, top: 110 }}>
        <Lucha gesto={GESTOS[escena.id]} mira={escena.id === "cierre" ? 0 : 1} entrada={2} />
      </div>
      <Sequence from={final.frases[0].desde}>
        <Hojas />
      </Sequence>
      <Subtitulo />
      {FRASES.map((fr) => (
        <Sequence key={fr.archivo} from={fr.desde} durationInFrames={fr.frames + 6}>
          <Audio src={staticFile(`voz/${fr.archivo}`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
