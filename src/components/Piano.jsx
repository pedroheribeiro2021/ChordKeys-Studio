import { useState } from "react";
import Key from "./Key";
import { playNotes } from "../utils/audioEngine";

const octaves = [3, 4];

const whitePattern = ["C", "D", "E", "F", "G", "A", "B"];

const blackPattern = {
  C: "C#",
  D: "D#",
  F: "F#",
  G: "G#",
  A: "A#",
};

export default function Piano({ activeNotes, onUserPlay }) {
  const [pressed, setPressed] = useState([]);

  const handlePlay = (note) => {
    playNotes([note]);

    const updated = [...pressed, note];
    setPressed(updated);

    if (onUserPlay) {
      onUserPlay(updated);
    }

    // limpa depois de curto tempo
    setTimeout(() => setPressed([]), 600);
  };

  const isActive = (note) => activeNotes.includes(note) || pressed.includes(note);

  return (
    // No celular as duas oitavas não cabem: o teclado rola na horizontal
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
                  onPlay={handlePlay}
                />

                {sharpNote && (
                  <Key
                    note={sharpNote}
                    isBlack={true}
                    isActive={isActive(sharpNote)}
                    onPlay={handlePlay}
                  />
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
