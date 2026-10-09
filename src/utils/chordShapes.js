import { NOTES, getIntervals, noteIndex, parseChord as parseSymbol } from "./chordUtils";

export const OPEN_SHAPES = {
  C: "x32010",
  D: "xx0232",
  E: "022100",
  G: "320003",
  A: "x02220",
  Am: "x02210",
  Dm: "xx0231",
  Em: "022000",
  C7: "x32310",
  D7: "xx0212",
  E7: "020100",
  G7: "320001",
  A7: "x02020",
  B7: "x21202",
  Am7: "x02010",
  Dm7: "xx0211",
  Em7: "020000",
  C7M: "x32000",
  D7M: "xx0222",
  E7M: "021100",
  F7M: "xx3210",
  G7M: "320002",
  A7M: "x02120",
  Asus4: "x02230",
  Dsus4: "xx0233",
  Esus4: "022200",
  Asus2: "x02200",
  Dsus2: "xx0230",
  Bm: "x24432",
  "F#7": "242322",
  Gm: "355333",
  F: "133211",
  "F#": "244322",
};

const MOVABLE_SHAPES = {
  E: {
    "": "022100",
    m: "022000",
    7: "020100",
    m7: "020000",
    "7M": "0x110x",
    sus4: "022200",
    dim: "0120xx",
    aug: "032110",
  },
  A: {
    "": "x02220",
    m: "x02210",
    7: "x02020",
    m7: "x02010",
    "7M": "x02120",
    sus4: "x02230",
    sus2: "x02200",
    dim: "x0121x",
    "m7(b5)": "x0101x",
    aug: "x03221",
  },
};

const TUNINGS = {
  standard: ["E", "A", "D", "G", "B", "E"].map(noteIndex),
};
const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
const ROOT_STRING = { E: 0, A: 1 };
const KNOWN_BARRES = { Bm: 2, "F#7": 2, Gm: 3, F: 1, "F#": 2 };

function qualityFor(suffix) {
  const intervals = new Set(getIntervals(suffix));
  const has = (interval) => intervals.has(interval);
  if (has(5) && !has(3) && !has(4)) return "sus4";
  if (has(2) && !has(3) && !has(4)) return "sus2";
  const minor = has(3) && !has(4);
  if (minor && has(6)) return has(10) ? "m7(b5)" : "dim";
  if (!minor && has(8) && !has(7)) return "aug";
  if (has(10)) return minor ? "m7" : "7";
  if (has(11)) return minor ? "m" : "7M";
  return minor ? "m" : "";
}

export { qualityFor as shapeQuality };

const parseShape = (shape) => [...shape].map((fret) => (fret === "x" ? -1 : Number(fret)));
const shapeString = (frets) =>
  frets.map((fret) => (fret < 0 ? "x" : fret < 10 ? String(fret) : `(${fret})`)).join("");

function barrePosition(frets) {
  const signature = shapeString(frets);
  const knownBarre = Object.entries(OPEN_SHAPES)
    .find(([chord, shape]) => shape === signature && Object.hasOwn(KNOWN_BARRES, chord));
  if (knownBarre) return KNOWN_BARRES[knownBarre[0]];
  if (
    Object.entries(OPEN_SHAPES).some(([chord, shape]) =>
      shape === signature && !Object.hasOwn(KNOWN_BARRES, chord),
    )
  ) {
    return null;
  }
  const positions = [...new Set(frets.filter((fret) => fret > 0))].sort((a, b) => a - b);
  for (const fret of positions) {
    const strings = frets.flatMap((value, index) => value === fret ? [index] : []);
    if (strings.length < 2) continue;
    const between = frets.slice(strings[0], strings[strings.length - 1] + 1);
    if (between.every((value) => value < 0 || value >= fret)) return fret;
  }
  return null;
}

