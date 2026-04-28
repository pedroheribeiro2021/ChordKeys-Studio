import { playSong, stopSong, setBPM } from "../utils/audioEngine";
import { song } from "../utils/songData";
import { transposeChord } from "../utils/transpose";

export default function Player({
  setActiveNotes,
  setCurrentChord,
  setCurrentSong,
  transpose,
  bpm,
  setIsPlaying,
  setSongDuration,
  duration,
  setCurrentIndex,
}) {
  const handlePlay = () => {
    setBPM(bpm);

    const transposedSong = song.map((item) => ({
      ...item,
      chord: transposeChord(item.chord, transpose),
    }));

    setCurrentSong(transposedSong);

    // Calcular duração total da música
    const songDuration = transposedSong.length * duration;
    setSongDuration(songDuration);

    setIsPlaying(true);

    playSong(transposedSong, (notes, chord, index) => {
      setActiveNotes(notes);
      setCurrentChord(chord);
      setCurrentIndex(index);

      setTimeout(() => setActiveNotes([]), 500);
    });

    // Parar quando terminar
    setTimeout(() => setIsPlaying(false), songDuration * 1000);
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Player</h3>

      <button onClick={handlePlay} style={{ marginRight: "10px" }}>
        Play
      </button>

      <button onClick={stopSong}>Stop</button>
    </div>
  );
}
