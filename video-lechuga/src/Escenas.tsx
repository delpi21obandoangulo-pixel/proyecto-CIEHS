// El panel derecho de cada escena: lo que Lucha va explicando.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Escena } from "./linea";
import { fuenteSerif, fuenteSans, fuenteMono } from "./fuentes";

const useEntra = (retraso: number, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - retraso, fps, config: { damping, stiffness: 120 } });
};

// Frame (relativo a la escena) en que empieza la frase n.
const inicio = (e: Escena, n: number) => e.frases[Math.min(n, e.frases.length - 1)].desde - e.desde;

const vidrio: React.CSSProperties = {
  background: "rgba(245,246,241,0.09)",
  border: "1.5px solid rgba(245,246,241,0.18)",
  borderRadius: 28,
  backdropFilter: "blur(12px)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
};

export const Panel: React.FC<{ e: Escena; ceja: string; children: React.ReactNode }> = ({ e, ceja, children }) => {
  const frame = useCurrentFrame();
  const t = useEntra(2);
  const sale = interpolate(frame, [e.frames - 12, e.frames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ left: 900, width: 920, top: 110, height: 760, opacity: 1 - sale, transform: `translateX(${sale * -40}px)` }}>
      <div
        style={{
          fontFamily: fuenteMono,
          fontSize: 26,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: C.hojaClara,
          opacity: t,
          transform: `translateY(${(1 - t) * 20}px)`,
        }}
      >
        {ceja}
      </div>
      <div
        style={{
          fontFamily: fuenteSerif,
          fontSize: 96,
          lineHeight: 1.02,
          color: C.crema,
          marginTop: 14,
          opacity: t,
          transform: `translateY(${(1 - t) * 40}px)`,
        }}
      >
        {e.titulo}
      </div>
      <div style={{ position: "relative", flex: 1, marginTop: 36 }}>{children}</div>
    </AbsoluteFill>
  );
};

const Foto: React.FC<{ src: string; style: React.CSSProperties; zoom?: number }> = ({ src, style, zoom = 1.12 }) => {
  const frame = useCurrentFrame();
  const t = useEntra(8, 18);
  const z = interpolate(frame, [0, 400], [1, zoom]);
  return (
    <div style={{ position: "absolute", overflow: "hidden", borderRadius: 28, opacity: t, transform: `scale(${0.92 + t * 0.08})`, boxShadow: "0 30px 80px rgba(0,0,0,0.45)", ...style }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})` }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(4,36,26,0) 50%, rgba(4,36,26,0.7) 100%)" }} />
    </div>
  );
};

const Chip: React.FC<{ retraso: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ retraso, children, style }) => {
  const t = useEntra(retraso, 12);
  return (
    <div
      style={{
        ...vidrio,
        position: "absolute",
        padding: "18px 28px",
        fontFamily: fuenteSans,
        fontSize: 34,
        fontWeight: 600,
        color: C.crema,
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity: t,
        transform: `translateY(${(1 - t) * 30}px) scale(${0.9 + t * 0.1})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Punto: React.FC<{ color?: string }> = ({ color = C.hoja }) => (
  <span style={{ width: 16, height: 16, borderRadius: 99, background: color, boxShadow: `0 0 18px ${color}` }} />
);

// 1 · Hola
export const EscenaHola: React.FC<{ e: Escena }> = ({ e }) => (
  <Panel e={e} ceja="CIEHS · Venta de lechuga">
    <Foto src="fotos/invernadero-dwc-900.webp" style={{ left: 0, top: 0, width: 880, height: 470 }} />
    <Chip retraso={inicio(e, 1)} style={{ left: 30, top: 370 }}>
      <Img src={staticFile("escudo-ie80033.png")} style={{ height: 64 }} />
      <span>
        I.E. N.° 80033 José Olaya Balandra
        <br />
        <span style={{ fontWeight: 400, fontSize: 28, opacity: 0.8 }}>Huanchaco · La Libertad</span>
      </span>
    </Chip>
  </Panel>
);

// 2 · Agua
const Burbujas: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: 18 }).map((_, i) => {
        const x = (i * 137) % 860;
        const vel = 1.2 + (i % 5) * 0.35;
        const y = 470 - ((frame * vel + i * 53) % 520);
        const r = 5 + (i % 4) * 3;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: r * 2, height: r * 2, borderRadius: 99, border: "2px solid rgba(160,225,255,0.7)", background: "rgba(160,225,255,0.12)" }} />;
      })}
    </>
  );
};

