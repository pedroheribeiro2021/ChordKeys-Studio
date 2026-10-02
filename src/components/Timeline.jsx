import { useEffect, useRef } from "react";

export default function Timeline({ song, currentIndex }) {
  const containerRef = useRef(null);
  const chordRefs = useRef([]);

  // Rola só a faixa horizontal. scrollIntoView também rolaria a página inteira,
  // o que no celular faz a tela pular a cada acorde.
  useEffect(() => {
    const container = containerRef.current;
    const chord = chordRefs.current[currentIndex];
    if (!container || !chord) return;

    container.scrollTo({
      left: chord.offsetLeft - container.clientWidth / 2 + chord.clientWidth / 2,
      behavior: "smooth",
    });
  }, [currentIndex]);

  if (song.length === 0) {
    return <p className="muted">Toque uma cifra para ver a sequência de acordes.</p>;
  }

  return (
    <div className="timeline" ref={containerRef}>
      {song.map((item, index) => (
        <div
          key={index}
          ref={(el) => (chordRefs.current[index] = el)}
          className={`timeline-chord${index === currentIndex ? " is-active" : ""}`}
        >
          {item.chord}
        </div>
      ))}
    </div>
  );
}
