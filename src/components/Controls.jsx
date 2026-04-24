import { playNotes } from "../utils/audioEngine";
import { getChordNotes } from "../utils/chordUtils";

const chords = ["C", "G", "Am", "F"];

export default function Controls({ setActiveNotes }) {
  const handlePlayChord = (chord) => {
    const notes = getChordNotes(chord);

    setActiveNotes(notes);
    playNotes(notes);

    setTimeout(() => setActiveNotes([]), 500);
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Chords</h3>
      {chords.map((chord) => (
        <button
          key={chord}
          onClick={() => handlePlayChord(chord)}
          style={{ marginRight: "10px", padding: "10px" }}
        >
          {chord}
        </button>
      ))}
    </div>
  );
}
