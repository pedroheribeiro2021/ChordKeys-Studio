import { FLAT_NOTES, NOTES, noteIndex, parseChord } from "./chordUtils";

const shiftNote = (note, steps, useFlats) => {
  const index = (((noteIndex(note) + steps) % 12) + 12) % 12;
  return (useFlats ? FLAT_NOTES : NOTES)[index];
};

// Transpõe fundamental e baixo mantendo o sufixo (C7M(9) +2 → D7M(9), D/F# +1 → D#/G).
// Mantém bemóis quando o acorde original foi escrito com bemol.
export const transposeChord = (chord, steps) => {
  const parsed = parseChord(chord);
  if (!parsed || steps % 12 === 0) return chord;

  const useFlats = parsed.root.includes("b");
  const root = shiftNote(parsed.root, steps, useFlats);
  const bass = parsed.bass ? `/${shiftNote(parsed.bass, steps, useFlats)}` : "";

  return `${root}${parsed.suffix}${bass}`;
};
