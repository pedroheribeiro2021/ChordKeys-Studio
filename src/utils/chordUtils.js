const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// converte nota → índice
const getNoteIndex = (note) => notes.indexOf(note);

// gera nota com oitava
const buildNote = (note, octave) => `${note}${octave}`;

// função principal
export const getChordNotes = (chord) => {
  const isMinor = chord.includes("m");
  const root = chord.replace("m", "");

  const rootIndex = getNoteIndex(root);
  if (rootIndex === -1) return [];

  // intervalos musicais
  const intervals = isMinor
    ? [0, 3, 7] // menor
    : [0, 4, 7]; // maior

  const baseOctave = 4;

  return intervals.map((interval) => {
    const noteIndex = (rootIndex + interval) % 12;
    const octaveShift = Math.floor((rootIndex + interval) / 12);
    return buildNote(notes[noteIndex], baseOctave + octaveShift);
  });
};
