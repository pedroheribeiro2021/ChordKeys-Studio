import { getIntervals, noteIndex, parseChord as parseSymbol } from "./chordUtils";
import { getShape, isOpenShape } from "./chordShapes";
import { repertoireProfile } from "./repertoire";

const MODE_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

const getRoot = (chord) => {
  const parsed = parseSymbol(chord);
  return parsed ? noteIndex(parsed.root) : -1;
};

function scaleFor(key, mode) {
  const parsed = parseSymbol(key ?? "");
  if (!parsed) return null;
  return (MODE_INTERVALS[mode] ?? MODE_INTERVALS.major).map(
    (interval) => (noteIndex(parsed.root) + interval) % 12,
  );
}

function functionFor(chord, key, mode) {
  const scale = scaleFor(key, mode);
  const degree = scale?.indexOf(getRoot(chord)) ?? -1;
  if (degree < 0) return null;
  if ([0, 2, 5].includes(degree)) return "tonic";
  if ([1, 3].includes(degree)) return "subdominant";
  return "dominant";
}

const chordPitches = (chord) => {
  const parsed = parseSymbol(chord);
  return parsed
    ? getIntervals(parsed.suffix).map((interval) => (noteIndex(parsed.root) + interval) % 12)
    : [];
};

function barrePenalty(shapeInfo) {
  const { frets, barre } = shapeInfo;
  if (barre == null) return 0;
  const barreStrings = frets.filter((fret) => fret === barre).length;
  const partial = barreStrings < 4;
  const additionalBarre = frets.some(
    (fret) => fret > 0 && fret !== barre && frets.filter((other) => other === fret).length >= 2,
  );
  return (barre > 5 ? 20 : 0) + (partial ? 15 : 0) + (additionalBarre ? 10 : 0);
}

export function rank(candidates, ctx = {}) {
  const {
    original,
    key,
    mode = "major",
    difficulty = "medio",
    repertoire = "unknown",
    contextBefore,
    contextAfter,
  } = ctx;
  const originalPitches = new Set(chordPitches(original));
  const originalParsed = parseSymbol(original);
  const originalIntervals = getIntervals(originalParsed?.suffix ?? "");
  const profile = repertoireProfile[repertoire] ?? repertoireProfile.unknown;
  const modifiers = {
    facil: { shape: 2, fidelity: 0.5 },
    medio: { shape: 1, fidelity: 1 },
    fiel: { shape: 0.5, fidelity: 2 },
  }[difficulty] ?? { shape: 1, fidelity: 1 };

  return candidates
    .map((candidate) => {
      const chord = typeof candidate === "string" ? candidate : candidate.chord;
      const reason = typeof candidate === "string" ? "original" : candidate.reason;
      const shapeInfo = getShape(chord);
      if (!shapeInfo) return null;
      const pitches = chordPitches(chord);
      const intervalsKept = pitches.filter((pitch) => originalPitches.has(pitch)).length;
      const totalIntervals = Math.max(originalIntervals.length, 1);
      const easyShape = isOpenShape(chord);
      const nearby = [contextBefore, contextAfter].some(
        (contextChord) => contextChord && getRoot(contextChord) === getRoot(chord),
      );
      const inKey = scaleFor(key, mode)?.includes(getRoot(chord)) ?? false;
      const functionPreserved =
        functionFor(original, key, mode) != null &&
        functionFor(original, key, mode) === functionFor(chord, key, mode);
      let score =
        (easyShape ? 40 : Math.round(shapeInfo.complexity * 0.2)) * modifiers.shape +
        (20 * intervalsKept / totalIntervals) * modifiers.fidelity +
        (functionPreserved ? 15 : 0) +
        (inKey ? 10 : 0) +
        (nearby ? 5 : 0) -
        barrePenalty(shapeInfo);
      const strategyName = {
        "normalize-notation": "normalizeNotation",
        "reduce-tensions": "reduceTensions",
        "reduce-to-triad": "reduceToTriad",
        "drop-inverted-bass": "dropInvertedBass",
        "keep-inversion": "keepPassingDiminished",
        "keep-diminished": "keepPassingDiminished",
        "transpose-to-guitar-key": "transposeToGuitarKey",
      }[reason];
      if (strategyName && reason !== "original") {
        score += (profile[strategyName] - 1) * 2;
      }

      const candidateIntervals = new Set(getIntervals(parseSymbol(chord)?.suffix ?? ""));
      const keptExtensionIntervals = originalIntervals
        .filter((interval) => [9, 14].includes(interval))
        .filter((interval) => !candidateIntervals.has(interval)).length;
      if (["bossa", "mpb"].includes(repertoire)) score -= 30 * keptExtensionIntervals;

      if (reason === "reduce-tensions" && originalParsed) {
        const removedTension =
          /(?:11|13|#11|b13|\b2\b|11\+|13\+)/.test(originalParsed.suffix) ||
          (!["bossa", "mpb", "samba"].includes(repertoire) &&
            (originalParsed.suffix.startsWith("m") || originalParsed.suffix.includes("7M")) &&
            /9/.test(originalParsed.suffix));
        if (removedTension) score += 50;
      }

      if (["rock", "pop"].includes(repertoire)) {
        const complexOriginal = /[#b](?:5|9|11|13)|(?:11|13)|alt/.test(original ?? "");
        const retainedComplexity = /[#b](?:5|9|11|13)|(?:11|13)|alt/.test(chord);
        if (complexOriginal && retainedComplexity) score -= 10;
      }

      score = Math.max(0, Math.min(100, Math.round(score)));
      return {
        chord,
        shape: shapeInfo.shape,
        score,
        reason,
        intervalsKept,
        ...(candidate?.transpose ? { transpose: candidate.transpose } : {}),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const scoreOrder = b.score - a.score;
      if (scoreOrder) return scoreOrder;
      const exactOriginal =
        Number(b.chord === original) - Number(a.chord === original);
      if (exactOriginal) return exactOriginal;
      const originalOrder = Number(b.reason === "original") - Number(a.reason === "original");
      return originalOrder || a.chord.localeCompare(b.chord);
    });
}
