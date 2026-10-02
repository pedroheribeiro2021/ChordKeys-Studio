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
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div className="progress-bar" style={{ width: `${progress}%` }} />
    </div>
  );
}
