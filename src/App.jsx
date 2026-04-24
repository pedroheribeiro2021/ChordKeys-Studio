import { useState } from "react";
import Piano from "./components/Piano";
import Controls from "./components/Controls";
import Player from "./components/Player";
import ChordInput from "./components/ChordInput";

function App() {
  const [activeNotes, setActiveNotes] = useState([]);
  const [transpose, setTranspose] = useState(0);

  return (
    <div style={{ padding: "20px" }}>
      <h1>ChordKeys Studio</h1>

      <p>Transpose: {transpose}</p>

      <button onClick={() => setTranspose(transpose + 1)}>+1</button>
      <button onClick={() => setTranspose(transpose - 1)}>-1</button>

      <Piano activeNotes={activeNotes} />
      <ChordInput setActiveNotes={setActiveNotes} transpose={transpose} />
      <Controls setActiveNotes={setActiveNotes} transpose={transpose} />
      <Player setActiveNotes={setActiveNotes} transpose={transpose} />
    </div>
  );
}

export default App;
