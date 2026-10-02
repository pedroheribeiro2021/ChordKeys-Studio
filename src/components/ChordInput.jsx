const PLACEHOLDER = `Cole a cifra ou só os acordes. Ex.:

C              G/B
Quando a luz dos olhos meus

Vazio, o ▶ toca uma progressão de exemplo.`;

export default function ChordInput({
  value,
  onChange,
  url,
  onUrlChange,
  onImport,
  isImporting,
  importError,
  history,
  beatsPerChord,
  onBeatsPerChordChange,
  onClear,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) onImport();
  };

  return (
    <div className="stack">
      <form className="row" onSubmit={handleSubmit}>
        <input
          className="input grow"
          type="url"
          inputMode="url"
          placeholder="Link do Cifra Club"
          aria-label="Link do Cifra Club"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
        />
        <button type="submit" className="btn" disabled={isImporting || !url.trim()}>
          {isImporting ? "Importando…" : "Importar"}
        </button>
      </form>

      {importError && <p className="error">{importError}</p>}

      {history.length > 0 && (
        <div className="history" aria-label="Importadas recentemente">
          {history.map((h) => (
            <button
              key={h}
              type="button"
              className="btn btn-sm btn-ghost"
              title={h}
              onClick={() => onUrlChange(h)}
            >
              {h.replace(/^https?:\/\/(www\.)?cifraclub\.com\.br\//, "").replace(/\/$/, "")}
            </button>
          ))}
        </div>
      )}

      <textarea
        className="input"
        aria-label="Cifra"
        placeholder={PLACEHOLDER}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        spellCheck={false}
      />

      <div className="row">
        <label className="field-label" htmlFor="beats-per-chord">
          Batidas por acorde
        </label>
        <select
          id="beats-per-chord"
          className="input input-auto"
          value={beatsPerChord}
          onChange={(e) => onBeatsPerChordChange(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 6, 8].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-ghost push-right" onClick={onClear}>
          Limpar
        </button>
      </div>
    </div>
  );
}
