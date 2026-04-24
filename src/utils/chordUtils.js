const chordMap = {
  C: ["C4", "E4", "G4"],
  D: ["D4", "F#4", "A4"],
  E: ["E4", "G#4", "B4"],
  F: ["F4", "A4", "C5"],
  G: ["G4", "B4", "D5"],
  A: ["A4", "C#5", "E5"],
  B: ["B4", "D#5", "F#5"],

  Am: ["A4", "C5", "E5"],
  Dm: ["D4", "F4", "A4"],
  Em: ["E4", "G4", "B4"],
};

export const getChordNotes = (chord) => {
  return chordMap[chord] || [];
};
