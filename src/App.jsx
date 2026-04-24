import { useState } from "react";
import Piano from "./components/Piano";
import Controls from "./components/Controls";
import Player from "./components/Player";

function App() {
  const [activeNotes, setActiveNotes] = useState([]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>ChordKeys Studio</h1>

      <Piano activeNotes={activeNotes} />
      <Controls setActiveNotes={setActiveNotes} />
      <Player setActiveNotes={setActiveNotes} />
    </div>
  );
}

export default App;
