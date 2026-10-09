import { FLAT_NOTES, NOTES, getIntervals, noteIndex, parseChord } from "./chordUtils";
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

export const EASY_SHAPES = {
  Bm: "x24432",
  "F#7": "242322",
  D: "xx0232",
  G: "320033",
  Em: "022000",
  Gm: "355333",
  A: "x02220",
  E7: "020100",
  Am: "x02210",
  C: "x32010",
  Dm: "xx0231",
  F: "133211",
};

const MODE_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};
const NATURAL_NOTES = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PITCHES = [0, 2, 4, 5, 7, 9, 11];

function keyScale(key, mode) {
  const tonic = parseChord(key ?? "");
  const intervals = MODE_INTERVALS[mode] ?? MODE_INTERVALS.major;
  if (!tonic) return null;

  const tonicLetter = NATURAL_NOTES.indexOf(tonic.root[0]);
  const tonicPitch = noteIndex(tonic.root);
  return intervals.map((interval, degree) => {
    const letter = NATURAL_NOTES[(tonicLetter + degree) % NATURAL_NOTES.length];
    const expectedPitch = (tonicPitch + interval) % 12;
    const naturalPitch = NATURAL_PITCHES[NATURAL_NOTES.indexOf(letter)];
    const alteration = (expectedPitch - naturalPitch + 12) % 12;
    const accidental = alteration === 1 ? "#" : alteration === 11 ? "b" : "";
    return { pitch: expectedPitch, note: `${letter}${accidental}` };
  });
}

function spellRoot(pitch, key, mode, fallback) {
  const scale = keyScale(key, mode);
  return scale?.find((note) => note.pitch === pitch)?.note ?? (key ? FLAT_NOTES[pitch] : fallback);
}

const rootPitch = (chord) => {
  const parsed = parseChord(chord);
  return parsed ? noteIndex(parsed.root) : -1;
};

const chordName = (value) => (typeof value === "string" ? value : value?.chord ?? "");

function harmonicFunction(chord, key, mode) {
  const scale = keyScale(key, mode);
  const root = rootPitch(chord);
  const degree = scale?.findIndex((note) => note.pitch === root) ?? -1;
  if (degree < 0) return null;
  if (mode === "minor") {
    return [0, 2, 5].includes(degree) ? "tonic" : [1, 3].includes(degree) ? "subdominant" : "dominant";
  }
  return [0, 2, 5].includes(degree) ? "tonic" : [1, 3].includes(degree) ? "subdominant" : "dominant";
}

function pitchClasses(chord) {
  const parsed = parseChord(chord);
  if (!parsed) return [];
  return getIntervals(parsed.suffix).map((interval) => (noteIndex(parsed.root) + interval) % 12);
}

function fingering(chord) {
  const shape = getGuitarShape(chord);
  if (!shape) return null;
  return {
    shape: EASY_SHAPES[chord] ?? shape.frets.map((fret) => (fret < 0 ? "x" : fret)).join(""),
    barre: shape.barre,
    frets: shape.frets,
  };
}

function candidateRecord(chord, reason, original, context) {
  const parsed = parseChord(chord);
  if (!parsed) return null;
  const { key, mode, difficulty, contextBefore, contextAfter } = context;
  const root = spellRoot(noteIndex(parsed.root), key, mode, parsed.root);
  const candidate = `${root}${parsed.suffix}${parsed.bass ? `/${parsed.bass}` : ""}`;
  const fingeringInfo = fingering(candidate);
  if (!fingeringInfo) return null;

  const originalPitches = new Set(pitchClasses(original));
  const kept = pitchClasses(candidate).filter((pitch) => originalPitches.has(pitch)).length;
  const total = Math.max(originalPitches.size, 1);
  const shapeQualityScore = EASY_SHAPES[candidate]
    ? 30
    : fingeringInfo.barre == null
      ? 15
      : 0;
  const functionPreserved =
    harmonicFunction(original, key, mode) &&
    harmonicFunction(original, key, mode) === harmonicFunction(candidate, key, mode);
  const inKey = keyScale(key, mode)?.some((note) => note.pitch === rootPitch(candidate)) ?? false;
  const appearsNearby = [contextBefore, contextAfter].some(
    (nearby) => nearby && rootPitch(nearby) === rootPitch(candidate),
  );
  const highBarre = fingeringInfo.barre > 5;
  const barreStrings = fingeringInfo.frets.filter((fret) => fret === fingeringInfo.barre).length;
  const partialBarre = fingeringInfo.barre != null && barreStrings < 4;
  const doubleBarre =
    fingeringInfo.barre != null &&
    fingeringInfo.frets.some(
      (fret, index) =>
        fret > 0 &&
        fret !== fingeringInfo.barre &&
        fingeringInfo.frets.indexOf(fret) === index &&
        fingeringInfo.frets.filter((other) => other === fret).length >= 2,
    );
  const passage = context.durationBeats != null && context.durationBeats <= 2 && !context.strongBeat;

  const weights = {
    facil: { shape: 1.5, fidelity: 0.5, function: 0.5, key: 0.5 },
    medio: { shape: 1, fidelity: 1, function: 1, key: 1 },
    fiel: { shape: 0.5, fidelity: 2, function: 1.5, key: 1 },
  }[difficulty] ?? { shape: 1, fidelity: 1, function: 1, key: 1 };
  let score =
    shapeQualityScore * weights.shape +
    (20 * kept / total) * weights.fidelity +
    (functionPreserved ? 15 * weights.function : 0) +
    (inKey ? 10 * weights.key : 0) +
    (appearsNearby ? 5 : 0) -
    (partialBarre ? 15 : 0) -
    (doubleBarre ? 10 : 0) -
    (highBarre ? 20 * weights.shape : 0);
  if (passage && reason !== "original") score += 5;
  if (context.durationBeats >= 4 && context.strongBeat && reason !== "original") score -= 10;
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    chord: candidate,
    shape: fingeringInfo.shape,
    score,
    reason,
    intervalsKept: kept,
  };
}

