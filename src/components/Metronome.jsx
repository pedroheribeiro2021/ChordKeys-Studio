import { useEffect, useState } from "react";

export default function Metronome({ bpm, isPlaying }) {
  const [beat, setBeat] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = (60 / bpm) * 1000;

    const interval = setInterval(() => {
      setBeat(true);

      setTimeout(() => setBeat(false), 100);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [bpm, isPlaying]);

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.circle,
          background: beat ? "#ff4d4f" : "#555",
          transform: beat ? "scale(1.3)" : "scale(1)",
        }}
      />
    </div>
  );
}

const styles = {
  container: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "center",
  },
  circle: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    transition: "all 0.1s ease",
  },
};
