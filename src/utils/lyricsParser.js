import { isChord } from "./chordUtils";

// Marcadores que aparecem em linhas de acorde e não são letra: [Intro], (2x), x2, |
const MARKER_REGEX = /^(\[[^\]]*\]|\(?\d+x\)?|x\d+|\|+|\.\.\.?)$/i;

const tokenize = (line) =>
  [...line.matchAll(/\S+/g)].map((m) => ({ text: m[0], col: m.index }));

export const isChordLine = (line) => {
  const tokens = tokenize(line).filter((t) => !MARKER_REGEX.test(t.text));
  if (tokens.length === 0) return false;

  const chordCount = tokens.filter((t) => isChord(t.text)).length;
  return chordCount > 0 && chordCount >= tokens.length * 0.6;
};

// Converte uma cifra (linha de acordes sobre linha de letra) em blocos
// { chords: [{ chord, col }], lyrics }. A coluna do acorde indica a sílaba onde ele entra.
export const parseLyricsWithChords = (text) => {
  const lines = text.split(/\r?\n/);
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || !isChordLine(line)) continue;

    const chords = tokenize(line)
      .filter((t) => isChord(t.text))
      .map((t) => ({ chord: t.text, col: t.col }));

    const next = lines[i + 1] ?? "";
    const hasLyrics = next.trim() !== "" && !isChordLine(next);

    result.push({ chords, lyrics: hasLyrics ? next : "" });

    if (hasLyrics) i++;
  }

  return result;
};
