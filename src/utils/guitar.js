import { NOTES, getIntervals, noteIndex, parseChord } from "./chordUtils";
import { transposeChord } from "./transpose";

// Afinação padrão, da 6ª corda (E grave) para a 1ª (E aguda)
export const TUNING = ["E", "A", "D", "G", "B", "E"].map(noteIndex);

// Formatos que o violão sabe montar. Acordes com tensões (9, 11, 13, 6, add9)
// caem no formato mais próximo, sem a tensão.
export function shapeQuality(suffix) {
  const intervals = new Set(getIntervals(suffix));
  const has = (i) => intervals.has(i);

  if (has(5) && !has(3) && !has(4)) return "sus4";
  if (has(2) && !has(3) && !has(4)) return "sus2";

  const minor = has(3) && !has(4);

  if (minor && has(6)) return has(10) ? "m7(b5)" : "dim";
  if (!minor && has(8) && !has(7)) return "aug";

  if (has(10)) return minor ? "m7" : "7";
  if (has(11)) return minor ? "m" : "7M";
  return minor ? "m" : "";
}

// Acordes abertos (sem pestana). Casas absolutas, da 6ª para a 1ª corda; -1 = não tocar.
const OPEN_SHAPES = {
  C: [-1, 3, 2, 0, 1, 0],
  D: [-1, -1, 0, 2, 3, 2],
  E: [0, 2, 2, 1, 0, 0],
  G: [3, 2, 0, 0, 0, 3],
  A: [-1, 0, 2, 2, 2, 0],
  Am: [-1, 0, 2, 2, 1, 0],
  Dm: [-1, -1, 0, 2, 3, 1],
  Em: [0, 2, 2, 0, 0, 0],
  C7: [-1, 3, 2, 3, 1, 0],
  D7: [-1, -1, 0, 2, 1, 2],
  E7: [0, 2, 0, 1, 0, 0],
  G7: [3, 2, 0, 0, 0, 1],
  A7: [-1, 0, 2, 0, 2, 0],
  B7: [-1, 2, 1, 2, 0, 2],
  Am7: [-1, 0, 2, 0, 1, 0],
  Dm7: [-1, -1, 0, 2, 1, 1],
  Em7: [0, 2, 0, 0, 0, 0],
  C7M: [-1, 3, 2, 0, 0, 0],
  D7M: [-1, -1, 0, 2, 2, 2],
  E7M: [0, 2, 1, 1, 0, 0],
  F7M: [-1, -1, 3, 2, 1, 0],
  G7M: [3, 2, 0, 0, 0, 2],
  A7M: [-1, 0, 2, 1, 2, 0],
  Asus4: [-1, 0, 2, 2, 3, 0],
  Dsus4: [-1, -1, 0, 2, 3, 3],
  Esus4: [0, 2, 2, 2, 0, 0],
  Asus2: [-1, 0, 2, 2, 0, 0],
  Dsus2: [-1, -1, 0, 2, 3, 0],
};

// Formatos móveis com pestana: casas relativas à casa da fundamental.
// "E" = fundamental na 6ª corda (formato de Mi); "A" = na 5ª corda (formato de Lá).
const MOVABLE_SHAPES = {
  E: {
    "": [0, 2, 2, 1, 0, 0],
    m: [0, 2, 2, 0, 0, 0],
    7: [0, 2, 0, 1, 0, 0],
    m7: [0, 2, 0, 0, 0, 0],
    "7M": [0, -1, 1, 1, 0, -1],
    sus4: [0, 2, 2, 2, 0, 0],
    dim: [0, 1, 2, 0, -1, -1],
    aug: [0, 3, 2, 1, 1, 0],
  },
  A: {
    "": [-1, 0, 2, 2, 2, 0],
    m: [-1, 0, 2, 2, 1, 0],
    7: [-1, 0, 2, 0, 2, 0],
    m7: [-1, 0, 2, 0, 1, 0],
    "7M": [-1, 0, 2, 1, 2, 0],
    sus4: [-1, 0, 2, 2, 3, 0],
    sus2: [-1, 0, 2, 2, 0, 0],
    dim: [-1, 0, 1, 2, 1, -1],
    "m7(b5)": [-1, 0, 1, 0, 1, -1],
    aug: [-1, 0, 3, 2, 2, 1],
  },
};

const ROOT_STRING = { E: 0, A: 1 };

// Formato de mão para o acorde: { frets, barre, quality }. barre = casa da pestana ou null.
export function getGuitarShape(chord) {
  const parsed = parseChord(chord);
  if (!parsed) return null;

  const root = noteIndex(parsed.root);
  const quality = shapeQuality(parsed.suffix);

  const open = OPEN_SHAPES[`${NOTES[root]}${quality}`];
  if (open) return { frets: open, barre: null, quality };

  const candidates = Object.entries(MOVABLE_SHAPES)
    .filter(([, shapes]) => shapes[quality])
    .map(([form, shapes]) => {
      const fret = (root - TUNING[ROOT_STRING[form]] + 12) % 12;
      return { fret, relative: shapes[quality] };
    })
    .sort((a, b) => a.fret - b.fret);

  if (candidates.length === 0) return null;

  const { fret, relative } = candidates[0];
  return {
    frets: relative.map((f) => (f < 0 ? -1 : f + fret)),
    barre: fret > 0 ? fret : null,
    quality,
  };
}

export const needsBarre = (chord) => getGuitarShape(chord)?.barre != null;

// Notas que soam no formato (classes de altura, sem repetir)
export function shapePitchClasses(frets) {
  return [...new Set(frets.flatMap((f, s) => (f < 0 ? [] : [(TUNING[s] + f) % 12])))];
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

// Reduz para tríade: C7M(9) → C, F#m7(b5) → F#m, D/F# → D, G7sus4 → G
export function simplifyChord(chord) {
  const parsed = parseChord(chord);
  if (!parsed) return chord;

  return `${parsed.root}${SIMPLE_SUFFIX[shapeQuality(parsed.suffix)]}`;
}

// Escolhe a casa do capotraste que deixa menos acordes com pestana.
// Com capo na casa N, toca-se o formato do acorde N semitons abaixo.
export function suggestCapo(chords, { maxCapo = 7, simplify = false } = {}) {
  const shapeFor = (chord, capo) => {
    const shaped = transposeChord(chord, -capo);
    return simplify ? simplifyChord(shaped) : shaped;
  };

  const barresAt = (capo) => chords.filter((c) => needsBarre(shapeFor(c, capo))).length;

  let best = { capo: 0, barres: barresAt(0) };
  for (let capo = 1; capo <= maxCapo; capo++) {
    const barres = barresAt(capo);
    if (barres < best.barres) best = { capo, barres };
  }

  return { ...best, barresWithoutCapo: barresAt(0) };
}
