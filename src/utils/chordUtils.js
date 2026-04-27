const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function getNoteIndex(note) {
  return NOTES.indexOf(note);
}

function getNoteWithOctave(note, octave) {
  return `${note}${octave}`;
}

export function getChordNotes(chord) {
  const rootMatch = chord.match(/^([A-G]#?)/);
  if (!rootMatch) return [];

  const root = rootMatch[1];
  const isMinor = chord.includes("m") && !chord.includes("maj");

  const rootIndex = getNoteIndex(root);

  let intervals;

  if (isMinor) {
    intervals = [0, 3, 7];
  } else {
    intervals = [0, 4, 7];
  }

  // 🔥 BASE: começa na oitava 3
  let octave = 3;

  return intervals.map((interval) => {
    let index = rootIndex + interval;

    let noteOctave = octave + Math.floor(index / 12);
    let note = NOTES[index % 12];

    return getNoteWithOctave(note, noteOctave);
  });
}
