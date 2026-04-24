import Piano from "./components/Piano";
import Controls from "./components/Controls";

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>ChordKeys Studio</h1>
      <Piano />
      <Controls />
    </div>
  );
}

export default App;
