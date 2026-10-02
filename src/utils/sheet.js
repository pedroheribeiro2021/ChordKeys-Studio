import { isChord } from "./chordUtils";
import { isChordLine } from "./lyricsParser";

// Divide a cifra em linhas para exibir: { type: "chords", parts } ou { type: "text", text }.
// Nas linhas de acorde, cada acorde passa por mapChord (tom, capo, simplificação) e
// continua na mesma coluna — se ficar maior, empurra os seguintes só o necessário.
export function formatSheet(text, mapChord = (c) => c) {
  return text.split(/\r?\n/).map((line) => {
    if (!line.trim() || !isChordLine(line)) return { type: "text", text: line };

    const parts = [];
    let cursor = 0;

    for (const match of line.matchAll(/\S+/g)) {
      const token = match[0];
      const chord = isChord(token) ? mapChord(token) : null;
      const shown = chord ?? token;

      // Pelo menos um espaço entre tokens; senão, mantém a coluna original
      const col = Math.max(match.index, parts.length ? cursor + 1 : 0);
      if (col > cursor) parts.push({ text: " ".repeat(col - cursor) });

      parts.push(chord ? { text: shown, chord } : { text: shown });
      cursor = col + shown.length;
    }

    return { type: "chords", parts };
  });
}

// Acordes únicos na ordem em que aparecem na cifra já formatada
export const sheetChords = (lines) => [
  ...new Set(lines.flatMap((l) => (l.type === "chords" ? l.parts.filter((p) => p.chord).map((p) => p.chord) : []))),
];
