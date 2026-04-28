import { useEffect, useRef } from "react";

export default function Timeline({ song, currentIndex }) {
  const chordRefs = useRef([]);

  useEffect(() => {
    if (chordRefs.current[currentIndex]) {
      chordRefs.current[currentIndex].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentIndex]);

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Timeline</h3>

      <div style={styles.container}>
        {song.map((item, index) => {
          const isActive = index === currentIndex;

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
              <div>{item.chord}</div>
              {item.lyric && (
                <div
                  style={{
                    fontSize: "12px",
                    color: isActive ? "#fff" : "#666",
                    marginTop: "4px",
                  }}
                >
                  {item.lyric}
                </div>
              )}
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
