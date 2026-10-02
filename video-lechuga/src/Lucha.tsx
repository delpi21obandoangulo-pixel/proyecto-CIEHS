// Lucha, la lechuga del CIEHS. La boca se mueve con el volumen real de la voz.
import React from "react";
import { interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { FRASES } from "./linea";

export type Gesto = "saluda" | "senala" | "feliz" | "normal";

// Contorno rizado: un círculo cuyo radio ondula, como el borde de la lechuga crespa.
const rizo = (cx: number, cy: number, r: number, k: number, a: number, fase: number, sy = 1) => {
  const N = 220;
  let d = "";
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2;
    const rr = r + a * Math.sin(k * t + fase) + a * 0.45 * Math.sin(2.3 * k * t + fase * 1.7);
    d += `${i ? "L" : "M"}${(cx + rr * Math.cos(t)).toFixed(1)},${(cy + rr * Math.sin(t) * sy).toFixed(1)}`;
  }
  return d + "Z";
};

// Hojita con borde ondulado (brazos y hojas sueltas).
const hojita = (largo: number, ancho: number, fase: number) => {
  const N = 40;
  const lado = (s: 1 | -1) => {
    const pts: string[] = [];
    for (let i = 0; i <= N; i++) {
      const t = s === 1 ? i / N : 1 - i / N;
      const w = Math.pow(Math.sin(Math.PI * t), 0.85) * ancho * (1 + 0.12 * Math.sin(t * 22 + fase));
      pts.push(`${(t * largo).toFixed(1)},${(s * w).toFixed(1)}`);
    }
    return pts;
  };
  return `M0,0 L${[...lado(1), ...lado(-1)].join(" L")}Z`;
};

const useBoca = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Una pista por frase; la lista es fija, así que el orden de los hooks también.
  const datos = FRASES.map((fr) => ({ fr, audio: useAudioData(staticFile(`voz/${fr.archivo}`)) }));
  const activa = datos.find(({ fr }) => frame >= fr.desde && frame < fr.desde + fr.frames);
  if (!activa || !activa.audio) return { boca: 0, habla: false };
  const v = visualizeAudio({
    audioData: activa.audio,
    fps,
    frame: frame - activa.fr.desde,
    numberOfSamples: 32,
    smoothing: true,
  });
  const media = v.slice(0, 12).reduce((s, x) => s + x, 0) / 12;
  return { boca: Math.min(1, media * 9), habla: true };
};

