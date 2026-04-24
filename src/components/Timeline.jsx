export default function Timeline({ song, currentChord }) {
  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Timeline</h3>

      <div
        style={{
          display: "flex",
          gap: "5px",
          overflowX: "auto",
        }}
      >
        {song.map((item, index) => {
          const isActive = item.chord === currentChord;

          return (
            <div
              key={index}
              style={{
                minWidth: "60px",
                padding: "10px",
                textAlign: "center",
                borderRadius: "6px",
                background: isActive ? "#ff4d4f" : "#eee",
                color: isActive ? "white" : "black",
                fontWeight: isActive ? "bold" : "normal",
                transition: "all 0.2s",
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
