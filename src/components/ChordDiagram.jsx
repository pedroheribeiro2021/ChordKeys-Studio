import { getChordNotes } from "../utils/chordUtils";

// Função para renderizar um mini teclado para um acorde
const renderMiniChord = (chord, isActive = false) => {
  if (!chord) return null;

  const notes = getChordNotes(chord);

  // Normaliza as notas para a oitava 4
  const normalizeNote = (note) => {
    const base = note.replace(/[0-9]/g, "");
    return base + "4";
  };

  return (
    <div style={styles.chordContainer}>
      <div style={{ ...styles.label, color: isActive ? "#ff4d4f" : "#333" }}>
        {chord}
      </div>
      <div style={styles.miniKeyboard}>
        {/* Teclas brancas */}
        {["C", "D", "E", "F", "G", "A", "B"].map((note) => {
          const fullNote = note + "4";
          const isActiveNote = notes.some((n) => normalizeNote(n) === fullNote);

          return (
            <div
              key={note}
              style={{
                ...styles.whiteKey,
                background: isActiveNote ? "#ff4d4f" : "#fff",
              }}
            />
          );
        })}

        {/* Teclas pretas */}
        {[
          { note: "C#", pos: 0.5 },
          { note: "D#", pos: 1.5 },
          { note: "F#", pos: 3.5 },
          { note: "G#", pos: 4.5 },
          { note: "A#", pos: 5.5 },
        ].map(({ note, pos }) => {
          const sharpNote = note + "4";
          const isActiveNote = notes.some(
            (n) => normalizeNote(n) === sharpNote,
          );

          return (
            <div
              key={note}
              style={{
                ...styles.blackKey,
                left: `${pos * 20 + 14}px`,
                background: isActiveNote ? "#ff4d4f" : "#111",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default function ChordDiagram({ song, currentChord }) {
  if (!song || song.length === 0) return null;

  // Extrai acordes únicos da song
  const uniqueChords = [...new Set(song.map((item) => item.chord))];

  return (
    <div style={styles.container}>
      <div style={styles.title}>Acordes da Música</div>
      <div style={styles.diagram}>
        {uniqueChords.map((chord, index) => {
          const isActive = chord === currentChord;
          return (
            <div
              key={index}
              style={{
                ...styles.chordWrapper,
                borderColor: isActive ? "#ff4d4f" : "#ddd",
                borderWidth: isActive ? "2px" : "1px",
              }}
            >
              {renderMiniChord(chord, isActive)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginTop: "15px",
    padding: "10px",
    background: "#f9f9f9",
    borderRadius: "8px",
  },
  title: {
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#333",
  },
  diagram: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "center",
  },
  chordWrapper: {
    padding: "5px",
    borderRadius: "6px",
    border: "1px solid #ddd",
    background: "#fff",
  },
  chordContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  label: {
    fontSize: "12px",
    fontWeight: "bold",
    marginBottom: "3px",
  },
  miniKeyboard: {
    position: "relative",
    width: "140px",
    height: "50px",
    background: "#222",
    padding: "5px",
    borderRadius: "4px",
  },
  whiteKey: {
    display: "inline-block",
    width: "16px",
    height: "40px",
    border: "1px solid #ccc",
    borderRadius: "2px",
    marginRight: "1px",
    verticalAlign: "bottom",
  },
  blackKey: {
    position: "absolute",
    top: "5px",
    width: "10px",
    height: "25px",
    borderRadius: "2px",
    zIndex: 10,
  },
};
