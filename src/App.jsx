import Piano from "./components/Piano";
import Controls from "./components/Controls";
import Player from "./components/Player";

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>ChordKeys Studio</h1>
      <Piano />
      <Controls />
      <Player />
    </div>
  );
}

export default App;
