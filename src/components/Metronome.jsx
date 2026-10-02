import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

export default function Metronome({ bpm, isPlaying }) {
  const [beat, setBeat] = useState(0);
  const synthRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) return;

    // 🔊 som do metrônomo, criado uma vez só
    synthRef.current ??= new Tone.MembraneSynth().toDestination();
    const synth = synthRef.current;

    let currentBeat = 0;

    const intervalTime = (60 / bpm) * 1000;

    const interval = setInterval(() => {
      currentBeat = (currentBeat % 4) + 1;

      setBeat(currentBeat);

      // 🔥 SOM DIFERENTE NO TEMPO 1
      if (currentBeat === 1) {
        synth.triggerAttackRelease("C5", "8n"); // forte
      } else {
        synth.triggerAttackRelease("C4", "8n"); // fraco
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [bpm, isPlaying]);

  // Parado, nenhum tempo fica aceso
  const shownBeat = isPlaying ? beat : 0;

  return (
    <div style={styles.container}>
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          style={{
            ...styles.dot,
            background:
              shownBeat === n
                ? n === 1
                  ? "#ff1f1f" // forte
                  : "#ff7875"
                : "#444",
            transform: shownBeat === n ? "scale(1.3)" : "scale(1)",
          }}
        >
          {n}
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
  dot: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: "bold",
    transition: "all 0.1s ease",
  },
};
