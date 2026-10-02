import { useMemo } from "react";
import { getChordNotes } from "../utils/chordUtils";

const WHITE = ["C", "D", "E", "F", "G", "A", "B"];
const BLACK = [
  { note: "C#", pos: 0.5 },
  { note: "D#", pos: 1.5 },
  { note: "F#", pos: 3.5 },
  { note: "G#", pos: 4.5 },
  { note: "A#", pos: 5.5 },
];

// Mini teclado de uma oitava com as notas do acorde acesas
function MiniChord({ chord, isActive, useInversion }) {
  const pitchClasses = getChordNotes(chord, useInversion).map((n) => n.replace(/\d/g, ""));
  const on = (note) => (pitchClasses.includes(note) ? " is-on" : "");

  return (
    <div className={`chord-card${isActive ? " is-active" : ""}`}>
      <div className="chord-card-label">{chord}</div>
      <div className="mini-keyboard" aria-label={`${chord}: ${pitchClasses.join(", ")}`}>
        {WHITE.map((note) => (
          <div key={note} className={`mini-key-white${on(note)}`} />
        ))}
        {BLACK.map(({ note, pos }) => (
          <div
            key={note}
            className={`mini-key-black${on(note)}`}
            style={{ left: `${pos * 18 + 9}px` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChordDiagram({ song, currentIndex, useInversion = false }) {
  // Acordes únicos na ordem em que aparecem.
  // Hooks precisam vir antes de qualquer return antecipado.
  const uniqueChords = useMemo(
    () => [...new Set((song ?? []).map((item) => item.chord))],
    [song],
  );

  if (uniqueChords.length === 0) {
    return <p className="muted">Os acordes da música aparecem aqui.</p>;
  }

  return (
    <div className="chord-grid">
      {uniqueChords.map((chord) => (
        <MiniChord
          key={chord}
          chord={chord}
          isActive={song[currentIndex]?.chord === chord}
          useInversion={useInversion}
        />
      ))}
    </div>
  );
}
