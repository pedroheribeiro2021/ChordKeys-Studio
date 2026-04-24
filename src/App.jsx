import { useState } from "react";
import Piano from "./components/Piano";
import Controls from "./components/Controls";
import Player from "./components/Player";
import ChordInput from "./components/ChordInput";
import ChordDisplay from "./components/ChordDisplay";

function App() {
  const [activeNotes, setActiveNotes] = useState([]);
  const [transpose, setTranspose] = useState(0);
  const [currentChord, setCurrentChord] = useState(null);

  return (
    <div style={{ padding: "20px" }}>
      <h1>ChordKeys Studio</h1>

      <p>Transpose: {transpose}</p>

      <button onClick={() => setTranspose(transpose + 1)}>+1</button>
      <button onClick={() => setTranspose(transpose - 1)}>-1</button>

      <ChordDisplay currentChord={currentChord} />

      <Piano activeNotes={activeNotes} />
      <Controls setActiveNotes={setActiveNotes} transpose={transpose} />
      <Player
        setActiveNotes={setActiveNotes}
        setCurrentChord={setCurrentChord}
        transpose={transpose}
      />

      <ChordInput
        setActiveNotes={setActiveNotes}
        setCurrentChord={setCurrentChord}
        transpose={transpose}
      />
    </div>
  );
}

export default App;
