import { useEffect, useState } from "react";
import Piano from "./components/Piano";
import Controls from "./components/Controls";
import Player from "./components/Player";
import ChordInput from "./components/ChordInput";
import Timeline from "./components/Timeline";
import ProgressBar from "./components/ProgressBar";
import ChordDiagram from "./components/ChordDiagram";
import { matchChord } from "./utils/chordMatcher";
import { getChordNotes } from "./utils/chordUtils";
import { parseChords } from "./utils/parser";
import { parseLyricsWithChords } from "./utils/lyricsParser";
import { buildSong, buildSongFromLyrics, getSongBeats } from "./utils/songBuilder";
import { demoChords } from "./utils/songData";
import { transposeChord } from "./utils/transpose";
import {
  pauseSong,
  playSong,
  resumeSong,
  setBPM,
  stopSong,
} from "./utils/audioEngine";

const HISTORY_KEY = "history";

const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
};

function App() {
  const [activeNotes, setActiveNotes] = useState([]);
  const [transpose, setTranspose] = useState(0);
  const [currentSong, setCurrentSong] = useState([]);
  const [bpm, setBpm] = useState(90);
  const [beatsPerChord, setBeatsPerChord] = useState(2);
  const [playback, setPlayback] = useState("stopped"); // "playing" | "paused" | "stopped"
  const [currentIndex, setCurrentIndex] = useState(0);
  const [url, setUrl] = useState("");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState(loadHistory);
  const [importError, setImportError] = useState(null);
  const [useInversion, setUseInversion] = useState(false);

  // O andamento é lido pelo Transport, então mudar o BPM afeta a música tocando
  useEffect(() => {
    setBPM(bpm);
  }, [bpm]);

  const startSong = (song) => {
    const transposed = song.map((item) => ({
      ...item,
      chord: transposeChord(item.chord, transpose),
    }));

    setCurrentSong(transposed);
    setCurrentIndex(0);
    setPlayback("playing");

    playSong(transposed, {
      totalBeats: getSongBeats(transposed, beatsPerChord),
      onChordPlay: (notes, chord, index) => {
        setActiveNotes(notes);
        setCurrentIndex(index);
        setTimeout(() => setActiveNotes([]), 500);
      },
      onEnd: () => setPlayback("stopped"),
    });
  };

  const handlePlayInput = () => {
    const parsed = parseLyricsWithChords(input);
    const song =
      parsed.length > 0
        ? buildSongFromLyrics(parsed, beatsPerChord)
        : buildSong(parseChords(input), beatsPerChord);

    if (song.length > 0) startSong(song);
  };

  const handlePlayDemo = () => {
    if (playback === "paused") {
      resumeSong();
      setPlayback("playing");
      return;
    }

    startSong(buildSong(demoChords, beatsPerChord));
  };

  const handlePause = () => {
    if (playback !== "playing") return;
    pauseSong();
    setPlayback("paused");
  };

  const handleStop = () => {
    stopSong();
    setPlayback("stopped");
    setCurrentIndex(0);
  };

  const handleClear = () => {
    handleStop();
    setCurrentSong([]);
    setInput("");
    setUrl("");
  };

  // Lógica para capturar notas tocadas pelo usuário
  const handleUserPlay = (notes) => {
    const current = currentSong[currentIndex];
    if (!current) return;

    if (matchChord(notes, getChordNotes(current.chord))) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleFetchFromUrl = async () => {
    setImportError(null);

    try {
      const res = await fetch(`/api/fetch-chords?url=${encodeURIComponent(url)}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.text) {
        throw new Error(data.error || "Não foi possível importar a cifra.");
      }

      setInput(data.text);

      const updated = [url, ...history.filter((u) => u !== url)].slice(0, 5);
      setHistory(updated);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      setImportError(error.message);
    }
  };

  const styles = {
    app: {
      maxWidth: "900px",
      margin: "0 auto",
      padding: "16px",
    },
    karaoke: {
      textAlign: "center",
      margin: "10px 0",
      fontSize: "18px",
      fontWeight: "bold",
      color: "#ff4d4f",
      minHeight: "24px",
    },
  };

  return (
    <>
      <div style={styles.app}>
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
            style={{ width: "60px", marginLeft: "10px" }}
          />

          <input
            type="range"
            min="60"
            max="180"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
          />

          <br />

          <label>Beats per chord: {beatsPerChord}</label>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={beatsPerChord}
            onChange={(e) => setBeatsPerChord(Number(e.target.value))}
          />
        </div>

        {/* Letra ativa com efeito karaokê */}
        <div style={styles.karaoke}>{currentSong[currentIndex]?.lyric}</div>

        <Timeline song={currentSong} currentIndex={currentIndex} />
        <ProgressBar isPlaying={playback === "playing"} />
        <button
          onClick={() => setUseInversion((prev) => !prev)}
          style={{ marginBottom: 8 }}
        >
          {useInversion ? "Inversion ON" : "Inversion OFF"}
        </button>
        <ChordDiagram
          song={currentSong}
          currentIndex={currentIndex}
          useInversion={useInversion}
        />
        <Piano activeNotes={activeNotes} onUserPlay={handleUserPlay} />
        <Controls setActiveNotes={setActiveNotes} transpose={transpose} />
        <Player
          onPlay={handlePlayDemo}
          onPause={handlePause}
          onStop={handleStop}
        />

        <ChordInput value={input} onChange={setInput} onPlay={handlePlayInput} />

        <input
          type="text"
          placeholder="Paste song URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button onClick={handleFetchFromUrl}>Import from URL</button>
        <button onClick={handleClear}>Clear</button>

        {importError && <p style={{ color: "#ff4d4f" }}>{importError}</p>}
      </div>
      <div>
        <h4>Recent Songs</h4>
        {history.map((h) => (
          <button key={h} onClick={() => setUrl(h)}>
            {h}
          </button>
        ))}
      </div>
    </>
  );
}

export default App;
