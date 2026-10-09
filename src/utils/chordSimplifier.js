import { getIntervals, NOTES, noteIndex, parseChord as parseSymbol } from "./chordUtils";
import { parseChord, formatChord } from "./chordParser";
import { getShape } from "./chordShapes";
import { rank } from "./chordRanker";
import { transposeChord } from "./transpose";

const DEFAULT_GUITAR_KEYS = ["G", "C", "D", "A", "E"];
const BASE_CHORD = (parsed, extensions = [], alterations = []) =>
  formatChord({ ...parsed, extensions, alterations });

function canonicalNotation(chord) {
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  const suffix = parsed.suffix
    .replace(/maj7|M7|Δ/g, "7M")
    .replace(/[º°]/g, "dim")
    .replace(/ø/g, "m7(b5)")
    .replace(/^\+$/, "aug")
    .replace(/\bsus\b/g, "sus4");
  return `${parsed.root}${suffix}${parsed.bass ? `/${parsed.bass}` : ""}`;
}

const passingBass = (current, after) => {
  if (!current?.bass || !after) return false;
  const nextBass = after.bass ?? after.root;
  const difference = (noteIndex(current.bass) - noteIndex(nextBass) + 12) % 12;
  return difference === 1 || difference === 2;
};

function hasDescendingBassLine(parsed, before, after) {
  if (!parsed?.bass) return false;
  const beforeBass = before?.bass ?? before?.root;
  const afterBass = after?.bass ?? after?.root;
  return passingBass(parsed, after) || (beforeBass && afterBass &&
    (noteIndex(beforeBass) - noteIndex(parsed.bass) + 12) % 12 <= 2 &&
    (noteIndex(parsed.bass) - noteIndex(afterBass) + 12) % 12 <= 2);
}

function hasChromaticRootLine(parsed, before, after) {
  if (!before || !after) return false;
  const previousRoot = noteIndex(before.root);
  const root = noteIndex(parsed.root);
  const nextRoot = noteIndex(after.root);
  return (previousRoot - root + 12) % 12 === 1 &&
    (root - nextRoot + 12) % 12 === 1;
}

