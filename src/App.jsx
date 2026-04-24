import { useEffect } from "react";
import Piano from "./components/Piano";
import { initAudio } from "./utils/audioEngine";

function App() {
  useEffect(() => {
    initAudio();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>ChordKeys Studio</h1>
      <Piano />
    </div>
  );
}

export default App;
