import { playSong, stopSong } from "../utils/audioEngine";
import { song } from "../utils/songData";

export default function Player() {
  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Player</h3>

      <button
        onClick={() => playSong(song)}
        style={{ marginRight: "10px", padding: "10px" }}
      >
        Play
      </button>

      <button onClick={stopSong} style={{ padding: "10px" }}>
        Stop
      </button>
    </div>
  );
}