function reducedTensionCandidates(chord, parsed) {
  const suffix = parsed.suffix;
  const loweredNinth = /(?:9-|b9)/.test(suffix);
  const hasSimpleNinth = /(?:^|[^b#\d])9(?:\)|\/|$)/.test(suffix);
  const hasOtherAlteration = /[#b](?:5|9|11|13)|(?:11\+|13\+|9\+)/.test(suffix);
  const base = BASE_CHORD(parsed);

  if (!parsed.seventh && !parsed.extensions.length && !parsed.alterations.length) return [];
  if (
    !hasOtherAlteration &&
    !/(?:11|13|\b2\b)/.test(suffix) &&
    !(parsed.quality === "minor" && parsed.extensions.includes("9")) &&
    !(parsed.seventh === "major" && parsed.extensions.includes("9"))
  ) {
    return [];
  }

  const candidates = [];
  if (loweredNinth && /(?:13|11|#11|11\+)/.test(suffix)) {
    const b9 = `${parsed.root}${parsed.quality === "minor" ? "m" : ""}7(b9)`;
    candidates.push({ chord: b9, reason: "reduce-tensions" });
  }
  if (hasSimpleNinth && parsed.seventh === "minor" && parsed.quality === "major" &&
      !/(?:11|13|#|b|[+-])/.test(suffix)) {
    return candidates;
  }
  candidates.push({ chord: base, reason: "reduce-tensions" });
  return candidates;
}

function triadFor(parsed, keepBass = true) {
  const quality = parsed.quality === "half-diminished" ? "minor" : parsed.quality;
  return BASE_CHORD(
    { ...parsed, quality, seventh: null, bass: keepBass ? parsed.bass : null },
    [],
    [],
  );
}

function transposeAlternatives(chord, parsedContext) {
  const { key, repertoire } = parsedContext;
  if (!key || !["bossa", "mpb"].includes(repertoire)) return [];
  const originalKey = noteIndex(key);
  return DEFAULT_GUITAR_KEYS.flatMap((targetKey) => {
    const shift = (noteIndex(targetKey) - originalKey + 12) % 12;
    if (!shift) return [];
    return [{
      chord: transposeChord(chord, shift),
      reason: "transpose-to-guitar-key",
      transpose: shift,
    }];
  });
}

export function simplifyChordSmart(chord, context = {}) {
  const parsed = parseChord(chord);
  if (!parsed) return { original: chord, options: [] };
  const ctx = {
    mode: "major",
    difficulty: "medio",
    repertoire: "unknown",
    ...context,
  };
  if (!context.difficulty && context.userSkill) {
    ctx.difficulty = {
      iniciante: "facil",
      intermediario: "medio",
      avancado: "fiel",
    }[context.userSkill] ?? ctx.difficulty;
  }
  const before = parseChord(ctx.contextBefore ?? "");
  const after = parseChord(ctx.contextAfter ?? "");
  const candidates = [{ chord, reason: "original" }];

  if (!ctx.allowedStrategies || ctx.allowedStrategies.includes("normalizeNotation")) {
    const normalized = canonicalNotation(chord);
    if (normalized !== chord) candidates.push({ chord: normalized, reason: "normalize-notation" });
  }

  let tensionCandidates = [];
  if (!ctx.allowedStrategies || ctx.allowedStrategies.includes("reduceTensions")) {
    tensionCandidates = reducedTensionCandidates(chord, parsed);
    candidates.push(...tensionCandidates);
  }

  const hasAllowedShape = !ctx.allowedShapes || candidates.some((candidate) =>
    ctx.allowedShapes.includes(getShape(candidate.chord)?.shape),
  );
  const tensionShapeAvailable = tensionCandidates.some((candidate) => getShape(candidate.chord));
  const canUseTriad =
    ["rock", "pop"].includes(ctx.repertoire) ||
    (tensionCandidates.length > 0 && !tensionShapeAvailable) ||
    (tensionCandidates.length === 0 && !getShape(chord));
  if (
    (!ctx.allowedStrategies || ctx.allowedStrategies.includes("reduceToTriad")) &&
    (!hasAllowedShape || canUseTriad)
  ) {
    const triad = triadFor(parsed);
    candidates.push({ chord: triad, reason: "reduce-to-triad" });
    if (ctx.allowedShapes && parsed.bass) {
      const rootTriad = triadFor(parsed, false);
      if (ctx.allowedShapes.includes(getShape(rootTriad)?.shape)) {
        candidates.push({ chord: rootTriad, reason: "reduce-to-triad" });
      }
    }
  }

  if ((!ctx.allowedStrategies || ctx.allowedStrategies.includes("dropInvertedBass")) && parsed.bass) {
    if (!ctx.contextBefore && !ctx.contextAfter || hasDescendingBassLine(parsed, before, after)) {
      candidates.push({ chord, reason: "keep-inversion" });
    } else {
      candidates.push({
        chord: `${parsed.root}${parsed.suffix}`,
        reason: "drop-inverted-bass",
      });
    }
  }

  if ((!ctx.allowedStrategies || ctx.allowedStrategies.includes("keepPassingDiminished")) &&
      parsed.quality === "diminished") {
    const beforeBass = before?.bass ?? before?.root;
    const afterBass = after?.bass ?? after?.root;
    const root = noteIndex(parsed.root);
    const passing =
      (beforeBass &&
        afterBass &&
        (root - noteIndex(beforeBass) + 12) % 12 === 1 &&
        (noteIndex(afterBass) - root + 12) % 12 === 1) ||
      hasChromaticRootLine(parsed, before, after);
    if (passing || (!before && !after)) {
      candidates.push({ chord, reason: "keep-diminished" });
    }
  }

  if (
    parsed.quality === "half-diminished" &&
    (!ctx.allowedStrategies || ctx.allowedStrategies.includes("functionalSubstitute"))
  ) {
    candidates.push({
      chord: `${parsed.root}m`,
      reason: "functional-substitute",
    });
  }

  if (
    parsed.quality === "sus4" &&
    after?.root === parsed.root &&
    /7/.test(after.suffix) &&
    (!ctx.allowedStrategies || ctx.allowedStrategies.includes("susResolution"))
  ) {
    candidates.push({
      chord: `${parsed.root}7`,
      reason: "sus-resolution",
    });
  }

  if (
    after &&
    parsed.quality === "minor" &&
    parsed.seventh === "minor" &&
    (!ctx.allowedStrategies || ctx.allowedStrategies.includes("dominantOfNext"))
  ) {
    const targetRoot = noteIndex(after.root);
    const dominantRoot = NOTES[(targetRoot + 7) % 12];
    candidates.push({
      chord: `${dominantRoot}7`,
      reason: "dominant-of-next",
    });
  }

  if (!ctx.allowedStrategies || ctx.allowedStrategies.includes("transposeToGuitarKey")) {
    candidates.push(...transposeAlternatives(chord, ctx));
  }

  const deduped = new Map();
  const reasonPriority = {
    "keep-inversion": 0,
    "keep-diminished": 0,
    original: 1,
    "normalize-notation": 2,
    "reduce-tensions": 3,
    "drop-inverted-bass": 4,
    "reduce-to-triad": 5,
    "transpose-to-guitar-key": 6,
    "functional-substitute": 3,
    "sus-resolution": 3,
    "dominant-of-next": 3,
  };
  for (const candidate of candidates) {
    const key = `${candidate.chord}|${candidate.transpose ?? 0}`;
    const prior = deduped.get(key);
    if (!prior || reasonPriority[candidate.reason] < reasonPriority[prior.reason]) {
      deduped.set(key, candidate);
    }
  }

  const originalHasColor =
    Boolean(parsed.seventh) || parsed.extensions.some((extension) => ["6", "9"].includes(extension));
  const rankable = [...deduped.values()].filter((candidate) =>
    !(ctx.difficulty === "fiel" && originalHasColor && candidate.reason === "reduce-to-triad"),
  );
  let ranked = rank(rankable, { ...ctx, original: chord });
  if (ctx.allowedShapes) {
    ranked = ranked.filter((option) => ctx.allowedShapes.includes(option.shape));
  }
  return {
    original: chord,
    options: ranked.map((option) => {
      const candidate = deduped.get(`${option.chord}|${option.transpose ?? 0}`);
      return { ...option, reason: candidate.reason };
    }),
  };
}

export function suggestGuitarTranspose(chords, context = {}) {
  const key = context.key;
  if (!key || !chords.length || !["bossa", "mpb"].includes(context.repertoire)) return null;
  const keyPitch = noteIndex(key);
  const choices = DEFAULT_GUITAR_KEYS.map((target) => ({
    target,
    shift: (noteIndex(target) - keyPitch + 12) % 12,
  })).filter((choice) => choice.shift);

  return choices
    .map((choice) => {
      const shapes = chords
        .map((chord) => getShape(transposeChord(chord, choice.shift)))
        .filter(Boolean);
      const highBarres = shapes.filter((shape) => shape.barre > 5).length;
      const meanComplexity = shapes.length
        ? shapes.reduce((sum, shape) => sum + shape.complexity, 0) / shapes.length
        : 0;
      return { ...choice, highBarres, meanComplexity };
    })
    .sort((a, b) => a.highBarres - b.highBarres || b.meanComplexity - a.meanComplexity)[0] ?? null;
}

export const getChordIntervals = (chord) => {
  const parsed = parseSymbol(chord);
  return parsed ? getIntervals(parsed.suffix) : [];
};