// Generates playable alternatives and ranks them without changing the source chord.
export function simplifyChordSmart(chord, context = {}) {
  const parsed = parseChord(chord);
  if (!parsed) return { original: chord, options: [] };
  const skillDifficulty = {
    iniciante: "facil",
    intermediario: "medio",
    avancado: "fiel",
  };
  const ctx = {
    ...context,
    mode: context.mode ?? "major",
    difficulty: context.difficulty ?? skillDifficulty[context.userSkill] ?? "medio",
  };
  const quality = shapeQuality(parsed.suffix);
  const root = parsed.root;
  const after = parseChord(chordName(ctx.contextAfter));
  const candidates = [{ chord, reason: "original" }];
  const triad = `${root}${SIMPLE_SUFFIX[quality] ?? ""}`;

  candidates.push({ chord: triad, reason: "triade" });
  if (parsed.bass) candidates.push({ chord: `${root}${parsed.suffix}`, reason: "drop-bass" });

  if (quality === "m7(b5)") candidates.push({ chord: `${root}m`, reason: "substituto-funcional" });
  if (quality === "7" || parsed.suffix.includes("#") || parsed.suffix.includes("b")) {
    candidates.push({ chord: `${root}7`, reason: "dominante-simples" });
  }
  if (quality === "sus4" || quality === "sus2") {
    candidates.push({ chord: root, reason: "resolucao-sus" });
    if (quality === "sus4" && after && after.root === root && ["7", "m7"].includes(shapeQuality(after.suffix))) {
      candidates.push({ chord: `${root}7`, reason: "resolucao-sus-dominante" });
    }
  }

  if (quality === "dim" && after) {
    candidates.push({
      chord: `${after.root}m`,
      reason: "dim-passagem",
    });
  }
  if (
    quality === "m7" &&
    after &&
    ctx.key &&
    !keyScale(ctx.key, ctx.mode)?.some((note) => note.pitch === rootPitch(chord))
  ) {
    const dominantRoot = NOTES[(noteIndex(after.root) + 7) % 12];
    candidates.push({
      chord: `${spellRoot(noteIndex(dominantRoot), ctx.key, ctx.mode, dominantRoot)}7`,
      reason: "dominante-do-proximo",
    });
  }

  const byChord = new Map();
  const reasonPriority = {
    original: 0,
    "dim-passagem": 1,
    "dominante-do-proximo": 1,
    "resolucao-sus-dominante": 1,
    "substituto-funcional": 1,
    "dominante-simples": 2,
    "drop-bass": 3,
    triade: 4,
    "resolucao-sus": 5,
  };
  for (const candidate of candidates) {
    const scored = candidateRecord(candidate.chord, candidate.reason, chord, ctx);
    if (!scored) continue;
    if (ctx.allowedShapes?.length && !ctx.allowedShapes.includes(scored.shape)) continue;
    const previous = byChord.get(scored.chord);
    if (
      !previous ||
      scored.score > previous.score ||
      (scored.score === previous.score &&
        reasonPriority[scored.reason] < reasonPriority[previous.reason])
    ) {
      byChord.set(scored.chord, scored);
    }
  }

  return {
    original: chord,
    options: [...byChord.values()].sort((a, b) => b.score - a.score || a.chord.localeCompare(b.chord)),
  };
}

// Escolhe a casa do capotraste que deixa menos acordes com pestana.
// Com capo na casa N, toca-se o formato do acorde N semitons abaixo.
export function suggestCapo(chords, {
  maxCapo = 7,
  simplify = false,
  key,
  mode = "major",
  difficulty = "medio",
} = {}) {
  const shapeFor = (chord, capo) => {
    const shaped = transposeChord(chord, -capo);
    if (!simplify) return shaped;
    const shapedKey = key ? transposeChord(key, -capo) : undefined;
    return simplifyChordSmart(shaped, { key: shapedKey, mode, difficulty }).options[0]?.chord ?? shaped;
  };

  const barresAt = (capo) => chords.filter((c) => needsBarre(shapeFor(c, capo))).length;

  let best = { capo: 0, barres: barresAt(0) };
  for (let capo = 1; capo <= maxCapo; capo++) {
    const barres = barresAt(capo);
    if (barres < best.barres) best = { capo, barres };
  }

  return { ...best, barresWithoutCapo: barresAt(0) };
}
