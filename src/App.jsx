import { useState, useEffect } from "react";
import Piano from "./components/Piano";
import Controls from "./components/Controls";
import Player from "./components/Player";
import ChordInput from "./components/ChordInput";
import ChordDisplay from "./components/ChordDisplay";
import Timeline from "./components/Timeline";
import ProgressBar from "./components/ProgressBar";
import Metronome from "./components/Metronome";
import ChordMiniKeyboard from "./components/ChordMiniKeyboard";
import ChordDiagram from "./components/ChordDiagram";
import { matchChord } from "./utils/chordMatcher";
import { getChordNotes } from "./utils/chordUtils";

function App() {
  const [activeNotes, setActiveNotes] = useState([]);
  const [transpose, setTranspose] = useState(0);
  const [currentChord, setCurrentChord] = useState(null);
  const [currentSong, setCurrentSong] = useState([]);
  const [bpm, setBpm] = useState(90);
  const [duration, setDuration] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songDuration, setSongDuration] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [url, setUrl] = useState("");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("history") || "[]");
    setHistory(saved);
  }, []);

  // Lógica para capturar notas tocadas pelo usuário
  const handleUserPlay = (notes) => {
    const current = currentSong[currentIndex];
    if (!current) return;

    const expected = getChordNotes(current.chord);
    const isCorrect = matchChord(notes, expected);

    if (isCorrect) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentChord(currentSong[nextIndex]?.chord);
    }
  };

  const handleFetchFromUrl = async () => {
    const res = await fetch(`/api/fetch-chords?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    setInput(data.text);

    const history = JSON.parse(localStorage.getItem("history") || "[]");

    const updated = [url, ...history.filter((u) => u !== url)].slice(0, 5);

    localStorage.setItem("history", JSON.stringify(updated));
  };

  const styles = {
    app: {
      maxWidth: "900px",
      margin: "0 auto",
      padding: "16px",
    },
    section: {
      marginBottom: "20px",
    },
    karaoke: {
      textAlign: "center",
      fontSize: "20px",
      fontWeight: "bold",
      margin: "20px 0",
      color: "#fff",
      transition: "all 0.3s ease",
    },
  };

  return (
    <><div style={styles.app}>
      <h1>ChordKeys Studio</h1>

      <p>Transpose: {transpose}</p>

      <button onClick={() => setTranspose(transpose + 1)}>+1</button>
      <button onClick={() => setTranspose(transpose - 1)}>-1</button>

      <div style={{ marginTop: "20px" }}>
        <h3>Controls</h3>

        <label>BPM:</label>
        <input
          type="number"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          style={{ width: "60px", marginLeft: "10px" }} />

        <input
          type="range"
          min="60"
          max="180"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))} />

        <br />

        <label>Chord Duration: {duration}</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.5"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))} />
      </div>

      {/* Letra ativa com efeito karaokê */}
      <div
        style={{
          textAlign: "center",
          margin: "10px 0",
          fontSize: "18px",
          fontWeight: "bold",
          color: "#ff4d4f",
          minHeight: "24px",
        }}
      >
        {currentSong[currentIndex]?.lyric}
      </div>

      <Timeline song={currentSong} currentIndex={currentIndex} />
      <ProgressBar duration={songDuration} isPlaying={isPlaying} />
      <ChordDiagram song={currentSong} currentIndex={currentIndex} />
      {/* <ChordMiniKeyboard chord={currentChord} /> */}
      {/* <Metronome bpm={bpm} isPlaying={isPlaying} /> */}
      {/* <ChordDisplay currentChord={currentChord} /> */}
      <div style={styles.karaoke}>{currentSong[currentIndex]?.lyric}</div>
      <Piano activeNotes={activeNotes} onUserPlay={handleUserPlay} />
      <Controls setActiveNotes={setActiveNotes} transpose={transpose} />
      <Player
        setActiveNotes={setActiveNotes}
        setCurrentChord={setCurrentChord}
        setCurrentSong={setCurrentSong}
        transpose={transpose}
        bpm={bpm}
        setIsPlaying={setIsPlaying}
        setSongDuration={setSongDuration}
        duration={duration}
        setCurrentIndex={setCurrentIndex} />

      <ChordInput
        setActiveNotes={setActiveNotes}
        setCurrentChord={setCurrentChord}
        setCurrentSong={setCurrentSong}
        transpose={transpose}
        bpm={bpm}
        duration={duration}
        setIsPlaying={setIsPlaying}
        setSongDuration={setSongDuration}
        setCurrentIndex={setCurrentIndex}
        externalInput={input} />

      <input
        type="text"
        placeholder="Paste song URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)} />

      <button onClick={handleFetchFromUrl}>Import from URL</button>
    </div><div>
        <h4>Recent Songs</h4>
        {history.map((h, i) => (
          <button key={i} onClick={() => setUrl(h)}>
            {h}
          </button>
        ))}
      </div></>
  );
}

export default App;
