import { loadFont as geist } from "@remotion/google-fonts/Geist";
import { loadFont as geistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as serif } from "@remotion/google-fonts/InstrumentSerif";

export const fuenteSans = geist("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const fuenteMono = geistMono("normal", { weights: ["400", "600"], subsets: ["latin"] }).fontFamily;
export const fuenteSerif = serif("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] }).fontFamily;
