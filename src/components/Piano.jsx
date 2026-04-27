import { useState } from "react";
import Key from "./Key";
import { playNotes } from "../utils/audioEngine";

const octaves = [{ base: 3 }, { base: 4 }];

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

  return (
    <div style={styles.wrapper}>
      <div style={styles.keyboard}>
        {octaves.map((octave) =>
          whitePattern.map((note, index) => {
            const fullNote = `${note}${octave.base}`;
            const sharp = blackPattern[note];
            const sharpNote = sharp ? `${sharp}${octave.base}` : null;

            return (
              <div key={fullNote} style={styles.whiteKeyWrapper}>
                {/* White key */}
                <Key
                  note={fullNote}
                  isBlack={false}
                  isActive={
                    activeNotes.includes(fullNote) || pressed.includes(fullNote)
                  }
                  onPlay={handlePlay}
                />

                {/* Black key */}
                {sharpNote && (
                  <div style={styles.blackKeyWrapper}>
                    <Key
                      note={sharpNote}
                      isBlack={true}
                      isActive={
                        activeNotes.includes(sharpNote) ||
                        pressed.includes(sharpNote)
                      }
                      onPlay={handlePlay}
                    />
                  </div>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: "30px",
  },
  keyboard: {
    display: "flex",
    position: "relative",
    background: "#222",
    padding: "10px",
    borderRadius: "10px",
  },
  whiteKeyWrapper: {
    position: "relative",
    width: "50px",
  },
  blackKeyWrapper: {
    position: "absolute",
    top: 0,
    right: "-15px",
    zIndex: 10,
  },
};
