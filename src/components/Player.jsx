const formatTranspose = (value) => (value > 0 ? `+${value}` : `${value}`);

// Barra fixa no rodapé: os controles de reprodução ficam ao alcance do polegar
export default function Player({
  playback,
  onPlayPause,
  onStop,
  transpose,
  onTransposeChange,
  bpm,
  onBpmChange,
}) {
  const isPlaying = playback === "playing";

  return (
    <div className="transport" role="region" aria-label="Reprodução">
      <div className="transport-inner">
        <div className="transport-main">
          <button
            type="button"
            className="btn btn-primary transport-play"
            onClick={onPlayPause}
            aria-label={isPlaying ? "Pausar" : "Tocar"}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>

          <button
            type="button"
            className="btn btn-icon"
            onClick={onStop}
            disabled={playback === "stopped"}
            aria-label="Parar"
          >
            ■
          </button>

          <div className="transpose" role="group" aria-label="Tom">
            <button
              type="button"
              className="btn btn-icon"
              onClick={() => onTransposeChange(transpose - 1)}
              aria-label="Baixar meio tom"
            >
              −
            </button>
            <span className="transpose-value" aria-live="polite">
              Tom {formatTranspose(transpose)}
            </span>
            <button
              type="button"
              className="btn btn-icon"
              onClick={() => onTransposeChange(transpose + 1)}
              aria-label="Subir meio tom"
            >
              +
            </button>
          </div>
        </div>

        <label className="bpm">
          <span>BPM</span>
          <input
            type="range"
            min="40"
            max="200"
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
          />
          <output>{bpm}</output>
        </label>
      </div>
    </div>
  );
}
