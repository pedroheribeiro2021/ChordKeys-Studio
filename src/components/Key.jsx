import { useState } from "react";
import { playNotes } from "../utils/audioEngine";

export default function Key({ note, isBlack }) {
  const [active, setActive] = useState(false);

  const handleClick = async () => {
    await playNotes([note]); // agora ativa áudio corretamente
    setActive(true);
    setTimeout(() => setActive(false), 150);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: isBlack ? "30px" : "50px",
        height: isBlack ? "120px" : "200px",
        background: isBlack ? "black" : "white",
        border: "1px solid #333",
        margin: "2px",
        position: "relative",
        zIndex: isBlack ? 2 : 1,
        opacity: active ? 0.6 : 1,
        cursor: "pointer",
      }}
    />
  );
}
