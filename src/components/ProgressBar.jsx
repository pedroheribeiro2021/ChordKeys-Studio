import { useEffect, useState } from "react";
import { getProgress } from "../utils/audioEngine";

// Lê a posição real do Transport, então pausa e mudança de BPM ficam corretas
export default function ProgressBar({ isPlaying }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame;

    const tick = () => {
      setProgress(getProgress() * 100);
      if (isPlaying) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.bar,
          width: `${progress}%`,
        }}
      />
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    height: "10px",
    background: "#444",
    borderRadius: "5px",
    marginTop: "10px",
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    background: "#ff4d4f",
  },
};
