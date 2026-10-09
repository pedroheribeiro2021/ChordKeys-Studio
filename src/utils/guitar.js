import { NOTES, getIntervals, noteIndex, parseChord } from "./chordUtils";
import { getShape, shapeQuality } from "./chordShapes";
import { simplifyChordSmart } from "./chordSimplifier";
import { transposeChord } from "./transpose";

export {
  OPEN_SHAPES,
  OPEN_SHAPES as EASY_SHAPES,
  getShape,
  shapeComplexity,
} from "./chordShapes";
export { simplifyChordSmart, suggestGuitarTranspose } from "./chordSimplifier";
export { detectRepertoire, repertoireProfile } from "./repertoire";

// Standard tuning, from the low E string to the high E string.
export const TUNING = ["E", "A", "D", "G", "B", "E"].map(noteIndex);

export { shapeQuality };

export function getGuitarShape(chord) {
  const shape = getShape(chord);
  return shape
    ? { frets: shape.frets, barre: shape.barre, quality: shape.quality }
    : null;
}

export const needsBarre = (chord) => getGuitarShape(chord)?.barre != null;

export function shapePitchClasses(frets) {
  return [...new Set(frets.flatMap((fret, string) =>
    fret < 0 ? [] : [(TUNING[string] + fret) % 12],
  ))];
}

const SIMPLE_SUFFIX = {
  "": "",
  7: "",
  "7M": "",
  aug: "",
  sus4: "",
  sus2: "",
  m: "m",
  m7: "m",
  "m7(b5)": "m",
  dim: "º",
};

function legacySimplifyChord(chord) {
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  return `${parsed.root}${SIMPLE_SUFFIX[shapeQuality(parsed.suffix)]}`;
}

// String-returning wrapper retained for existing callers; context opts into the ranked pipeline.
export function simplifyChord(chord, context) {
  if (!context) return legacySimplifyChord(chord);
  return simplifyChordSmart(chord, context).options[0]?.chord ?? chord;
}

// Capo positions are scored with the same shape lookup used by chord simplification.
export function suggestCapo(chords, { maxCapo = 7, simplify = false, ...context } = {}) {
  const shapeFor = (chord, capo) => {
    const shaped = transposeChord(chord, -capo);
    if (!simplify) return shaped;
    return simplifyChordSmart(shaped, {
      ...context,
      key: context.key ? transposeChord(context.key, -capo) : undefined,
    }).options[0]?.chord ?? shaped;
  };
  const barresAt = (capo) => chords.filter((chord) => needsBarre(shapeFor(chord, capo))).length;

  let best = { capo: 0, barres: barresAt(0) };
  for (let capo = 1; capo <= maxCapo; capo++) {
    const barres = barresAt(capo);
    if (barres < best.barres) best = { capo, barres };
  }
  return { ...best, barresWithoutCapo: barresAt(0) };
}

export { NOTES, getIntervals, noteIndex };
