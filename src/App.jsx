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
  const [isImporting, setIsImporting] = useState(false);
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

  // Sem cifra digitada, toca a progressão de exemplo
  const buildSongFromInput = () => {
    if (!input.trim()) return buildSong(demoChords, beatsPerChord);

    const parsed = parseLyricsWithChords(input);
    return parsed.length > 0
      ? buildSongFromLyrics(parsed, beatsPerChord)
      : buildSong(parseChords(input), beatsPerChord);
  };

  const handlePlayPause = () => {
    if (playback === "playing") {
      pauseSong();
      setPlayback("paused");
      return;
    }

    if (playback === "paused") {
      resumeSong();
      setPlayback("playing");
      return;
    }

    const song = buildSongFromInput();
    if (song.length > 0) startSong(song);
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

  // Modo aprendizado: avança quando o acorde certo é tocado no teclado
  const handleUserPlay = (notes) => {
    const current = currentSong[currentIndex];
    if (!current) return;

    if (matchChord(notes, getChordNotes(current.chord))) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleFetchFromUrl = async () => {
    setImportError(null);
    setIsImporting(true);

    try {
      const res = await fetch(`/api/fetch-chords?url=${encodeURIComponent(url)}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.text) {
        throw new Error(data.error || "Não foi possível importar a cifra.");
      }

      handleStop();
      setInput(data.text);

      const updated = [url, ...history.filter((u) => u !== url)].slice(0, 5);
      setHistory(updated);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      setImportError(error.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <header className="app-header">
        <h1>ChordKeys Studio</h1>
        <p>Veja e ouça os acordes de qualquer cifra.</p>
      </header>

      <main className="layout">
        <section className="card area-now" aria-labelledby="now-title">
          <div className="card-header">
            <h2 className="card-title" id="now-title">
              Tocando
            </h2>
          </div>
          <div className="karaoke" aria-live="polite">
            {currentSong[currentIndex]?.lyric}
          </div>
          <Timeline song={currentSong} currentIndex={currentIndex} />
          <ProgressBar isPlaying={playback === "playing"} />
        </section>

        <section className="card area-song" aria-labelledby="song-title">
          <div className="card-header">
            <h2 className="card-title" id="song-title">
              Cifra
            </h2>
          </div>
          <ChordInput
            value={input}
            onChange={setInput}
            url={url}
            onUrlChange={setUrl}
            onImport={handleFetchFromUrl}
            isImporting={isImporting}
            importError={importError}
            history={history}
            beatsPerChord={beatsPerChord}
            onBeatsPerChordChange={setBeatsPerChord}
            onClear={handleClear}
          />
        </section>

        <section className="card area-chords" aria-labelledby="chords-title">
          <div className="card-header">
            <h2 className="card-title" id="chords-title">
              Acordes da música
            </h2>
            <button
              type="button"
              className="btn btn-sm"
              aria-pressed={useInversion}
              onClick={() => setUseInversion((prev) => !prev)}
            >
              Inversão
            </button>
          </div>
          <ChordDiagram
            song={currentSong}
            currentIndex={currentIndex}
            useInversion={useInversion}
          />
        </section>

        <section className="card area-keys" aria-labelledby="keys-title">
          <div className="card-header">
            <h2 className="card-title" id="keys-title">
              Teclado
            </h2>
          </div>
          <Piano activeNotes={activeNotes} onUserPlay={handleUserPlay} />
          <Controls setActiveNotes={setActiveNotes} transpose={transpose} />
        </section>
      </main>

      <Player
        playback={playback}
        onPlayPause={handlePlayPause}
        onStop={handleStop}
        transpose={transpose}
        onTransposeChange={setTranspose}
        bpm={bpm}
        onBpmChange={setBpm}
      />
    </>
  );
}

export default App;
