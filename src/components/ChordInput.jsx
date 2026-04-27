import { useState } from "react";
import { parseChords } from "../utils/parser";
import { buildSong } from "../utils/songBuilder";
import { playSong, setBPM } from "../utils/audioEngine";
import { transposeChord } from "../utils/transpose";

export default function ChordInput({
  setActiveNotes,
  setCurrentChord,
  setCurrentSong,
  transpose,
  bpm,
  duration,
  setIsPlaying,
  setSongDuration,
}) {
  const [input, setInput] = useState("C G Am F");

  const handlePlay = () => {
    setBPM(bpm);

    const chords = parseChords(input);

    const transposed = chords.map((ch) => transposeChord(ch, transpose));

    const song = buildSong(transposed, duration);

    // Calcular duração total da música
    const songDuration = song.length * duration;
    setSongDuration(songDuration);

    setCurrentSong(song);

    setIsPlaying(true);

    playSong(song, (notes, chord) => {
      setActiveNotes(notes);
      setCurrentChord(chord);

      setTimeout(() => setActiveNotes([]), 500);
    });

    // Parar quando terminar
    setTimeout(() => setIsPlaying(false), songDuration * 1000);
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