export const Lucha: React.FC<{ gesto: Gesto; mira?: number; entrada?: number }> = ({ gesto, mira = 1, entrada = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { boca, habla } = useBoca();

  const aparece = spring({ frame: frame - entrada, fps, config: { damping: 11, stiffness: 90 } });
  const flota = Math.sin(frame / 17) * 9;
  const respira = 1 + Math.sin(frame / 23) * 0.012 + boca * 0.025;
  const fase = frame * 0.015;

  // Parpadeo cada ~3,3 s, con un doble parpadeo de vez en cuando.
  const ciclo = frame % 100;
  const parpado = ciclo < 5 ? interpolate(ciclo, [0, 2, 5], [1, 0.08, 1]) : frame % 300 > 290 ? 0.3 : 1;

  // Brazos según el gesto.
  const ola = Math.sin(frame / 4.5);
  const brazoDer =
    gesto === "saluda" ? -55 + ola * 22 : gesto === "senala" ? -12 + Math.sin(frame / 10) * 4 : gesto === "feliz" ? -70 + ola * 12 : 18 + Math.sin(frame / 14) * 6;
  const brazoIzq = gesto === "feliz" ? 70 - ola * 12 : -18 + Math.sin(frame / 15 + 1) * 6 + (habla ? boca * 8 : 0);

  const ojoX = 7 * mira;
  const cejas = -boca * 7 + (gesto === "feliz" ? -6 : 0);

  return (
    <svg viewBox="0 0 600 760" width={640} height={810} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="cabeza" cx="45%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#d8f7b8" />
          <stop offset="45%" stopColor="#93db74" />
          <stop offset="100%" stopColor="#3f9e4c" />
        </radialGradient>
        <radialGradient id="rizoExt" cx="50%" cy="45%" r="60%">
          <stop offset="55%" stopColor="#4fb257" />
          <stop offset="100%" stopColor="#1f7a3e" />
        </radialGradient>
        <linearGradient id="hojaAtras" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f9a4c" />
          <stop offset="100%" stopColor="#0d5a34" />
        </linearGradient>
        <linearGradient id="brazo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3f9e4c" />
          <stop offset="100%" stopColor="#8fd56f" />
        </linearGradient>
        <filter id="suave" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#021a10" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Sombra en el agua */}
      <ellipse cx={300} cy={700} rx={170 - flota * 2} ry={22} fill="#021a10" opacity={0.35 * aparece} />

      <g transform={`translate(300 ${400 + flota}) scale(${aparece * respira}) translate(-300 -400)`}>
        {/* Raíces: crece en agua, así que se le ven */}
        {[-60, -30, 0, 30, 60].map((dx, i) => {
          const s = Math.sin(frame / 20 + i) * 14;
          return (
            <path
              key={i}
              d={`M${300 + dx * 0.6},560 C${300 + dx + s},610 ${300 + dx * 1.3 - s},650 ${300 + dx * 1.1 + s * 0.6},${700 + (i % 2) * 18}`}
              stroke="#f1ead2"
              strokeWidth={5 - Math.abs(i - 2)}
              fill="none"
              strokeLinecap="round"
              opacity={0.85}
            />
          );
        })}

        {/* Hojas de atrás */}
        {[-160, -125, -90, -55, -20].map((ang, i) => {
          const rad = (ang * Math.PI) / 180;
          const bal = Math.sin(frame / 25 + i * 1.3) * 3;
          return (
            <path
              key={i}
              d={rizo(300 + Math.cos(rad) * 165, 380 + Math.sin(rad) * 150, 112, 9, 9, fase + i, 1.05)}
              fill="url(#hojaAtras)"
              transform={`rotate(${bal} 300 520)`}
            />
          );
        })}

        {/* Brazo izquierdo (para quien mira) */}
        <g transform={`translate(122 470) rotate(${180 + brazoIzq})`}>
          <path d={hojita(140, 34, fase * 3)} fill="url(#brazo)" />
          <path d="M8,0 L120,0" stroke="#d8f7b8" strokeWidth={3} opacity={0.6} />
        </g>
        {/* Brazo derecho: saluda y señala hacia el panel */}
        <g transform={`translate(478 470) rotate(${brazoDer})`}>
          <path d={hojita(140, 34, fase * 3 + 2)} fill="url(#brazo)" />
          <path d="M8,0 L120,0" stroke="#d8f7b8" strokeWidth={3} opacity={0.6} />
        </g>

        {/* Cuerpo: dos capas de rizo */}
        <g filter="url(#suave)">
          <path d={rizo(300, 400, 228, 15, 13, fase, 0.98)} fill="url(#rizoExt)" />
          <path d={rizo(300, 405, 192, 12, 8, -fase * 1.3, 0.97)} fill="url(#cabeza)" />
        </g>
        {/* Nervaduras */}
        {[-70, -35, 0, 35, 70].map((dx, i) => (
          <path
            key={i}
            d={`M300,590 Q${300 + dx * 0.5},480 ${300 + dx * 1.9},${250 + Math.abs(dx) * 0.9}`}
            stroke="#f4ffe6"
            strokeWidth={4}
            fill="none"
            opacity={0.32}
            strokeLinecap="round"
          />
        ))}

        {/* Cara */}
        <g>
          {/* Mejillas */}
          <ellipse cx={205} cy={438} rx={30} ry={18} fill="#ff8f8f" opacity={0.42} />
          <ellipse cx={395} cy={438} rx={30} ry={18} fill="#ff8f8f" opacity={0.42} />
          {/* Ojos */}
          {[235, 365].map((x) => (
            <g key={x} transform={`translate(${x} 365) scale(1 ${parpado})`}>
              <ellipse rx={36} ry={43} fill="#ffffff" stroke="#1d5a32" strokeWidth={3} />
              <circle cx={ojoX} cy={6} r={21} fill="#0e1a14" />
              <circle cx={ojoX + 8} cy={-4} r={7} fill="#ffffff" />
              <circle cx={ojoX - 7} cy={14} r={3} fill="#ffffff" opacity={0.8} />
            </g>
          ))}
          {/* Cejas */}
          <path d={`M205,${310 + cejas} Q235,${296 + cejas} 262,${308 + cejas}`} stroke="#1d5a32" strokeWidth={7} fill="none" strokeLinecap="round" />
          <path d={`M338,${308 + cejas} Q365,${296 + cejas} 395,${310 + cejas}`} stroke="#1d5a32" strokeWidth={7} fill="none" strokeLinecap="round" />
          {/* Boca */}
          <Boca abre={boca} sonrie={gesto === "feliz" || !habla} />
        </g>
      </g>
    </svg>
  );
};

const Boca: React.FC<{ abre: number; sonrie: boolean }> = ({ abre, sonrie }) => {
  const cx = 300;
  const cy = 452;
  const ancho = 48 - abre * 8;
  const alto = 6 + abre * 46;
  if (abre < 0.06) {
    const curva = sonrie ? 22 : 12;
    return (
      <path
        d={`M${cx - 44},${cy - 4} Q${cx},${cy + curva} ${cx + 44},${cy - 4}`}
        stroke="#1d3b26"
        strokeWidth={7}
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  const d = `M${cx - ancho},${cy - 6} Q${cx},${cy + 2} ${cx + ancho},${cy - 6} Q${cx + ancho * 0.9},${cy + alto} ${cx},${cy + alto} Q${cx - ancho * 0.9},${cy + alto} ${cx - ancho},${cy - 6}Z`;
  return (
    <g>
      <clipPath id="bocaClip">
        <path d={d} />
      </clipPath>
      <path d={d} fill="#4a1d1f" stroke="#1d3b26" strokeWidth={6} strokeLinejoin="round" />
      <g clipPath="url(#bocaClip)">
        <ellipse cx={cx} cy={cy + alto + 4} rx={ancho * 0.7} ry={alto * 0.45} fill="#ff7a85" />
        <rect x={cx - ancho} y={cy - 8} width={ancho * 2} height={9} fill="#ffffff" opacity={abre > 0.35 ? 0.95 : 0} />
      </g>
    </g>
  );
};
