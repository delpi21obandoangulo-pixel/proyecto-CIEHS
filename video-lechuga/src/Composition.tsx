import { Composition } from "remotion";
import { Video } from "./Video";
import { ALTO, ANCHO, DURACION, FPS } from "./linea";

export const MyComposition = () => (
  <Composition id="LechugaPromo" component={Video} durationInFrames={DURACION} fps={FPS} width={ANCHO} height={ALTO} />
);
