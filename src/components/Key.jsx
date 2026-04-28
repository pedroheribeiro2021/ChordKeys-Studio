import { useState } from "react";
import { playNotes } from "../utils/audioEngine";

export default function Key({ note, isBlack, isActive, onPlay }) {
  return (
    <div
      onClick={() => onPlay(note)}
      style={{
        width: isBlack ? "6vw" : "10vw",
        maxWidth: isBlack ? "30px" : "50px",
        height: isBlack ? "120px" : "200px",
        background: isActive ? "#ff4d4f" : isBlack ? "#111" : "#fff",
        border: isBlack ? "none" : "1px solid #ccc",
        borderRadius: "6px",
        boxShadow: isBlack
          ? "0 4px 6px rgba(0,0,0,0.5)"
          : "0 2px 4px rgba(0,0,0,0.2)",
        cursor: "pointer",
        transition: "all 0.1s ease",
      }}
    />
  );
}
