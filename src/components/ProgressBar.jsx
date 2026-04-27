import { useEffect, useState } from "react";

export default function ProgressBar({ duration, isPlaying }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    setProgress(0);

    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;

      const value = Math.min((elapsed / duration) * 100, 100);

      setProgress(value);

      if (value >= 100) clearInterval(interval);
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, duration]);

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
    transition: "width 0.05s linear",
  },
};
