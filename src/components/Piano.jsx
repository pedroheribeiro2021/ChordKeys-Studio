import Key from "./Key";
import { playNotes } from "../utils/audioEngine";

const notes = [
  "C4",
  "C#4",
  "D4",
  "D#4",
  "E4",
  "F4",
  "F#4",
  "G4",
  "G#4",
  "A4",
  "A#4",
  "B4",
  "C5",
  "C#5",
  "D5",
  "D#5",
  "E5",
];

export default function Piano({ activeNotes }) {
  const handlePlay = (note) => {
    playNotes([note]);
  };

  return (
    <div style={{ display: "flex", position: "relative" }}>
      {notes.map((note) => (
        <Key
          key={note}
          note={note}
          isBlack={note.includes("#")}
          isActive={activeNotes.includes(note)}
          onPlay={handlePlay}
        />
      ))}
    </div>
  );
}
