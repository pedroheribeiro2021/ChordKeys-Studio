import { useEffect, useRef } from "react";

export default function Timeline({ song, currentChord }) {
  const chordRefs = useRef([]);

  useEffect(() => {
    const index = song.findIndex((item) => item.chord === currentChord);

    if (index !== -1 && chordRefs.current[index]) {
      chordRefs.current[index].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentChord, song]);

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Timeline</h3>

      <div style={styles.container}>
        {song.map((item, index) => {
          const isActive = item.chord === currentChord;

          return (
            <div
              key={index}
              ref={(el) => (chordRefs.current[index] = el)}
              style={{
                ...styles.chord,
                background: isActive ? "#ff4d4f" : "#eee",
                color: isActive ? "white" : "black",
                transform: isActive ? "scale(1.2)" : "scale(1)",
              }}
            >
              {item.chord}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    gap: "10px",
    overflowX: "auto",
    padding: "10px",
    scrollBehavior: "smooth",
  },
  chord: {
    minWidth: "60px",
    padding: "10px",
    textAlign: "center",
    borderRadius: "6px",
    transition: "all 0.2s ease",
    fontWeight: "bold",
  },
};
