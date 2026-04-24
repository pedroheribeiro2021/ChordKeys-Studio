import { useState } from "react";
import { playNotes } from "../utils/audioEngine";

export default function Key({ note, isBlack, isActive, onPlay }) {
  return (
    <div
      onClick={() => onPlay(note)}
      style={{
        width: isBlack ? "30px" : "50px",
        height: isBlack ? "120px" : "200px",
        background: isBlack ? "black" : "white",
        border: "1px solid #333",
        margin: "2px",
        position: "relative",
        zIndex: isBlack ? 2 : 1,
        background: isActive
          ? isBlack
            ? "#ff4d4f"
            : "#ff7875"
          : isBlack
            ? "black"
            : "white",
        transition: "all 0.1s ease",
        cursor: "pointer",
      }}
    />
  );
}
