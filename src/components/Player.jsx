import {
  playSong,
  stopSong,
  pauseSong,
  setBPM,
  resumeSong,
} from "../utils/audioEngine";

import { song } from "../utils/songData";
import { transposeChord } from "../utils/transpose";
import { useState } from "react";

export default function Player({
  setActiveNotes,
  setCurrentChord,
  setCurrentSong,
  transpose,
  bpm,
  setIsPlaying,
  setSongDuration,
  duration,
  setCurrentIndex,
}) {
  const [wasPaused, setWasPaused] = useState(false);
  const handlePlay = () => {
    setBPM(bpm);
    if (wasPaused) {
      resumeSong();
      setIsPlaying(true);
      setWasPaused(false);
      return;
    }

    const transposedSong = song.map((item) => ({
      ...item,
      chord: transposeChord(item.chord, transpose),
    }));

    setCurrentSong(transposedSong);

    const songDuration = transposedSong.length * duration;
    setSongDuration(songDuration);

    setIsPlaying(true);

    playSong(transposedSong, (notes, chord, index) => {
      setActiveNotes(notes);
      setCurrentChord(chord);
      setCurrentIndex(index);

      setTimeout(() => setActiveNotes([]), 500);
    });

    setTimeout(() => setIsPlaying(false), songDuration * 1000);
  };

  const handlePause = () => {
    pauseSong();
    setIsPlaying(false);
    setWasPaused(true);
  };

  const handleStop = () => {
    stopSong();
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Player</h3>

      <button onClick={handlePlay}>Play</button>
      <button onClick={handlePause}>Pause</button>
      <button onClick={handleStop}>Stop</button>
    </div>
  );
}
