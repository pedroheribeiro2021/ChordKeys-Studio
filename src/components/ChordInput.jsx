import { useState } from "react";
import { parseChords } from "../utils/parser";
import { buildSong } from "../utils/songBuilder";
import { playSong } from "../utils/audioEngine";
import { transposeChord } from "../utils/transpose";

export default function ChordInput({ setActiveNotes, transpose }) {
  const [input, setInput] = useState("C G Am F");

  const handlePlay = () => {
    const chords = parseChords(input);

    const transposed = chords.map((ch) => transposeChord(ch, transpose));

    const song = buildSong(transposed);

    playSong(song, (notes) => {
      setActiveNotes(notes);
      setTimeout(() => setActiveNotes([]), 500);
    });
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Custom Song</h3>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        style={{ width: "300px" }}
      />

      <br />

      <button onClick={handlePlay} style={{ marginTop: "10px" }}>
        Play Input
      </button>
    </div>
  );
}
