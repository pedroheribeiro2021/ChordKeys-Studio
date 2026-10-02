const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function getNoteIndex(note) {
  return NOTES.indexOf(note);
}

function getNoteWithOctave(note, octave) {
  return `${note}${octave}`;
}

export function getChordNotes(chord, useInversion = false) {
  const rootMatch = chord.match(/^([A-G]#?)/);
  if (!rootMatch) return [];

  const root = rootMatch[1];
  const rootIndex = getNoteIndex(root);

  let intervals = [0, 4, 7]; // major padrão

  // 🎯 DETECÇÃO DE TIPO
  if (chord.includes("m") && !chord.includes("maj")) {
    intervals = [0, 3, 7];
  }

  if (chord.includes("7")) {
    intervals.push(10);
  }

  if (chord.includes("maj7") || chord.includes("7M")) {
    intervals = [0, 4, 7, 11];
  }

  if (chord.includes("º")) {
    intervals = [0, 3, 6];
  }

  // 🎯 BASE FIXA (evita inversão)
  const octaveBase = 3;

  let notes = intervals.map((interval) => {
    let index = rootIndex + interval;

    let octave = octaveBase + Math.floor(index / 12);
    let note = NOTES[index % 12];

    return getNoteWithOctave(note, octave);
  });

  // 🔥 GARANTE ORDEM CORRETA (grave → agudo)
  notes.sort((a, b) => {
    const getValue = (n) => {
      const note = n.replace(/[0-9]/g, "");
      const octave = parseInt(n.replace(/\D/g, ""));
      return NOTES.indexOf(note) + octave * 12;
    };

    return getValue(a) - getValue(b);
  });

  if (useInversion && notes.length > 1) {
    // Inversão simples: joga a nota mais grave para o topo
    const first = notes.shift();
    notes.push(first);
  }

  return notes;
}
