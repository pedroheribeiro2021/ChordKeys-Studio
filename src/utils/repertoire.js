import { isChord } from "./chordUtils";
import { parseChord } from "./chordParser";
import { isChordLine } from "./lyricsParser";

export const repertoireProfile = {
  bossa: {
    normalizeNotation: 1,
    reduceTensions: 0.4,
    reduceToTriad: 0.1,
    dropInvertedBass: 0.15,
    keepPassingDiminished: 2,
    transposeToGuitarKey: 1.2,
  },
  mpb: {
    normalizeNotation: 1,
    reduceTensions: 0.55,
    reduceToTriad: 0.15,
    dropInvertedBass: 0.2,
    keepPassingDiminished: 1.8,
    transposeToGuitarKey: 1.1,
  },
  samba: {
    normalizeNotation: 1,
    reduceTensions: 0.65,
    reduceToTriad: 0.2,
    dropInvertedBass: 0.2,
    keepPassingDiminished: 1.7,
    transposeToGuitarKey: 1,
  },
  rock: {
    normalizeNotation: 1,
    reduceTensions: 1.2,
    reduceToTriad: 1.1,
    dropInvertedBass: 0.7,
    keepPassingDiminished: 0.7,
    transposeToGuitarKey: 0.8,
  },
  pop: {
    normalizeNotation: 1,
    reduceTensions: 1,
    reduceToTriad: 0.9,
    dropInvertedBass: 0.65,
    keepPassingDiminished: 0.6,
    transposeToGuitarKey: 0.8,
  },
  unknown: {
    normalizeNotation: 1,
    reduceTensions: 1,
    reduceToTriad: 0.5,
    dropInvertedBass: 0.5,
    keepPassingDiminished: 1,
    transposeToGuitarKey: 0.6,
  },
};

const count = (chords, predicate) => chords.filter(predicate).length;

export function detectRepertoire(song) {
  const lines = String(song ?? "").split(/\r?\n/);
  const chordLines = lines.filter(isChordLine);
  const tokens = String(song ?? "").match(/\S+/g) ?? [];
  const chords = chordLines.length
    ? chordLines.flatMap((line) => line.match(/\S+/g) ?? []).filter(isChord)
    : tokens.length && tokens.every(isChord)
      ? tokens
      : [];
  if (!chords.length) return "unknown";

  const parsed = chords.map((chord) => ({ chord, parsed: parseChord(chord) }));
  const number = (degree) => count(parsed, ({ parsed: item }) =>
    !item.suffix.includes("add") &&
    item.extensions.some((extension) => Number(extension.replace(/\D/g, "")) === degree),
  );
  const seventhMajor = count(parsed, ({ chord }) => /(?:7M|maj7|Δ)/.test(chord));
  const halfDiminished = count(parsed, ({ parsed: item }) => item.quality === "half-diminished");
  const diminished = count(parsed, ({ parsed: item }) => item.quality === "diminished");
  const minorSeventh = count(parsed, ({ parsed: item }) => item.quality === "minor" && item.seventh === "minor");
  const harmonicColors = seventhMajor + number(9) + number(6) + halfDiminished + diminished;
  const colorRatio = harmonicColors / chords.length;
  const powerChords = count(parsed, ({ chord }) =>
    /(?:^|\s)[A-G][#b]?5(?:\s|$)/.test(chord),
  );
  const rockMarkers = count(parsed, ({ parsed: item, chord }) =>
    item.quality === "sus4" ||
    item.quality === "sus2" ||
    /add9/i.test(chord) ||
    /(?:^|\s)[A-G][#b]?5(?:\s|$)/.test(chord),
  );

  if (colorRatio > 0.3) {
    if (minorSeventh >= 2 && (halfDiminished + diminished) >= 2) return "mpb";
    return "bossa";
  }
  if (rockMarkers / chords.length > 0.25) {
    return powerChords / chords.length > 0.45 ? "rock" : "pop";
  }
  if (chords.length >= 4 && minorSeventh / chords.length > 0.4) return "samba";
  return "unknown";
}
