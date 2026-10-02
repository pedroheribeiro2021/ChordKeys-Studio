import { useRef, useState } from "react";
import Key from "./Key";
import { getSustain, noteOff, noteOn, setSustain } from "../utils/audioEngine";

const octaves = [3, 4];

const whitePattern = ["C", "D", "E", "F", "G", "A", "B"];

const blackPattern = {
  C: "C#",
  D: "D#",
  F: "F#",
  G: "G#",
  A: "A#",
};

// Janela para juntar notas tocadas em sequência como um acorde (modo aprendizado)
const CHORD_WINDOW_MS = 800;

export default function Piano({ activeNotes, onUserPlay }) {
  const [held, setHeld] = useState([]);
  // O estado vive no motor de áudio: sobrevive à troca de tela
  const [sustain, setSustainState] = useState(getSustain);
  const recent = useRef([]);

  const handlePress = (note) => {
    noteOn(note);
    setHeld((prev) => (prev.includes(note) ? prev : [...prev, note]));

    const now = Date.now();
    recent.current = [
      ...recent.current.filter((r) => now - r.at < CHORD_WINDOW_MS && r.note !== note),
      { note, at: now },
    ];
    onUserPlay?.(recent.current.map((r) => r.note));
  };

  const handleRelease = (note) => {
    noteOff(note);
    setHeld((prev) => prev.filter((n) => n !== note));
  };

  const toggleSustain = () => {
    setSustain(!sustain);
    setSustainState(!sustain);
  };

  const isActive = (note) => activeNotes.includes(note) || held.includes(note);

  return (
    <>
      <div className="piano-toolbar">
        <button
          type="button"
          className="btn btn-sm"
          aria-pressed={sustain}
          onClick={toggleSustain}
          title="Com sustain, a nota continua soando depois de soltar a tecla, como o pedal do piano"
        >
          Sustain {sustain ? "ligado" : "desligado"}
        </button>
      </div>

      {/* No celular as duas oitavas não cabem: o teclado rola na horizontal */}
      <div className="piano-scroll">
        <div className="piano">
          {octaves.map((octave) =>
            whitePattern.map((note) => {
              const fullNote = `${note}${octave}`;
              const sharp = blackPattern[note];
              const sharpNote = sharp ? `${sharp}${octave}` : null;

              return (
                <div key={fullNote} className="piano-slot">
                  <Key
                    note={fullNote}
                    isBlack={false}
                    isActive={isActive(fullNote)}
                    onPress={handlePress}
                    onRelease={handleRelease}
                  />

                  {sharpNote && (
                    <Key
                      note={sharpNote}
                      isBlack={true}
                      isActive={isActive(sharpNote)}
                      onPress={handlePress}
                      onRelease={handleRelease}
                    />
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>
    </>
  );
}
