import { useState } from "react";
import { parseChords } from "../utils/parser";
import { buildSong, buildSongFromLyrics } from "../utils/songBuilder";
import { parseLyricsWithChords } from "../utils/lyricsParser";
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
  learningMode,
}) {
  const [input, setInput] = useState("C G Am F");

  const handlePlay = () => {
    // Travar autoplay no modo aprendizado
    if (learningMode) return;

    setBPM(bpm);

    // Tenta parsear como letra com acordes
    const parsed = parseLyricsWithChords(input);

    let song;
    if (parsed.length > 0) {
      // Formato de letra com acordes
      song = buildSongFromLyrics(parsed);
    } else {
      // Formato simples (acordes apenas)
      const chords = parseChords(input);
      const transposed = chords.map((ch) => transposeChord(ch, transpose));
      song = buildSong(transposed, duration);
    }

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
