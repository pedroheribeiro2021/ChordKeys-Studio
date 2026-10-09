import { useEffect, useState } from "react";
import Piano from "./components/Piano";
import Controls from "./components/Controls";
import Player from "./components/Player";
import ChordInput from "./components/ChordInput";
import Timeline from "./components/Timeline";
import ProgressBar from "./components/ProgressBar";
import ChordDiagram from "./components/ChordDiagram";
import GuitarView from "./components/GuitarView";
import Library from "./components/Library";
import SaveSong from "./components/SaveSong";
import { useHashView } from "./hooks/useHashView";
import { matchChord } from "./utils/chordMatcher";
import { getChordNotes } from "./utils/chordUtils";
import { parseChords } from "./utils/parser";
import { parseLyricsWithChords } from "./utils/lyricsParser";
import { buildSong, buildSongFromLyrics, getSongBeats } from "./utils/songBuilder";
import { demoChords } from "./utils/songData";
import { transposeChord } from "./utils/transpose";
import { requestPersistence, saveSong } from "./utils/songStore";
import { syncSong } from "./utils/firebase";
import { importFile, importText } from "./utils/importers";
import {
  pauseSong,
  playSong,
  resumeSong,
  setBPM,
  stopSong,
} from "./utils/audioEngine";

const VIEWS = [
  { id: "estudio", label: "Estúdio" },
  { id: "violao", label: "Violão" },
  { id: "cifras", label: "Minhas cifras" },
];

const EMPTY_META = { id: null, title: "", artist: "" };

function App() {
  const [activeNotes, setActiveNotes] = useState([]);
  const [transpose, setTranspose] = useState(0);
  const [currentSong, setCurrentSong] = useState([]);
  const [bpm, setBpm] = useState(90);
  const [beatsPerChord, setBeatsPerChord] = useState(2);
  const [playback, setPlayback] = useState("stopped"); // "playing" | "paused" | "stopped"
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [importMessage, setImportMessage] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [useInversion, setUseInversion] = useState(false);

  // Cifra aberta (salva ou não) e ajustes de violão
  const [meta, setMeta] = useState(EMPTY_META);
  const [capo, setCapo] = useState(0);
  const [simplify, setSimplify] = useState(false);
  const [simplifyDifficulty, setSimplifyDifficulty] = useState("medio");
  const [songKey, setSongKey] = useState("");
  const [mode, setMode] = useState("major");

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

  // A barra de reprodução só existe no Estúdio: ao sair dele, a música para
  const [view, navigate] = useHashView(
    VIEWS.map((v) => v.id),
    "estudio",
    (from) => {
      if (from === "estudio") handleStop();
    },
  );

  // Troca a cifra aberta: para a reprodução e zera o que era da cifra anterior
  const openSong = ({
    text,
    meta: nextMeta,
    transpose: t = 0,
    capo: c = 0,
    simplify: s = false,
    difficulty: d = "medio",
    key: k = "",
    mode: m = "major",
  }) => {
    handleStop();
    setCurrentSong([]);
    setInput(text);
    setMeta(nextMeta);
    setTranspose(t);
    setCapo(c);
    setSimplify(s);
    setSimplifyDifficulty(d);
    setSongKey(k);
    setMode(m);
  };

  const handleClear = () => {
    openSong({ text: "", meta: EMPTY_META });
    setImportMessage(null);
  };

  const handleOpenSaved = (song) => {
    openSong({
      text: song.text,
      meta: { id: song.id, title: song.title, artist: song.artist },
      transpose: song.transpose,
      capo: song.capo,
      simplify: song.simplify,
      difficulty: song.difficulty,
      key: song.key,
      mode: song.mode,
    });
    navigate("violao");
  };

  const handleSave = async (fields) => {
    const saved = await saveSong({
      ...meta,
      ...fields,
      id: meta.id ?? undefined,
      text: input,
      transpose,
      capo,
      simplify,
      difficulty: simplifyDifficulty,
      key: songKey,
      mode,
    });
    setMeta({ id: saved.id, title: saved.title, artist: saved.artist });
    requestPersistence().catch(() => {});
    try {
      return { synced: await syncSong(saved) };
    } catch (error) {
      throw new Error(`Salva neste aparelho, mas não sincronizou: ${error.message}`, { cause: error });
    }
  };

  // Modo aprendizado: avança quando o acorde certo é tocado no teclado
  const handleUserPlay = (notes) => {
    const current = currentSong[currentIndex];
    if (!current) return;

    if (matchChord(notes, getChordNotes(current.chord))) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Cifra com capotraste já vem escrita nos formatos da mão: capo N + tom +N
  // mostra os mesmos formatos no violão e toca o som real no piano
  const openImported = ({ text, title, artist, capo: importedCapo }) => {
    openSong({
      text,
      meta: { ...EMPTY_META, title, artist },
      transpose: importedCapo,
      capo: importedCapo,
    });
  };

  const handlePasteText = (raw) => {
    const result = importText(raw);
    openImported(result);
    setImportMessage(null);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const raw = await navigator.clipboard.readText();
      if (!raw.trim()) {
        setImportMessage({ error: true, text: "A área de transferência está vazia." });
        return;
      }
      handlePasteText(raw);
    } catch {
      setImportMessage({
        error: true,
        text: "O navegador não deixou ler a área de transferência. Toque e segure na caixa de texto abaixo e escolha Colar.",
      });
    }
  };

  const handleOpenFile = async (file) => {
    setImportMessage(null);
    setIsImporting(true);

    try {
      const result = await importFile(file);
      if (!result.text.trim()) throw new Error("Não encontrei uma cifra nesse arquivo.");

      openImported(result);
      setImportMessage({
        text: `“${result.title || file.name}” aberta${result.capo ? ` (capotraste na ${result.capo}ª casa)` : ""}.`,
      });
    } catch (error) {
      setImportMessage({ error: true, text: error.message || "Não foi possível abrir o arquivo." });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <header className="app-header">
        <h1>ChordKeys Studio</h1>
        <nav className="tabs" aria-label="Telas">
          {VIEWS.map((v) => (
            <a
              key={v.id}
              href={`#/${v.id}`}
              className="tab"
              aria-current={view === v.id ? "page" : undefined}
            >
              {v.label}
            </a>
          ))}
        </nav>
      </header>

      {view === "violao" && (
        <main className="layout layout-single">
          <GuitarView
            text={input}
            meta={meta}
            onSave={handleSave}
            transpose={transpose}
            onTransposeChange={setTranspose}
            capo={capo}
            onCapoChange={setCapo}
            simplify={simplify}
            onSimplifyChange={setSimplify}
            simplifyDifficulty={simplifyDifficulty}
            onSimplifyDifficultyChange={setSimplifyDifficulty}
            songKey={songKey}
            onSongKeyChange={setSongKey}
            mode={mode}
            onModeChange={setMode}
            onGoTo={navigate}
          />
        </main>
      )}

      {view === "cifras" && (
        <main className="layout layout-single">
          <Library onOpen={handleOpenSaved} />
        </main>
      )}

      {view === "estudio" && (
        <>
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
                  {meta.title ? `Cifra · ${meta.title}` : "Cifra"}
                </h2>
                <SaveSong meta={meta} onSave={handleSave} disabled={!input.trim()} />
              </div>
              <ChordInput
                value={input}
                onChange={setInput}
                onPasteText={handlePasteText}
                onPasteFromClipboard={handlePasteFromClipboard}
                onOpenFile={handleOpenFile}
                isImporting={isImporting}
                importMessage={importMessage}
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
      )}
    </>
  );
}

export default App;
