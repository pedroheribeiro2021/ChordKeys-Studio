import { getChordNotes } from "../utils/chordUtils";

export default function ChordMiniKeyboard({ chord }) {
  if (!chord) return null;

  const notes = getChordNotes(chord);

  // Mapeia notas para posições no teclado (oitava 4)
  const notePositions = {
    C4: 0,
    "C#4": 0.5,
    D4: 1,
    "D#4": 1.5,
    E4: 2,
    F4: 3,
    "F#4": 3.5,
    G4: 4,
    "G#4": 4.5,
    A4: 5,
    "A#4": 5.5,
    B4: 6,
  };

  // Normaliza as notas para a oitava 4
  const normalizeNote = (note) => {
    const base = note.replace(/[0-9]/g, "");
    return base + "4";
  };

  return (
    <div style={styles.container}>
      <div style={styles.label}>{chord}</div>
      <div style={styles.keyboard}>
        {/* Renderiza 7 teclas brancas */}
        {["C", "D", "E", "F", "G", "A", "B"].map((note, index) => {
          const fullNote = note + "4";
          const isActive = notes.some((n) => normalizeNote(n) === fullNote);

          return (
            <div
              key={note}
              style={{
                ...styles.whiteKey,
                background: isActive ? "#ff4d4f" : "#fff",
              }}
            >
              <span style={styles.noteLabel}>{note}</span>
            </div>
          );
        })}

        {/* Renderiza teclas pretas */}
        {[
          { note: "C#", pos: 0.5 },
          { note: "D#", pos: 1.5 },
          { note: "F#", pos: 3.5 },
          { note: "G#", pos: 4.5 },
          { note: "A#", pos: 5.5 },
        ].map(({ note, pos }) => {
          const sharpNote = note + "4";
          const isActive = notes.some((n) => normalizeNote(n) === sharpNote);

          return (
            <div
              key={note}
              style={{
                ...styles.blackKey,
                left: `${pos * 30 + 20}px`,
                background: isActive ? "#ff4d4f" : "#111",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "inline-block",
    marginTop: "10px",
  },
  label: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "5px",
    textAlign: "center",
  },
  keyboard: {
    position: "relative",
    width: "210px",
    height: "80px",
    background: "#222",
    padding: "8px",
    borderRadius: "6px",
  },
  whiteKey: {
    display: "inline-block",
    width: "26px",
    height: "64px",
    border: "1px solid #ccc",
    borderRadius: "3px",
    marginRight: "2px",
    verticalAlign: "bottom",
    textAlign: "center",
    lineHeight: "64px",
    cursor: "default",
  },
  blackKey: {
    position: "absolute",
    top: "8px",
    width: "16px",
    height: "40px",
    borderRadius: "2px",
    zIndex: 10,
  },
  noteLabel: {
    fontSize: "10px",
    color: "#333",
    fontWeight: "500",
  },
};
