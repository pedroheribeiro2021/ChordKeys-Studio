import { playSong, stopSong } from "../utils/audioEngine";
import { song } from "../utils/songData";
import { getChordNotes } from "../utils/chordUtils";

export default function Player({ setActiveNotes }) {
  const handlePlay = () => {
    playSong(song, (notes) => {
      setActiveNotes(notes);

      setTimeout(() => {
        setActiveNotes([]);
      }, 500);
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
