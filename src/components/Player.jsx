import { playSong, stopSong } from "../utils/audioEngine";
import { song } from "../utils/songData";
import { transposeChord } from "../utils/transpose";

export default function Player({ setActiveNotes, transpose }) {
  const handlePlay = () => {
    const transposedSong = song.map((item) => ({
      ...item,
      chord: transposeChord(item.chord, transpose),
    }));

    playSong(transposedSong, (notes) => {
      setActiveNotes(notes);

      setTimeout(() => setActiveNotes([]), 500);
    });
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