export const EscenaAgua: React.FC<{ e: Escena }> = ({ e }) => (
  <Panel e={e} ceja="Hidroponía escolar">
    <Foto src="fotos/mesas-dwc-1600.webp" style={{ left: 0, top: 0, width: 880, height: 470 }} />
    <div style={{ position: "absolute", left: 0, top: 0, width: 880, height: 470, overflow: "hidden", borderRadius: 28 }}>
      <Burbujas />
    </div>
    <Chip retraso={inicio(e, 0) + 40} style={{ left: 30, top: 30 }}>
      <Punto color={C.agua} /> Agua con nutrientes
    </Chip>
    <Chip retraso={inicio(e, 0) + 70} style={{ right: 30, top: 130 }}>
      <Punto /> 15 módulos de raíz flotante
    </Chip>
    <Chip retraso={inicio(e, 1) + 10} style={{ left: 30, top: 400 }}>
      <Punto color={C.sol} /> 280 estudiantes · 1.° a 5.°
    </Chip>
    <Chip retraso={inicio(e, 1) + 50} style={{ right: 30, top: 400, fontFamily: fuenteMono, fontSize: 30 }}>
      pH 5.5–6.5 · CE 1.2–1.8
    </Chip>
  </Panel>
);

// 3 · Beneficios
const Icono: React.FC<{ tipo: string }> = ({ tipo }) => {
  const s = { width: 64, height: 64 } as const;
  switch (tipo) {
    case "gota":
      return (
        <svg viewBox="0 0 64 64" {...s}>
          <path d="M32 6 C20 24 14 32 14 41 a18 18 0 0 0 36 0 C50 32 44 24 32 6Z" fill={C.agua} />
          <path d="M23 42 a9 9 0 0 0 8 9" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
        </svg>
      );
    case "fibra":
      return (
        <svg viewBox="0 0 64 64" {...s}>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${14 + i * 14} 54 C${8 + i * 14} 36 ${26 + i * 14} 28 ${18 + i * 14} 10`} stroke={C.hojaClara} strokeWidth={5} fill="none" strokeLinecap="round" />
          ))}
        </svg>
      );
    case "reloj":
      return (
        <svg viewBox="0 0 64 64" {...s}>
          <circle cx={32} cy={32} r={24} fill="none" stroke={C.sol} strokeWidth={5} />
          <path d="M32 18 V32 L42 38" stroke={C.sol} strokeWidth={5} fill="none" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 64 64" {...s}>
          <circle cx={32} cy={32} r={26} fill={tipo === "A" ? "#f59e0b" : tipo === "K" ? C.hoja : "#a78bfa"} />
          <text x={32} y={43} textAnchor="middle" fontFamily={fuenteSans} fontWeight={700} fontSize={tipo.length > 1 ? 18 : 30} fill="#fff">
            {tipo}
          </text>
        </svg>
      );
  }
};

export const EscenaBeneficios: React.FC<{ e: Escena }> = ({ e }) => {
  const items: [string, string, string, number][] = [
    ["Fresca y crujiente", "Recién cortada", "fibra", inicio(e, 0) + 10],
    ["Casi todo agua", "Hidrata y es ligera", "gota", inicio(e, 1) + 8],
    ["Fibra", "Buena digestión", "fibra", inicio(e, 1) + 40],
    ["Vitamina A y K", "Vista y huesos", "A", inicio(e, 1) + 70],
    ["Folato", "Crecimiento sano", "B9", inicio(e, 1) + 100],
    ["Cosecha del día", "Se corta al entregarla", "reloj", inicio(e, 2) + 30],
  ];
  return (
    <Panel e={e} ceja="Beneficios">
      {items.map(([t, s, ic, d], i) => (
        <Tarjeta key={t} retraso={d} x={(i % 2) * 450} y={Math.floor(i / 2) * 165}>
          <Icono tipo={ic} />
          <div>
            <div style={{ fontSize: 38, fontWeight: 700 }}>{t}</div>
            <div style={{ fontSize: 28, opacity: 0.75, marginTop: 4 }}>{s}</div>
          </div>
        </Tarjeta>
      ))}
    </Panel>
  );
};

const Tarjeta: React.FC<{ retraso: number; x: number; y: number; children: React.ReactNode }> = ({ retraso, x, y, children }) => {
  const t = useEntra(retraso, 12);
  const frame = useCurrentFrame();
  const brillo = interpolate(frame - retraso, [0, 24], [-120, 520], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        ...vidrio,
        position: "absolute",
        left: x,
        top: y,
        width: 425,
        height: 140,
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        gap: 22,
        overflow: "hidden",
        fontFamily: fuenteSans,
        color: C.crema,
        opacity: t,
        transform: `translateY(${(1 - t) * 40}px) scale(${0.85 + t * 0.15})`,
      }}
    >
      {children}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: brillo, width: 90, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)", transform: "skewX(-20deg)" }} />
    </div>
  );
};

// 4 · Reservar: un teléfono que muestra cada paso.
export const EscenaReservar: React.FC<{ e: Escena }> = ({ e }) => {
  const frame = useCurrentFrame();
  const pasos = [
    { txt: "Entra a ciehs.vercel.app", d: inicio(e, 1) },
    { txt: "Toca «Reservar»", d: inicio(e, 1) + 60 },
    { txt: "Elige y cuántas", d: inicio(e, 2) },
    { txt: "Nombre y contacto", d: inicio(e, 2) + 75 },
    { txt: "Ventas confirma el día", d: inicio(e, 3) },
  ];
  const activo = pasos.reduce((a, p, i) => (frame >= p.d ? i : a), -1);
  return (
    <Panel e={e} ceja="Cómo comprar">
      <Telefono paso={activo} desde={activo >= 0 ? pasos[activo].d : 0} />
      <div style={{ position: "absolute", left: 400, top: 10, display: "flex", flexDirection: "column", gap: 22 }}>
        {pasos.map((p, i) => (
          <Paso key={i} n={i + 1} txt={p.txt} retraso={p.d} activo={i === activo} hecho={i < activo} />
        ))}
      </div>
    </Panel>
  );
};

const Paso: React.FC<{ n: number; txt: string; retraso: number; activo: boolean; hecho: boolean }> = ({ n, txt, retraso, activo, hecho }) => {
  const t = useEntra(retraso, 13);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, opacity: 0.25 + t * 0.75, transform: `translateX(${(1 - t) * 30}px)`, fontFamily: fuenteSans }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 99,
          display: "grid",
          placeItems: "center",
          fontSize: 30,
          fontWeight: 700,
          background: activo ? C.hoja : hecho ? "rgba(15,159,110,0.35)" : "rgba(245,246,241,0.1)",
          color: C.crema,
          boxShadow: activo ? `0 0 0 8px rgba(15,159,110,0.25), 0 0 40px ${C.hoja}` : "none",
          transform: `scale(${activo ? 1.08 : 1})`,
        }}
      >
        {hecho ? "✓" : n}
      </div>
      <div style={{ fontSize: 40, fontWeight: activo ? 700 : 500, color: C.crema }}>{txt}</div>
    </div>
  );
};

const Telefono: React.FC<{ paso: number; desde: number }> = ({ paso, desde }) => {
  const frame = useCurrentFrame();
  const t = useEntra(10, 15);
  const local = frame - desde;
  const url = "ciehs.vercel.app";
  const letras = Math.min(url.length, Math.max(0, Math.floor(local / 2)));
  const toque = (cuando: number) => interpolate(local - cuando, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tarjeta = (y: number, nombre: string, cant: number) => (
    <div style={{ position: "absolute", left: 18, right: 18, top: y, height: 104, borderRadius: 18, background: "#fff", display: "flex", alignItems: "center", gap: 14, padding: "0 14px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
      <div style={{ width: 70, height: 70, borderRadius: 14, background: "radial-gradient(circle at 40% 35%, #d8f7b8, #4fb257)" }} />
      <div style={{ flex: 1, fontSize: 22, fontWeight: 700, color: C.tinta }}>{nombre}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, fontWeight: 700, color: C.tinta }}>
        <span style={{ width: 34, height: 34, borderRadius: 99, background: "#e6e9e1", display: "grid", placeItems: "center" }}>−</span>
        {cant}
        <span style={{ width: 34, height: 34, borderRadius: 99, background: C.hoja, color: "#fff", display: "grid", placeItems: "center" }}>+</span>
      </div>
    </div>
  );
  const cant = paso === 2 ? Math.min(3, Math.floor(Math.max(0, local - 20) / 18)) : paso > 2 ? 3 : 0;
  const escribe = (s: string, d: number) => s.slice(0, Math.max(0, Math.floor((local - d) / 3)));
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 350,
        height: 690,
        borderRadius: 54,
        background: "#0b1410",
        padding: 14,
        boxShadow: "0 40px 90px rgba(0,0,0,0.5), inset 0 0 0 2px rgba(255,255,255,0.15)",
        opacity: t,
        transform: `translateY(${(1 - t) * 60}px) rotate(${(1 - t) * -6}deg)`,
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 42, background: "#f5f6f1", overflow: "hidden", fontFamily: fuenteSans }}>
        {/* Barra de dirección */}
        <div style={{ margin: "40px 16px 0", height: 50, borderRadius: 14, background: "#e6e9e1", display: "flex", alignItems: "center", padding: "0 16px", fontSize: 21, color: C.tinta, fontFamily: fuenteMono }}>
          🔒 {paso <= 0 ? url.slice(0, letras) : url}
          {paso <= 0 && frame % 20 < 10 ? "|" : ""}
        </div>
        <div style={{ margin: "18px 18px 0", fontFamily: fuenteSerif, fontSize: 40, color: C.tinta, lineHeight: 1 }}>
          {paso >= 3 ? "Tus datos" : paso >= 2 ? "Elige tu lechuga" : "Lechugas del CIEHS"}
        </div>
        {paso <= 1 && (
          <>
            <div style={{ position: "absolute", left: 18, right: 18, top: 170, height: 260, borderRadius: 22, overflow: "hidden" }}>
              <Img src={staticFile("fotos/cosecha-empaque-1600.webp")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div
              style={{
                position: "absolute",
                left: 40,
                right: 40,
                top: 470,
                height: 76,
                borderRadius: 99,
                background: C.hoja,
                color: "#fff",
                fontSize: 30,
                fontWeight: 700,
                display: "grid",
                placeItems: "center",
                boxShadow: `0 0 ${20 + Math.sin(frame / 5) * 10}px ${C.hoja}`,
                transform: `scale(${paso === 1 ? 1 - Math.sin(toque(20) * Math.PI) * 0.08 : 1})`,
              }}
            >
              Reservar
            </div>
            {paso === 1 && <Onda x={170} y={508} p={toque(20)} />}
          </>
        )}
        {paso === 2 && (
          <>
            {tarjeta(160, "Lechuga crespa", cant)}
            {tarjeta(280, "Lechuga arrepollada", 0)}
            <Onda x={290} y={212} p={toque(20)} />
          </>
        )}
        {paso === 3 && (
          <>
            {["Tu nombre", "Tu celular"].map((p, i) => (
              <div key={p} style={{ position: "absolute", left: 18, right: 18, top: 170 + i * 110, height: 84, borderRadius: 16, background: "#fff", border: `2px solid ${C.hoja}`, padding: "10px 16px", fontSize: 18, color: "#56655c" }}>
                {p}
                <div style={{ fontSize: 26, color: C.tinta, fontWeight: 600, marginTop: 4 }}>{escribe(i === 0 ? "●●●●●●" : "●●● ●●● ●●●", 10 + i * 30)}</div>
              </div>
            ))}
            <div style={{ position: "absolute", left: 40, right: 40, top: 430, height: 70, borderRadius: 99, background: C.hoja, color: "#fff", fontSize: 26, fontWeight: 700, display: "grid", placeItems: "center" }}>Enviar reserva</div>
          </>
        )}
        {paso >= 4 && (
          <div style={{ position: "absolute", inset: "150px 20px 0", textAlign: "center", color: C.tinta }}>
            <div
              style={{
                width: 150,
                height: 150,
                margin: "20px auto",
                borderRadius: 99,
                background: C.hoja,
                display: "grid",
                placeItems: "center",
                fontSize: 90,
                color: "#fff",
                transform: `scale(${spring({ frame: local, fps: 30, config: { damping: 9 } })})`,
              }}
            >
              ✓
            </div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>¡Reserva enviada!</div>
            <div style={{ fontSize: 22, marginTop: 12, color: "#3b4a42" }}>Ventas te confirma el día de entrega.</div>
          </div>
        )}
      </div>
    </div>
  );
};

const Onda: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) =>
  p <= 0 || p >= 1 ? null : (
    <div style={{ position: "absolute", left: x - 60 * p, top: y - 60 * p, width: 120 * p, height: 120 * p, borderRadius: 99, border: "4px solid rgba(15,159,110,0.8)", opacity: 1 - p }} />
  );

// 5 · Por qué
export const EscenaPorque: React.FC<{ e: Escena }> = ({ e }) => {
  const destinos = ["Nutrientes y solución", "Semillas y almácigo", "Mantenimiento de los módulos", "Materiales de investigación"];
  const frame = useCurrentFrame();
  return (
    <Panel e={e} ceja="Todo vuelve al laboratorio">
      <Foto src="fotos/almacigo-trasplante-1200.webp" style={{ left: 0, top: 0, width: 330, height: 520 }} />
      {destinos.map((d, i) => {
        const r = inicio(e, 1) + 20 + i * 38;
        const lleno = interpolate(frame - r, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
        return (
          <Chip key={d} retraso={r} style={{ left: 370, top: i * 132, width: 510, height: 110, padding: "0 26px", boxSizing: "border-box" }}>
            <span style={{ fontFamily: fuenteMono, fontSize: 28, color: C.hojaClara }}>0{i + 1}</span>
            <span style={{ fontSize: 32 }}>{d}</span>
            <div style={{ position: "absolute", left: 0, bottom: 0, height: 5, width: `${lleno * 100}%`, background: `linear-gradient(90deg, ${C.hoja}, ${C.hojaClara})`, borderRadius: 4 }} />
          </Chip>
        );
      })}
      <Chip retraso={inicio(e, 2)} style={{ left: 370, top: 545, background: "rgba(15,159,110,0.3)", borderColor: C.hoja }}>
        🌱 Tu reserva hace crecer la ciencia escolar
      </Chip>
    </Panel>
  );
};

// 6 · Cierre
export const EscenaCierre: React.FC<{ e: Escena }> = ({ e }) => {
  const frame = useCurrentFrame();
  const t = useEntra(inicio(e, 1), 10);
  const latido = 1 + Math.sin(frame / 6) * 0.025;
  return (
    <Panel e={e} ceja="I.E. N.° 80033 · Huanchaco">
      <Img src={staticFile("logo-ciehs-claro.svg")} style={{ height: 120, opacity: useEntra(20) }} />
      <div
        style={{
          position: "absolute",
          top: 190,
          left: 0,
          padding: "26px 48px",
          borderRadius: 99,
          background: C.crema,
          color: C.tinta,
          fontFamily: fuenteMono,
          fontSize: 58,
          fontWeight: 600,
          opacity: t,
          transform: `scale(${(0.7 + t * 0.3) * latido})`,
          transformOrigin: "left center",
          boxShadow: `0 0 ${40 + Math.sin(frame / 6) * 20}px rgba(159,227,154,0.6)`,
        }}
      >
        ciehs.vercel.app
      </div>
      <div style={{ position: "absolute", top: 350, left: 8, fontFamily: fuenteSans, fontSize: 44, color: C.crema, opacity: t, fontWeight: 600 }}>
        Toca <span style={{ color: C.hojaClara }}>Reservar</span> y elige tu lechuga 🥬
      </div>
    </Panel>
  );
};
