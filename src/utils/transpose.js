const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const transposeChord = (chord, steps) => {
  const isMinor = chord.includes("m");
  const root = chord.replace("m", "");

  const index = notes.indexOf(root);
  if (index === -1) return chord;

  let newIndex = (index + steps) % 12;
  if (newIndex < 0) newIndex += 12;

  const newRoot = notes[newIndex];

  return isMinor ? newRoot + "m" : newRoot;
};
