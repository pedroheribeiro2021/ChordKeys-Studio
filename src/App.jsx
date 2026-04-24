import { useState } from "react";
import Piano from "./components/Piano";
import Controls from "./components/Controls";
import Player from "./components/Player";
import ChordInput from "./components/ChordInput";
import ChordDisplay from "./components/ChordDisplay";
import Timeline from "./components/Timeline";

function App() {
  const [activeNotes, setActiveNotes] = useState([]);
  const [transpose, setTranspose] = useState(0);
  const [currentChord, setCurrentChord] = useState(null);
  const [currentSong, setCurrentSong] = useState([]);
  const [bpm, setBpm] = useState(90);
  const [duration, setDuration] = useState(1);

  return (
    <div style={{ padding: "20px" }}>
      <h1>ChordKeys Studio</h1>

      <p>Transpose: {transpose}</p>

      <button onClick={() => setTranspose(transpose + 1)}>+1</button>
      <button onClick={() => setTranspose(transpose - 1)}>-1</button>

      <div style={{ marginTop: "20px" }}>
        <h3>Controls</h3>

        <label>BPM: {bpm}</label>
        <input
          type="range"
          min="60"
          max="180"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
        />

        <br />

        <label>Chord Duration: {duration}</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.5"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
      </div>

      <Timeline song={currentSong} currentChord={currentChord} />
      <ChordDisplay currentChord={currentChord} />

      <Piano activeNotes={activeNotes} />
      <Controls setActiveNotes={setActiveNotes} transpose={transpose} />
      <Player
        setActiveNotes={setActiveNotes}
        setCurrentChord={setCurrentChord}
        setCurrentSong={setCurrentSong}
        transpose={transpose}
        bpm={bpm}
      />

      <ChordInput
        setActiveNotes={setActiveNotes}
        setCurrentChord={setCurrentChord}
        setCurrentSong={setCurrentSong}
        transpose={transpose}
        bpm={bpm}
        duration={duration}
      />
    </div>
  );
}

export default App;
