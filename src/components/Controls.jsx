import { playNotes } from "../utils/audioEngine";
import { getChordNotes } from "../utils/chordUtils";
import { transposeChord } from "../utils/transpose";

const chords = ["C", "G", "Am", "F"];

export default function Controls({ setActiveNotes, transpose }) {
  const handlePlayChord = (chord) => {
    const transposedChord = transposeChord(chord, transpose);
    const notes = getChordNotes(transposedChord);

    setActiveNotes(notes);
    playNotes(notes);

    setTimeout(() => setActiveNotes([]), 500);
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Chords</h3>

      {chords.map((chord) => {
        const displayChord = transposeChord(chord, transpose);

        return (
          <button
            key={chord}
            onClick={() => handlePlayChord(chord)}
            style={{ marginRight: "10px", padding: "10px" }}
          >
            {displayChord}
          </button>
        );
      })}
    </div>
  );
}
