export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const FLAT_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// Aceita a notação usada em cifras brasileiras: C7M, F#m7(b5), Bbº, D/F#, G7(9), Asus4...
const CHORD_REGEX =
  /^([A-G][#b]?)((?:maj|min|dim|aug|sus|add|alt|m|M|º|°|ø|Δ|\+|-|\d|\(|\)|[#b]|,)*)(\/9)?(?:\/([A-G][#b]?))?$/;

export function noteIndex(note) {
  const sharp = NOTES.indexOf(note);
  return sharp !== -1 ? sharp : FLAT_NOTES.indexOf(note);
}

export function isChord(token) {
  return CHORD_REGEX.test(token);
}

// Separa o símbolo em fundamental, sufixo e baixo. Retorna null se não for acorde.
export function parseChord(symbol) {
  const match = CHORD_REGEX.exec(symbol?.trim() ?? "");
  if (!match) return null;

  const [, root, suffix, sixNine = "", bass = null] = match;
  return { root, suffix: `${suffix}${sixNine}`, bass };
}

// Intervalos (em semitons a partir da fundamental) descritos pelo sufixo.
export function getIntervals(suffix) {
  const s = suffix
    .replace(/[º°]/g, "dim")
    .replace(/ø/g, "m7(b5)")
    .replace(/\+/g, "aug")
    .replace(/Δ/g, "7M")
    .replace(/^-/, "m")
    .replace(/maj7|M7/g, "7M");

  const isDim = s.includes("dim");
  const isMinor = isDim || /^m(?!aj)/.test(s) || s.startsWith("min");

  let third = isMinor ? 3 : 4;
  if (s.includes("sus2")) third = 2;
  else if (s.includes("sus")) third = 5;

  let fifth = 7;
  if (isDim || /b5|5-/.test(s)) fifth = 6;
  else if (s.includes("aug") || /#5|5\+/.test(s)) fifth = 8;

  const intervals = [0, third, fifth];

  // Extensões ficam dentro de parênteses ou depois do 7 (G7(9), C7M(9), G9, G13)
  const tensions = s.match(/(?:add)?[#b]?\d+/g) ?? [];

  // G9 e G13 (fora de parênteses e sem "add") implicam a sétima
  const outside = s.replace(/\(.*?\)/g, "").replace(/add\d+/g, "");
  const hasSeventh =
    outside.includes("7") || (/(9|11|13)/.test(outside) && !outside.includes("6/9"));

  if (s.includes("7M")) intervals.push(11);
  else if (isDim && s.includes("7")) intervals.push(9);
  else if (hasSeventh) intervals.push(10);
  else if (/(^|[^#b\d])6/.test(outside)) intervals.push(9);

  const TENSION_INTERVALS = { 9: 14, 11: 17, 13: 21 };
  for (const t of tensions) {
    const degree = Number(t.replace(/\D/g, ""));
    const base = TENSION_INTERVALS[degree];
    if (base === undefined) continue;
    const shift = t.includes("b") && !t.startsWith("add") ? -1 : t.includes("#") ? 1 : 0;
    intervals.push(base + shift);
  }

  return [...new Set(intervals)].sort((a, b) => a - b);
}

export function getChordNotes(chord, useInversion = false) {
  const parsed = parseChord(chord);
  if (!parsed) return [];

  const rootIndex = noteIndex(parsed.root);
  const octaveBase = 3;

  const notes = getIntervals(parsed.suffix).map((interval) => {
    const index = rootIndex + interval;
    return `${NOTES[index % 12]}${octaveBase + Math.floor(index / 12)}`;
  });

  if (parsed.bass) {
    const bassIndex = noteIndex(parsed.bass);
    const bassNote = `${NOTES[bassIndex]}${octaveBase - 1}`;
    return [bassNote, ...notes.filter((n) => n.replace(/\d/g, "") !== NOTES[bassIndex])];
  }

  if (useInversion && notes.length > 1) {
    // Inversão simples: a nota mais grave sobe uma oitava
    const [first, ...rest] = notes;
    const octave = Number(first.replace(/\D/g, ""));
    return [...rest, `${first.replace(/\d/g, "")}${octave + 1}`];
  }

  return notes;
}
