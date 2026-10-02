import { playNotes } from "../utils/audioEngine";
import { getChordNotes } from "../utils/chordUtils";
import { transposeChord } from "../utils/transpose";

const chords = ["C", "Cm", "D", "Dm", "E", "Em", "F", "Fm", "G", "Gm", "A", "Am", "B", "Bm"];

// Atalhos para ouvir e ver um acorde no teclado, já no tom escolhido
export default function Controls({ setActiveNotes, transpose }) {
  const handlePlayChord = (chord) => {
    const notes = getChordNotes(transposeChord(chord, transpose));

    setActiveNotes(notes);
    playNotes(notes);

    setTimeout(() => setActiveNotes([]), 500);
  };

  return (
    <div className="quick-chords">
      {chords.map((chord) => (
        <button
          key={chord}
          type="button"
          className="btn btn-sm"
          onClick={() => handlePlayChord(chord)}
        >
          {transposeChord(chord, transpose)}
        </button>
      ))}
    </div>
  );
}