export function shapeComplexity(shape) {
  const frets = Array.isArray(shape) ? shape : parseShape(shape);
  const fretted = frets.filter((fret) => fret > 0);
  const openStrings = frets.some((fret) => fret === 0);
  const barre = barrePosition(frets);
  const fretPosition = fretted.length ? Math.min(...fretted) : 0;
  const fingerCount = barre == null
    ? fretted.length
    : new Set(fretted.filter((fret) => fret !== barre)).size + 1;
  const score =
    (openStrings ? 40 : 0) +
    (barre == null ? 30 : 15) -
    5 * fretPosition -
    3 * fingerCount;
  return Math.max(0, Math.min(100, score));
}

function describe(shape) {
  const frets = parseShape(shape);
  return {
    shape,
    frets,
    barre: barrePosition(frets),
    quality: null,
    complexity: shapeComplexity(frets),
  };
}

function lowestPitch(frets) {
  const pitches = frets.flatMap((fret, index) =>
    fret < 0 ? [] : [OPEN_MIDI[index] + fret],
  );
  return pitches.length ? Math.min(...pitches) : Infinity;
}

function inversionVoicings(shape, bass, chordPitches, openPitches) {
  if (!bass) return [];
  const bassPitch = noteIndex(bass);
  if (!chordPitches.has(bassPitch)) return [];
  const candidates = [];

  for (let string = 0; string < shape.frets.length; string++) {
    for (let fret = 0; fret <= 8; fret++) {
      if ((openPitches[string] + fret) % 12 !== bassPitch) continue;
      const frets = shape.frets.map((value, index) => index < string ? -1 : value);
      frets[string] = fret;
      if (lowestPitch(frets) % 12 !== bassPitch) continue;
      if (frets.some((value, index) =>
        value >= 0 && !chordPitches.has((openPitches[index] + value) % 12),
      )) continue;
      candidates.push({
        shape: shapeString(frets),
        frets,
        barre: barrePosition(frets),
        quality: shape.quality,
        complexity: shapeComplexity(frets),
      });
    }
  }
  return candidates;
}

export function getShape(chord, tuning = "standard") {
  const parsed = parseSymbol(chord);
  const openPitches = TUNINGS[typeof tuning === "string" ? tuning : "standard"];
  if (!parsed || !openPitches) return null;
  const root = noteIndex(parsed.root);
  const quality = qualityFor(parsed.suffix);
  const canonicalRoot = NOTES[root];
  const openName = `${canonicalRoot}${quality}`;
  const chordPitches = new Set(
    getIntervals(parsed.suffix).map((interval) => (root + interval) % 12),
  );

  if (OPEN_SHAPES[openName]) {
    const openShape = { ...describe(OPEN_SHAPES[openName]), quality };
    if (!parsed.bass) return openShape;
    const inversions = inversionVoicings(openShape, parsed.bass, chordPitches, openPitches);
    return [openShape, ...inversions]
      .filter((candidate) => lowestPitch(candidate.frets) % 12 === noteIndex(parsed.bass))
      .sort((a, b) => b.complexity - a.complexity || (a.barre ?? 0) - (b.barre ?? 0))[0] ??
      openShape;
  }

  const choices = Object.entries(MOVABLE_SHAPES)
    .filter(([, shapes]) => shapes[quality])
    .map(([form, shapes]) => {
      const position = (root - openPitches[ROOT_STRING[form]] + 12) % 12;
      const relative = parseShape(shapes[quality]);
      const frets = relative.map((fret) => (fret < 0 ? -1 : fret + position));
      const shape = shapeString(frets);
      return {
        shape,
        frets,
        barre: position > 0 ? position : null,
        quality,
        complexity: shapeComplexity(frets),
      };
    })
    .sort((a, b) => b.complexity - a.complexity || (a.barre ?? 0) - (b.barre ?? 0));

  if (!parsed.bass) return choices[0] ?? null;
  const inversions = choices.flatMap((shape) =>
    inversionVoicings(shape, parsed.bass, chordPitches, openPitches),
  );
  return inversions
    .sort((a, b) => b.complexity - a.complexity || (a.barre ?? 0) - (b.barre ?? 0))[0] ?? null;
}

export const isOpenShape = (chord) => Object.hasOwn(OPEN_SHAPES, chord);
